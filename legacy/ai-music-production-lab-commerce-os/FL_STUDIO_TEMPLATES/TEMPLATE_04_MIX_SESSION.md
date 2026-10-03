# TEMPLATE 04 · Mix Session

## Objetivo de sesión

Plantilla de mezcla con una jerarquía de ruteo predecible, retornos de efectos centralizados, referencias de nivel y puntos de medición. La sesión parte de canales vacíos, por lo que no fuerza una estética de sonido ni modifica el audio hasta que se cargan los elementos del proyecto.

| Grupo | Canales de origen | Bus de destino | Color recomendado |
|---|---|---|---|
| Drums | Kick, snare, hats, percusión, breaks | `BUS · DRUMS` | Naranja/rojo suave |
| Bass | Sub, bass synth, bass audio | `BUS · BASS` | Violeta |
| Music | Keys, guitars, synths, samples | `BUS · MUSIC` | Azul |
| Vocals | Lead, doubles, adlibs, backing | `BUS · VOCALS` | Verde |
| FX | Risers, impacts, ambience, foley | `BUS · FX` | Amarillo |
| Premaster | Todos los buses | `PREMASTER` | Gris claro |
| Master | Sólo `PREMASTER` y referencia controlada | `MASTER` | Blanco |

## Construcción del Mixer

1. Renombre y coloree los canales de origen antes de insertar plugins. Use nombres que expresen función: `KICK`, `SNARE`, `SUB`, `BASS MID`, `LEAD VOX`, `DBL L`, `DBL R`, `PAD`, `GTR`, etc.
2. Cree los cinco buses de grupo: `BUS · DRUMS`, `BUS · BASS`, `BUS · MUSIC`, `BUS · VOCALS` y `BUS · FX`. Envíe cada canal de origen únicamente a su bus correspondiente y desactive su ruta directa al Master.
3. Cree tres retornos estéreo independientes: `SEND · SHORT VERB`, `SEND · LONG VERB` y `SEND · DELAY`. Mantenga sus efectos en 100 % wet y envíe desde las pistas de origen, no desde el Master.
4. Añada un bus `PARALLEL · DRUMS` y un bus `PARALLEL · VOX`, ambos apagados o a retorno muy bajo. Envíe hacia ellos desde las pistas necesarias; la ruta de regreso debe llegar al bus de grupo, no al Master por separado.
5. Envíe los cinco buses de grupo y los retornos a `PREMASTER`. El único canal que debe alimentar `MASTER` por defecto es `PREMASTER`.
6. Inserte en `PREMASTER` una cadena de observación, inicialmente transparente: medidor de espectro, medidor de correlación/fase, medidor de loudness y medidor peak/true-peak si está disponible. Mantenga cualquier limitador desactivado o en modo de sólo control hasta la fase de mastering.
7. Cree un canal `REFERENCE · MUTE` que pueda cargar una referencia legalmente obtenida. Envíelo directamente al Master **sin** pasar por `PREMASTER`, con un control de ganancia dedicado. Debe permanecer silenciado por defecto y nunca mezclarse en el render final.
8. Agrupe visualmente los tramos del Mixer con separadores: `SOURCES`, `BUSES`, `SENDS`, `PARALLELS`, `METERING`, `REFERENCE`. Deje dos canales vacíos por grupo para crecimiento de la sesión.

## Inserciones por bus

| Bus | Inserciones iniciales | Norma de uso |
|---|---|---|
| `BUS · DRUMS` | EQ de corrección → compresión de glue opcional → medidor | Ajustes suaves; el punch nace en las fuentes. |
| `BUS · BASS` | EQ → control dinámico/mono en graves si procede → medidor | Comprobar compatibilidad con kick. |
| `BUS · MUSIC` | EQ de limpieza → compresión opcional | Mantener espacio para vocal y bajo. |
| `BUS · VOCALS` | EQ correctiva → compresión serial moderada → de-esser → medidor | Usar sends para efectos temporales. |
| `BUS · FX` | EQ pasa-altos/pasa-bajos → control de dinámica | Evitar que los FX ocupen el centro de la mezcla. |
| `PREMASTER` | Spectrum → correlation → loudness → peak/true-peak | Sin procesamiento que cambie el balance al abrir. |

## Ganancia y medición

| Punto de control | Meta operativa |
|---|---|
| Canales de origen | Sin clipping y con margen suficiente para procesar. |
| Buses de grupo | Suma limpia; compresión sólo si resuelve un problema audible. |
| `PREMASTER` | Margen de headroom antes de mastering; vigilar picos y correlación. |
| `MASTER` | Sin plugins de rendimiento ambiguo durante la mezcla. |
| `REFERENCE · MUTE` | Normalizar por percepción, no por la posición del fader. |

## Guardado

Guarde el proyecto como plantilla con el nombre `TEMPLATE_04_MIX_SESSION`. Guarde los estados de los buses y la cadena de metering como presets de Mixer independientes para incorporarlos en proyectos heredados. Mantenga los medidores elegidos documentados; si un medidor es de terceros, indique un sustituto compatible en el nombre del preset o en las notas del proyecto.

## Preflight de mezcla

- Cada pista de origen tiene un único bus de grupo; no hay rutas paralelas accidentales al Master.
- Todos los buses y retornos llegan a `PREMASTER`, y sólo `PREMASTER` llega al Master.
- Los sends están al 100 % wet y los retornos no generan bucles de realimentación.
- La cadena de medición está activa, pero no hay procesamiento de mastering irreversible activado.
- `REFERENCE · MUTE` está silenciado y excluido del render final.
- Colores, nombres y separadores hacen legible la sesión sin abrir plugins.
