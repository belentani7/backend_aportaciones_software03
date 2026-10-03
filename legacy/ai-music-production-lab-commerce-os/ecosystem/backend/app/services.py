from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Lead, LeadStage, MetricSnapshot, Offer, Opportunity, OpportunityStage, Subscription, SubscriptionStatus


def lead_score(name: str, company: str, consent_marketing: bool, source: str) -> int:
    score = 15
    if name.strip():
        score += 20
    if company.strip():
        score += 25
    if consent_marketing:
        score += 25
    if source not in {"", "direct", "unknown"}:
        score += 15
    return min(score, 100)


def dashboard_metrics(db: Session) -> dict:
    subscriptions = db.scalars(select(Subscription).where(Subscription.status.in_([SubscriptionStatus.active.value, SubscriptionStatus.trial.value]))).all()
    mrr = 0
    for subscription in subscriptions:
        if subscription.interval == "month":
            mrr += subscription.amount_cents
        elif subscription.interval == "year":
            mrr += round(subscription.amount_cents / 12)
        elif subscription.interval == "week":
            mrr += round(subscription.amount_cents * 52 / 12)

    pipeline = db.scalar(
        select(func.coalesce(func.sum(Opportunity.expected_value_cents * Opportunity.probability / 100), 0)).where(
            Opportunity.stage.not_in([OpportunityStage.won.value, OpportunityStage.lost.value])
        )
    ) or 0
    total_leads = db.scalar(select(func.count(Lead.id))) or 0
    qualified_leads = db.scalar(select(func.count(Lead.id)).where(Lead.stage.in_([LeadStage.qualified.value, LeadStage.nurturing.value, LeadStage.converted.value]))) or 0
    converted = db.scalar(select(func.count(Lead.id)).where(Lead.stage == LeadStage.converted.value)) or 0
    active_offers = db.scalar(select(func.count(Offer.id)).where(Offer.status == "active")) or 0
    stage_rows = db.execute(select(Opportunity.stage, func.count(Opportunity.id)).group_by(Opportunity.stage)).all()
    return {
        "mrr_cents": int(mrr),
        "active_subscriptions": len(subscriptions),
        "pipeline_cents": int(pipeline),
        "qualified_leads": int(qualified_leads),
        "total_leads": int(total_leads),
        "offers_active": int(active_offers),
        "conversion_rate": round((converted / total_leads * 100) if total_leads else 0.0, 2),
        "opportunities_by_stage": {stage: count for stage, count in stage_rows},
    }


def snapshot_metrics(db: Session) -> dict:
    values = dashboard_metrics(db)
    snapshot = db.scalar(select(MetricSnapshot).where(MetricSnapshot.snapshot_date == date.today()))
    if not snapshot:
        snapshot = MetricSnapshot(snapshot_date=date.today())
        db.add(snapshot)
    snapshot.mrr_cents = values["mrr_cents"]
    snapshot.active_subscriptions = values["active_subscriptions"]
    snapshot.pipeline_cents = values["pipeline_cents"]
    snapshot.qualified_leads = values["qualified_leads"]
    db.commit()
    return values


def score_unscored_leads(db: Session) -> dict:
    leads = db.scalars(select(Lead).where(Lead.stage.in_([LeadStage.new.value, LeadStage.qualified.value, LeadStage.nurturing.value]))).all()
    qualified = 0
    for lead in leads:
        lead.score = lead_score(lead.name, lead.company, lead.consent_marketing, lead.source)
        if lead.score >= 60 and lead.stage == LeadStage.new.value:
            lead.stage = LeadStage.qualified.value
            qualified += 1
    db.commit()
    return {"processed": len(leads), "newly_qualified": qualified}


def eligible_campaign_audience(db: Session) -> dict:
    eligible = db.scalar(
        select(func.count(Lead.id)).where(
            Lead.consent_marketing.is_(True),
            Lead.stage.in_([LeadStage.qualified.value, LeadStage.nurturing.value]),
        )
    ) or 0
    return {"eligible_contacts": int(eligible), "delivery": "disabled_by_design"}
