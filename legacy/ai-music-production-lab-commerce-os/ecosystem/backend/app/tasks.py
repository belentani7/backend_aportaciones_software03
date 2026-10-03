from __future__ import annotations

from datetime import datetime, timezone

from celery import Celery

from .config import get_settings
from .database import SessionLocal, initialize_database
from .models import AutomationRun, AutomationStatus
from .services import eligible_campaign_audience, score_unscored_leads, snapshot_metrics

settings = get_settings()
celery_app = Celery("commerce_ops", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "score-and-snapshot-every-six-hours": {
            "task": "app.tasks.run_scheduled_cycle",
            "schedule": 21600.0,
        }
    },
)


def run_named_automation(run_id: int, name: str) -> dict:
    initialize_database()
    with SessionLocal() as db:
        run = db.get(AutomationRun, run_id)
        if run:
            run.status = AutomationStatus.running.value
            db.commit()
        try:
            if name == "lead_scoring":
                result = score_unscored_leads(db)
            elif name == "metrics_snapshot":
                result = snapshot_metrics(db)
            elif name == "campaign_audience":
                result = eligible_campaign_audience(db)
            else:
                raise ValueError(f"Automatización no admitida: {name}")
            if run:
                run.status = AutomationStatus.completed.value
                run.finished_at = datetime.now(timezone.utc)
                run.result = result
                db.commit()
            return result
        except Exception as exc:
            if run:
                run.status = AutomationStatus.failed.value
                run.finished_at = datetime.now(timezone.utc)
                run.result = {"error": str(exc)}
                db.commit()
            raise


@celery_app.task(name="app.tasks.execute_automation")
def execute_automation(run_id: int, name: str) -> dict:
    return run_named_automation(run_id, name)


@celery_app.task(name="app.tasks.run_scheduled_cycle")
def run_scheduled_cycle() -> dict:
    initialize_database()
    with SessionLocal() as db:
        score_result = score_unscored_leads(db)
        snapshot_result = snapshot_metrics(db)
        audience_result = eligible_campaign_audience(db)
    return {"lead_scoring": score_result, "metrics_snapshot": snapshot_result, "campaign_audience": audience_result}
