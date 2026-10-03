# TEMPLATE 02 · Drum Programming

## Objetivo de sesión

Plantilla para crear patrones de batería de forma rápida, conservar el control MIDI expresivo y preparar slicing de loops o breaks sin mezclar las responsabilidades de cada instrumento.

| Elemento | Configuración inicial | Finalidad |
|---|---|---|
| Channel Rack | `FPC_KIT`, `KICK`, `SNARE_CLAP`, `HATS`, `PERC`, `SLICEX_BREAK` | Separación clara de fuentes rítmicas. |
| Mixer 1–6 | Canales individuales de drums | Procesamiento y ganancia por elemento. |
| Mixer 20 | `DRUM BUS` | Glue, saturación leve y control general. |
| Mixer 21 | `DRUM PARALLEL` | Compresión paralela opcional. |
| Mixer 22 | `DRUM ROOM` | Retorno de sala corto. |
| Playlist | `DRUM MIDI`, `DRUM AUDIO`, `BREAK SLICES`, `DRUM PRINT` | Edición y consolidación rápida. |

## Construcción

1. Cargue **FPC** en el Channel Rack y nómbrelo `FPC_KIT`. Cargue un kit de trabajo legalmente licenciado o uno de los kits nativos disponibles.
2. Establezca un mapa de pads consistente. Como punto de partida: kick en C5, snare/clap en D5, closed hat en F#5, open hat en A#5 y percusiones en las filas superiores. Mantenga esta convención en todos los proyectos para evitar reprogramación innecesaria.
3. En **MIDI Settings**, active el controlador y verifique que su puerto de entrada responde. En FPC, use el mapeo MIDI de notas/pads y compruebe que los pads físicos disparan las celdas esperadas. Guarde el mapeo global sólo cuando sea propio de ese controlador; no lo convierta en enlace permanente de un plugin si se usará con distintos equipos.
4. Asigne salidas separadas de FPC a `KICK`, `SNARE_CLAP`, `HATS` y `PERC`, o mantenga una salida única a `DRUM BUS` si el kit no requiere procesamiento por pieza.
5. Inserte **Slicex** en `SLICEX_BREAK`. Configure la carpeta de slices del proyecto y cargue un loop para confirmar que detecta marcadores. Enrute su salida a un canal `BREAK` o directamente a `DRUM BUS` según la complejidad de la sesión.
6. Envíe todos los canales individuales al `DRUM BUS`; retire sus envíos directos al Master si el bus controla la suma. Deje `DRUM PARALLEL` apagado o a nivel mínimo y envíe hacia él desde los elementos que requieran densidad.
7. En `DRUM ROOM`, cargue una reverb corta con 100 % wet. Los envíos desde snare, clap y percusión deben iniciar a un nivel bajo.
8. Añada tres patrones vacíos: `A · GROOVE`, `B · VARIATION` y `C · FILL`. Añada también un patrón `BREAK · SLICES` dedicado a Slicex.

## Control y mezcla inicial

| Canal | Prioridad | Cadena inicial sugerida |
|---|---|---|
| `KICK` | Centro y espacio de subgrave | EQ correctiva → clipper suave opcional. |
| `SNARE_CLAP` | Ataque y presencia | EQ → transient shaper o compresión leve. |
| `HATS` | Ritmo y control de aspereza | Filtro/EQ → control dinámico si es necesario. |
| `PERC` | Movimiento sin saturar el bus | EQ de limpieza → panorámica moderada. |
| `DRUM BUS` | Cohesión | EQ mínima → compresión ligera → medidor. |
| `DRUM PARALLEL` | Densidad en paralelo | Compresión fuerte; retorno bajo y ajustable. |

## Guardado

Guarde el proyecto como plantilla con el nombre `TEMPLATE_02_DRUM_PROGRAMMING`. Guarde de forma separada el estado de FPC si ha creado un mapeo/kit reutilizable y los presets de `DRUM BUS` o `DRUM PARALLEL` si se trasladarán entre sesiones.

## Preflight

- El controlador dispara exactamente los pads previstos.
- Los patrones A, B, C y `BREAK · SLICES` están creados y etiquetados.
- FPC y Slicex llegan al `DRUM BUS` sin duplicar rutas al Master.
- La carpeta de slices y los samples usados están dentro de la estructura del proyecto o se encuentran en una biblioteca correctamente enlazada.
- Los retornos `DRUM PARALLEL` y `DRUM ROOM` no generan realimentación ni clipping.
