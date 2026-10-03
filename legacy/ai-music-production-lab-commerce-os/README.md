# AI Music Production Lab · Commerce Operations Ecosystem

Núcleo autosuficiente para operar **ofertas, activos digitales, servicios productizados, leads, oportunidades, suscripciones, campañas y automatizaciones** sin atarse a un solo nicho. La producción musical sigue como vertical inicial; el dominio permite añadir cualquier vertical desde el panel o la API.

> El software estructura captación, conversión y recurrencia; no garantiza retornos financieros. Los ingresos reales requieren oferta validada, distribución, cobro, cumplimiento y retención.

## Capacidades

| Bloque | Entregable | Estado |
|---|---|---|
| Operación comercial | Verticales, ofertas, leads, oportunidades y suscripciones | Implementado. |
| Automatización | Puntuación de leads, métricas recurrentes y preparación de audiencias | Implementado; las comunicaciones externas están desactivadas. |
| Métricas | MRR normalizado, pipeline ponderado, conversión y cartera | Implementado. |
| Panel | Operación autenticada desde navegador | Implementado. |
| Infraestructura | PostgreSQL, Redis, FastAPI, Celery, Nginx y redes aisladas | Definido en `docker-compose.yml`. |
| Observabilidad musical | CPU/GPU, renders, éxito y errores de modelos | Conservado en `monitoring/`. |
| Plantillas FL Studio | Cuatro planos de construcción de sesiones | Conservados en `FL_STUDIO_TEMPLATES/`. |

## Inicio único

```bash
make up
```

Abra `http://127.0.0.1:8080`. Consulte `.env` de forma local y segura para obtener la credencial de operador. No comparta ni suba ese archivo.

## Operación

```bash
make health
make logs
make test
make backup
make package
make down
```

La guía operativa está en [`RUNBOOK.md`](RUNBOOK.md), la definición del sistema en [`ECOSYSTEM_MANIFEST.md`](ECOSYSTEM_MANIFEST.md) y los controles de seguridad en [`SECURITY.md`](SECURITY.md).

## Estructura

```text
AI_MUSIC_PRODUCTION_LAB/
├── ecosystem/
│   ├── backend/app/        # API, dominio, persistencia, worker y scheduler
│   ├── frontend/           # Panel operativo estático
│   └── tests/              # Pruebas de integración
├── infra/nginx/            # Gateway y cabeceras de seguridad
├── scripts/                # Backup y empaquetado seguro
├── monitoring/             # Observabilidad de sesiones de producción
├── FL_STUDIO_TEMPLATES/    # Planos de sesiones FL Studio
├── docker-compose.yml
├── .env.example
├── Makefile
├── RUNBOOK.md
├── SECURITY.md
└── ECOSYSTEM_MANIFEST.md
```

## Límites deliberados

El proyecto no procesa tarjetas, no realiza transferencias, no compra tráfico, no hace scraping, no envía campañas ni inventa ingresos. Las conexiones de pago y comunicación se añaden únicamente después de proporcionar credenciales legítimas, definir cumplimiento y aprobar explícitamente su activación.
