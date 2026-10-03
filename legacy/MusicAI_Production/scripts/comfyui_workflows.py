#!/usr/bin/env python3
"""
Professional Music AI Production - ComfyUI Music Workflows
Custom nodes and workflows for music generation
"""

import json
from pathlib import Path

# ComfyUI Workflow for HeartMuLa Music Generation
HEARTMULA_WORKFLOW = {
    "1": {
        "inputs": {
            "model_path": "models/heartmula/3b",
            "version": "3B",
            "bf16": False
        },
        "class_type": "LoadHeartMuLaModel",
        "_meta": {"title": "Load HeartMuLa Model"}
    },
    "2": {
        "inputs": {
            "lyrics": "Your lyrics here",
            "tags": "pop, energetic, 120bpm, key of C",
            "max_length_ms": 240000,
            "temperature": 1.0,
            "topk": 50
        },
        "class_type": "HeartMuLaGenerate",
        "_meta": {"title": "Generate Music"}
    },
    "3": {
        "inputs": {
            "audio": ["2", 0],
            "filename": "heartmula_output"
        },
        "class_type": "SaveAudio",
        "_meta": {"title": "Save Audio"}
    }
}

# ComfyUI Workflow for SongGeneration
SONGGENERATION_WORKFLOW = {
    "1": {
        "inputs": {
            "model_path": "models/songgeneration/v2_large",
            "precision": "fp32"
        },
        "class_type": "LoadSongGenerationModel",
        "_meta": {"title": "Load SongGeneration Model"}
    },
    "2": {
        "inputs": {
            "prompt": "Upbeat pop song about summer love, catchy melody, modern production",
            "lyrics": "Summer nights we dance in the moonlight\nStars above shining so bright\nYou and me, forever free\nThis is where we're meant to be",
            "language": "en",
            "temperature": 1.0,
            "top_k": 50
        },
        "class_type": "SongGenerationGenerate",
        "_meta": {"title": "Generate Song"}
    },
    "3": {
        "inputs": {
            "audio": ["2", 0],
            "filename": "songgeneration_output"
        },
        "class_type": "SaveAudio",
        "_meta": {"title": "Save Audio"}
    }
}

# ComfyUI Workflow for RVC Voice Conversion
RVC_WORKFLOW = {
    "1": {
        "inputs": {
            "model_path": "models/rvc/pretrained_v2",
            "index_path": "models/rvc/pretrained_v2/index",
            "device": "cpu"
        },
        "class_type": "LoadRVCModel",
        "_meta": {"title": "Load RVC Model"}
    },
    "2": {
        "inputs": {
            "audio": "input_vocals.wav",
            "f0_method": "rmvpe",
            "f0_min": 50,
            "f0_max": 1100,
            "pitch_shift": 0,
            "filter_radius": 3,
            "index_rate": 0.75,
            "rms_mix_rate": 0.25,
            "protect": 0.33
        },
        "class_type": "RVCInference",
        "_meta": {"title": "RVC Voice Conversion"}
    },
    "3": {
        "inputs": {
            "audio": ["2", 0],
            "filename": "rvc_converted"
        },
        "class_type": "SaveAudio",
        "_meta": {"title": "Save Converted Audio"}
    }
}

# ComfyUI Workflow for SoulX-Singer
SOULX_WORKFLOW = {
    "1": {
        "inputs": {
            "model_path": "models/soulx_singer/svs",
            "preprocess_path": "models/soulx_singer/preprocess"
        },
        "class_type": "LoadSoulXSinger",
        "_meta": {"title": "Load SoulX-Singer"}
    },
    "2": {
        "inputs": {
            "lyrics": "Your lyrics here",
            "melody_reference": "melody_reference.wav",
            "voice_reference": "voice_reference.wav",
            "control_mode": "melody",
            "midi_transcribe": False
        },
        "class_type": "SoulXSingerSynthesize",
        "_meta": {"title": "Synthesize Singing"}
    },
    "3": {
        "inputs": {
            "audio": ["2", 0],
            "filename": "soulx_output"
        },
        "class_type": "SaveAudio",
        "_meta": {"title": "Save Audio"}
    }
}

# ComfyUI Workflow for Complete Album Production
ALBUM_PRODUCTION_WORKFLOW = {
    "1": {
        "inputs": {
            "project_name": "MyAlbum",
            "singer_profile": "singer_name",
            "genre": "pop",
            "language": "es",
            "track_count": 10
        },
        "class_type": "InitAlbumProject",
        "_meta": {"title": "Initialize Album Project"}
    },
    "2": {
        "inputs": {
            "track_list": [
                {"title": "Track 1", "lyrics": "", "style": "upbeat pop", "bpm": 120, "key": "C"},
                {"title": "Track 2", "lyrics": "", "style": "emotional ballad", "bpm": 80, "key": "Am"},
                {"title": "Track 3", "lyrics": "", "style": "dance pop", "bpm": 128, "key": "G"}
            ]
        },
        "class_type": "AddAlbumTracks",
        "_meta": {"title": "Add Album Tracks"}
    },
    "3": {
        "inputs": {
            "engine": "heartmula",
            "voice_engine": "soulx"
        },
        "class_type": "ProduceAlbum",
        "_meta": {"title": "Produce Complete Album"}
    },
    "4": {
        "inputs": {
            "tracks": ["3", 0],
            "output_dir": "final_masters"
        },
        "class_type": "ExportAlbum",
        "_meta": {"title": "Export Final Masters"}
    }
}

