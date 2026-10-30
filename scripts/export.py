#!/usr/bin/env python3
"""Exporta el inventario de datos principales del repositorio (Protocolo 11).

Genera un JSON con los metadatos de cada bloque del repositorio madre:
número de ficheros, tamaño, lenguajes (por extensión) y manifiestos
detectados. Uso:

    python scripts/export.py            # JSON a stdout
    python scripts/export.py --out out.json
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

EXCLUDED_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build", ".next", "release"}

LANG_BY_EXT = {
    ".py": "python",
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".jsx": "javascript",
    ".json": "json",
    ".md": "markdown",
    ".html": "html",
    ".css": "css",
    ".yml": "yaml",
    ".yaml": "yaml",
    ".sh": "shell",
    ".bat": "batch",
    ".csv": "csv",
    ".txt": "text",
}

BLOCK_DESCRIPTIONS = {
    "SoulX-Singer": "Síntesis de voz cantada (mirror privado)",
    "coqui_tts": "TTS (webui gradio + torch)",
    "music-os-interface": "Interfaz Music OS (React/Electron)",
    "music-os-pedro-belentani": "Music OS conceptual + docs",
    "ai-music-production-lab-commerce-os": "FastAPI commerce ops (con tests)",
    "MusicAI_Production": "Scripts de producción musical IA",
    "voice-ai-agency": "Agentes de voz AI multi-canal",
}


def walk(directory: Path) -> tuple[int, int, Counter, list[str]]:
    """Recorre un directorio y devuelve (ficheros, bytes, extensiones, manifiestos)."""
    files = 0
    total_bytes = 0
    exts: Counter = Counter()
    manifests: list[str] = []
    for path in directory.rglob("*"):
        if not path.is_file():
            continue
        rel_parts = path.relative_to(directory).parts
        if any(part in EXCLUDED_DIRS for part in rel_parts[:-1]):
            continue
        files += 1
        try:
            total_bytes += path.stat().st_size
        except OSError:
            pass
        exts[path.suffix.lower() or "(sin extensión)"] += 1
        name = path.name
        if name in ("package.json", "requirements.txt", "docker-compose.yml", "pyproject.toml"):
            manifests.append(str(path.relative_to(directory)))
    return files, total_bytes, exts, sorted(manifests)


def block_summary(name: str, directory: Path) -> dict:
    files, total_bytes, exts, manifests = walk(directory)
    languages = {LANG_BY_EXT.get(ext, ext): count for ext, count in exts.most_common()}
    return {
        "block": name,
        "description": BLOCK_DESCRIPTIONS.get(name, "Bloque legacy del ecosistema"),
        "files": files,
        "bytes": total_bytes,
        "languages": languages,
        "manifests": manifests,
        "has_tests": any("test" in m or "tests" in m for m in manifests)
        or any(p.name.startswith("test_") for p in directory.rglob("test_*.py")),
    }


def build_inventory() -> dict:
    legacy_dir = ROOT / "legacy"
    blocks = []
    if legacy_dir.is_dir():
        for child in sorted(legacy_dir.iterdir()):
            if child.is_dir():
                blocks.append(block_summary(child.name, child))
    root_files = sorted(
        p.name for p in ROOT.iterdir() if p.is_file()
    )
    workflows = sorted(
        p.name for p in (ROOT / ".github" / "workflows").glob("*.yml")
    ) if (ROOT / ".github" / "workflows").is_dir() else []
    return {
        "repository": "backend_aportaciones_software03",
        "title": "Mother 03 · Creative & Music OS",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "root_files": root_files,
        "ci_workflows": workflows,
        "blocks": blocks,
        "total_blocks": len(blocks),
        "total_files": sum(b["files"] for b in blocks),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Inventario JSON del repositorio Mother 03")
    parser.add_argument("--out", type=Path, default=None, help="Ruta de salida (por defecto stdout)")
    args = parser.parse_args()
    inventory = build_inventory()
    payload = json.dumps(inventory, ensure_ascii=False, indent=2)
    if args.out:
        args.out.write_text(payload + "\n", encoding="utf-8")
        print(f"Inventario escrito en {args.out}", file=sys.stderr)
    else:
        print(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
