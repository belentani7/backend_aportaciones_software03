# Project TODO

## Interfaz de Usuario (Frontend)
- [x] Panel de configuración completo (idioma, estilo, BPM, tonalidad, modelo de IA).
- [x] Campo de tema/concepto central (opcional).
- [x] Botón de ejecución del pipeline con indicador de progreso.
- [x] Visualización del Gemelo Digital (Music IR) con métricas clave.
- [x] Secciones expandibles por estructura musical (acordes, letra).
- [x] Panel de producción por roles abstractos (dinámica, espacio sonoro).
- [x] Registro del sistema en tiempo real (Event Bus Log) estilo consola.
- [x] Exportadores universales (JSON, TXT, MIDI).
- [x] Historial de composiciones guardadas con función de revisión.

## Backend y Lógica de Negocio
- [x] Actualizar esquema de base de datos para almacenar composiciones.
- [x] Implementar funciones de guardado y recuperación de composiciones en `server/db.ts`.
- [x] Mover el kernel de Python a `server/music_os_kernel_python.py`.
- [x] Sustituir el puente frágil por el kernel TypeScript `server/musicKernel.ts`, con fallback local y capas online.
- [x] Crear router de composición (`server/routers/composition.ts`) para la API.
- [x] Integrar el router de composición en `server/routers.ts`.

## Mejoras y Adaptaciones
- [x] Mejorar la comprensión fonética y prosódica en el ComposerAgent para generar letras más "cantables" y musicalmente coherentes.
- [x] Refactorizar el kernel para soportar perfiles local, Ollama y proxy online mediante una capa de proveedor.
- [x] Añadir selección de proveedor en el frontend; las claves permanecen gestionadas server-side y nunca se exponen al cliente.


## Auditoría pesada solicitada
- [x] Auditar compilación, dependencias, logs, pruebas y estado del servidor.
- [x] Auditar frontend real frente a los requisitos y corregir la pantalla de ejemplo.
- [x] Auditar backend, routers tRPC, validaciones, autenticación y autorización.
- [x] Auditar esquema, migraciones y aislamiento de composiciones por usuario.
- [x] Auditar integración del kernel Python, rutas de ejecución y manejo de errores.
- [x] Auditar exportadores JSON, TXT y MIDI y validar archivos generados.
- [x] Auditar seguridad, secretos, prompt injection, límites de recursos y privacidad.
- [x] Ejecutar pruebas unitarias, de integración, smoke y verificación visual.
- [x] Documentar scorecard, bloqueos, riesgos y plan correctivo de auditoría.


## Brechas detectadas en revisión de auditoría
- [x] Implementar progreso real del pipeline desde backend (estado por etapa o polling), sustituyendo el temporizador simulado del cliente.
- [x] Implementar Event Bus incremental con eventos emitidos por Planner, Compositor, Productor y Evaluador durante la ejecución.
- [x] Sustituir la heurística fonética básica por análisis silábico/acentual y validación de cantabilidad por sección.


## Limpieza y publicación solicitadas
- [x] Eliminar código legacy no utilizado, bytecode generado y documentos de auditoría redundantes del repositorio.
- [x] Añadir endurecimiento de producción: validación de entorno, límites de jobs y carga cliente eficiente.
- [x] Ejecutar validación release completa y corregir cualquier fallo antes de crear el checkpoint publicable.
- [x] Preparar el repositorio para publicación externa en GitHub sin ejecutar el envío hasta confirmación del usuario.
- [x] Resolver el audit de dependencias: actualizar paquetes vulnerables sin romper typecheck, pruebas ni build y revisar cualquier excepción residual.
- [x] Implementar validación explícita de variables de entorno requeridas al arrancar el servidor y cubrirla con pruebas.
- [x] Añadir límites verificables al sistema de jobs: capacidad máxima, expiración, limpieza y rechazo cuando se supera el cupo.
- [x] Añadir pruebas automatizadas para expiración y limpieza de jobs en memoria (TTL, eliminación tras finalizar y cleanup en consultas/prepare).
- [x] Añadir una prueba automatizada que ejecute un job hasta completarlo y verifique que, tras JOB_TTL_MS, el job finalizado ya no puede consultarse.
- [x] Añadir una prueba automatizada para cleanup de jobs en estado error después del TTL, además del caso complete.


