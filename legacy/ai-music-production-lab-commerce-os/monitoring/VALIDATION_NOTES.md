# Validación local

Fecha de validación: 2026-08-21.

## Resultados

| Comprobación | Resultado |
|---|---|
| Inicialización de almacenamiento | Correcta; se creó y actualizó `metrics.csv`. |
| Captura de muestra de recursos | Correcta; la prueba registró CPU, disco y ausencia explícita de GPU NVIDIA. |
| Medición de render | Correcta; se abrió y cerró una ejecución de prueba con duración registrada. |
| Carga automática de CSV por HTTP local | Correcta; el dashboard cargó tres eventos desde `metrics.csv`. |
| Dashboard sin datos al abrir por `file://` | Correcto y esperado; se muestra una instrucción clara para usar el selector de archivo o un servidor HTTP local. |
| Tarjetas, tablas y gráficos | Correctos; se mostraron CPU, disco, render medio, tasa de éxito, plugins registrados y serie temporal. |

## Observaciones

La muestra de CPU de la prueba local marcó aproximadamente 0 % porque el proceso estaba inactivo durante la ventana corta de muestreo. En una carga real de FL Studio, el valor dependerá del PID indicado, del intervalo de muestra y de la actividad del proyecto.

No se detectó `nvidia-smi` en el entorno de validación. Por diseño, GPU y memoria GPU aparecen vacías en lugar de mostrar valores estimados. Esto confirma el comportamiento de degradación segura documentado en `README.md`.
