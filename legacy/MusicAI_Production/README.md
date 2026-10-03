# Music AI Professional Production - Complete Setup Guide

## 🎵 SYSTEM OVERVIEW

This is a complete professional music AI production environment for creating full albums with AI voice cloning. Designed for a singer who wants to produce a complete album using their own voice.

### 🖥️ HARDWARE REQUIREMENTS (YOUR SYSTEM)
- **OS**: Windows 10 Pro
- **CPU**: Intel i7-8665U (4 cores, 8 threads @ 1.9GHz)
- **RAM**: 16 GB
- **GPU**: Intel UHD Graphics 620 (1 GB VRAM) - **NO NVIDIA GPU**
- **Storage**: ~49 GB free on C:

### 🔧 OPTIMIZATION STRATEGY
Since you have **no NVIDIA GPU**, this setup uses:
1. **CPU-optimized inference** (PyTorch CPU, ONNX Runtime)
2. **Quantized models** (INT8/FP8) for faster CPU inference
3. **Cloud GPU fallback** (RunPod, Modal, Replicate) for heavy lifting
4. **Local model caching** to minimize re-downloads
5. **Batch processing** for efficiency

---

## 📁 DIRECTORY STRUCTURE

```
MusicAI_Production/
├── models/                 # Downloaded AI models
│   ├── rvc/               # RVC voice conversion models
│   ├── soulx_singer/      # SoulX-Singer models
│   ├── heartmula/         # HeartMuLa music generation
│   ├── songgeneration/    # SongGeneration (Tencent)
│   ├── whisper/           # Whisper transcription
│   └── demucs/            # Demucs stem separation
├── voice_profiles/        # Singer voice profiles
│   ├── singer_name/       # Individual voice profile
│   │   ├── sample_001.wav
│   │   ├── sample_002.wav
│   │   └── profile.json
│   └── profiles.json      # Master profile index
├── projects/              # Album projects
│   └── AlbumName/
│       ├── project.json   # Project configuration
│       ├── track_01_SongTitle/
│       │   ├── lyrics.txt
│       │   ├── tags.txt
│       │   ├── instrumental.wav
│       │   ├── vocals.wav
│       │   ├── final_mix.wav
│       │   └── stems/
├── output/                # Generated outputs
├── stems/                 # Separated stems
├── final_masters/         # Mastered final tracks
├── audio_samples/         # Input audio samples
├── configs/               # Configuration files
├── scripts/               # Production scripts
└── cloud_gpu/             # Cloud GPU configs
```

---

## 🚀 QUICK START

### 1. Install Dependencies
```batch
# Run as Administrator
scripts\install_environment.bat
```

### 2. Download Models
```bash
python scripts/download_models.py
```

### 3. Create Voice Profile
```bash
# Prepare 10-30 minutes of clean vocal samples (WAV, 44.1kHz+)
python scripts/voice_profile_manager.py --create --name "your_singer_name" --files "sample1.wav" "sample2.wav" ... --language es --genre pop
```

### 4. Launch All Services
```batch
launch_production.bat
```

This starts:
- **Ollama** (localhost:11434) - Local LLMs
- **ComfyUI** (localhost:8188) - Visual workflows
- **RVC WebUI** (localhost:7865) - Voice conversion
- **SoulX-Singer** (localhost:7866) - Singing synthesis
- **Production API** (localhost:8000) - REST API

### 5. Create Album Project
```bash
python scripts/production_orchestrator.py --create "MyAlbum" --singer "your_singer_name" --genre pop --language es --tracks 10
```

### 6. Add Tracks
```bash
python scripts/production_orchestrator.py --load "MyAlbum" --add-track "Song Title" --lyrics "Your lyrics here" --style "upbeat pop" --bpm 120 --key C
```

### 7. Produce Complete Album
```bash
python scripts/production_orchestrator.py --load "MyAlbum" --produce --engine heartmula --voice-engine soulx
```

---

## 🎤 VOICE PROFILE CREATION

### Best Practices for Voice Samples:
1. **Duration**: 10-30 minutes total
2. **Quality**: 44.1kHz/48kHz, 24-bit WAV
3. **Content**: Clean vocals only (no background music)
4. **Variety**: Different pitches, emotions, styles
5. **Language**: Match target album language
6. **Format**: Mono preferred, stereo OK

