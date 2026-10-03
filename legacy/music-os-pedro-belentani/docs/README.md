# MUSIC OS v1.0: Sistema Operativo Musical Basado en Agentes

Bienvenido a **MUSIC OS v1.0**, un sistema innovador diseñado para la composición y producción musical asistida por inteligencia artificial. Este proyecto transforma la visión de un simple generador de canciones en una plataforma robusta, capaz de fusionar estilos artísticos complejos y adaptarse a múltiples idiomas, todo ello operable en tu entorno local.

## 1. Introducción

MUSIC OS v1.0 es un ecosistema musical completo y evolutivo. Su objetivo es emular el criterio de un productor musical de élite, integrando la esencia de artistas como **Lady Gaga**, **The Smiths**, **Anitta** y **Nathy Peluso**. A diferencia de otros sistemas, MUSIC OS **aprende y evoluciona** con cada canción generada, adaptando su criterio artístico a través de sus motores de Creatividad y Aprendizaje.

La arquitectura se basa en un **Gemelo Digital de la Canción (Music IR)** y una **Lógica de Negociación Multi-Agente**, permitiendo una colaboración dinámica entre diferentes módulos especializados. Aunque la visión completa de MUSIC OS v1.0 es ambiciosa, esta implementación se centra en un prototipo funcional que demuestra sus principios fundamentales en un entorno local [1].

## 2. Arquitectura General y Motores Avanzados

El corazón de MUSIC OS v1.0 es el **Music IR**, una representación unificada y detallada de la canción. El sistema ahora incluye:

*   **Motor de Creatividad (Originalidad):** Permite ajustar el nivel de riesgo artístico, forzando al sistema a buscar soluciones melódicas y líricas fuera de lo común.
*   **Motor de Aprendizaje y Evolución:** El sistema mantiene una memoria histórica (`music_os_history.json`) de la cual extrae patrones aprendidos y métricas de evolución, mejorando su coherencia y estilo con el tiempo.
*   **Arquitectura Multi-Agente:** Agentes especializados (Director, Compositor, Productor, Aprendizaje) negocian a través del Music IR para alcanzar el objetivo artístico.

Para una descripción detallada de la arquitectura y el diseño del Gemelo Digital, consulta los documentos:
*   [`Diseno_Gemelo_Digital_y_Multiagente.md`](./Diseno_Gemelo_Digital_y_Multiagente.md)
*   [`Evaluacion_Viabilidad_MUSIC_OS.md`](./Evaluacion_Viabilidad_MUSIC_OS.md)

## 3. Requisitos del Sistema

Para ejecutar MUSIC OS v1.0 en tu ordenador, necesitarás:

