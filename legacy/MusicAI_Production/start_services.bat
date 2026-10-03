@echo off
REM Start all services for Music AI Production

echo Starting Music AI Production Services...
echo.

start "Ollama" cmd /k "ollama serve"
timeout /t 3 /nobreak >nul

start "ComfyUI" cmd /k "cd /d C:\Users\USER\ComfyUI && python main.py --listen 0.0.0.0 --port 8188"
timeout /t 2 /nobreak >nul

start "RVC WebUI" cmd /k "cd /d C:\Users\USER\Retrieval-based-Voice-Conversion-WebUI && python webui.py"
timeout /t 2 /nobreak >nul

start "SoulX-Singer" cmd /k "cd /d C:\Users\USER\SoulX-Singer && python webui.py"
timeout /t 2 /nobreak >nul

start "Production API" cmd /k "cd /d C:\Users\USER\MusicAI_Production && python scripts\production_api.py"

echo.
echo All services started!
echo.
echo Access URLs:
echo   ComfyUI:        http://localhost:8188
echo   RVC WebUI:      http://localhost:7865
echo   SoulX-Singer:   http://localhost:7866
echo   Production API: http://localhost:8000/docs
echo   Ollama:         http://localhost:11434
echo.
pause