### Sample Script for Recording:
```
Record these for best cloning:
1. Sustained vowels (ah, eh, ee, oh, oo) - 30 sec each
2. Scales and arpeggios - 2 min
3. Song phrases in target style - 5 min
4. Spoken text (for prosody) - 2 min
5. Breath sounds and consonants - 1 min
```

---

## 🎼 MUSIC GENERATION ENGINES

### 1. HeartMuLa (Recommended for CPU)
- **Quality**: High (3B/7B params)
- **Languages**: EN, ZH, ES, JA, KO
- **VRAM**: 8-16 GB (CPU: system RAM)
- **Speed**: ~2-5 min per track on CPU
- **Best for**: Complete songs with lyrics

### 2. SongGeneration (Tencent/LeVo)
- **Quality**: Commercial (rivals Suno)
- **Languages**: EN, ZH, ES, JA
- **VRAM**: 10-28 GB
- **Speed**: ~1-3 min per track
- **Best for**: Radio-ready production

### 3. SoulX-Singer (Voice Cloning)
- **Type**: Zero-shot singing synthesis
- **Quality**: Highest for voice cloning
- **Languages**: Mandarin, English, Cantonese
- **Input**: Lyrics + melody reference + voice reference
- **Best for**: Applying your voice to generated melodies

### 4. RVC (Retrieval-based Voice Conversion)
- **Type**: Voice conversion (singing to singing)
- **Quality**: Excellent for timbre transfer
- **Input**: Source vocals + target voice model
- **Best for**: Converting generated vocals to your voice

---

## ☁️ CLOUD GPU FALLBACK

When local CPU is too slow, use cloud GPUs:

### RunPod (Recommended)
```bash
# Configure
python scripts/cloud_gpu_manager.py --configure runpod --api-key YOUR_KEY

# Launch RTX 4090 (24GB VRAM, ~$0.69/hr)
python scripts/cloud_gpu_manager.py --launch --gpu "RTX 4090" --count 1

# Setup environment
python scripts/cloud_gpu_manager.py --setup INSTANCE_ID
```

### Modal (Serverless)
```bash
# Configure
python scripts/cloud_gpu_manager.py --configure modal --token-id ID --token-secret SECRET
```

### Replicate (Model Hosting)
```bash
# Configure
python scripts/cloud_gpu_manager.py --configure replicate --api-token TOKEN
```

---

## 🎛️ PRODUCTION WORKFLOW

### Phase 1: Composition
```
1. Write lyrics for each track
2. Define style, BPM, key, mood
3. Add to project via CLI or API
```

### Phase 2: Instrumental Generation
```
1. HeartMuLa generates full instrumental from lyrics + tags
2. Or SongGeneration for commercial quality
3. Review and iterate on instrumentals
```

### Phase 3: Vocal Synthesis
```
Option A: SoulX-Singer (Zero-shot)
- Input: Lyrics + melody reference + your voice sample
- Output: Your voice singing the melody

Option B: RVC (Voice Conversion)
- Generate guide vocals (any voice)
- Convert to your voice using trained RVC model
```

### Phase 4: Mixing & Processing
```
1. Vocal processing chain (denoise, EQ, compress, de-ess, reverb)
2. Mix vocals with instrumental
3. Stem separation for flexibility
4. Mastering chain (multiband comp, limiting, LUFS normalization)
```

### Phase 5: Mastering & Delivery
```
1. Album-level mastering (consistent LUFS)
2. Metadata generation (ISRC, CUE sheet)
3. Export formats: WAV 44.1/24, MP3 320, FLAC
4. Distribution-ready package
```

---

## 🔧 ADVANCED CONFIGURATION

### Environment Variables (.env)
```bash
# Cloud providers
RUNPOD_API_KEY=your_key
MODAL_TOKEN_ID=your_id
MODAL_TOKEN_SECRET=your_secret
REPLICATE_API_TOKEN=your_token

# Model paths
MODELS_DIR=C:/Users/USER/MusicAI_Production/models
VOICE_PROFILES_DIR=C:/Users/USER/MusicAI_Production/voice_profiles

# Processing
DEFAULT_SR=44100
TARGET_LUFS=-14
CPU_THREADS=8
```

### PyTorch CPU Optimization
```python
import torch
torch.set_num_threads(8)  # Match your CPU threads
torch.set_num_interop_threads(4)
# Enable MKL-DNN
torch.backends.mkldnn.enabled = True
```

### Model Quantization (for CPU)
```python
# Quantize models to INT8 for 2-4x speedup
from torch.quantization import quantize_dynamic
model_quantized = quantize_dynamic(model, {torch.nn.Linear}, dtype=torch.qint8)
```