# Custom Node Definitions for ComfyUI
CUSTOM_NODES = {
    "LoadHeartMuLaModel": {
        "category": "Music/HeartMuLa",
        "inputs": {
            "model_path": "STRING",
            "version": ["3B", "7B"],
            "bf16": "BOOLEAN"
        },
        "outputs": ["HEARTMULA_MODEL"],
        "function": "load_model"
    },
    "HeartMuLaGenerate": {
        "category": "Music/HeartMuLa",
        "inputs": {
            "model": "HEARTMULA_MODEL",
            "lyrics": "STRING",
            "tags": "STRING",
            "max_length_ms": "INT",
            "temperature": "FLOAT",
            "topk": "INT"
        },
        "outputs": ["AUDIO"],
        "function": "generate"
    },
    "LoadSongGenerationModel": {
        "category": "Music/SongGeneration",
        "inputs": {
            "model_path": "STRING",
            "precision": ["fp16", "fp32", "bf16"]
        },
        "outputs": ["SONGGEN_MODEL"],
        "function": "load_model"
    },
    "SongGenerationGenerate": {
        "category": "Music/SongGeneration",
        "inputs": {
            "model": "SONGGEN_MODEL",
            "prompt": "STRING",
            "lyrics": "STRING",
            "language": ["en", "zh", "es", "ja"],
            "temperature": "FLOAT",
            "top_k": "INT"
        },
        "outputs": ["AUDIO"],
        "function": "generate"
    },
    "LoadRVCModel": {
        "category": "Voice/RVC",
        "inputs": {
            "model_path": "STRING",
            "index_path": "STRING",
            "device": ["cpu", "cuda"]
        },
        "outputs": ["RVC_MODEL"],
        "function": "load_model"
    },
    "RVCInference": {
        "category": "Voice/RVC",
        "inputs": {
            "model": "RVC_MODEL",
            "audio": "AUDIO",
            "f0_method": ["pm", "harvest", "dio", "crepe", "rmvpe"],
            "f0_min": "INT",
            "f0_max": "INT",
            "pitch_shift": "INT",
            "filter_radius": "INT",
            "index_rate": "FLOAT",
            "rms_mix_rate": "FLOAT",
            "protect": "FLOAT"
        },
        "outputs": ["AUDIO"],
        "function": "infer"
    },
    "LoadSoulXSinger": {
        "category": "Voice/SoulX-Singer",
        "inputs": {
            "model_path": "STRING",
            "preprocess_path": "STRING"
        },
        "outputs": ["SOULX_MODEL"],
        "function": "load_model"
    },
    "SoulXSingerSynthesize": {
        "category": "Voice/SoulX-Singer",
        "inputs": {
            "model": "SOULX_MODEL",
            "lyrics": "STRING",
            "melody_reference": "AUDIO",
            "voice_reference": "AUDIO",
            "control_mode": ["melody", "score"],
            "midi_transcribe": "BOOLEAN"
        },
        "outputs": ["AUDIO"],
        "function": "synthesize"
    },
    "InitAlbumProject": {
        "category": "Album/Production",
        "inputs": {
            "project_name": "STRING",
            "singer_profile": "STRING",
            "genre": "STRING",
            "language": "STRING",
            "track_count": "INT"
        },
        "outputs": ["ALBUM_PROJECT"],
        "function": "init_project"
    },
    "AddAlbumTracks": {
        "category": "Album/Production",
        "inputs": {
            "project": "ALBUM_PROJECT",
            "track_list": "STRING"  # JSON string
        },
        "outputs": ["ALBUM_PROJECT"],
        "function": "add_tracks"
    },
    "ProduceAlbum": {
        "category": "Album/Production",
        "inputs": {
            "project": "ALBUM_PROJECT",
            "engine": ["heartmula", "songgeneration", "soulx"],
            "voice_engine": ["soulx", "rvc"]
        },
        "outputs": ["ALBUM_PROJECT", "AUDIO_LIST"],
        "function": "produce"
    },
    "ExportAlbum": {
        "category": "Album/Production",
        "inputs": {
            "project": "ALBUM_PROJECT",
            "output_dir": "STRING"
        },
        "outputs": ["STRING"],
        "function": "export"
    }
}

def save_workflows():
    """Save all workflows to ComfyUI workflows directory"""
    workflows_dir = Path(r"C:\Users\USER\ComfyUI\user\default\workflows")
    workflows_dir.mkdir(parents=True, exist_ok=True)
    
    workflows = {
        "heartmula_music_generation.json": HEARTMULA_WORKFLOW,
        "songgeneration_music_generation.json": SONGGENERATION_WORKFLOW,
        "rvc_voice_conversion.json": RVC_WORKFLOW,
        "soulx_singer_synthesis.json": SOULX_WORKFLOW,
        "album_production_complete.json": ALBUM_PRODUCTION_WORKFLOW
    }
    
    for name, workflow in workflows.items():
        filepath = workflows_dir / name
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(workflow, f, indent=2)
        print(f"Saved: {filepath}")
    
    # Save custom node definitions
    nodes_dir = Path(r"C:\Users\USER\ComfyUI\custom_nodes\music_ai_nodes")
    nodes_dir.mkdir(parents=True, exist_ok=True)
    
    with open(nodes_dir / "node_definitions.json", 'w', encoding='utf-8') as f:
        json.dump(CUSTOM_NODES, f, indent=2)
    
    print(f"Saved node definitions: {nodes_dir / 'node_definitions.json'}")

if __name__ == "__main__":
    save_workflows()
    print("All ComfyUI workflows saved!")