*   **Sistema Operativo:** Windows, macOS o Linux.
*   **Python:** Versión 3.x (se recomienda la última versión estable).
*   **Ollama:** Una plataforma para ejecutar modelos de lenguaje grandes (LLMs) localmente. Descárgalo desde [ollama.com](https://ollama.com/).
*   **Modelo de Lenguaje:** Un modelo compatible con Ollama. Se recomienda `qwen2.5:7b` por su rendimiento en español, catalán y francés, y su eficiencia en el uso de recursos (funciona con 8GB de RAM). Alternativamente, puedes usar `llama3`.

## 4. Instalación y Configuración

Sigue estos pasos para preparar tu entorno:

### 4.1. Instalar Ollama y el Modelo de Lenguaje

1.  **Descarga e instala Ollama:** Visita [ollama.com](https://ollama.com/) y descarga el instalador para tu sistema operativo. Sigue las instrucciones de instalación.
2.  **Descarga el modelo de lenguaje:** Abre tu terminal (CMD o PowerShell en Windows, Terminal en macOS/Linux) y ejecuta el siguiente comando para descargar el modelo recomendado:
    ```bash
    ollama pull qwen2.5:7b
    ```
    Si prefieres `llama3`, usa:
    ```bash
    ollama pull llama3
    ```
    **Importante:** Asegúrate de que Ollama esté ejecutándose en segundo plano. Puedes verificarlo abriendo la aplicación Ollama o ejecutando `ollama serve` en la terminal.

### 4.2. Instalar Librerías de Python

1.  **Abre tu terminal** y ejecuta el siguiente comando para instalar las librerías necesarias:
    ```bash
    pip install streamlit midiutil
    ```
    La librería `ollama` se importa directamente en el código si está disponible en el entorno de ejecución de Streamlit.

## 5. Uso de MUSIC OS v1.0

El sistema se opera a través de una interfaz de usuario web interactiva construida con Streamlit.

### 5.1. Guardar los Archivos

1.  Guarda los archivos `music_os_core.py` y `music_os_ui.py` en la misma carpeta de tu elección en tu ordenador.

### 5.2. Ejecutar la Aplicación

1.  **Abre tu terminal** y navega hasta la carpeta donde guardaste los archivos.
2.  **Ejecuta la aplicación** con el siguiente comando:
    ```bash
    streamlit run music_os_ui.py
    ```
3.  Tu navegador web se abrirá automáticamente en una dirección similar a `http://localhost:8501`, mostrando la interfaz de MUSIC OS v1.0.

### 5.3. Interfaz de Usuario (Cockpit Universal)

La interfaz de usuario te permitirá controlar los parámetros de composición y producción:

*   **Barra Lateral Izquierda (Configuración):**
    *   **Idioma Nativo:** Selecciona el idioma para la letra.
    *   **Fusión de Estilos:** Elige los artistas cuyo estilo deseas fusionar (Lady Gaga, The Smiths, Anitta, Nathy Peluso).
    *   **BPM (Tempo):** Ajusta el tempo de la canción.
    *   **Tonalidad:** Selecciona la tonalidad principal.
    *   **Modelo Ollama:** Especifica el nombre del modelo de lenguaje a usar (por defecto `qwen2.5:7b`).
*   **Área Central:**
    *   **Concepto o Tema de la Canción:** Introduce una descripción detallada del tema, emoción o historia.
*   **Botón "GENERAR OBRA MAESTRA":** Inicia el proceso de composición y producción.

### 5.4. Resultados Generados

Una vez generada la canción, la interfaz mostrará:

*   **Título y Metadatos:** Información básica de la canción.
*   **Concepto y Dirección Vocal:** Resumen del tema y directivas para la interpretación vocal.
*   **Estructura de la Canción:** Letra y acordes organizados por secciones (Verso, Coro, Puente, etc.).
*   **Arreglos y Producción:** Sugerencias de instrumentación, dinámicas y diseño espacial.

### 5.5. Descargas

Podrás descargar los siguientes archivos:

*   **Music IR (JSON):** El Gemelo Digital completo de la canción en formato JSON, ideal para desarrolladores y análisis detallado.
*   **Letra (TXT):** La letra completa con acordes y estructura en un archivo de texto plano.
*   **MIDI:** Un archivo MIDI con la progresión de acordes, compatible con cualquier estación de trabajo de audio digital (DAW).

## 6. Funcionamiento Interno (Para Desarrolladores)

El archivo `music_os_core.py` contiene la lógica principal del sistema:

*   **`MusicIR` (dataclass):** Define la estructura del Gemelo Digital de la Canción.
*   **`MusicOSAgent` (clase base):** Proporciona la funcionalidad básica para interactuar con el LLM.
*   **`DirectorAgent`:** Establece los objetivos artísticos.
*   **`CompositionAgent`:** Genera letras y armonías utilizando el LLM.
*   **`ProductionAgent`:** Añade directivas de arreglos y producción utilizando el LLM.
*   **`MusicOS` (clase principal):** Orquesta la interacción entre los agentes y gestiona el flujo de trabajo.

La interacción multi-agente se simula mediante llamadas secuenciales a los agentes, que modifican el objeto `MusicIR` central. El LLM (Ollama) es el motor creativo que interpreta los prompts y genera el contenido textual estructurado en JSON.

## 7. Próximos Pasos y Mejoras Potenciales

Esta implementación es un prototipo. Futuras mejoras podrían incluir:

*   Implementación de un Event Bus real para una comunicación multi-agente más robusta.
*   Integración con herramientas de procesamiento de audio para generar audio real a partir del MIDI y las directivas de producción.
*   Desarrollo de agentes más especializados (Melody Agent, Rhythm Agent, Evaluation Agent).
*   Un sistema de versionado y `snapshots` más sofisticado para el Music IR.
*   Capacidades de aprendizaje y adaptación basadas en el feedback del usuario.

¡Esperamos que disfrutes explorando las posibilidades creativas de MUSIC OS v1.0!

## Referencias

[1] Contenido proporcionado por el usuario en `pasted_content.txt` y `chat-Cancionesconalmaycriterio(2).txt`.
[2] `Diseno_Gemelo_Digital_y_Multiagente.md`
