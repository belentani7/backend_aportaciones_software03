from __future__ import annotations

from datetime import date, datetime, timezone
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class RecordStatus(str, Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    archived = "archived"


class LeadStage(str, Enum):
    new = "new"
    qualified = "qualified"
    nurturing = "nurturing"
    converted = "converted"
    disqualified = "disqualified"


class OpportunityStage(str, Enum):
    discovery = "discovery"
    proposal = "proposal"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"


class SubscriptionStatus(str, Enum):
    active = "active"
    trial = "trial"
    past_due = "past_due"
    cancelled = "cancelled"
    paused = "paused"


class AutomationStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class Vertical(Base):
    __tablename__ = "verticals"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default=RecordStatus.draft.value)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    offers: Mapped[list[Offer]] = relationship(back_populates="vertical")
    leads: Mapped[list[Lead]] = relationship(back_populates="vertical")


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(primary_key=True)
    vertical_id: Mapped[int] = mapped_column(ForeignKey("verticals.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    kind: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(Text, default="")
    price_cents: Mapped[int] = mapped_column(Integer, default=0)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    billing_interval: Mapped[str] = mapped_column(String(20), default="one_time")
    status: Mapped[str] = mapped_column(String(20), default=RecordStatus.draft.value)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    vertical: Mapped[Vertical] = relationship(back_populates="offers")
    opportunities: Mapped[list[Opportunity]] = relationship(back_populates="offer")
    subscriptions: Mapped[list[Subscription]] = relationship(back_populates="offer")


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    vertical_id: Mapped[int | None] = mapped_column(ForeignKey("verticals.id", ondelete="SET NULL"), nullable=True, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160), default="")
    company: Mapped[str] = mapped_column(String(160), default="")
    consent_marketing: Mapped[bool] = mapped_column(Boolean, default=False)
    score: Mapped[int] = mapped_column(Integer, default=0)
    stage: Mapped[str] = mapped_column(String(20), default=LeadStage.new.value)
    source: Mapped[str] = mapped_column(String(80), default="direct")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    vertical: Mapped[Vertical | None] = relationship(back_populates="leads")
    opportunities: Mapped[list[Opportunity]] = relationship(back_populates="lead")


class Opportunity(Base):
    __tablename__ = "opportunities"

    id: Mapped[int] = mapped_column(primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), index=True)
    offer_id: Mapped[int | None] = mapped_column(ForeignKey("offers.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    stage: Mapped[str] = mapped_column(String(20), default=OpportunityStage.discovery.value)
    expected_value_cents: Mapped[int] = mapped_column(Integer, default=0)
    probability: Mapped[int] = mapped_column(Integer, default=10)
    close_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    lead: Mapped[Lead] = relationship(back_populates="opportunities")
    offer: Mapped[Offer | None] = relationship(back_populates="opportunities")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    offer_id: Mapped[int] = mapped_column(ForeignKey("offers.id", ondelete="CASCADE"), index=True)
    customer_email: Mapped[str] = mapped_column(String(320), index=True)
    amount_cents: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    interval: Mapped[str] = mapped_column(String(20), default="month")
    status: Mapped[str] = mapped_column(String(20), default=SubscriptionStatus.trial.value)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    offer: Mapped[Offer] = relationship(back_populates="subscriptions")


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True)
    vertical_id: Mapped[int | None] = mapped_column(ForeignKey("verticals.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    objective: Mapped[str] = mapped_column(String(160))
    audience_rule: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(20), default=RecordStatus.draft.value)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AutomationRun(Base):
    __tablename__ = "automation_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    status: Mapped[str] = mapped_column(String(20), default=AutomationStatus.queued.value)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    result: Mapped[dict] = mapped_column(JSON, default=dict)


class MetricSnapshot(Base):
    __tablename__ = "metric_snapshots"
    __table_args__ = (UniqueConstraint("snapshot_date", name="uq_metric_snapshot_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    snapshot_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    mrr_cents: Mapped[int] = mapped_column(Integer, default=0)
    active_subscriptions: Mapped[int] = mapped_column(Integer, default=0)
    pipeline_cents: Mapped[int] = mapped_column(Integer, default=0)
    qualified_leads: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
