# TEMPLATE 03 · Sound Design

## Objetivo de sesión

Plantilla para diseñar, automatizar, resamplear y documentar sonidos. El flujo mantiene una fuente de síntesis editable, una red Patcher para experimentar sin perder el sonido original y una pista de audio dedicada a impresiones o resampling.

| Elemento | Configuración inicial | Finalidad |
|---|---|---|
| Channel Rack | `VITAL_MAIN` o `SURGE_MAIN`, `PATCHER_FX`, `RESAMPLE_REC` | Fuente, procesamiento modular y grabación de resultados. |
| Mixer 1 | `SYNTH SOURCE` | Salida de Vital/Surge sin impresión. |
| Mixer 2 | `PATCHER DESIGN` | Red de diseño/efectos y paralelos. |
| Mixer 3 | `RESAMPLE PRINT` | Audio consolidado para slicing o capas. |
| Mixer 10 | `DESIGN SPACE` | Retorno creativo de reverb/delay. |
| Playlist | `MIDI SOURCE`, `AUTOMATION`, `RESAMPLES`, `SELECTS` | Separación de control y resultado. |

## Construcción

1. Cargue **Vital** como fuente principal. Si Vital no está disponible, cargue **Surge XT** y renombre el canal `SURGE_MAIN`. Deje un preset inicial simple y etiquete cualquier preset creado con categoría, tonalidad y versión.
2. Enrute el sintetizador a `SYNTH SOURCE`. Cree desde allí una única ruta hacia `PATCHER DESIGN` y retire el envío directo al Master para evitar duplicación de señal.
3. Abra **Patcher** en `PATCHER DESIGN`. Cree una red mínima y legible: entrada → rama limpia → rama de movimiento/modulación → rama de distorsión o textura → suma → salida. Etiquete visualmente cada rama y mantenga los controles macro en valores seguros al guardar.
4. Conecte una reverb o delay creativo sólo a través de `DESIGN SPACE`, manteniendo el retorno 100 % wet. El objetivo es poder decidir si el espacio se imprime o permanece como efecto de mezcla.
5. Prepare `RESAMPLE PRINT` para grabación de audio. Puede usarse con Edison o con la función de grabación del Mixer, según el flujo. Establezca una carpeta de render dentro del proyecto y deje una pista `RESAMPLES` vacía en la Playlist.
6. Cree y nombre clips de automatización para, como mínimo: **cutoff/filtro**, **macro de movimiento**, **mezcla dry/wet de textura** y **nivel de espacio**. Use las pistas `AUTOMATION` y nombres descriptivos como `AUTO · CUTOFF · 16B`.
7. Añada un patrón MIDI de prueba de ocho compases que cubra registros graves, medios y agudos. Sirve para evaluar aliasing, respuesta de envolvente, estéreo y resonancia al abrir la plantilla.
8. Antes de resamplear, conserve una variante editable del patrón y el preset. Imprima luego a `RESAMPLE PRINT`, arrastre el audio a `RESAMPLES` y añada un comentario de textura/uso previsto en el nombre del clip.

## Controles macro de Patcher

| Macro | Destino recomendado | Rango de seguridad al guardar |
|---|---|---|
| `MACRO 1 · MOTION` | LFO depth, wavetable position o modulación equivalente | 0–20 % |
| `MACRO 2 · EDGE` | Drive, wavefold o distorsión | 0–10 % |
| `MACRO 3 · SPACE` | Send a `DESIGN SPACE` o mezcla de reverb | 0–15 % |
| `MACRO 4 · WIDTH` | Ensanchamiento paralelo, nunca el subgrave | 0–20 % |
| `MACRO 5 · TONE` | Cutoff/tilt EQ | Posición neutra |

## Guardado

Guarde el proyecto como plantilla con el nombre `TEMPLATE_03_SOUND_DESIGN`. Guarde por separado el preset del sintetizador, el estado de Patcher y cualquier cadena de resampling que vaya a reaprovechar. Si comparte la plantilla, documente versiones de plugin y fuentes de samples para facilitar la reproducción de resultados.

## Preflight

- Sólo una fuente de síntesis está activa por defecto: Vital o Surge XT, no ambas sin motivo.
- `SYNTH SOURCE` llega a `PATCHER DESIGN` y no duplica la ruta al Master.
- Los macros de Patcher tienen nombres y posiciones de inicio seguras.
- Existen cuatro clips de automatización etiquetados y un patrón MIDI de prueba.
- La ruta de resampling graba en una carpeta del proyecto y no sobreescribe audio existente.
- Al abrir la plantilla, no hay clipping ni modulación extrema involuntaria.
