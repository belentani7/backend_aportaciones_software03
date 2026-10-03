#!/usr/bin/env python3
"""Monitor local para AI_MUSIC_PRODUCTION_LAB.

No transmite datos a terceros. Todas las métricas se guardan bajo monitoring/.
"""
from __future__ import annotations

import argparse
import csv
import json
import shutil
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import psutil
except ImportError as exc:
    sys.stderr.write(
        "Falta la dependencia 'psutil'. Instale con: python -m pip install -r requirements.txt\n"
    )
    raise SystemExit(2) from exc

BASE_DIR = Path(__file__).resolve().parent
LOG_DIR = BASE_DIR / "logs"
RUN_DIR = LOG_DIR / "active_runs"
METRICS_FILE = BASE_DIR / "metrics.csv"
FIELDS = [
    "timestamp_utc",
    "event_type",
    "status",
    "job_id",
    "plugin",
    "model",
    "render_time_s",
    "cpu_pct",
    "gpu_pct",
    "gpu_memory_mb",
    "disk_total_gb",
    "disk_free_gb",
    "pid",
    "error_code",
    "message",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def ensure_storage() -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    if not METRICS_FILE.exists() or METRICS_FILE.stat().st_size == 0:
        with METRICS_FILE.open("w", newline="", encoding="utf-8") as handle:
            csv.DictWriter(handle, fieldnames=FIELDS).writeheader()


def clean(value: Any) -> Any:
    if value is None:
        return ""
    if isinstance(value, float):
        return round(value, 2)
    return value


def gpu_metrics() -> tuple[float | None, float | None]:
    """Devuelve media de uso y memoria de todas las GPU NVIDIA detectadas.

    En equipos sin nvidia-smi, devuelve valores vacíos de forma deliberada: no se
    debe inventar telemetría para GPU AMD, Intel o macOS.
    """
    executable = shutil.which("nvidia-smi")
    if not executable:
        return None, None
    try:
        output = subprocess.check_output(
            [
                executable,
                "--query-gpu=utilization.gpu,memory.used",
                "--format=csv,noheader,nounits",
            ],
            text=True,
            stderr=subprocess.DEVNULL,
            timeout=3,
        )
        samples = []
        for line in output.strip().splitlines():
            values = [part.strip() for part in line.split(",")]
            if len(values) == 2:
                samples.append((float(values[0]), float(values[1])))
        if not samples:
            return None, None
        return (
            sum(item[0] for item in samples) / len(samples),
            sum(item[1] for item in samples),
        )
    except (OSError, subprocess.SubprocessError, ValueError):
        return None, None


def resource_snapshot(pid: int | None, interval: float) -> dict[str, Any]:
    disk = psutil.disk_usage(str(BASE_DIR.anchor or Path.cwd().anchor))
    gpu_pct, gpu_memory_mb = gpu_metrics()
    cpu_pct: float | None
    effective_pid: int | None = pid
    if pid:
        try:
            process = psutil.Process(pid)
            process.cpu_percent(interval=None)
            time.sleep(max(interval, 0.1))
            cpu_pct = process.cpu_percent(interval=None)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            cpu_pct = None
    else:
        cpu_pct = psutil.cpu_percent(interval=max(interval, 0.1))
        effective_pid = None
    return {
        "cpu_pct": cpu_pct,
        "gpu_pct": gpu_pct,
        "gpu_memory_mb": gpu_memory_mb,
        "disk_total_gb": disk.total / (1024**3),
        "disk_free_gb": disk.free / (1024**3),
        "pid": effective_pid,
    }


def write_record(record: dict[str, Any]) -> None:
    ensure_storage()
    normalized = {field: clean(record.get(field, "")) for field in FIELDS}
    with METRICS_FILE.open("a", newline="", encoding="utf-8") as handle:
        csv.DictWriter(handle, fieldnames=FIELDS).writerow(normalized)
    log_file = LOG_DIR / f"{datetime.now(timezone.utc):%Y-%m-%d}.jsonl"
    with log_file.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(normalized, ensure_ascii=False) + "\n")


def base_record(args: argparse.Namespace, event_type: str, status: str) -> dict[str, Any]:
    return {
        "timestamp_utc": utc_now(),
        "event_type": event_type,
        "status": status,
        "job_id": getattr(args, "job_id", "") or "",
        "plugin": getattr(args, "plugin", "") or "",
        "model": getattr(args, "model", "") or "",
        "render_time_s": None,
        "cpu_pct": None,
        "gpu_pct": None,
        "gpu_memory_mb": None,
        "disk_total_gb": None,
        "disk_free_gb": None,
        "pid": getattr(args, "pid", None),
        "error_code": "",
        "message": "",
    }


def add_snapshot(record: dict[str, Any], pid: int | None, interval: float) -> dict[str, Any]:
    record.update(resource_snapshot(pid, interval))
    return record


def command_init(_: argparse.Namespace) -> int:
    ensure_storage()
    print(f"Inicializado: {BASE_DIR}")
    return 0


def command_sample(args: argparse.Namespace) -> int:
    record = base_record(args, "resource_sample", "info")
    record["message"] = "Muestra de recursos registrada"
    write_record(add_snapshot(record, args.pid, args.interval))
    print("Muestra registrada")
    return 0


