# MUSIC OS v1.0

Cockpit web de composición musical autónoma con **Music IR**, pipeline multi-agente, análisis prosódico, producción por roles abstractos, exportación JSON/TXT/MIDI e historial aislado por usuario.

## Ejecutar en desarrollo

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

Abre la URL que muestre el servidor. Inicia sesión mediante Manus OAuth para acceder al historial y a las operaciones protegidas de composición.

## Uso

En el cockpit selecciona idioma, estilos, BPM, tonalidad y motor. El concepto central es opcional: si se deja vacío, el kernel genera una idea autónoma. `Kernel local` funciona sin API; `Ollama local` usa el modelo configurado en el servidor; `Proxy online` utiliza el helper server-side del entorno sin exponer credenciales al navegador.

Pulsa **Ejecutar pipeline**. El backend crea un job y actualiza Planner, Compositor, Productor y Evaluador. La interfaz consulta el progreso y el Event Bus incremental hasta recibir el Music IR final. Desde el resultado se pueden descargar JSON, TXT y MIDI, y revisar composiciones anteriores del usuario.

## Arquitectura

- `client/src/pages/Home.tsx`: cockpit y exportadores.
- `client/src/pages/DuckStudio.tsx`: módulo Duck Studio de secuenciación, grabación y mezcla local en navegador.
- `client/src/lib/duck/`: motor Web Audio, teoría de escala, secuenciador de primer plano, proyecto y biblioteca local de tomas.
- `server/musicKernel.ts`: composición local, proveedores, teoría armónica, prosodia y MIDI.
- `server/routers/composition.ts`: jobs, progreso, Event Bus, generación e historial protegido.
- `server/db.ts` y `drizzle/schema.ts`: persistencia y aislamiento por usuario.
- `server/*.test.ts`: pruebas de autenticación, router, kernel, prosodia y exportadores.

## Validación de release

```bash
pnpm check
pnpm test
pnpm build
```

El estado de jobs se mantiene en memoria por proceso. El sistema limita la cola a 100 jobs, evita ejecuciones concurrentes por usuario y elimina jobs terminados o fallidos después de 10 minutos. Antes de desplegar con múltiples instancias debe migrarse a un almacén compartido o cola de trabajos. Los modelos online requieren configuración server-side y no deben introducirse como secretos en el cliente.

## Duck Studio Suite

La ruta `/duck` ofrece un módulo independiente de producción: Channel Rack de 16 pasos, piano roll, mezcla, sintetizador y percusión con Web Audio, captura de micrófono, cadena vocal, biblioteca de tomas local y entrada Web MIDI progresiva. El almacenamiento de proyecto usa el navegador; las tomas se almacenan en IndexedDB y no se envían automáticamente al servidor. La guía de permisos, exportación y límites está en [docs/DUCK_STUDIO.md](docs/DUCK_STUDIO.md).

## Aplicación de escritorio Windows 11

El proyecto puede empaquetarse como un EXE portable con `pnpm desktop:build`. El resultado se genera en `release/MUSIC-OS-1.0.0-x64.exe` y no requiere instalar Node.js. Al abrirlo, Electron inicia el servidor local en loopback, carga el cockpit y guarda el historial en la carpeta de datos de usuario de Windows, dentro de `AppData\\Roaming\\MUSIC OS\\compositions`.

El modo escritorio usa el kernel local y no necesita OAuth, MySQL ni conexión a Internet para componer y exportar JSON, TXT y MIDI. Ollama es opcional: si está instalado en Windows, ejecuta `ollama run qwen2.5:7b` y selecciona `ollama` en el cockpit. Los proveedores online requieren sus credenciales y configuración server-side. El instalador NSIS se genera con `pnpm desktop:build:installer` en un host Windows con las herramientas de firma disponibles; el EXE portable ya es el artefacto distribuible principal.

## CI y seguridad

El workflow `.github/workflows/ci.yml` ejecuta instalación congelada, typecheck, pruebas y build para cada cambio en GitHub. La auditoría de dependencias de producción se valida con `pnpm audit --prod --audit-level high`; el estado actual no reporta vulnerabilidades altas o críticas conocidas. El repositorio excluye secretos, bytecode, logs y artefactos de build mediante `.gitignore`.

## Publicación

Primero ejecuta las validaciones de release y crea un checkpoint en la interfaz de gestión. La publicación externa en GitHub debe realizarse mediante la acción de exportación del proyecto, verificando antes el propietario y el nombre del repositorio. No se incluyen claves, archivos `.env`, bytecode ni artefactos generados.

## Licencia

El repositorio se publica bajo la licencia MIT incluida en `LICENSE`.
