import os
from pathlib import Path

TEST_DB = Path("/tmp/commerce_os_test.db")
if TEST_DB.exists():
    TEST_DB.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["ADMIN_EMAIL"] = "operator@test.local"
os.environ["ADMIN_PASSWORD"] = "a-secure-test-password"
os.environ["ADMIN_ACCESS_TOKEN"] = "test-access-token"
os.environ["REDIS_URL"] = "redis://localhost:6399/0"

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import AutomationRun
from app.tasks import run_named_automation


def auth_headers(client: TestClient) -> dict:
    response = client.post("/auth/token", json={"email": "operator@test.local", "password": "a-secure-test-password"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_commercial_flow_and_metrics():
    with TestClient(app) as client:
        assert client.get("/health").status_code == 200
        headers = auth_headers(client)
        verticals = client.get("/api/verticals", headers=headers).json()
        assert len(verticals) >= 4
        offer = client.get("/api/offers", headers=headers).json()[0]
        lead_response = client.post(
            "/api/leads",
            headers=headers,
            json={
                "vertical_id": offer["vertical_id"],
                "email": "buyer@iana.org",
                "name": "Buyer Name",
                "company": "Example Studio",
                "consent_marketing": True,
                "source": "referral",
            },
        )
        assert lead_response.status_code == 201
        lead = lead_response.json()
        assert lead["stage"] == "qualified"
        opportunity_response = client.post(
            "/api/opportunities",
            headers=headers,
            json={"lead_id": lead["id"], "offer_id": offer["id"], "title": "Pilot", "expected_value_cents": 10000, "probability": 50},
        )
        assert opportunity_response.status_code == 201
        subscription_response = client.post(
            "/api/subscriptions",
            headers=headers,
            json={"offer_id": offer["id"], "customer_email": "buyer@iana.org", "amount_cents": 2500, "interval": "month", "status": "active"},
        )
        assert subscription_response.status_code == 201
        dashboard = client.get("/api/dashboard", headers=headers).json()
        assert dashboard["mrr_cents"] == 2500
        assert dashboard["pipeline_cents"] == 5000
        assert dashboard["qualified_leads"] >= 1


def test_automation_updates_audit_record():
    with TestClient(app):
        with SessionLocal() as db:
            run = AutomationRun(name="metrics_snapshot", status="queued")
            db.add(run)
            db.commit()
            db.refresh(run)
            run_id = run.id
        result = run_named_automation(run_id, "metrics_snapshot")
        assert "mrr_cents" in result
        with SessionLocal() as db:
            completed = db.get(AutomationRun, run_id)
            assert completed.status == "completed"
            assert completed.result["mrr_cents"] == result["mrr_cents"]
