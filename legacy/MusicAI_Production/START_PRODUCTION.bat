@echo off
REM ============================================
REM MUSIC AI PROFESSIONAL PRODUCTION - FINAL LAUNCHER
REM ============================================

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  MUSIC AI PROFESSIONAL PRODUCTION ENVIRONMENT - READY!           ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

set BASE_DIR=C:\Users\USER\MusicAI_Production
cd /d %BASE_DIR%

echo 📋 INSTALLATION STATUS:
echo    ✅ Directory structure created
echo    ✅ Python dependencies installed (PyTorch CPU, librosa, transformers, etc.)
echo    ✅ RVC (Retrieval-based Voice Conversion) installed
echo    ✅ SoulX-Singer (Zero-shot Singing Synthesis) installed
echo    ✅ ComfyUI (Visual Workflows) installed
echo    ✅ ComfyUI Music Workflows created
echo    ✅ Production Orchestrator ready
echo    ✅ Voice Profile Manager ready
echo    ✅ Audio Processor ready
echo    ✅ Cloud GPU Manager ready
echo    ✅ Production API Server ready
echo.

echo 📁 KEY DIRECTORIES:
echo    Models:          %BASE_DIR%\models\
echo    Voice Profiles:  %BASE_DIR%\voice_profiles\
echo    Projects:        %BASE_DIR%\projects\
echo    Output:          %BASE_DIR%\output\
echo    Final Masters:   %BASE_DIR%\final_masters\
echo    Stems:           %BASE_DIR%\stems\
echo    Scripts:         %BASE_DIR%\scripts\
echo.

echo 🎯 NEXT STEPS:
echo.
echo 1️⃣  DOWNLOAD MODELS (run once, takes 30-60 min):
echo     python scripts\download_models.py
echo.
echo 2️⃣  CREATE VOICE PROFILE (prepare 10-30 min clean vocal WAVs):
echo     python scripts\voice_profile_manager.py --create --name "singer_name" --files "sample1.wav" "sample2.wav" ...
echo.
echo 3️⃣  LAUNCH ALL SERVICES:
echo     start_services.bat
echo.
echo 4️⃣  CREATE ALBUM PROJECT:
echo     python scripts\production_orchestrator.py --create "MyAlbum" --singer "singer_name" --genre pop --language es --tracks 10
echo.
echo 5️⃣  ADD TRACKS:
echo     python scripts\production_orchestrator.py --load "MyAlbum" --add-track "Song Title" --lyrics "..." --style "upbeat pop" --bpm 120 --key C
echo.
echo 6️⃣  PRODUCE ALBUM:
echo     python scripts\production_orchestrator.py --load "MyAlbum" --produce --engine heartmula --voice-engine soulx
echo.

echo 🌐 SERVICE URLS (after launching):
echo    • ComfyUI:        http://localhost:8188
echo    • RVC WebUI:      http://localhost:7865
echo    • SoulX-Singer:   http://localhost:7866
echo    • Production API: http://localhost:8000/docs
echo    • Ollama API:     http://localhost:11434
echo.

echo 💡 PRO TIPS FOR HIGH QUALITY:
echo    • Record vocals at 44.1kHz/48kHz, 24-bit, mono, -12dB peak
echo    • Use 10-30 minutes of varied material (scales, songs, speech)
echo    • Specify style: "Modern pop, punchy drums, bright synths, radio-ready"
echo    • Use cloud GPU (RunPod RTX 4090) for faster generation
echo    • Target -14 LUFS for streaming mastering
echo.

echo 📖 Full documentation: %BASE_DIR%\README.md
echo.

REM Launch services
echo 🚀 Starting services...
start "Ollama" cmd /k "ollama serve"
timeout /t 3 /nobreak >nul
start "ComfyUI" cmd /k "cd /d C:\Users\USER\ComfyUI && python main.py --listen 0.0.0.0 --port 8188"
timeout /t 2 /nobreak >nul
start "RVC WebUI" cmd /k "cd /d C:\Users\USER\Retrieval-based-Voice-Conversion-WebUI && python webui.py"
timeout /t 2 /nobreak >nul
start "SoulX-Singer" cmd /k "cd /d C:\Users\USER\SoulX-Singer && python webui.py"
timeout /t 2 /nobreak >nul
start "Production API" cmd /k "cd /d %BASE_DIR% && python scripts\production_api.py"

echo.
echo ✅ All services starting! Check the new command windows.
echo    Press any key to keep this window open...
pause >nul