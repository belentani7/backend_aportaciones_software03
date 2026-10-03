# Duck Studio Suite

Duck Studio Suite es el módulo de producción y grabación que convive con MUSIC OS sin sustituirlo. Mientras MUSIC OS compone y audita un Music IR mediante agentes, Duck permite **interpretar, grabar, secuenciar y mezclar** dentro del navegador.

## Apertura y flujo de trabajo

Abra **Duck Studio** desde el menú lateral o la acción “Abrir Duck Studio” del cockpit de MUSIC OS. Primero pulse **Ativar áudio**, ajuste el BPM, la tonalidad, la escala y el swing, y use el Channel Rack o el Piano Roll para construir un patrón. El botón **Tocar** inicia un planificador musical de primer plano, con anticipación de 120 ms y sin tareas durables de servidor.

| Área | Acción disponible | Persistencia |
|---|---|---|
| Channel Rack | Programar cuatro canales, pasos, mute, solo, ganancia y paneo | Proyecto local |
| Piano Roll | Crear o borrar notas, y ajustar su velocidad | Proyecto local |
| Mixer | Buses por canal con nivel, paneo, filtro tonal, drive, compresión y medidor individual antes del master | Proyecto local |
| Voice Lab | Seleccionar micrófono, monitorizar y grabar la salida procesada | Biblioteca local de IndexedDB |
| Cadena vocal | Gate, EQ, de-esser, compresión, saturación, chorus, delay, reverb, anchura y limitador | Proyecto local |
| Scale Assist | Cuantizar opcionalmente notas del piano roll y MIDI a la escala seleccionada | Proyecto local |
| MIDI | Escuchar Note On/Off, CC y pitch bend; monitor de eventos y nota 36 para transporte | Solo sesión actual |
| Presets | Aplicar, guardar, borrar y exportar ajustes de cadena vocal | Navegador local |
| Historial | Deshacer y rehacer cambios de proyecto recientes | Memoria local de la pestaña |
| Proyecto | Importar JSON Duck v1 validado y exportar una copia portátil | Usuario decide cuándo mover datos |

## Permisos y privacidad

Duck solicita el micrófono únicamente cuando se pulsa **Conectar** o **Gravar tomada**. La toma se procesa en la pestaña actual mediante la [Web Audio API](https://developer.mozilla.org/docs/Web/API/Web_Audio_API) y se guarda localmente en IndexedDB; no se envía automáticamente al backend de MUSIC OS ni a un servicio externo.

> Los permisos de micrófono y MIDI son decididos por el navegador y por el usuario. Para un flujo estable, use `https` o `localhost`, conceda el permiso explícitamente y prefiera Chrome, Edge o Firefox actualizados.

Los proyectos se guardan como una estructura JSON en `localStorage`. La biblioteca de tomas almacena los blobs de audio en IndexedDB para no incorporarlos al JSON de proyecto. Exporte el proyecto con **Exportar projeto** y descargue cada toma desde la biblioteca antes de limpiar datos de navegación.

La opción **Importar** solo admite JSON de proyecto Duck v1 con una lista de canales válida y limita el archivo a 1 MB. El contenido se normaliza antes de llegar al proyecto activo; un archivo corrupto no sustituye el proyecto actual. Las acciones de edición, incluido un proyecto importado, quedan disponibles en el historial de la pestaña mediante los controles de deshacer y rehacer. Este historial no es un sistema de copias de seguridad: use la exportación para conservar una copia fuera del navegador.

## Atajos de producción

| Atajo | Acción | Restricción de seguridad |
|---|---|---|
| Espacio | Iniciar o detener el transporte | No se captura al escribir en un campo. |
| R | Iniciar o detener la grabación | El navegador aún debe conceder permiso de micrófono. |
| Ctrl/Cmd + S | Guardar localmente | Persiste el proyecto activo en el navegador solo fuera de campos editables. |
| Ctrl/Cmd + E | Exportar proyecto | Mantiene el control de descarga en el usuario. |
| ? | Mostrar u ocultar ayuda | No se captura al escribir en un campo. |

## Cadena de voz y grabación

La cadena está construida con nodos Web Audio estándar: ganancia, filtros, compresores, waveshaper, delay, convolver, paneo y analizador. La grabación captura la salida procesada local de dicha cadena. Los controles no son plugins VST/AU y Duck no afirma cargar, replicar o distribuir procesadores propietarios de otros DAWs.

La asistencia tonal de Duck puede cuantizar las notas creadas en el piano roll y las entradas MIDI a la nota permitida más cercana de la escala elegida. **No modifica la afinación del micrófono**, no conserva formantes y no declara una emulación de productos comerciales de afinación.

## Compatibilidad y resolución de problemas

| Situación | Comprobación recomendada |
|---|---|
| “Web Audio API” no disponible | Abra la app con un navegador actualizado y sin modo que bloquee audio. |
| No hay dispositivos de entrada | Pulse “Ativar áudio”, conceda el permiso y vuelva a abrir el selector. |
| No graba | Conecte el micrófono antes de pulsar “Gravar tomada”; confirme que el navegador ofrece MediaRecorder. |
| No llega MIDI | Pulse “Conectar Web MIDI”, autorice el acceso y verifique el cable/controlador. |
| No aparecen tomas previas | Compruebe que IndexedDB no esté bloqueado o haya sido borrado por el navegador. |

## Límites actuales

Duck es una estación de producción web local, no un reemplazo universal de un DAW de escritorio. No hospeda VST/AU propietarios, no exporta una mezcla WAV offline completa todavía y no sincroniza automáticamente proyectos ni tomas entre dispositivos. Para conservar material, descargue las tomas y el JSON exportado como parte de su flujo de respaldo.

## Validación

El proyecto incluye pruebas deterministas de teoría, cuantización, estructura de proyecto, scheduler, presets y un contrato estático de los controles críticos de la interfaz. La captura real de micrófono, los permisos y los nodos Web Audio requieren un navegador y hardware reales; esos límites se verifican de forma manual en el cockpit, no se simulan como una grabación de producción dentro del entorno de pruebas de Node.
