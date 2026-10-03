# AI Music Production Lab · Commerce Operations Ecosystem

> **Nota de riesgo financiero.** Este ecosistema organiza ofertas, oportunidades, suscripciones, facturación de control y automatizaciones operativas. No garantiza ingresos constantes: el retorno depende de producto, mercado, precio, distribución, cumplimiento, cobros y retención.

## Propósito

El laboratorio evoluciona de herramientas de producción musical a un núcleo operativo multi-nicho para activos digitales y servicios productizados. El núcleo no depende de un nicho: cada vertical, oferta, lead, campaña, activo y suscripción se modela como un registro independiente y filtrable. La vertical musical permanece como una línea inicial, pero no tiene privilegios técnicos dentro del sistema.

## Arquitectura

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | HTML, CSS y JavaScript nativos servidos por Nginx | Panel de control, gestión de verticales, ofertas, leads, oportunidades y campañas. |
| API | Python 3.12, FastAPI, SQLAlchemy 2, Pydantic | Autenticación, dominio comercial, métricas, acciones y contratos HTTP. |
| Base de datos | PostgreSQL 16 | Fuente de verdad transaccional y reportes agregados. |
| Cola | Redis 7 | Broker de tareas y caché efímera de procesos. |
| Worker | Celery | Ejecución fuera de petición: puntuación, resumen comercial y tareas de campaña. |
| Scheduler | Celery Beat | Planificación determinista y periódica de automatizaciones. |
| Observabilidad | Endpoint de salud, logs JSON, monitor existente | Diagnóstico operativo y trazabilidad de ejecuciones. |
| Borde | Nginx | Entrega del frontend y proxy hacia la API por la red privada. |

## Flujos de valor

| Flujo | Evento de entrada | Proceso automático | Resultado medible |
|---|---|---|---|
| Catálogo multi-nicho | Creación de vertical y oferta | Validación de oferta, asignación de estado y métricas | Oferta publicable y trazable. |
| Captación | Alta de lead con consentimiento | Dedupe por email y lead scoring | Prioridad comercial reproducible. |
| Conversión | Conversión del lead en oportunidad | Etapas, importe esperado y seguimiento | Pipeline y previsión de ingresos. |
| Recurrente | Alta de suscripción | Cálculo diario de MRR, churn y salud de cartera | Ingreso recurrente medible, no garantizado. |
| Campañas | Campaña activada | Segmentación de leads con consentimiento y tareas de preparación | Cadencia con estado auditable; no envía comunicaciones por defecto. |
| Experimentación | Métrica o feedback registrado | Ranking de ofertas por conversión y prioridad | Decisiones basadas en datos propios. |

## Controles de seguridad y cumplimiento

Las comunicaciones están desactivadas por diseño hasta que se incorpore un proveedor autorizado y se registre consentimiento verificable. El sistema no hace scraping, no compra tráfico, no realiza cobros externos ni envía correo de forma autónoma. Se protege el acceso por token de administrador, se evita exponer secretos al frontend y se registra cada ejecución programada. Para un despliegue público, se debe revisar legalmente la privacidad, condiciones de contratación, impuestos y consentimiento comercial aplicable.

## Modelo de datos

| Entidad | Campos de negocio clave |
|---|---|
| `verticals` | `name`, `slug`, `status`, `description` |
| `offers` | `vertical_id`, `name`, `kind`, `price_cents`, `currency`, `billing_interval`, `status` |
| `leads` | `email`, `name`, `company`, `vertical_id`, `consent_marketing`, `score`, `stage` |
| `opportunities` | `lead_id`, `offer_id`, `stage`, `expected_value_cents`, `probability`, `close_date` |
| `subscriptions` | `offer_id`, `customer_email`, `amount_cents`, `currency`, `interval`, `status`, `started_at`, `ended_at` |
| `campaigns` | `vertical_id`, `name`, `status`, `objective`, `audience_rule` |
| `automation_runs` | `name`, `status`, `started_at`, `finished_at`, `result` |
| `metric_snapshots` | `date`, `mrr_cents`, `active_subscriptions`, `pipeline_cents`, `qualified_leads` |

## Contrato HTTP

| Método | Ruta | Operación |
|---|---|---|
| `GET` | `/health` | Salud del proceso y dependencias. |
| `POST` | `/auth/token` | Emite token de administrador con credenciales locales. |
| `GET/POST` | `/api/verticals` | Consulta y crea verticales. |
| `GET/POST` | `/api/offers` | Consulta y crea ofertas. |
| `GET/POST` | `/api/leads` | Consulta y registra leads con deduplicación. |
| `GET/POST` | `/api/opportunities` | Consulta y registra oportunidades. |
| `GET/POST` | `/api/subscriptions` | Consulta y registra suscripciones de control. |
| `GET/POST` | `/api/campaigns` | Consulta y gestiona campañas. |
| `GET` | `/api/dashboard` | KPIs agregados y embudo. |
| `POST` | `/api/automations/run/{name}` | Encola una automatización autorizada. |
| `GET` | `/api/automations/runs` | Audita ejecuciones. |

## Árbol objetivo

```text
AI_MUSIC_PRODUCTION_LAB/
├── ecosystem/
│   ├── backend/
│   ├── frontend/
│   ├── tests/
│   ├── Dockerfile.api
│   ├── Dockerfile.worker
│   └── requirements.txt
├── infra/nginx/
├── scripts/
├── .github/workflows/
├── docker-compose.yml
├── .env
├── .env.example
├── Makefile
├── ECOSYSTEM_MANIFEST.md
└── RUNBOOK.md
```
