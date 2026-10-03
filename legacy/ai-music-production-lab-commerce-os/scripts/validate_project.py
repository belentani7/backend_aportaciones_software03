#!/usr/bin/env python3
from pathlib import Path
import sys

import yaml

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = [
    "docker-compose.yml",
    ".env",
    ".env.example",
    "ecosystem/backend/app/main.py",
    "ecosystem/frontend/index.html",
    "infra/nginx/default.conf",
    "RUNBOOK.md",
    "SECURITY.md",
]


def main() -> int:
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).is_file()]
    if missing:
        print(f"Faltan archivos requeridos: {', '.join(missing)}", file=sys.stderr)
        return 1
    compose = yaml.safe_load((ROOT / "docker-compose.yml").read_text(encoding="utf-8"))
    services = compose.get("services", {})
    expected_services = {"gateway", "api", "worker", "scheduler", "postgres", "redis"}
    absent = expected_services - set(services)
    if absent:
        print(f"Faltan servicios: {', '.join(sorted(absent))}", file=sys.stderr)
        return 1
    core = compose.get("networks", {}).get("core", {})
    if core.get("internal") is not True:
        print("La red core debe ser interna", file=sys.stderr)
        return 1
    if not any("127.0.0.1:" in port for port in services["gateway"].get("ports", [])):
        print("El gateway debe enlazarse a localhost", file=sys.stderr)
        return 1
    env_mode = (ROOT / ".env").stat().st_mode & 0o777
    if env_mode & 0o077:
        print(".env debe estar restringido al propietario", file=sys.stderr)
        return 1
    print("Validación estructural correcta")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
