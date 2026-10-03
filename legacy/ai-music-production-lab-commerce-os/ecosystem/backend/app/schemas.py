from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TokenRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=12, max_length=256)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class VerticalCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=120)
    description: str = Field(default="", max_length=5000)
    status: str = Field(default="draft", pattern=r"^(draft|active|paused|archived)$")


class VerticalRead(ORMModel):
    id: int
    name: str
    slug: str
    description: str
    status: str
    created_at: datetime


class OfferCreate(BaseModel):
    vertical_id: int
    name: str = Field(min_length=2, max_length=160)
    kind: str = Field(min_length=2, max_length=50)
    description: str = Field(default="", max_length=5000)
    price_cents: int = Field(ge=0, le=100_000_000)
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    billing_interval: str = Field(default="one_time", pattern=r"^(one_time|week|month|year)$")
    status: str = Field(default="draft", pattern=r"^(draft|active|paused|archived)$")

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()


class OfferRead(ORMModel):
    id: int
    vertical_id: int
    name: str
    kind: str
    description: str
    price_cents: int
    currency: str
    billing_interval: str
    status: str
    created_at: datetime


class LeadCreate(BaseModel):
    vertical_id: int | None = None
    email: EmailStr
    name: str = Field(default="", max_length=160)
    company: str = Field(default="", max_length=160)
    consent_marketing: bool = False
    source: str = Field(default="direct", max_length=80)


class LeadRead(ORMModel):
    id: int
    vertical_id: int | None
    email: EmailStr
    name: str
    company: str
    consent_marketing: bool
    score: int
    stage: str
    source: str
    created_at: datetime
    updated_at: datetime


class OpportunityCreate(BaseModel):
    lead_id: int
    offer_id: int | None = None
    title: str = Field(min_length=2, max_length=200)
    stage: str = Field(default="discovery", pattern=r"^(discovery|proposal|negotiation|won|lost)$")
    expected_value_cents: int = Field(ge=0, le=100_000_000)
    probability: int = Field(default=10, ge=0, le=100)
    close_date: date | None = None


class OpportunityRead(ORMModel):
    id: int
    lead_id: int
    offer_id: int | None
    title: str
    stage: str
    expected_value_cents: int
    probability: int
    close_date: date | None
    created_at: datetime


class SubscriptionCreate(BaseModel):
    offer_id: int
    customer_email: EmailStr
    amount_cents: int = Field(ge=0, le=100_000_000)
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    interval: str = Field(default="month", pattern=r"^(week|month|year)$")
    status: str = Field(default="trial", pattern=r"^(active|trial|past_due|cancelled|paused)$")


class SubscriptionRead(ORMModel):
    id: int
    offer_id: int
    customer_email: EmailStr
    amount_cents: int
    currency: str
    interval: str
    status: str
    started_at: datetime
    ended_at: datetime | None


class CampaignCreate(BaseModel):
    vertical_id: int | None = None
    name: str = Field(min_length=2, max_length=160)
    objective: str = Field(min_length=3, max_length=160)
    audience_rule: dict[str, Any] = Field(default_factory=dict)
    status: str = Field(default="draft", pattern=r"^(draft|active|paused|archived)$")


class CampaignRead(ORMModel):
    id: int
    vertical_id: int | None
    name: str
    objective: str
    audience_rule: dict[str, Any]
    status: str
    created_at: datetime


class AutomationRunRead(ORMModel):
    id: int
    name: str
    status: str
    started_at: datetime
    finished_at: datetime | None
    result: dict[str, Any]


class DashboardRead(BaseModel):
    mrr_cents: int
    active_subscriptions: int
    pipeline_cents: int
    qualified_leads: int
    total_leads: int
    offers_active: int
    conversion_rate: float
    opportunities_by_stage: dict[str, int]
