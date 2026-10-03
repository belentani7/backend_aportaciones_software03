import json
import os
from music_os_core import MusicOS

def run_stress_test():
    print("🚀 Iniciando Prueba de Estrés de MUSIC OS v1.0...")
    mos = MusicOS(model_name="demo-mode")
    
    test_cases = [
        {"theme": "Soledad espacial", "styles": ["Lady Gaga", "The Smiths"], "lang": "Español", "bpm": 120, "key": "Am", "creativity": 80},
        {"theme": "Carnaval distópico", "styles": ["Anitta", "Nathy Peluso"], "lang": "Portugués", "bpm": 95, "key": "Dm", "creativity": 60},
        {"theme": "Ruptura en París", "styles": ["Lady Gaga", "Nathy Peluso"], "lang": "Francés", "bpm": 80, "key": "Em", "creativity": 90},
        {"theme": "Nostalgia urbana", "styles": ["The Smiths"], "lang": "Catalán", "bpm": 105, "key": "G", "creativity": 70}
    ]
    
    results = []
    
    for i, case in enumerate(test_cases):
        print(f"\n🧪 Test Case {i+1}: {case['theme']} ({case['lang']})")
        try:
            music_ir = mos.generate_project(
                theme=case["theme"],
                styles=case["styles"],
                language=case["lang"],
                bpm=case["bpm"],
                key=case["key"],
                creativity=case["creativity"]
            )
            
            # Verificaciones de Coherencia
            checks = {
                "title_exists": bool(music_ir.metadata["title"]),
                "sections_count": len(music_ir.musical["sections"]),
                "lyrics_complete": len(music_ir.lyrics["content"]) == len(music_ir.musical["sections"]),
                "chords_complete": len(music_ir.harmony["chords"]) == len(music_ir.musical["sections"]),
                "midi_generated": len(mos.export_midi()) > 0,
                "learning_updated": len(music_ir.memory["learned_patterns"]) > 0
            }
            
            status = "✅ PASSED" if all(checks.values()) else "❌ FAILED"
            results.append({"case": case["theme"], "status": status, "checks": checks})
            print(f"Resultado: {status}")
            
        except Exception as e:
            print(f"❌ ERROR CRÍTICO en Test Case {i+1}: {e}")
            results.append({"case": case["theme"], "status": "❌ CRASHED", "error": str(e)})

    print("\n" + "="*50)
    print("📊 RESUMEN DE LA PRUEBA DE ESTRÉS")
    print("="*50)
    for res in results:
        print(f"- {res['case']}: {res['status']}")
    
    # Guardar reporte
    with open("stress_test_report.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\nReporte guardado en stress_test_report.json")

if __name__ == "__main__":
    run_stress_test()
