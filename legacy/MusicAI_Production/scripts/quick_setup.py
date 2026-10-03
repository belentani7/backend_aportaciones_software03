#!/usr/bin/env python3
"""
Professional Music AI Production - Quick Start Script
Runs the complete setup automatically
"""

import subprocess
import sys
import asyncio
from pathlib import Path

def run_command(cmd, cwd=None, description=""):
    """Run command and return success"""
    print(f"\n{'='*60}")
    print(f"🔧 {description}")
    print(f"Command: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            print(f"✅ Success")
            if result.stdout:
                print(result.stdout[:500])
            return True
        else:
            print(f"❌ Failed (exit code {result.returncode})")
            if result.stderr:
                print(result.stderr[:500])
            return False
    except subprocess.TimeoutExpired:
        print(f"⏱️ Timeout")
        return False
    except Exception as e:
        print(f"💥 Error: {e}")
        return False

async def main():
    base_dir = Path(r"C:\Users\USER\MusicAI_Production")
    
    print("""
╔═══════════════════════════════════════════════════════════════════╗
║     MUSIC AI PROFESSIONAL PRODUCTION - QUICK SETUP              ║
║     Automated environment setup for album production            ║
╚═══════════════════════════════════════════════════════════════════╝
""")
    
    # Step 1: Install Python dependencies
    print("\n📦 STEP 1: Installing Python dependencies...")
    run_command([
        sys.executable, "-m", "pip", "install", "--upgrade", "pip"
    ], description="Upgrade pip")
    
    # Core packages first
    core_packages = [
        "torch==2.5.1+cpu torchvision==0.20.1+cpu torchaudio==2.5.1+cpu --index-url https://download.pytorch.org/whl/cpu",
        "librosa==0.11.0 soundfile==0.13.1 scipy==1.14.1 numpy==1.26.4 scikit-learn==1.5.2",
        "pydub==0.25.1 pedalboard==0.9.2 audioread==3.0.1 resampy==0.4.3",
        "fairseq==0.12.2 speechbrain==1.0.0 huggingface-hub==0.25.2",
        "transformers==4.45.2 accelerate==0.34.2 sentencepiece==0.2.0",
        "gradio==5.5.0 fastapi==0.115.0 uvicorn==0.30.6",
        "python-dotenv==1.0.1 pyyaml==6.0.1 requests==2.32.3 rich==13.9.4 loguru==0.7.2",
        "music21==9.3.0 mido==1.3.3 pretty-midi==0.2.10",
        "pyloudnorm==0.1.1 noisereduce==3.0.1 pyroomacoustics==0.7.0"
    ]
    
    for pkg in core_packages:
        run_command([sys.executable, "-m", "pip", "install"] + pkg.split(), description=f"Install {pkg.split()[0]}")
    
    # Step 2: Install RVC requirements
    print("\n🎤 STEP 2: Installing RVC requirements...")
    run_command([
        sys.executable, "-m", "pip", "install", "-r", "requirments_cpu_py312.txt"
    ], cwd=r"C:\Users\USER\Retrieval-based-Voice-Conversion-WebUI", description="RVC CPU requirements")
    
    # Step 3: Install SoulX-Singer requirements
    print("\n🎵 STEP 3: Installing SoulX-Singer requirements...")
    run_command([
        sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
    ], cwd=r"C:\Users\USER\SoulX-Singer", description="SoulX-Singer requirements")
    
    # Step 4: Install ComfyUI requirements
    print("\n🎨 STEP 4: Installing ComfyUI requirements...")
    run_command([
        sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
    ], cwd=r"C:\Users\USER\ComfyUI", description="ComfyUI requirements")
    
    # Step 5: Download models
    print("\n📥 STEP 5: Downloading AI models...")
    run_command([
        sys.executable, "scripts/download_models.py"
    ], cwd=base_dir, description="Download all models (this may take 30-60 min)")
    
    # Step 6: Create ComfyUI workflows
    print("\n🔗 STEP 6: Creating ComfyUI workflows...")
    run_command([
        sys.executable, "scripts/comfyui_workflows.py"
    ], cwd=base_dir, description="Create ComfyUI workflow files")
    
    # Step 7: Verify installation
    print("\n✅ STEP 7: Verifying installation...")
    
    # Test imports
    test_imports = [
        "import torch; print(f'PyTorch: {torch.__version__}, CUDA: {torch.cuda.is_available()}')",
        "import librosa; print('librosa OK')",
        "import soundfile; print('soundfile OK')",
        "import gradio; print('gradio OK')",
        "import fastapi; print('fastapi OK')",
    ]
    
    for test in test_imports:
        result = subprocess.run([sys.executable, "-c", test], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"  ✅ {result.stdout.strip()}")
        else:
            print(f"  ❌ {test}: {result.stderr.strip()}")
    
    print("""
╔═══════════════════════════════════════════════════════════════════╗
║                    SETUP COMPLETE! 🎉                            ║
║                                                                  ║
║  Next steps:                                                    ║
║  1. Prepare voice samples (10-30 min clean vocals)             ║
║  2. Create voice profile:                                       ║
║     python scripts/voice_profile_manager.py --create           ║
║        --name "singer_name" --files "sample1.wav" "sample2.wav" ║
║  3. Launch all services:                                        ║
║     launch_production.bat                                       ║
║  4. Create album project:                                       ║
║     python scripts/production_orchestrator.py --create         ║
║        "MyAlbum" --singer "singer_name"                         ║
║  5. Add tracks and produce!                                     ║
║                                                                  ║
║  Documentation: README.md                                       ║
╚═══════════════════════════════════════════════════════════════════╝
""")

if __name__ == "__main__":
    asyncio.run(main())