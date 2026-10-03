from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db, initialize_database
from .models import AutomationRun, Campaign, Lead, Offer, Opportunity, Subscription, Vertical
from .schemas import (
    AutomationRunRead,
    CampaignCreate,
    CampaignRead,
    DashboardRead,
    LeadCreate,
    LeadRead,
    OfferCreate,
    OfferRead,
    OpportunityCreate,
    OpportunityRead,
    SubscriptionCreate,
    SubscriptionRead,
    TokenRequest,
    TokenResponse,
    VerticalCreate,
    VerticalRead,
)
from .services import dashboard_metrics, lead_score
from .tasks import execute_automation

settings = get_settings()
logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("commerce_api")
security = HTTPBearer(auto_error=False)


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    logger.info("database_initialized")
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


def require_admin(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> str:
    if not credentials or credentials.scheme.lower() != "bearer" or credentials.credentials != settings.admin_access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de administrador inválido")
    return credentials.credentials


def entity_or_404(db: Session, entity_type, entity_id: int, detail: str):
    entity = db.get(entity_type, entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail=detail)
    return entity


@app.get("/health")
def health(db: Session = Depends(get_db)) -> dict:
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "service": "commerce-api", "environment": settings.environment}
    except Exception as exc:
        logger.exception("health_failed")
        raise HTTPException(status_code=503, detail="Base de datos no disponible") from exc


@app.post("/auth/token", response_model=TokenResponse)
def issue_token(payload: TokenRequest) -> TokenResponse:
    if payload.email.lower() != settings.admin_email.lower() or payload.password != settings.admin_password:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return TokenResponse(access_token=settings.admin_access_token)


@app.get("/api/verticals", response_model=list[VerticalRead], dependencies=[Depends(require_admin)])
def list_verticals(db: Session = Depends(get_db)) -> list[Vertical]:
    return list(db.scalars(select(Vertical).order_by(Vertical.name)).all())


@app.post("/api/verticals", response_model=VerticalRead, status_code=201, dependencies=[Depends(require_admin)])
def create_vertical(payload: VerticalCreate, db: Session = Depends(get_db)) -> Vertical:
    vertical = Vertical(**payload.model_dump())
    db.add(vertical)
    try:
        db.commit()
        db.refresh(vertical)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="El nombre o slug ya existe") from exc
    return vertical


@app.get("/api/offers", response_model=list[OfferRead], dependencies=[Depends(require_admin)])
def list_offers(vertical_id: int | None = None, db: Session = Depends(get_db)) -> list[Offer]:
    query = select(Offer).order_by(Offer.created_at.desc())
    if vertical_id is not None:
        query = query.where(Offer.vertical_id == vertical_id)
    return list(db.scalars(query).all())


@app.post("/api/offers", response_model=OfferRead, status_code=201, dependencies=[Depends(require_admin)])
def create_offer(payload: OfferCreate, db: Session = Depends(get_db)) -> Offer:
    entity_or_404(db, Vertical, payload.vertical_id, "Vertical no encontrada")
    offer = Offer(**payload.model_dump())
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@app.get("/api/leads", response_model=list[LeadRead], dependencies=[Depends(require_admin)])
def list_leads(db: Session = Depends(get_db)) -> list[Lead]:
    return list(db.scalars(select(Lead).order_by(Lead.score.desc(), Lead.created_at.desc())).all())


