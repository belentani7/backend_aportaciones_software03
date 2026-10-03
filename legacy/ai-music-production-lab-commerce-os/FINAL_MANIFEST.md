# AI Music Production Lab · Commerce Operations Ecosystem

## Estado final

Ecosistema multi-nicho implementado para operar catálogo de ofertas, leads, oportunidades, suscripciones, campañas y automatizaciones auditables. La vertical de producción musical queda preservada junto al monitor de rendimiento y a los planos de FL Studio, mientras que la nueva capa comercial admite verticales adicionales sin cambios de código.

> **Riesgo financiero.** El sistema ofrece trazabilidad de captación, conversión y recurrencia; no garantiza retornos financieros. El resultado económico depende de validación de oferta, distribución, cumplimiento, cobro y retención reales.

| Activo | Estado | Ruta o enlace |
|---|---|---|
| Repositorio privado | Publicado en `main` | https://github.com/belentani7/ai-music-production-lab-commerce-os |
| Paquete de respaldo | Archivado en Drive | https://drive.google.com/file/d/1GSrUlrucxd9GsPlKN7DfCzi6babUrgGY/view?usp=drivesdk |
| API y automatizaciones | Implementadas | `ecosystem/backend/app/` |
| Panel operativo | Implementado | `ecosystem/frontend/index.html` |
| Observabilidad de producción | Conservada | `monitoring/` |
| Plantillas FL Studio | Conservadas como planos reproducibles | `FL_STUDIO_TEMPLATES/` |

## Arquitectura desacoplada

| Capa | Stack | Responsabilidad |
|---|---|---|
| Gateway | Nginx 1.27 Alpine | Entrega del panel, proxy de API y cabeceras de seguridad. |
| Frontend | HTML, CSS y JavaScript nativos | Panel autenticado de catálogo, captación, campañas, métricas y automatizaciones. |
| Backend | Python 3.12, FastAPI, Pydantic, SQLAlchemy 2 | Dominio, autenticación, validación, API y salud. |
| Base de datos | PostgreSQL 16 | Persistencia de negocio, cartera, oportunidades y snapshots. |
| Cola | Redis 7.4 | Broker y backend de tareas. |
| Workers | Celery 5 | Puntuación de leads, snapshots de métricas y preparación de audiencias. |
| Scheduler | Celery Beat | Ciclo automático cada seis horas. |
| Observabilidad | Healthchecks, logs, `monitoring/` | Diagnóstico técnico y rendimiento de sesiones. |

## Modelo de datos

| Entidad | Finalidad | Relaciones principales |
|---|---|---|
| `Vertical` | Segmento comercial independiente. | Tiene ofertas y leads. |
| `Offer` | Producto, servicio o suscripción vendible. | Pertenece a una vertical; recibe oportunidades y suscripciones. |
| `Lead` | Contacto con fuente, consentimiento y score. | Puede generar oportunidades. |
| `Opportunity` | Pipeline ponderado por probabilidad. | Enlaza un lead y una oferta. |
| `Subscription` | Recurrencia operativa por cliente. | Enlaza una oferta y calcula MRR normalizado. |
| `Campaign` | Objetivo y criterio interno de audiencia. | Opcionalmente enlazada a una vertical. |
| `AutomationRun` | Auditoría de cada tarea automática. | Registra estado, fechas y resultado JSON. |
| `MetricSnapshot` | Serie diaria de KPI. | Guarda MRR, pipeline, cartera y leads cualificados. |

## Endpoints

| Método | Ruta | Autorización | Función |
|---|---|---|---|
| `GET` | `/health` | Pública local | Salud de API y base de datos. |
| `POST` | `/auth/token` | Credencial local | Emite token Bearer de operador. |
| `GET/POST` | `/api/verticals` | Bearer | Consulta y creación de verticales. |
| `GET/POST` | `/api/offers` | Bearer | Consulta y creación de ofertas. |
| `GET/POST` | `/api/leads` | Bearer | Captación deduplicada y scoring. |
| `GET/POST` | `/api/opportunities` | Bearer | Pipeline comercial. |
| `GET/POST` | `/api/subscriptions` | Bearer | Cartera y recurrencia. |
| `GET/POST` | `/api/campaigns` | Bearer | Campañas internas sin entrega automática. |
| `GET` | `/api/dashboard` | Bearer | MRR, pipeline, conversión, ofertas y cartera. |
| `POST` | `/api/automations/run/{name}` | Bearer | Encola `lead_scoring`, `metrics_snapshot` o `campaign_audience`. |
| `GET` | `/api/automations/runs` | Bearer | Auditoría de ejecuciones. |

## Automatizaciones

