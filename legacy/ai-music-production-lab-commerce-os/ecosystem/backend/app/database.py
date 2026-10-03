from __future__ import annotations

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from .config import get_settings
from .models import Base, Offer, RecordStatus, Vertical

settings = get_settings()
engine_args: dict = {"pool_pre_ping": True}
if settings.database_url.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}
engine = create_engine(settings.database_url, **engine_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_defaults(db: Session) -> None:
    if db.scalar(select(Vertical.id).limit(1)):
        return
    catalog = [
        ("Producción musical", "music-production", "Servicios, activos y operaciones para creadores musicales.", "Auditoría de mezcla", "service", 14900, "one_time"),
        ("Herramientas para creadores", "creator-tools", "Plantillas, automatizaciones y productos digitales para profesionales creativos.", "Sistema de activos digitales", "digital_product", 2900, "one_time"),
        ("Servicios profesionales", "professional-services", "Paquetes de automatización y operaciones para pequeños equipos.", "Retainer de automatización", "subscription", 9900, "month"),
        ("Educación práctica", "practical-learning", "Programas, recursos y acompañamiento estructurado.", "Biblioteca de talleres", "subscription", 1900, "month"),
    ]
    for vertical_name, slug, description, offer_name, kind, price_cents, interval in catalog:
        vertical = Vertical(name=vertical_name, slug=slug, description=description, status=RecordStatus.active.value)
        db.add(vertical)
        db.flush()
        db.add(
            Offer(
                vertical_id=vertical.id,
                name=offer_name,
                kind=kind,
                description="Oferta inicial gestionable desde el catálogo operativo.",
                price_cents=price_cents,
                currency="EUR",
                billing_interval=interval,
                status=RecordStatus.active.value,
            )
        )
    db.commit()


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_defaults(db)
