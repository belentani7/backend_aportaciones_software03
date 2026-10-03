@echo off
REM Professional Music AI Production - Environment Setup
REM Run as Administrator for best results

echo ============================================
echo MUSIC AI PROFESSIONAL PRODUCTION SETUP
echo ============================================
echo.

REM Check Python version
python --version
echo.

REM Upgrade pip
echo [1/6] Upgrading pip...
python -m pip install --upgrade pip

echo.
echo [2/6] Installing core PyTorch (CPU optimized for Intel UHD)...
pip install torch==2.5.1+cpu torchvision==0.20.1+cpu torchaudio==2.5.1+cpu --index-url https://download.pytorch.org/whl/cpu

echo.
echo [3/6] Installing audio processing libraries...
pip install librosa==0.11.0 soundfile==0.13.1 scipy==1.14.1 numpy==1.26.4 scikit-learn==1.5.2 pydub==0.25.1 pedalboard==0.9.2 audioread==3.0.1 resampy==0.4.3

echo.
echo [4/6] Installing voice cloning dependencies...
pip install fairseq==0.12.2 speechbrain==1.0.0 huggingface-hub==0.25.2 transformers==4.45.2 accelerate==0.34.2 sentencepiece==0.2.0 tokenizers==0.20.3 protobuf==5.28.3

echo.
echo [5/6] Installing music generation & ComfyUI dependencies...
pip install tensorboard==2.18.0 wandb==0.18.1 omegaconf==2.3.0 hydra-core==1.3.2 comfyui==0.3.0 opencv-python==4.10.0.84 pillow==10.4.0 matplotlib==3.9.2 tqdm==4.66.5 einops==0.8.0 kornia==0.7.2

echo.
echo [6/6] Installing web UI, utilities & cloud support...
pip install gradio==5.5.0 fastapi==0.115.0 uvicorn==0.30.6 websockets==13.1 aiohttp==3.10.5 python-dotenv==1.0.1 pyyaml==6.0.1 requests==2.32.3 rich==13.9.4 loguru==0.7.2 runpod==1.6.0 modal==0.65.0 replicate==0.34.0 music21==9.3.0 mido==1.3.3 pretty-midi==0.2.10 pysptk==0.1.20 pyroomacoustics==0.7.0 noisereduce==3.0.1 pyloudnorm==0.1.1

echo.
echo ============================================
echo INSTALLING RVC REQUIREMENTS
echo ============================================
cd "C:\Users\USER\Retrieval-based-Voice-Conversion-WebUI"
pip install -r requirments_cpu_py312.txt

echo.
echo ============================================
echo INSTALLING SOULX-SINGER REQUIREMENTS
echo ============================================
cd "C:\Users\USER\SoulX-Singer"
pip install -r requirements.txt

echo.
echo ============================================
echo INSTALLING COMFYUI REQUIREMENTS
echo ============================================
cd "C:\Users\USER\ComfyUI"
pip install -r requirements.txt

echo.
echo ============================================
echo SETUP COMPLETE!
echo ============================================
echo.
echo Next steps:
echo 1. Download voice models to MusicAI_Production/voice_profiles/
echo 2. Run: python scripts/download_models.py
echo 3. Start production: python scripts/production_orchestrator.py
echo.
pause