| Nombre | Disparador | Salida | Restricción |
|---|---|---|---|
| `lead_scoring` | Manual o ciclo de seis horas | Score y cualificación de leads. | No contacta a terceros. |
| `metrics_snapshot` | Manual o ciclo de seis horas | MRR, pipeline y cartera diaria. | No altera cobros. |
| `campaign_audience` | Manual o ciclo de seis horas | Recuento de audiencia elegible. | No envía campañas. |

## Secretos, red y persistencia

| Recurso | Implementación |
|---|---|
| Secretos | `.env` con permisos `0600`, excluido de Git y de los paquetes. |
| Exposición | Sólo `127.0.0.1:${APP_PORT}` publica el gateway; no se publican puertos de PostgreSQL ni Redis. |
| Aislamiento | Red `core` interna para API, worker, scheduler, PostgreSQL y Redis. |
| Persistencia | Volúmenes `postgres_data` y `redis_data`. |
| Backups | `make backup` ejecuta `pg_dump`, comprime, verifica y conserva treinta días. |
| Paquetes | `make package` excluye secretos, datos, logs, cachés y dependencias. |

## Pruebas, CI/CD y operación

La suite pasó **2 pruebas de integración**: autenticación, catálogo, lead scoring, oportunidad, suscripción, métricas y auditoría de automatización. La automatización de CI en `.github/workflows/ci.yml` compila el backend, ejecuta pruebas y valida la estructura de Compose para cada push y pull request a `main`.

```bash
make up
make health
make logs
make test
make backup
make package
make down
```

## Árbol de archivos

```text
AI_MUSIC_PRODUCTION_LAB/
├── .github/workflows/ci.yml
├── ecosystem/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── main.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── services.py
│   │   │   └── tasks.py
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.worker
│   │   └── requirements.txt
│   ├── frontend/index.html
│   └── tests/test_api.py
├── infra/nginx/default.conf
├── scripts/
│   ├── backup.sh
│   ├── package.sh
│   └── validate_project.py
├── monitoring/
├── FL_STUDIO_TEMPLATES/
├── docker-compose.yml
├── .env.example
├── Makefile
├── RUNBOOK.md
├── SECURITY.md
├── PUBLICATION.md
└── FINAL_MANIFEST.md
```

## docker-compose.yml

```yaml
name: ai-music-production-lab

services:
  gateway:
    image: nginx:1.27-alpine
    restart: unless-stopped
    ports:
      - "127.0.0.1:${APP_PORT}:8080"
    volumes:
      - ./ecosystem/frontend:/usr/share/nginx/html:ro
      - ./infra/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      api:
        condition: service_healthy
    networks:
      - edge
      - core
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run

  api:
    build:
      context: ./ecosystem/backend
      dockerfile: Dockerfile.api
    restart: unless-stopped
    environment:
      ENVIRONMENT: ${ENVIRONMENT}
      DATABASE_URL: postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379/0
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      ADMIN_ACCESS_TOKEN: ${ADMIN_ACCESS_TOKEN}
      ALLOWED_ORIGINS: http://localhost:${APP_PORT},http://127.0.0.1:${APP_PORT}
      LOG_LEVEL: ${LOG_LEVEL}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - core
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"]
      interval: 20s
      timeout: 5s
      retries: 5
      start_period: 25s

  worker:
    build:
      context: ./ecosystem/backend
      dockerfile: Dockerfile.worker
    restart: unless-stopped
    command: ["celery", "-A", "app.tasks.celery_app", "worker", "--loglevel=INFO", "--concurrency=2"]
    environment:
      ENVIRONMENT: ${ENVIRONMENT}
      DATABASE_URL: postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379/0
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      ADMIN_ACCESS_TOKEN: ${ADMIN_ACCESS_TOKEN}
      LOG_LEVEL: ${LOG_LEVEL}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - core
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD-SHELL", "celery -A app.tasks.celery_app inspect ping -d celery@$$HOSTNAME --timeout=3 | grep -q pong"]
      interval: 45s
      timeout: 10s
      retries: 3
      start_period: 30s

  scheduler:
    build:
      context: ./ecosystem/backend
      dockerfile: Dockerfile.worker
    restart: unless-stopped
    command: ["celery", "-A", "app.tasks.celery_app", "beat", "--loglevel=INFO", "--schedule=/tmp/celerybeat-schedule"]
    environment:
      ENVIRONMENT: ${ENVIRONMENT}
      DATABASE_URL: postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379/0
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      ADMIN_ACCESS_TOKEN: ${ADMIN_ACCESS_TOKEN}
      LOG_LEVEL: ${LOG_LEVEL}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - core
    security_opt:
      - no-new-privileges:true

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - core
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 15s

  redis:
    image: redis:7.4-alpine
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--appendfsync", "everysec"]
    volumes:
      - redis_data:/data
    networks:
      - core
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 10s

networks:
  edge:
    driver: bridge
  core:
    driver: bridge
    internal: true

volumes:
  postgres_data:
  redis_data:
```