## Empaquetado de Escritorio Windows 11 (EXE)
- [x] Diseñar el wrapper de Electron o NW.js / pkg para empaquetar el servidor Node y la interfaz en un único ejecutable local.
- [x] Añadir scripts de build para Windows y empaquetar el bundle en un artefacto distribuible.
- [x] Documentar el uso local en Windows 11, incluyendo la integración opcional con Ollama.
- [x] Verificar que `app.asar` contiene `desktop/main.mjs`, `dist/index.js` y `dist/public/index.html`.
- [x] Cubrir con Vitest la identidad loopback y la persistencia JSON aislada del modo escritorio.

## Corrección de publicación web
- [x] Corregir la incompatibilidad de hash de pnpm/Corepack que bloquea el build de producción.
- [x] Reducir el contexto Docker excluyendo node_modules, release, dist y artefactos locales.
- [x] Validar typecheck, pruebas, build y publicación web después de la corrección.
- [x] Reintentar la publicación web y confirmar un despliegue exitoso posterior a la corrección de Corepack.
- [x] Validar explícitamente el flujo `corepack pnpm install` en un entorno limpio antes de cerrar la incidencia.

## Corrección de runtime en producción
- [x] Eliminar efectos secundarios de localStorage durante el render de useAuth.
- [x] Proteger lecturas de window/localStorage en el layout y mostrar un fallback visible ante errores de montaje.
- [x] Verificar el dominio público después de la corrección y cerrar la incidencia solo con #root renderizado.

- [x] Investigar por qué el dominio público mantiene el bundle anterior tras un checkpoint exitoso y corregir la carga del artefacto publicado.

- [x] Determinar y corregir el fallo de montaje de React que persiste en el dominio público aunque el bundle ya cambia tras el despliegue.

- [x] Añadir una ruta de arranque tolerante a errores y diagnóstico visible para evitar que un fallo silencioso deje #root vacío en producción.
- [x] Eliminar el ciclo de inicialización creado por el manual chunk `react-runtime` y verificar el build de producción con CDP.
- [x] Ajustar el umbral de advertencia de chunks tras mantener React en el grafo normal y validar el build local limpio.
- [x] Verificar que el dominio público sirva el bundle CQbgketN generado en producción y que no referencie `react-runtime`.
- [x] Diagnosticar y corregir cualquier discrepancia entre el artefacto local y el artefacto publicado.
- [x] Revalidar en producción que `#root` renderiza contenido real con el artefacto correcto.

- [x] Repetir la verificación pública evitando el 403 transitorio y confirmar #root renderizado con el bundle CQbgketN.

## Sistemas Avanzados del Organismo Creativo (Volumen II)
- [x] 1. Genoma Musical: Estructura tipada (`Genome`) con slots armónicos, rítmicos, tímbricos y formales, operador de cruce y mutación sin colisión armónica.
- [x] 2. Bucle de Auto-Entrenamiento (LoRA/Estilo Autónomo) con rechazo estricto, ratio de mezcla ancla/generado y rollback por caída de diversidad o desvío de canon.
- [x] 3. Lore Engine musical en Drizzle/SQLite y Memoria: Facciones sonoras, arquetipos, símbolos armónicos, lugares acústicos y eventos con detección de nodos huérfanos y crossovers.
- [x] 4. Archivo Inmutable (WORM) y Provenencia C2PA Musical: Checksum SHA-256, metadatos de semilla y genoma, y árbol genealógico (DAG).
- [x] 5. Auto-Curación y Kill-Switches: Detección de colapso, deriva y entropía con mitigación automática y panel de gobernanza.
- [x] 6. Cronograma y Automatización Segura: Heartbeat cron para simular ciclos de evolución, generación de lotes y mantenimiento del lore.
- [x] 7. Panel Web Avanzado (Frontend): Galería virtualizada, Modo Arqueológico con líneas de tiempo y Grafo de Lore interactivo.
- [x] 8. Pruebas automatizadas en Vitest para genoma, mutación, rollback y persistencia.
- [x] Conectar el genoma, la validación armónica, la proveniencia WORM y los enlaces de lore a cada composición generada por el pipeline real.
- [x] Persistir y consultar los artefactos avanzados por usuario desde `server/db.ts`, incluidos los modos web y escritorio.
- [x] Exponer mediante tRPC el estado operativo, el archivo de proveniencia, el lore y los controles de gobernanza.
- [x] Añadir al cockpit datos vivos de backend y controles de kill-switch, evitando tarjetas o métricas decorativas.
- [x] Cubrir con pruebas deterministas los efectos del pipeline de extremo a extremo y el rechazo por kill-switch.
- [x] Hacer que el genoma seleccionado gobierne la armonía que genera el kernel y quede adjunto al Music IR antes de persistir.
- [x] Ejecutar en Vitest un pipeline local aislado que verifique composición, genoma, WORM y enlaces de lore en los archivos persistidos.
- [x] Representar las relaciones de lore como edges navegables entre nodos en el panel arqueológico y verificar su contrato de datos.

