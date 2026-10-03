# Plantillas de sesión para FL Studio

Esta carpeta contiene **planos de construcción reproducibles** para cuatro sesiones de trabajo. Cada plano enumera los canales, ruteos, plugins, controles y comprobaciones necesarias antes de guardar una plantilla final.

> **Formato correcto.** En FL Studio, una plantilla de proyecto se guarda desde **File → Save as template** y entra en la lista de plantillas. Los proyectos y las plantillas viven bajo la estructura de proyectos, mientras que `.fst` es un archivo de estado para presets de generadores y efectos, no el contenedor de una sesión completa. [1] [2]

Por ello, no se incluyen archivos `.fst` ficticios: un archivo de texto renombrado como `.fst` no abriría una cadena ni una sesión válida y podría provocar una configuración engañosa. Cree cada sesión siguiendo su plano y guárdela como plantilla desde FL Studio. Para reutilizar una cadena individual, guarde el **estado del canal** o el **preset del Mixer** correspondiente en `.fst`, según el manual. [2]

## Uso operativo

| Orden | Acción |
|---|---|
| 1 | Abra una sesión vacía o la plantilla **Minimal** en FL Studio. |
| 2 | Siga el archivo `TEMPLATE_XX_...md` correspondiente, de arriba abajo. |
| 3 | Compruebe plugins, rutas de entrada/salida, latencia y nivel de monitorización. |
| 4 | Guarde una versión de proyecto antes de sustituir plugins o cambiar drivers. |
| 5 | Use **File → Save as template** y asigne el mismo nombre de plantilla sin extensión manual. |
| 6 | Guarde por separado las cadenas reutilizables de Mixer o canales como `.fst` desde sus menús de preset. |

Los plugins de terceros son **sustituibles**. Si no dispone de RX, Vital, Surge XT o un medidor específico, mantenga el objetivo funcional del plano y use un reemplazo compatible. No incluya rutas absolutas de muestras, plugins ni bibliotecas en una plantilla que vaya a mover de equipo.

## Inventario

| Plantilla | Sesión objetivo | Estado principal reutilizable |
|---|---|---|
| `TEMPLATE_01_VOCAL_PROCESSING.md` | Grabación y edición vocal con escucha segura. | Cadena de limpieza/procesamiento de voz. |
| `TEMPLATE_02_DRUM_PROGRAMMING.md` | Programación de drums con FPC, Slicex y controlador MIDI. | Mapeo y patrón base de drums. |
| `TEMPLATE_03_SOUND_DESIGN.md` | Diseño sonoro con Vital o Surge XT, Patcher y automatización. | Patcher de resampling/experimentación. |
| `TEMPLATE_04_MIX_SESSION.md` | Mezcla organizada con buses, retornos y medición. | Estados de bus y cadena de metering. |

## Ubicación recomendada

La documentación oficial sitúa las plantillas de proyecto bajo la carpeta de proyectos del usuario y los presets de plugin bajo la jerarquía de presets. [1] Para instalar una plantilla ya guardada, use el comando de guardado de plantilla de FL Studio o conserve el proyecto desde la carpeta de plantillas del usuario. Evite trabajar dentro de la carpeta de instalación del programa.

## Referencias

[1]: https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/menu_file.htm "Image-Line · File Menu"
[2]: https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/fformats_other_fst.htm "Image-Line · FL Studio State File (*.fst)"