---

## 📊 MONITORING & DEBUGGING

### Check System Resources
```bash
# GPU/CPU usage
python -c "import torch; print('CUDA:', torch.cuda.is_available()); import psutil; print('RAM:', psutil.virtual_memory().percent, '%')"

# Disk space
python -c "import shutil; t,u,f=shutil.disk_usage('C:/'); print(f'Free: {f/1e9:.1f} GB')"
```

### View Logs
```bash
# Production API logs
tail -f logs/production_api.log

# ComfyUI logs (in ComfyUI window)
# RVC logs (in RVC window)
# SoulX logs (in SoulX window)
```

### Debug Failed Tracks
```bash
# Check track status
python scripts/production_orchestrator.py --load "MyAlbum" --status

# Re-process specific track
python scripts/audio_processor.py --input "projects/MyAlbum/track_01/vocals.wav" --output "projects/MyAlbum/track_01/vocals_fixed.wav" --process vocal_chain --style pop
```

---

## 🎯 PRO TIPS FOR HIGH QUALITY

### 1. Voice Profile Quality
- Record in treated room (no reverb)
- Use good microphone (condenser preferred)
- Consistent distance (6-12 inches)
- Pop filter essential
- Record at -12dB to -6dB peak

### 2. Lyric Writing for AI
- Clear structure markers: [Verse], [Chorus], [Bridge]
- Phonetic spelling for unusual words
- Specify emotional delivery: (softly), (powerful), (breathy)
- Include timing hints: (slow), (fast), (rubato)

### 3. Style Prompts
```
Good: "Modern pop production, punchy drums, bright synths, catchy hook, radio-ready mix"
Bad: "Good song"

Good: "Emotional piano ballad, intimate vocals, subtle strings, sparse arrangement, raw feeling"
Bad: "Sad song"
```

### 4. Iteration Strategy
1. Generate 3-5 instrumental variations per track
2. Pick best, then generate 3-5 vocal variations
3. Mix and match best elements
4. Fine-tune with audio processor

### 5. Album Cohesion
- Use same key relationships across tracks
- Consistent BPM ranges per "side"
- Shared instrumental palette
- Unified vocal processing chain

---

## 🚨 TROUBLESHOOTING

### Out of Memory (OOM)
```bash
# Reduce batch size
# Use gradient checkpointing
# Enable CPU offloading
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128
```

### Slow Generation
```bash
# Use quantized models
# Enable flash attention (if GPU)
# Use cloud GPU for heavy tracks
```

### Voice Cloning Artifacts
```bash
# More voice samples (30+ min)
# Cleaner samples (no noise/reverb)
# Better pitch coverage
# Try different f0_method (rmvpe > crepe > harvest)
```

### Audio Quality Issues
```bash
# Check sample rates match (44.1k or 48k)
# Ensure mono for vocals
# Normalize input levels
# Use high-quality resampling (librosa/kaiser_best)
```

---

## 📦 DISTRIBUTION CHECKLIST

Before releasing:
- [ ] All tracks mastered to -14 LUFS (streaming)
- [ ] True peak < -1 dBTP
- [ ] Metadata complete (ISRC, UPC, credits)
- [ ] CUE sheet for CD
- [ ] High-res artwork (3000x3000px)
- [ ] WAV 44.1/24, MP3 320, FLAC
- [ ] Stems delivered for sync licensing
- [ ] Instrumental versions
- [ ] Acapella versions
- [ ] Backup project files

---

## 🔗 USEFUL LINKS

- **ComfyUI**: http://localhost:8188
- **RVC WebUI**: http://localhost:7865
- **SoulX-Singer**: http://localhost:7866
- **Production API**: http://localhost:8000/docs
- **Ollama**: http://localhost:11434

### Model Downloads:
- HeartMuLa: https://huggingface.co/HeartMuLa
- SongGeneration: https://huggingface.co/lglg666/SongGeneration-v2-large
- SoulX-Singer: https://huggingface.co/Soul-AILab/SoulX-Singer
- RVC Models: https://huggingface.co/lj1995/VoiceConversionWebUI

---

## 📞 SUPPORT

For issues:
1. Check logs in each service window
2. Verify model paths in configs
3. Ensure Python environment activated
4. Check disk space (need 20+ GB for models)
5. Restart services if stuck

**Happy producing! 🎵**