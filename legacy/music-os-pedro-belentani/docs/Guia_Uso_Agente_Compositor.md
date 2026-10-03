# Guía de Uso: Agente Compositor Musical Universal

Esta guía proporciona las instrucciones necesarias para instalar, configurar y utilizar el Agente Compositor Musical Universal, una herramienta diseñada para generar canciones personalizadas con un criterio artístico avanzado, fusionando estilos de diversos artistas y adaptándose a múltiples idiomas.

## 1. Requisitos del Sistema

Para ejecutar el agente localmente en tu ordenador, necesitarás los siguientes componentes:

*   **Sistema Operativo:** Windows, macOS o Linux.
*   **Python:** Versión 3.x (se recomienda la última versión estable).
*   **Ollama:** Una plataforma para ejecutar modelos de lenguaje grandes (LLMs) localmente. Puedes descargarlo desde [ollama.com](https://ollama.com/).
*   **Modelo de Lenguaje:** Un modelo compatible con Ollama. Se recomienda `qwen2.5:7b` por su rendimiento en español, catalán y francés, y su eficiencia en el uso de recursos (funciona con 8GB de RAM). Alternativamente, puedes usar `llama3`.

## 2. Instalación y Configuración

Sigue estos pasos para preparar tu entorno:

### 2.1. Instalar Ollama y el Modelo de Lenguaje

1.  **Descarga e instala Ollama:** Visita [ollama.com](https://ollama.com/) y descarga el instalador para tu sistema operativo. Sigue las instrucciones de instalación.
2.  **Descarga el modelo de lenguaje:** Abre tu terminal (CMD o PowerShell en Windows, Terminal en macOS/Linux) y ejecuta el siguiente comando para descargar el modelo recomendado:
    ```bash
    ollama pull qwen2.5:7b
    ```
    Si prefieres `llama3`, usa:
    ```bash
    ollama pull llama3
    ```
    Asegúrate de que Ollama esté ejecutándose en segundo plano. Puedes verificarlo abriendo la aplicación Ollama o ejecutando `ollama serve` en la terminal.

### 2.2. Instalar Librerías de Python

1.  **Abre tu terminal** y ejecuta el siguiente comando para instalar las librerías necesarias:
    ```bash
    pip install ollama midiutil streamlit
    ```

## 3. Uso del Agente Compositor

El agente se ejecuta a través de una interfaz de usuario web interactiva construida con Streamlit.

### 3.1. Guardar el Código

1.  Guarda el código proporcionado (`agente_compositor_universal.py`) en una carpeta de tu elección en tu ordenador.

### 3.2. Ejecutar la Aplicación

1.  **Abre tu terminal** y navega hasta la carpeta donde guardaste el archivo `agente_compositor_universal.py`.
2.  **Ejecuta la aplicación** con el siguiente comando:
    ```bash
    streamlit run agente_compositor_universal.py
    ```
3.  Tu navegador web se abrirá automáticamente en una dirección similar a `http://localhost:8501`, mostrando la interfaz del Agente Compositor Musical Universal.

### 3.3. Interfaz de Usuario

La interfaz de usuario consta de los siguientes elementos:

*   **Barra Lateral Izquierda (Configuración):**
    *   **Idioma Nativo:** Selecciona el idioma en el que deseas que se componga la letra (Español, Portugués, Inglés, Catalán, Francés).
    *   **Fusión de Estilos:** Elige uno o varios artistas (Lady Gaga, The Smiths, Anitta, Nathy Peluso) para fusionar sus estilos en la composición. El agente combinará sus características artísticas.
    *   **BPM (Tempo):** Ajusta el tempo de la canción usando el deslizador.
    *   **Tonalidad:** Selecciona la tonalidad principal de la canción.
    *   **Modelo Ollama:** Puedes especificar el nombre del modelo de Ollama que deseas usar (por defecto `qwen2.5:7b`).
*   **Área Central:**
    *   **Concepto o Tema de la Canción:** Introduce una descripción detallada del tema o la idea central que quieres para tu canción (ej. 