## Programa de 400 mejoras verificables
- [x] Crear un registro auditable con al menos 400 mejoras unitarias, cada una vinculada a una implementación, prueba, documentación o control observable.
- [x] Añadir a cada mejora del registro su estado y una referencia de evidencia explícita, verificando mediante prueba que existen 400 IDs únicos y evidencia no vacía.
- [x] Incluir una referencia de evidencia individual no vacía en cada una de las 400 líneas de mejora y validarla automáticamente.
- [x] Implementar importación validada de proyectos Duck, con recuperación ante JSON corrupto y evidencia para IM-163/IM-164/IM-200.
- [x] Implementar historial local de deshacer/rehacer para cambios de proyecto Duck y evidencia para IM-105/IM-106.
- [x] Implementar atajos de producción seguros para transporte, grabación, guardado, exportación y ayuda, y evidencia para IM-203–IM-208.
- [x] Añadir guardado local inmediato con feedback y un atajo distinto de la exportación de archivo, junto con prueba de contrato y documentación.
- [ ] Ampliar el catálogo musical con perfiles armónicos, rítmicos, formales, tímbricos y de producción reutilizables y validados.
- [ ] Reforzar el kernel con validadores, límites, métricas, explicabilidad y recuperación segura por cada etapa del pipeline.
- [ ] Ampliar el cockpit con búsqueda, filtros, estados vacíos, atajos, accesibilidad, responsive design y operaciones de archivo comprobables.
- [ ] Incrementar la cobertura automatizada de unidades, contratos y extremo a extremo para las nuevas capacidades.
- [ ] Completar la documentación de producto, arquitectura, seguridad, operaciones, escritorio Windows y distribución.
- [ ] Validar typecheck, pruebas, build, auditoría de dependencias y experiencia visual antes del release.
- [ ] Publicar la versión validada en Git bajo una cuenta/remoto autorizado por el usuario.
- [ ] Guardar un respaldo comprimido verificable del release y su registro de mejoras en Google Drive.

## Duck Studio Suite — Producción y grabación
- [x] Crear un módulo y ruta Duck independientes de MUSIC OS, con navegación explícita entre ambos productos.
- [x] Implementar un motor Web Audio con ciclo de vida seguro, buses de entrada, mezcla y salida, medición de nivel y recuperación de contexto suspendido.
- [x] Implementar captura de micrófono seleccionable, monitorización, grabación MediaRecorder y biblioteca de tomas local.
- [x] Implementar una cadena vocal real basada en nodos Web Audio: puerta, EQ, de-esser, compresión, saturación, chorus, delay, reverb, estéreo y limitador.
- [x] Implementar afinación guiada por escala como asistencia tonal honesta, sin afirmar compatibilidad con los plugins propietarios de FL Studio.
- [x] Implementar secuenciador de patrones con planificación anticipada, swing, tempo, mute/solo y reproducción musical verificable.
- [x] Implementar piano roll editable, edición de velocidad y reproducción mediante sintetizador Web Audio.
- [x] Implementar mixer por canal con ganancia, paneo, cadena de efectos, medidores y master.
- [x] Añadir una cadena de efectos configurable por canal con filtro, drive y compresión independientes antes de la cadena/master global, junto con pruebas de contrato.
- [x] Implementar compatibilidad Web MIDI progresiva, monitor de eventos y mapeo básico de entrada.
- [x] Implementar persistencia local de proyectos, patrones, ajustes, tomas y presets con controles de exportación.
- [x] Diseñar el cockpit Duck verde esmeralda, accesible, responsive y operativo, sin copiar marcas ni recursos de FL Studio.
- [x] Añadir pruebas unitarias y de interfaz para motor, patrones, escalas, guardado y componentes críticos de Duck.
- [x] Documentar permisos de micrófono/MIDI, compatibilidad de navegador, privacidad local y limitaciones del procesamiento web.
- [x] Conectar la guía tonal a una asistencia interactiva observable para piano roll y MIDI entrante, con prueba determinista.
- [x] Añadir monitor visible de eventos MIDI recientes y mapeo básico de un controlador a transporte o parámetro.
- [x] Implementar presets explícitos de cadena vocal con guardado, carga, borrado y exportación local.
- [x] Añadir pruebas de interfaz/contrato para los controles de Duck Studio y documentar los límites del test de audio real en navegador.
