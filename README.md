# backend_aportaciones_software03 — Mother 03 · Creative & Music OS

Repositorio madre del ecosistema Belentani (antes `music-os`): reúne en un único árbol, bajo `legacy/`, los 7 repos de música y voz del ecosistema sin reescribir su contenido. El historial git no se conserva (decisión de aplanado, 2026-10-02).

**Nivel de visibilidad recomendado: PRIVADO.** Contiene repos privados o de terceros: no debe publicarse como repo público.

## Qué hace

- Conserva y organiza el código de los 7 bloques de música/voz IA de Belentani: síntesis de voz cantada, TTS, interfaz web audio, agente compositor, operaciones comerciales de producción musical y agentes de voz para PYMEs.
- Sirve de base estable del "Mother 03": la implementación vive aquí y el portal es la capa de acceso (ver `MOTHER.md`).
- Incluye CI (`.github/workflows/`) que verifica los protocolos (README/LICENSE/.gitignore), la sintaxis Python de todo el árbol (`compileall`) y los tests reales del bloque `ai-music-production-lab-commerce-os`.

## Stack

- **Python 3.12**: FastAPI + SQLAlchemy + Celery (commerce-os), gradio + torch + TTS (coqui_tts), pipelines de preprocesado (SoulX-Singer), scripts de producción musical (MusicAI_Production), plataforma de agentes de voz con LLM multi-proveedor (voice-ai-agency).
- **Node/TypeScript**: interfaz Music OS — React 19, Vite, Electron, tRPC/drizzle, gestionado con pnpm (`legacy/music-os-interface`).
- **Docker/compose**: despliegue del commerce-os (gateway, API, worker, scheduler, postgres, redis) dentro de su bloque legacy.

## Instalación

No hay una única aplicación en la raíz: cada bloque de `legacy/` es autónomo y conserva su propio README con sus instrucciones. Requisito común del lado Python: 3.12. Ejemplo verificado con el bloque que tiene tests:

```bash
python -m venv .venv
python -m pip install -r legacy/ai-music-production-lab-commerce-os/ecosystem/backend/requirements.txt
```

## Uso

```bash
# Tests reales del bloque commerce-os (2 tests, verificado en local):
PYTHONPATH=legacy/ai-music-production-lab-commerce-os/ecosystem/backend \
  .venv/Scripts/python -m pytest -q legacy/ai-music-production-lab-commerce-os/ecosystem/tests --timeout=60

# Inventario JSON del repositorio (Protocolo 11):
python scripts/export.py
```

Cada bloque tiene sus propios comandos en su `README.md` (p. ej. `legacy/music-os-interface` usa `pnpm dev` y builds de Electron).

## Estructura

```
.github/workflows/   CI (quality: protocolos + compileall + pytest · codeql)
scripts/             export.py — inventario JSON del repositorio
legacy/
  SoulX-Singer/                        síntesis de voz cantada (mirror privado)
  coqui_tts/                           TTS (webui gradio + torch)
  music-os-interface/                  interfaz Music OS (React/Electron)
  music-os-pedro-belentani/            music OS conceptual + docs
  ai-music-production-lab-commerce-os/ FastAPI commerce ops (con tests)
  MusicAI_Production/                  scripts de producción musical IA
  voice-ai-agency/                     agentes de voz AI multi-canal
```

## Origen de cada bloque

| Carpeta | Repo original | KB | Vis. | Sitio vivo | Descripción (de GitHub) |
|---|---|--:|:--:|---|---|
| `legacy/SoulX-Singer` | [`SoulX-Singer`](https://github.com/belentani7/SoulX-Singer) | 7807 | priv | — | SoulX-Singer - sintesis de voz cantada (mirror privado). |
| `legacy/coqui_tts` | [`coqui_tts`](https://github.com/belentani7/coqui_tts) | 1441 | priv | — | Proyecto del ecosistema Belentani. |
| `legacy/music-os-interface` | [`music-os-interface`](https://github.com/belentani7/music-os-interface) | 297 | priv | — | Music OS Interface - capa de interfaz del Music OS (web audio). |
| `legacy/music-os-pedro-belentani` | [`music-os-pedro-belentani`](https://github.com/belentani7/music-os-pedro-belentani) | 138 | priv | — | Music OS - sistema operativo musical conceptual de Pedro Belentani. |
| `legacy/ai-music-production-lab-commerce-os` | [`ai-music-production-lab-commerce-os`](https://github.com/belentani7/ai-music-production-lab-commerce-os) | 59 | priv | — | AI Music Production Lab · Commerce Operations Ecosystem |
| `legacy/MusicAI_Production` | [`MusicAI_Production`](https://github.com/belentani7/MusicAI_Production) | 36 | priv | — | Music AI Production. |
| `legacy/voice-ai-agency` | [`voice-ai-agency`](https://github.com/belentani7/voice-ai-agency) | 13 | priv | vercel | Plataforma multi-canal de agentes de voz AI para PYMEs en LATAM + España/Portugal |

## Scripts

No hay `package.json` en la raíz. `scripts/export.py` genera el inventario JSON del repositorio (bloques, ficheros, tamaños, lenguajes, manifiestos). Los bloques legacy conservan sus scripts originales (p. ej. `legacy/MusicAI_Production/scripts/`, `.bat` de arranque).

## Utilidad

- **Utilidad social:** punto de entrada común y auditable al catálogo de música/voz IA de Belentani — síntesis de voz cantada, TTS y agentes de voz — para desarrollo interno, colaboración y preservación del trabajo del ecosistema.
- **Utilidad comercial:** materia prima de productos del ecosistema (plataforma de agentes de voz para PYMEs en LATAM/España, commerce OS de operaciones, Music OS de escritorio); se sustenta como software del ecosistema bajo licencia MIT.

## Licencia

MIT — año 2026, titular Belentani (ver `LICENSE`). Cada bloque de `legacy/` conserva además su licencia original.
