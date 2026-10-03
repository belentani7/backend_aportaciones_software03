import json
import re
import sys
import io
from midiutil import MIDIFile

# Intentar importar ollama y streamlit, pero permitir que el script se guarde si no están instalados
try:
    import ollama
except ImportError:
    pass

try:
    import streamlit as st
except ImportError:
    pass

class AgenteCompositorUniversal:
    """
    Agente de composición musical universal e independiente.
    Integra principios artísticos de Lady Gaga, The Smiths, Anitta y Nathy Peluso.
    Diseñado para funcionar localmente con Ollama.
    """
    
    def __init__(self, model_name="qwen2.5:7b"):
        self.model = model_name
        self.chord_map = self._build_robust_chord_map()

    def _build_robust_chord_map(self):
        """Mapeo de notas MIDI con variaciones comunes para evitar errores de KeyError."""
        base_map = {
            'C': [60, 64, 67], 'Cm': [60, 63, 67], 'Cmaj7': [60, 64, 67, 71], 
            'Cm7': [60, 63, 67, 70], 'Cm9': [60, 63, 67, 70, 74],
            'Dm': [62, 65, 69], 'Dm7': [62, 65, 69, 72], 'Dm9': [62, 65, 69, 72, 76],
            'Em': [64, 67, 71], 'Em7': [64, 67, 71, 74],
            'F': [65, 69, 72], 'Fmaj7': [65, 69, 72, 76], 'Fm': [65, 68, 72],
            'G': [67, 71, 74], 'G7': [67, 71, 74, 77], 'Gmaj7': [67, 71, 74, 78],
            'Am': [69, 72, 76], 'Am7': [69, 72, 76, 79], 'Am9': [69, 72, 76, 79, 83],
            'Bb': [70, 74, 77], 'Bbmaj7': [70, 74, 77, 81],
            'Eb': [63, 67, 70], 'Ebmaj7': [63, 67, 70, 74],
            'Ab': [68, 72, 75], 'Db': [61, 65, 68]
        }
        return base_map

    def clean_json_from_llm(self, raw_text):
        """Limpia el texto de la IA para extraer solo el bloque JSON."""
        start = raw_text.find('{')
        end = raw_text.rfind('}')
        if start != -1 and end != -1:
            return raw_text[start:end+1]
        return raw_text

    def parse_chord_safely(self, chord_str, fallback_key="Am"):
        """Busca la raíz del acorde y devuelve notas MIDI seguras."""
        clean_chord = chord_str.split('/')[0].strip()
        if clean_chord in self.chord_map:
            return self.chord_map[clean_chord]
        for key in self.chord_map:
            if key in clean_chord:
                return self.chord_map[key]
        return self.chord_map.get(fallback_key, [60, 64, 67])

    def build_mega_prompt(self, language, styles, theme, bpm, key):
        """Construye el prompt de sistema para la composición nativa y fusión de estilos."""
        
        phonetic_directives = {
            "Español": "REGLA DE ORO: Piensa nativamente en español. Usa fricativas y vibrantes (rr, ll, y) para actitud y tensión. Juega con el ritmo de las sílabas.",
            "Portugués": "REGLA DE ORO: Pense em português brasileiro nativo. Use vogais nasais (ão, em, am) para sustentar notas longas e consoantes oclusivas para percussão vocal.",
            "Inglés": "GOLDEN RULE: Think natively in English. Use stress-timed rhythm and consonant clusters (tr, bl, str) for percussive flow.",
            "Catalán": "REGLA D'OR: Pensa nativament en català. Explota les vocals neutres i tancades per a la intimitat, i obre les vocals en el tornada.",
            "Francés": "RÈGLE D'OR: Pense nativement en français. Utilise les liaisons pour lier les mots y exploite les voyelles nasales pour la mélancolía."
        }

        style_matrices = {
            "Lady Gaga": "Teatralidad Pop, drama, cambios de tempo y vulnerabilidad emocional como espectáculo.",
            "The Smiths": "Melancolía Indie, letras poéticas de alienación, intercambio modal y guitarras jangly.",
            "Anitta": "Groove percusivo, actitud, síncopa y flow sensual/urbano.",
            "Nathy Peluso": "Tensión armónica, visceralidad, fusión jazz/tango y entrega vocal cruda."
        }

        selected_styles_desc = " + ".join([style_matrices.get(s, "") for s in styles])

        return f"""
        Eres el ALGORITMO DE COMPOSICIÓN UNIVERSAL v3.0.
        {phonetic_directives.get(language, phonetic_directives['Español'])}
        
        CONTEXTO ARTÍSTICO (FUSIÓN):
        {selected_styles_desc}
        
        PARÁMETROS:
        - Idioma: {language.upper()}
        - Tema: {theme}
        - BPM: {bpm}
        - Tonalidad: {key}
        
        INSTRUCCIONES TÉCNICAS:
        1. Los acordes deben ser complejos (usa 7, 9, maj7, m7b5, alt).
        2. La estructura debe tener dinámicas extremas.
        3. Marca con MAYÚSCULAS la sílaba fuerte de cada verso en 'lyrics' para guiar el flow.
        4. NO TRADUZCAS. Piensa y escribe directamente en {language}.

        DEVUELVE ÚNICAMENTE UN JSON VÁLIDO CON ESTA ESTRUCTURA:
        {{
            "title": "Título",
            "bpm": {bpm},
            "key": "{key}",
            "structure": ["Verso 1", "Pre-Coro", "Coro", "Verso 2", "Puente", "Coro", "Outro"],
            "lyrics": {{ "Verso 1": "...", "Coro": "...", ... }},
            "chords": {{ "Verso 1": ["Am9", "Fmaj7", ...], "Coro": [...], ... }},
            "vocal_direction": "Instrucciones técnicas de tono y actitud."
        }}
        """

    def generate_midi(self, song_data):
        """Genera un objeto MIDI a partir de los datos de la canción."""
        midi = MIDIFile(1)
        track = 0
        time = 0
        midi.addTempo(track, time, song_data.get('bpm', 105))
        
        for section in song_data.get('structure', []):
            section_chords = song_data.get('chords', {}).get(section, [])
            for chord_str in section_chords:
                notes = self.parse_chord_safely(chord_str, song_data.get('key', 'Am'))
                for note in notes:
                    midi.addNote(track, 0, note, time, 4, 100)
                time += 4
        return midi

