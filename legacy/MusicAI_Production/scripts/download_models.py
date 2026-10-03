#!/usr/bin/env python3
"""
Professional Music AI Production - Model Downloader
Downloads all required models for album production
"""

import os
import sys
from pathlib import Path
from huggingface_hub import hf_hub_download, snapshot_download
import torch

# Setup paths
BASE_DIR = Path(r"C:\Users\USER\MusicAI_Production")
MODELS_DIR = BASE_DIR / "models"
VOICE_DIR = BASE_DIR / "voice_profiles"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
VOICE_DIR.mkdir(parents=True, exist_ok=True)

# Model configurations
MODELS = {
    # RVC Models
    "rvc": {
        "hubert_base": {
            "repo_id": "lj1995/VoiceConversionWebUI",
            "filename": "hubert_base.pt",
            "local_dir": MODELS_DIR / "rvc"
        },
        "rmvpe": {
            "repo_id": "lj1995/VoiceConversionWebUI", 
            "filename": "rmvpe.pt",
            "local_dir": MODELS_DIR / "rvc"
        },
        "pretrained_v2": {
            "repo_id": "lj1995/VoiceConversionWebUI",
            "allow_patterns": ["pretrained_v2/*"],
            "local_dir": MODELS_DIR / "rvc"
        }
    },
    
    # SoulX-Singer Models
    "soulx_singer": {
        "svs": {
            "repo_id": "Soul-AILab/SoulX-Singer",
            "allow_patterns": ["svs/*"],
            "local_dir": MODELS_DIR / "soulx_singer"
        },
        "svc": {
            "repo_id": "Soul-AILab/SoulX-Singer",
            "allow_patterns": ["svc/*"],
            "local_dir": MODELS_DIR / "soulx_singer"
        },
        "preprocess": {
            "repo_id": "Soul-AILab/SoulX-Singer-Preprocess",
            "local_dir": MODELS_DIR / "soulx_singer" / "preprocess"
        }
    },
    
    # HeartMuLa Models
    "heartmula": {
        "3b": {
            "repo_id": "HeartMuLa/HeartMuLa-oss-3B",
            "local_dir": MODELS_DIR / "heartmula" / "3b"
        },
        "codec": {
            "repo_id": "HeartMuLa/HeartCodec-oss",
            "local_dir": MODELS_DIR / "heartmula" / "codec"
        },
        "transcriptor": {
            "repo_id": "HeartMuLa/HeartTranscriptor-oss",
            "local_dir": MODELS_DIR / "heartmula" / "transcriptor"
        }
    },
    
    # SongGeneration (Tencent)
    "songgeneration": {
        "v2_large": {
            "repo_id": "lglg666/SongGeneration-v2-large",
            "local_dir": MODELS_DIR / "songgeneration" / "v2_large"
        }
    },
    
    # Whisper for transcription
    "whisper": {
        "large_v3": {
            "repo_id": "openai/whisper-large-v3",
            "local_dir": MODELS_DIR / "whisper" / "large_v3"
        }
    },
    
    # Demucs for stem separation
    "demucs": {
        "htdemucs": {
            "repo_id": "facebook/demucs",
            "allow_patterns": ["htdemucs*"],
            "local_dir": MODELS_DIR / "demucs"
        }
    }
}

def download_model(config, name):
    """Download a model from HuggingFace"""
    try:
        local_dir = Path(config["local_dir"])
        local_dir.mkdir(parents=True, exist_ok=True)
        
        if "filename" in config:
            # Single file download
            print(f"Downloading {name}...")
            hf_hub_download(
                repo_id=config["repo_id"],
                filename=config["filename"],
                local_dir=local_dir,
                local_dir_use_symlinks=False
            )
        elif "allow_patterns" in config:
            # Pattern-based download
            print(f"Downloading {name} (patterns: {config['allow_patterns']})...")
            snapshot_download(
                repo_id=config["repo_id"],
                allow_patterns=config["allow_patterns"],
                local_dir=local_dir,
                local_dir_use_symlinks=False
            )
        else:
            # Full repo download
            print(f"Downloading {name} (full repo)...")
            snapshot_download(
                repo_id=config["repo_id"],
                local_dir=local_dir,
                local_dir_use_symlinks=False
            )
        print(f"✓ {name} downloaded successfully!")
        return True
    except Exception as e:
        print(f"✗ Failed to download {name}: {e}")
        return False

def main():
    print("=" * 60)
    print("MUSIC AI PRODUCTION - MODEL DOWNLOADER")
    print("=" * 60)
    print(f"Models directory: {MODELS_DIR}")
    print(f"Voice profiles: {VOICE_DIR}")
    print(f"PyTorch: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    print("=" * 60)
    
    # Check disk space
    import shutil
    total, used, free = shutil.disk_usage(BASE_DIR)
    print(f"Disk space: {free / 1e9:.1f} GB free of {total / 1e9:.1f} GB")
    print("=" * 60)
    
    # Download all models
    success_count = 0
    total_count = 0
    
    for category, models in MODELS.items():
        print(f"\n>>> Category: {category.upper()}")
        for name, config in models.items():
            total_count += 1
            if download_model(config, f"{category}/{name}"):
                success_count += 1
    
    print("\n" + "=" * 60)
    print(f"DOWNLOAD COMPLETE: {success_count}/{total_count} models successful")
    print("=" * 60)
    
    if success_count < total_count:
        print("Some models failed to download. Check your internet connection")
        print("and run this script again to resume.")
        sys.exit(1)
    
    print("\nAll models ready for production!")
    print(f"Models stored in: {MODELS_DIR}")

if __name__ == "__main__":
    main()