@app.post("/api/leads", response_model=LeadRead, status_code=201, dependencies=[Depends(require_admin)])
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)) -> Lead:
    if payload.vertical_id is not None:
        entity_or_404(db, Vertical, payload.vertical_id, "Vertical no encontrada")
    existing = db.scalar(select(Lead).where(Lead.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un lead con este correo")
    fields = payload.model_dump()
    fields["email"] = str(payload.email).lower()
    fields["score"] = lead_score(payload.name, payload.company, payload.consent_marketing, payload.source)
    if fields["score"] >= 60:
        fields["stage"] = "qualified"
    lead = Lead(**fields)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@app.get("/api/opportunities", response_model=list[OpportunityRead], dependencies=[Depends(require_admin)])
def list_opportunities(db: Session = Depends(get_db)) -> list[Opportunity]:
    return list(db.scalars(select(Opportunity).order_by(Opportunity.created_at.desc())).all())


@app.post("/api/opportunities", response_model=OpportunityRead, status_code=201, dependencies=[Depends(require_admin)])
def create_opportunity(payload: OpportunityCreate, db: Session = Depends(get_db)) -> Opportunity:
    entity_or_404(db, Lead, payload.lead_id, "Lead no encontrado")
    if payload.offer_id is not None:
        entity_or_404(db, Offer, payload.offer_id, "Oferta no encontrada")
    opportunity = Opportunity(**payload.model_dump())
    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)
    return opportunity


@app.get("/api/subscriptions", response_model=list[SubscriptionRead], dependencies=[Depends(require_admin)])
def list_subscriptions(db: Session = Depends(get_db)) -> list[Subscription]:
    return list(db.scalars(select(Subscription).order_by(Subscription.started_at.desc())).all())


@app.post("/api/subscriptions", response_model=SubscriptionRead, status_code=201, dependencies=[Depends(require_admin)])
def create_subscription(payload: SubscriptionCreate, db: Session = Depends(get_db)) -> Subscription:
    entity_or_404(db, Offer, payload.offer_id, "Oferta no encontrada")
    fields = payload.model_dump()
    fields["customer_email"] = str(payload.customer_email).lower()
    fields["currency"] = payload.currency.upper()
    subscription = Subscription(**fields)
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@app.get("/api/campaigns", response_model=list[CampaignRead], dependencies=[Depends(require_admin)])
def list_campaigns(db: Session = Depends(get_db)) -> list[Campaign]:
    return list(db.scalars(select(Campaign).order_by(Campaign.created_at.desc())).all())


@app.post("/api/campaigns", response_model=CampaignRead, status_code=201, dependencies=[Depends(require_admin)])
def create_campaign(payload: CampaignCreate, db: Session = Depends(get_db)) -> Campaign:
    if payload.vertical_id is not None:
        entity_or_404(db, Vertical, payload.vertical_id, "Vertical no encontrada")
    campaign = Campaign(**payload.model_dump())
    db.add(campaign)
    try:
        db.commit()
        db.refresh(campaign)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya existe una campaña con este nombre") from exc
    return campaign


@app.get("/api/dashboard", response_model=DashboardRead, dependencies=[Depends(require_admin)])
def dashboard(db: Session = Depends(get_db)) -> dict:
    return dashboard_metrics(db)


@app.get("/api/automations/runs", response_model=list[AutomationRunRead], dependencies=[Depends(require_admin)])
def list_automation_runs(db: Session = Depends(get_db)) -> list[AutomationRun]:
    return list(db.scalars(select(AutomationRun).order_by(AutomationRun.started_at.desc()).limit(100)).all())


@app.post("/api/automations/run/{name}", response_model=AutomationRunRead, status_code=202, dependencies=[Depends(require_admin)])
def run_automation(name: str, db: Session = Depends(get_db)) -> AutomationRun:
    if name not in {"lead_scoring", "metrics_snapshot", "campaign_audience"}:
        raise HTTPException(status_code=404, detail="Automatización no admitida")
    run = AutomationRun(name=name, status="queued")
    db.add(run)
    db.commit()
    db.refresh(run)
    try:
        execute_automation.delay(run.id, name)
    except Exception as exc:
        run.status = "failed"
        run.result = {"error": "No se pudo encolar la automatización", "detail": str(exc)}
        db.commit()
        raise HTTPException(status_code=503, detail="Cola de automatizaciones no disponible") from exc
    return run
