#!/usr/bin/env python3
"""Read-only, offline inventory of the seven legacy Music OS components."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

COMPONENTS = (
    "SoulX-Singer",
    "coqui_tts",
    "music-os-interface",
    "music-os-pedro-belentani",
    "ai-music-production-lab-commerce-os",
    "MusicAI_Production",
    "voice-ai-agency",
)
INDICATORS = ("README.md", "package.json", "pyproject.toml", "requirements.txt", "main.py")


def inventory(root: Path) -> dict:
    """Inspect only allowlisted filenames; never read media, credentials or user data."""
    root = root.resolve()
    legacy = root / "legacy"
    if not legacy.is_dir() or legacy.is_symlink():
        raise ValueError("Expected a real legacy/ directory in the Music OS repository")
    entries = []
    for name in COMPONENTS:
        folder = legacy / name
        if not folder.is_dir() or folder.is_symlink():
            entries.append({"name": name, "status": "missing", "indicators": [], "scripts": []})
            continue
        indicators = [item for item in INDICATORS if (folder / item).is_file() and not (folder / item).is_symlink()]
        entry = {"name": name, "status": "available", "indicators": indicators, "scripts": []}
        manifest = folder / "package.json"
        if "package.json" in indicators:
            try:
                package = json.loads(manifest.read_text(encoding="utf-8"))
                scripts = package.get("scripts", {})
                if not isinstance(scripts, dict) or any(not isinstance(key, str) for key in scripts):
                    raise ValueError("Invalid package scripts")
                entry["scripts"] = sorted(scripts)
            except (OSError, UnicodeError, ValueError, TypeError):
                entry["status"] = "invalid-package-json"
        entries.append(entry)
    return {"schema_version": 1, "components": entries, "available": sum(e["status"] == "available" for e in entries)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    args = parser.parse_args()
    try:
        result = inventory(args.root)
    except ValueError as exc:
        parser.error(str(exc))
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        for component in result["components"]:
            print(f"{component['name']}: {component['status']} ({', '.join(component['indicators']) or 'no entrypoints'})")
        print(f"Available: {result['available']}/{len(COMPONENTS)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
