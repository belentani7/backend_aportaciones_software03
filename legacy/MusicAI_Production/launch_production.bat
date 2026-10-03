@echo off
REM ============================================
REM MUSIC AI PROFESSIONAL PRODUCTION - MASTER LAUNCHER
REM ============================================
REM This script launches the complete production environment

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║     MUSIC AI PROFESSIONAL PRODUCTION ENVIRONMENT            ║
echo ║     High-Quality Album Production with Voice Cloning        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Set base directory
set BASE_DIR=C:\Users\USER\MusicAI_Production
cd /d %BASE_DIR%

echo [1/5] Starting Ollama (Local LLM)...
start "Ollama" cmd /k "ollama serve"

echo [2/5] Starting ComfyUI (Visual Workflows)...
cd /d "C:\Users\USER\ComfyUI"
start "ComfyUI" cmd /k "python main.py --listen 0.0.0.0 --port 8188"

echo [3/5] Starting RVC WebUI (Voice Conversion)...
cd /d "C:\Users\USER\Retrieval-based-Voice-Conversion-WebUI"
start "RVC WebUI" cmd /k "python webui.py"

echo [4/5] Starting SoulX-Singer WebUI (Singing Synthesis)...
cd /d "C:\Users\USER\SoulX-Singer"
start "SoulX-Singer" cmd /k "python webui.py"

echo [5/5] Starting Production API Server...
cd /d %BASE_DIR%
start "Production API" cmd /k "python scripts/production_api.py"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  ALL SERVICES STARTING - CHECK WINDOWS FOR EACH SERVICE     ║
echo ║                                                              ║
echo ║  Access Points:                                             ║
echo ║  • ComfyUI:        http://localhost:8188                    ║
echo ║  • RVC WebUI:      http://localhost:7865 (default)          ║
echo ║  • SoulX-Singer:   http://localhost:7866 (default)          ║
echo ║  • Production API: http://localhost:8000                    ║
echo ║  • Ollama API:     http://localhost:11434                   ║
echo ║                                                              ║
echo ║  Next Steps:                                                ║
echo ║  1. Run: python scripts/download_models.py                  ║
echo ║  2. Create voice profile: python scripts/voice_profile_manager.py --create --name "singer" --files "sample1.wav" "sample2.wav" ║
echo ║  3. Create project: python scripts/production_orchestrator.py --create "MyAlbum" --singer "singer" ║
echo ║  4. Add tracks: python scripts/production_orchestrator.py --load "MyAlbum" --add-track "Song Title" --lyrics "..." --style "pop" --bpm 120 --key C ║
echo ║  5. Produce album: python scripts/production_orchestrator.py --load "MyAlbum" --produce ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d %BASE_DIR%
cmd /k