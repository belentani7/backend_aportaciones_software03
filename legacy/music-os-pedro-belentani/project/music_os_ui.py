import streamlit as st
import json
import io
import os
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from music_os_core import MusicOS

# Configuración de la página
st.set_page_config(
    page_title="MUSIC OS v1.0 | Creative Engine",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilos personalizados
st.markdown("""
<style>
    .main-header { font-size: 2.5rem; font-weight: bold; color: #1DB954; margin-bottom: 0.5rem; }
    .sub-header { font-size: 1.1rem; color: #888; margin-bottom: 2rem; }
    .section-title { font-size: 1.3rem; font-weight: bold; color: #1DB954; margin-top: 1.5rem; margin-bottom: 1rem; }
    .metric-card { background-color: #1e1e1e; padding: 1rem; border-radius: 0.5rem; border: 1px solid #333; }
</style>
""", unsafe_allow_html=True)

# Título principal
st.markdown('<div class="main-header">🧠 MUSIC OS v1.0</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Motor de Creatividad, Aprendizaje y Evolución Musical</div>', unsafe_allow_html=True)

# --- BARRA LATERAL: CONFIGURACIÓN AVANZADA ---
with st.sidebar:
    st.header("⚙️ Configuración del Sistema")
    
    st.markdown("### 🎨 Parámetros de Creatividad")
    creativity = st.slider("Nivel de Creatividad / Originalidad", 0, 100, 75, help="Controla qué tan arriesgado y original será el algoritmo.")
    
    st.markdown("### 🎯 Objetivo Artístico")
    language = st.selectbox("Idioma Nativo", ["Español", "Portugués", "Inglés", "Catalán", "Francés"])
    styles = st.multiselect("Fusión de Estilos", ["Lady Gaga", "The Smiths", "Anitta", "Nathy Peluso"], default=["Lady Gaga", "The Smiths"])
    
    st.markdown("### 🎼 Parámetros Musicales")
    bpm = st.slider("BPM (Tempo)", 60, 160, 105)
    key = st.selectbox("Tonalidad", ["Am", "C", "Dm", "G", "Em", "Fmaj7", "Bm", "F", "Bb"])
    
    st.markdown("### 🤖 Cerebro Local")
    model = st.text_input("Modelo Ollama", value="qwen2.5:7b")
    
    if st.button("🗑️ Limpiar Historial de Aprendizaje"):
        if os.path.exists("music_os_history.json"):
            os.remove("music_os_history.json")
            st.success("Memoria reseteada.")

# --- ÁREA CENTRAL ---
tab1, tab2, tab3 = st.tabs(["🎵 Composición", "🧠 Aprendizaje", "🗄️ Historial"])

with tab1:
    st.markdown('<div class="section-title">📝 Concepto Creativo</div>', unsafe_allow_html=True)
    theme = st.text_area("¿Sobre qué quieres que aprenda y cree el sistema hoy?", placeholder="Ej: La alienación en la era digital con un toque de cabaret oscuro...")
    
    if st.button("🚀 GENERAR Y EVOLUCIONAR", type="primary", use_container_width=True):
        if not theme:
            st.error("Introduce un tema.")
        else:
            with st.spinner("🧠 Agentes negociando y aprendiendo de la historia..."):
                try:
                    mos = MusicOS(model_name=model)
                    music_ir = mos.generate_project(theme, styles, language, bpm, key, creativity)
                    
                    st.success("✅ ¡Obra Maestra Generada y Patrones Evolucionados!")
                    
                    # Dashboard de la Canción
                    col_t, col_o, col_c = st.columns(3)
                    with col_t: st.metric("🎶 Título", music_ir.metadata["title"])
                    with col_o: st.metric("✨ Originalidad", f"{music_ir.metadata['originality_score']}%")
                    with col_c: st.metric("🌍 Idioma", music_ir.lyrics["language"])
                    
                    # Analítica Visual de la Canción
                    st.markdown('<div class="section-title">📊 Análisis de Dinámica y Energía</div>', unsafe_allow_html=True)
                    dyn_data = music_ir.arrangement.get("dynamics", {})
                    if dyn_data:
                        df_dyn = pd.DataFrame(list(dyn_data.items()), columns=['Sección', 'Energía'])
                        fig_dyn = px.line(df_dyn, x='Sección', y='Energía', markers=True, 
                                         title="Curva de Dinámica Belentani",
                                         color_discrete_sequence=['#1DB954'])
                        fig_dyn.update_layout(template="plotly_dark", plot_bgcolor='rgba(0,0,0,0)', paper_bgcolor='rgba(0,0,0,0)')
                        st.plotly_chart(fig_dyn, use_container_width=True)
                    
                    # Letra y Producción
                    st.markdown("---")
                    c1, c2 = st.columns([2, 1])
                    with c1:
                        st.markdown("**📖 Letra y Estructura:**")
                        for sec in music_ir.musical["sections"]:
                            with st.expander(f"🎼 {sec.upper()} | {', '.join(music_ir.harmony['chords'].get(sec, []))}"):
                                st.write(music_ir.lyrics["content"].get(sec, ""))
                    with c2:
                        st.markdown("**🎛️ Producción y Arreglos:**")
                        st.info(f"🗣️ **Voz:** {music_ir.production['interpretation']}")
                        st.json(music_ir.arrangement["instrumentation"])
                    
                    # Descargas
                    st.markdown("---")
                    d1, d2, d3 = st.columns(3)
                    d1.download_button("🎹 Descargar MIDI", mos.export_midi(), f"{music_ir.metadata['title']}.mid")
                    d2.download_button("📄 Descargar Letra", music_ir.to_json(), f"{music_ir.metadata['title']}_lyrics.json")
                    d3.download_button("📋 Music IR (Full)", music_ir.to_json(), f"{music_ir.metadata['title']}_ir.json")
                    
                except Exception as e:
                    st.error(f"Error: {e}")

with tab2:
    st.markdown('<div class="section-title">🧠 Estado de Evolución del Sistema</div>', unsafe_allow_html=True)
    if os.path.exists("music_os_history.json"):
        with open("music_os_history.json", "r") as f:
            hist = json.load(f)
            last = hist[-1]
            
            # Visualización de la Evolución Histórica
            st.subheader("📈 Progreso de Originalidad y Creatividad")
            hist_df = pd.DataFrame([
                {"Canción": h["metadata"]["title"], 
                 "Originalidad": h["metadata"]["originality_score"],
                 "Creatividad": h["metadata"]["creativity_level"]} 
                for h in hist
            ])
            fig_evol = px.area(hist_df, x="Canción", y=["Originalidad", "Creatividad"], 
                              title="Evolución del Criterio Artístico",
                              color_discrete_map={"Originalidad": "#1DB954", "Creatividad": "#888"})
            fig_evol.update_layout(template="plotly_dark", plot_bgcolor='rgba(0,0,0,0)', paper_bgcolor='rgba(0,0,0,0)')
            st.plotly_chart(fig_evol, use_container_width=True)
            
            c1, c2 = st.columns(2)
            with c1:
                st.subheader("🧬 Patrones ADN Aprendidos")
                for p in last["memory"]["learned_patterns"]:
                    st.write(f"✅ {p}")
            with c2:
                st.subheader("📊 Métricas de la Última Sesión")
                metrics = last["evaluation"]["evolution_metrics"]
                for k, v in metrics.items():
                    st.write(f"**{k.replace('_', ' ').title()}:** {v}%")
    else:
        st.info("El sistema aún no ha generado canciones para aprender patrones.")

with tab3:
    st.markdown('<div class="section-title">🗄️ Memoria del Sistema</div>', unsafe_allow_html=True)
    if os.path.exists("music_os_history.json"):
        with open("music_os_history.json", "r") as f:
            hist = json.load(f)
            for h in reversed(hist):
                st.write(f"📅 **{h['metadata']['title']}** | Originalidad: {h['metadata']['originality_score']}% | Estilos: {', '.join(h['metadata']['styles'])}")
    else:
        st.info("Historial vacío.")

st.markdown("---")
st.markdown("**MUSIC OS v1.0** | Motor de Evolución Artística para Pedro Belentani")