def command_watch(args: argparse.Namespace) -> int:
    completed = 0
    print("Monitor activo. Presione Ctrl+C para detenerlo.")
    try:
        while args.iterations == 0 or completed < args.iterations:
            record = base_record(args, "resource_sample", "info")
            record["message"] = "Muestra periódica de recursos"
            write_record(add_snapshot(record, args.pid, args.interval))
            completed += 1
            if args.iterations == 0 or completed < args.iterations:
                time.sleep(args.interval)
    except KeyboardInterrupt:
        print("Monitor detenido")
    return 0


def command_start(args: argparse.Namespace) -> int:
    ensure_storage()
    job_id = args.job_id or f"job-{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}-{uuid.uuid4().hex[:6]}"
    start = {
        "job_id": job_id,
        "started_epoch": time.time(),
        "plugin": args.plugin or "",
        "model": args.model or "",
        "pid": args.pid,
    }
    run_file = RUN_DIR / f"{job_id}.json"
    run_file.write_text(json.dumps(start, ensure_ascii=False, indent=2), encoding="utf-8")
    record = base_record(args, "render_started", "started")
    record["job_id"] = job_id
    record["message"] = "Render o generación iniciado"
    write_record(add_snapshot(record, args.pid, args.interval))
    print(job_id)
    return 0


def command_end(args: argparse.Namespace) -> int:
    ensure_storage()
    run_file = RUN_DIR / f"{args.job_id}.json"
    if not run_file.exists():
        sys.stderr.write(f"No existe una ejecución activa con id '{args.job_id}'.\n")
        return 1
    start = json.loads(run_file.read_text(encoding="utf-8"))
    succeeded = args.status == "success"
    record = {
        "timestamp_utc": utc_now(),
        "event_type": "generation_completed" if succeeded else "generation_failed",
        "status": "success" if succeeded else "failure",
        "job_id": args.job_id,
        "plugin": start.get("plugin", ""),
        "model": start.get("model", ""),
        "render_time_s": max(0, time.time() - float(start["started_epoch"])),
        "cpu_pct": None,
        "gpu_pct": None,
        "gpu_memory_mb": None,
        "disk_total_gb": None,
        "disk_free_gb": None,
        "pid": start.get("pid"),
        "error_code": args.error_code if not succeeded else "",
        "message": args.message or ("Generación completada" if succeeded else "Generación fallida"),
    }
    write_record(add_snapshot(record, start.get("pid"), args.interval))
    run_file.unlink()
    print("Ejecución cerrada")
    return 0


def command_error(args: argparse.Namespace) -> int:
    record = base_record(args, "model_error", "error")
    record["error_code"] = args.error_code or "UNSPECIFIED"
    record["message"] = args.message
    write_record(add_snapshot(record, args.pid, args.interval))
    print("Error registrado")
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="Monitor local de AI Music Production Lab")
    sub = root.add_subparsers(dest="command", required=True)

    init = sub.add_parser("init", help="Crea el CSV y las carpetas de logs")
    init.set_defaults(func=command_init)

    def telemetry_options(command: argparse.ArgumentParser) -> None:
        command.add_argument("--plugin", default="", help="Nombre del plugin o cadena de procesamiento")
        command.add_argument("--model", default="", help="Modelo de IA o motor de generación")
        command.add_argument("--pid", type=int, help="PID de FL Studio o del proceso supervisado")
        command.add_argument("--interval", type=float, default=1.0, help="Ventana de muestreo en segundos")

    sample = sub.add_parser("sample", help="Registra una muestra de CPU/GPU/disco")
    telemetry_options(sample)
    sample.set_defaults(func=command_sample)

    watch = sub.add_parser("watch", help="Registra muestras periódicas; 0 iteraciones significa continuo")
    telemetry_options(watch)
    watch.add_argument("--iterations", type=int, default=0, help="Número de muestras a registrar")
    watch.set_defaults(func=command_watch)

    start = sub.add_parser("start-render", help="Abre una medición de render o generación")
    telemetry_options(start)
    start.add_argument("--job-id", default="", help="Identificador opcional de la ejecución")
    start.set_defaults(func=command_start)

    end = sub.add_parser("end-render", help="Cierra una medición activa")
    end.add_argument("--job-id", required=True, help="Identificador devuelto por start-render")
    end.add_argument("--status", required=True, choices=["success", "failure"], help="Resultado de la ejecución")
    end.add_argument("--error-code", default="", help="Código de error si el resultado es failure")
    end.add_argument("--message", default="", help="Descripción breve del resultado")
    end.add_argument("--interval", type=float, default=0.2, help="Ventana de muestra final en segundos")
    end.set_defaults(func=command_end)

    error = sub.add_parser("error", help="Registra un error del modelo fuera de un render cronometrado")
    telemetry_options(error)
    error.add_argument("--job-id", default="", help="Identificador opcional de la ejecución")
    error.add_argument("--error-code", default="UNSPECIFIED", help="Código o categoría de error")
    error.add_argument("--message", required=True, help="Descripción del error")
    error.set_defaults(func=command_error)
    return root


def main() -> int:
    args = parser().parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
