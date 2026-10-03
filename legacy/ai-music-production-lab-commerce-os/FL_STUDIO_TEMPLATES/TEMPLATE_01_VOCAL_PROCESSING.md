# TEMPLATE 01 · Vocal Processing

## Objetivo de sesión

Plantilla para capturar, limpiar y monitorizar una voz principal sin imprimir procesamiento destructivo. El diseño separa la pista de grabación, la cadena de escucha y los retornos creativos, de modo que una toma limpia siga disponible aunque se modifique el carácter de la mezcla.

| Elemento | Configuración inicial | Finalidad |
|---|---|---|
| Playlist | `VOCAL_MAIN`, `VOCAL_DBL`, `ADLIBS`, `COMP_PRINT` | Organización de tomas y consolidaciones. |
| Mixer 1 | `VOX REC · INPUT` | Entrada de micrófono; armado para grabación. |
| Mixer 2 | `VOX MON · RX CHAIN` | Monitorización procesada, no impresa. |
| Mixer 3 | `VOX MAIN · MIX` | Voz principal ya seleccionada/compensada. |
| Mixer 10 | `VOX REV SEND` | Retorno de reverb. |
| Mixer 11 | `VOX DELAY SEND` | Retorno de delay. |
| Master | Sin limitador agresivo durante tracking | Evita decisiones irreversibles al grabar. |

## Construcción

1. Seleccione el driver de audio de menor latencia estable y confirme la entrada del micrófono en `VOX REC · INPUT`.
2. Abra **Edison** en el primer slot de `VOX REC · INPUT`. Seleccione la entrada correcta dentro de Edison, active su grabación y déjelo preparado antes de comenzar la toma. Mantenga el canal de grabación sin reducción de ruido, afinación o normalización impresa.
3. Desactive el envío de `VOX REC · INPUT` al master y enrútelo solamente a `VOX MON · RX CHAIN`. Así, la voz cruda se graba y la voz procesada se escucha a través de una rama distinta.
4. Inserte en `VOX MON · RX CHAIN` una cadena RX de escucha con el siguiente orden: **Voice De-noise → De-plosive → De-click → De-ess**. Ajuste cada módulo con reducción moderada; el objetivo es mejorar inteligibilidad, no borrar consonantes ni ambiente natural.
5. Desde `VOX MON · RX CHAIN`, envíe la señal a `VOX MAIN · MIX`. En este canal, deje marcadores vacíos para EQ correctiva, compresión vocal, de-esser tonal y afinación en tiempo real, según el estilo.
6. Cree envíos post-fader de `VOX MAIN · MIX` a `VOX REV SEND` y `VOX DELAY SEND`. Mantenga ambos retornos a 100 % wet.
7. Active el icono de disco del canal `VOX REC · INPUT`, confirme la carpeta de destino y haga una prueba de diez segundos. Revise nivel de entrada, ausencia de clipping y sincronía con el playback.

## Monitorización

| Control | Ajuste de partida | Comprobación |
|---|---|---|
| Buffer | El valor más bajo estable para la interfaz | No debe haber clicks ni dropout. |
| Monitor directo | Desactivado si se usa la cadena RX; activado sólo si se necesita cero latencia | Nunca escuchar simultáneamente señal directa y señal del DAW. |
| Nivel de preamplificador | Picos de toma lejos de 0 dBFS | Deje margen; no compense clipping con plugins. |
| Cadena RX | Sólo en la rama de escucha | La toma en Edison debe seguir disponible limpia. |
| Master | Picos con margen durante tracking | Sin limitador de mastering al grabar. |

## Guardado

Guarde el proyecto como plantilla con el nombre `TEMPLATE_01_VOCAL_PROCESSING`. Si desea reutilizar sólo el procesamiento, guarde los estados de `VOX MON · RX CHAIN` y `VOX MAIN · MIX` como presets de Mixer independientes. Documente en el nombre del preset la versión de RX o los sustitutos usados.

## Preflight antes de REC

- Edison está armado y la entrada correcta está seleccionada.
- `VOX REC · INPUT` graba limpio y no se envía al master.
- `VOX MON · RX CHAIN` permite escuchar sin latencia molesta ni doble señal.
- La señal llega a `VOX MAIN · MIX` y los sends a reverb/delay permanecen controlados.
- Una toma corta se reproduce desde Edison y se localiza correctamente en la carpeta del proyecto.
