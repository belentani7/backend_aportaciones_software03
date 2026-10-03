# Sistema de monitorización

Este directorio contiene un registrador local y un dashboard estático para seguir la carga de los procesos de producción, el rendimiento de renders y generaciones, la disponibilidad de disco y los errores declarados por los motores de IA. El sistema **no transmite datos fuera del equipo**: `metrics.csv` y los eventos diarios JSONL son su única persistencia.

## Estructura

| Ruta | Finalidad |
|---|---|
| `monitor.py` | CLI que captura recursos, mide renders y registra errores. |
| `metrics.csv` | Fuente única que consume el dashboard. Cada fila representa un evento. |
| `logs/YYYY-MM-DD.jsonl` | Registro diario, una entrada JSON por evento, apto para auditoría. |
| `logs/active_runs/` | Estado temporal de renders que se han iniciado y aún no se han cerrado. |
| `dashboard.html` | Panel local sin dependencias externas. |

## Instalación y apertura

Desde esta carpeta, instale la única dependencia y cree el archivo CSV si todavía no existe:

```bash
python -m pip install -r requirements.txt
python monitor.py init
```

Para ver el panel con recarga directa de `metrics.csv`, inicie un servidor local y abra la dirección indicada en un navegador:

```bash
python -m http.server 8080
# Abrir: http://localhost:8080/dashboard.html
```

También se puede abrir `dashboard.html` directamente y elegir manualmente el CSV con el botón **Abrir otro CSV**.

## Captura de recursos

Registre una muestra etiquetada para un plugin o una cadena de trabajo concreta. Si conoce el PID de FL Studio o del proceso de render, añádalo para medir ese proceso en lugar del total de la máquina.

```bash
# Muestra puntual atribuida a Vital
python monitor.py sample --plugin "Vital" --model "Sound Design" --pid 1234

# Veinte muestras, cada cinco segundos, para una cadena vocal
python monitor.py watch --plugin "RX Vocal Chain" --model "Vocal Processing" --pid 1234 --interval 5 --iterations 20
```

El campo `gpu_pct` y la memoria GPU se rellenan cuando `nvidia-smi` está disponible. En equipos sin esa interfaz, los campos quedan vacíos y el dashboard muestra un guion; el sistema nunca estima ni inventa telemetría de GPU.

> **Alcance de la atribución por plugin.** Un sistema operativo mide procesos, no la carga interna de cada VST dentro de un mismo proceso de FL Studio. Por tanto, el monitor registra la CPU del PID indicado y la atribuye a la etiqueta `--plugin` usada durante el tramo de trabajo. Para comparaciones fiables, mida una sola instancia o cadena por vez, con el mismo intervalo y una carga musical comparable.

## Medición de render y tasa de éxito

Abra una medición justo antes del render o la generación y ciérrela al recibir su resultado. El primer comando imprime un identificador que debe usar en el segundo.

```bash
python monitor.py start-render --plugin "FPC" --model "drum-generator" --pid 1234
# Ejemplo de salida: job-20260821T120000Z-a1b2c3

python monitor.py end-render --job-id job-20260821T120000Z-a1b2c3 --status success --message "Render WAV 24-bit finalizado"
```

Para una generación fallida, la ejecución queda reflejada en la tasa de éxito, en el tiempo transcurrido y en la tabla de errores:

```bash
python monitor.py end-render --job-id job-20260821T120000Z-a1b2c3 --status failure --error-code "MODEL_TIMEOUT" --message "La respuesta excedió el tiempo máximo"
```

Los errores que ocurren fuera de un render cronometrado se pueden registrar de forma independiente:

```bash
python monitor.py error --plugin "Patcher" --model "music-model" --error-code "AUTH_FAILED" --message "Credencial no válida"
```

## Diccionario de métricas

| Campo | Significado |
|---|---|
| `cpu_pct` | Porcentaje de CPU del PID indicado o, si no existe PID, del sistema completo. |
| `gpu_pct` | Promedio de utilización de GPU NVIDIA disponible mediante `nvidia-smi`. |
| `gpu_memory_mb` | Memoria usada agregada por las GPU NVIDIA detectadas. |
| `render_time_s` | Duración entre `start-render` y `end-render`. |
| `status` | Resultado de un evento: `success`, `failure`, `error`, `started` o `info`. |
| `disk_free_gb` | Espacio disponible en el volumen que contiene la carpeta del proyecto. |
| `error_code` y `message` | Categoría y detalle operativo del error registrado. |

## Operación recomendada

Inicie un `watch` durante una sesión de prueba de cada cadena importante. Antes y después de cada render, use los comandos `start-render` y `end-render`. Etiquete siempre los eventos con el nombre estable del plugin, cadena o modelo. Después de una sesión, abra el dashboard y seleccione el periodo o plugin que quiere comparar.

No borre filas de `metrics.csv` mientras haya un render activo. Para conservar el histórico antes de depurarlo, copie `metrics.csv` y la carpeta `logs/` con una fecha en el nombre.

## Verificación rápida

```bash
python monitor.py init
python monitor.py sample --plugin "Vital" --model "prueba" --interval 1
python monitor.py start-render --job-id prueba-vital --plugin "Vital" --model "prueba"
python monitor.py end-render --job-id prueba-vital --status success
```

Tras ello, `metrics.csv` debe contener tres nuevas filas o más: una muestra de recursos, inicio de render y generación completada.
