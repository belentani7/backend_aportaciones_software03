#!/usr/bin/env python3
"""
Professional Music AI Production - Production API Server
REST API for controlling the production pipeline
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import uvicorn
from pathlib import Path
import sys
import os

# Add scripts to path
sys.path.append(str(Path(__file__).parent))

from production_orchestrator import AlbumProductionOrchestrator
from voice_profile_manager import VoiceProfileManager
from audio_processor import AudioProcessor
from cloud_gpu_manager import CloudGPUManager

app = FastAPI(title="Music AI Production API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
orchestrator = AlbumProductionOrchestrator()
voice_manager = VoiceProfileManager()
audio_processor = AudioProcessor()
cloud_manager = CloudGPUManager()

# ==================== MODELS ====================
class ProjectCreate(BaseModel):
    name: str
    singer_profile: str
    genre: str = "pop"
    language: str = "es"
    target_tracks: int = 10

class TrackAdd(BaseModel):
    title: str
    lyrics: str = ""
    style_prompt: str = ""
    bpm: int = 120
    key: str = "C"
    structure: str = "verse-chorus-verse-chorus-bridge-chorus"
    reference_audio: str = ""
    mood: str = "energetic"

class VoiceProfileCreate(BaseModel):
    name: str
    language: str = "es"
    gender: str = "unknown"
    genre: str = "pop"
    notes: str = ""

class ProductionStart(BaseModel):
    project_name: str
    engine: str = "heartmula"
    voice_engine: str = "soulx"

class CloudLaunch(BaseModel):
    provider: str = "runpod"
    gpu_type: str = "RTX 4090"
    gpu_count: int = 1

# ==================== PROJECT ENDPOINTS ====================
@app.post("/projects")
async def create_project(project: ProjectCreate):
    """Create new album project"""
    try:
        project_dir = orchestrator.create_project(
            name=project.name,
            singer_profile=project.singer_profile,
            genre=project.genre,
            language=project.language,
            target_tracks=project.target_tracks
        )
        return {"success": True, "project_dir": str(project_dir)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/projects")
async def list_projects():
    """List all projects"""
    projects = []
    for p in orchestrator.projects_dir.iterdir():
        if p.is_dir() and (p / "project.json").exists():
            import json
            with open(p / "project.json") as f:
                projects.append(json.load(f))
    return {"projects": projects}

@app.get("/projects/{project_name}")
async def get_project(project_name: str):
    """Get project details"""
    try:
        orchestrator.load_project(project_name)
        return orchestrator.project_config
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/projects/{project_name}/tracks")
async def add_track(project_name: str, track: TrackAdd):
    """Add track to project"""
    try:
        orchestrator.load_project(project_name)
        new_track = orchestrator.add_track(
            title=track.title,
            lyrics=track.lyrics,
            style_prompt=track.style_prompt,
            bpm=track.bpm,
            key=track.key,
            structure=track.structure,
            reference_audio=track.reference_audio,
            mood=track.mood
        )
        return {"success": True, "track": new_track}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/projects/{project_name}/produce")
async def produce_album(project_name: str, production: ProductionStart, background_tasks: BackgroundTasks):
    """Start album production"""
    try:
        orchestrator.load_project(project_name)
        
        # Run in background
        async def run_production():
            await orchestrator.produce_album(
                engine=production.engine,
                voice_clone_engine=production.voice_engine
            )
        
        background_tasks.add_task(run_production)
        return {"success": True, "message": "Production started in background"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/projects/{project_name}/status")
async def get_production_status(project_name: str):
    """Get production status"""
    try:
        orchestrator.load_project(project_name)
        return {
            "status": orchestrator.project_config.get("status"),
            "current_stage": orchestrator.project_config.get("current_stage"),
            "tracks": orchestrator.project_config.get("tracks", [])
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

# ==================== VOICE PROFILE ENDPOINTS ====================
@app.post("/voice-profiles")
async def create_voice_profile(profile: VoiceProfileCreate, files: List[UploadFile] = File(...)):
    """Create voice profile from uploaded audio files"""
    try:
        # Save uploaded files
        upload_dir = Path(r"C:\Users\USER\MusicAI_Production\audio_samples\uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_paths = []
        for file in files:
            file_path = upload_dir / file.filename
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            file_paths.append(str(file_path))
        
        # Create profile
        result = voice_manager.create_profile(
            name=profile.name,
            audio_files=file_paths,
            language=profile.language,
            gender=profile.gender,
            genre=profile.genre,
            notes=profile.notes
        )
        
        return {"success": True, "profile": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/voice-profiles")
async def list_voice_profiles():
    """List all voice profiles"""
    voice_manager.list_profiles()
    return {"profiles": voice_manager.profiles}

@app.get("/voice-profiles/{name}")
async def get_voice_profile(name: str):
    """Get voice profile details"""
    profile = voice_manager.get_profile(name)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

# ==================== AUDIO PROCESSING ENDPOINTS ====================
@app.post("/audio/process")
async def process_audio(
    file: UploadFile = File(...),
    process_type: str = "master",
    style: str = "pop",
    target_lufs: float = -14.0
):
    """Process audio file"""
    try:
        # Save uploaded file
        upload_dir = Path(r"C:\Users\USER\MusicAI_Production\audio_samples\uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        input_path = upload_dir / file.filename
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        output_path = upload_dir / f"processed_{file.filename}"
        
        # Load and process
        y, sr = audio_processor.load_audio(str(input_path))
        
        if process_type == "denoise":
            y = audio_processor.reduce_noise(y, sr)
        elif process_type == "compress":
            y = audio_processor.compress(y, sr)
        elif process_type == "master":
            y = audio_processor.master_chain(y, sr, target_lufs=target_lufs)
        elif process_type == "vocal_chain":
            y = audio_processor.process_vocal_chain(y, sr, style)
        else:
            raise HTTPException(status_code=400, detail="Unknown process type")
        
        audio_processor.save_audio(str(output_path), y, sr)
        
        return {"success": True, "output_file": str(output_path)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/audio/stems")
async def separate_stems(file: UploadFile = File(...)):
    """Separate audio into stems"""
    try:
        upload_dir = Path(r"C:\Users\USER\MusicAI_Production\audio_samples\uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        input_path = upload_dir / file.filename
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        output_dir = Path(r"C:\Users\USER\MusicAI_Production\stems") / file.filename.stem
        stems = await audio_processor.separate_stems(str(input_path), output_dir)
        
        return {"success": True, "stems": stems}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== CLOUD GPU ENDPOINTS ====================
@app.post("/cloud/launch")
async def launch_cloud_instance(cloud: CloudLaunch):
    """Launch cloud GPU instance"""
    try:
        from cloud_gpu_manager import CloudProvider
        provider = CloudProvider(cloud.provider)
        instance = await cloud_manager.launch_instance(provider, cloud.gpu_type, cloud.gpu_count)
        
        if instance:
            return {"success": True, "instance": instance.__dict__}
        else:
            raise HTTPException(status_code=500, detail="Failed to launch instance")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/cloud/instances")
async def list_cloud_instances():
    """List cloud instances"""
    cloud_manager.list_instances()
    return {"instances": cloud_manager.instances}

@app.post("/cloud/instances/{instance_id}/setup")
async def setup_cloud_instance(instance_id: str):
    """Setup cloud instance with music AI environment"""
    try:
        success = await cloud_manager.setup_instance(instance_id)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/cloud/instances/{instance_id}")
async def terminate_cloud_instance(instance_id: str):
    """Terminate cloud instance"""
    try:
        success = cloud_manager.terminate_instance(instance_id)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== UTILITY ENDPOINTS ====================
@app.get("/health")
async def health_check():
    """Health check"""
    import torch
    return {
        "status": "healthy",
        "pytorch": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU only"
    }

@app.get("/models")
async def list_models():
    """List downloaded models"""
    models_dir = Path(r"C:\Users\USER\MusicAI_Production\models")
    models = {}
    if models_dir.exists():
        for category in models_dir.iterdir():
            if category.is_dir():
                models[category.name] = [f.name for f in category.rglob("*") if f.is_file()]
    return {"models": models}

# ==================== MAIN ====================
if __name__ == "__main__":
    print("Starting Music AI Production API Server...")
    print("API Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)