# --- INTERFAZ STREAMLIT ---
def run_app():
    st.set_page_config(page_title="Agente Compositor Universal", page_icon="🎵", layout="wide")
    
    st.title("🎵 Agente Compositor Musical Universal")
    st.markdown("### El algoritmo de composición independiente para Pedro Belentani")
    
    with st.sidebar:
        st.header("⚙️ Configuración")
        language = st.selectbox("Idioma Nativo", ["Español", "Portugués", "Inglés", "Catalán", "Francés"])
        styles = st.multiselect("Fusión de Estilos", ["Lady Gaga", "The Smiths", "Anitta", "Nathy Peluso"], default=["Lady Gaga", "The Smiths"])
        bpm = st.slider("BPM (Tempo)", 60, 160, 105)
        key = st.selectbox("Tonalidad", ["Am", "C", "Dm", "G", "Em", "Fmaj7", "Bm"])
        model = st.text_input("Modelo Ollama", value="qwen2.5:7b")
        
    theme = st.text_area("Concepto o Tema de la Canción", placeholder="Ej: La soledad de un astronauta en una discoteca abandonada...")
    
    agent = AgenteCompositorUniversal(model_name=model)
    
    if st.button("🚀 GENERAR OBRA MAESTRA", type="primary"):
        if not theme:
            st.warning("Por favor, introduce un tema.")
        else:
            with st.spinner("🧠 El Algoritmo está pensando nativamente y fusionando estilos..."):
                try:
                    prompt = agent.build_mega_prompt(language, styles, theme, bpm, key)
                    response = ollama.chat(
                        model=model, 
                        messages=[
                            {'role': 'system', 'content': 'Eres un motor de composición. Devuelve SOLO JSON válido.'},
                            {'role': 'user', 'content': prompt}
                        ],
                        format='json'
                    )
                    
                    clean_json = agent.clean_json_from_llm(response['message']['content'])
                    song_data = json.loads(clean_json)
                    
                    st.success("✅ ¡Obra Maestra Generada!")
                    
                    # Mostrar Resultados
                    st.subheader(f"🎶 {song_data.get('title', 'Sin Título')}")
                    st.info(f"🗣️ **Dirección Vocal:** {song_data.get('vocal_direction', '')}")
                    
                    for section in song_data.get('structure', []):
                        with st.expander(f"🎼 {section.upper()}"):
                            chords = song_data.get('chords', {}).get(section, [])
                            lyrics = song_data.get('lyrics', {}).get(section, "(Instrumental)")
                            st.markdown(f"**Acordes:** `{' | '.join(chords)}`")
                            st.markdown(f"**Letra:**\n{lyrics}")
                    
                    # Descargas
                    col1, col2 = st.columns(2)
                    
                    # TXT
                    txt_content = f"TÍTULO: {song_data.get('title')}\nIDIOMA: {language}\nBPM: {bpm} | KEY: {key}\n\n"
                    for section in song_data.get('structure', []):
                        txt_content += f"[{section}]\nAcordes: {' | '.join(song_data.get('chords', {}).get(section, []))}\n{song_data.get('lyrics', {}).get(section, '')}\n\n"
                    
                    col1.download_button("📄 Descargar Letra (TXT)", txt_content, f"{song_data.get('title')}.txt")
                    
                    # MIDI
                    midi_obj = agent.generate_midi(song_data)
                    midi_buffer = io.BytesIO()
                    midi_obj.writeFile(midi_buffer)
                    col2.download_button("🎹 Descargar MIDI", midi_buffer.getvalue(), f"{song_data.get('title')}.mid")
                    
                except Exception as e:
                    st.error(f"❌ Error: {e}. Asegúrate de que Ollama esté corriendo con el modelo {model}.")

if __name__ == "__main__":
    if 'streamlit' in sys.modules:
        run_app()
    else:
        print("Este script está diseñado para ejecutarse con Streamlit.")
        print("Ejecuta: streamlit run agente_compositor_universal.py")
