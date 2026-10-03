#!/usr/bin/env python3
"""
Professional Music AI Production - Voice Profile Manager
Manages singer voice profiles for cloning
"""

import os
import json
import shutil
from pathlib import Path
import librosa
import soundfile as sf
import numpy as np
from datetime import datetime

class VoiceProfileManager:
    def __init__(self, base_dir=r"C:\Users\USER\MusicAI_Production"):
        self.base_dir = Path(base_dir)
        self.voice_dir = self.base_dir / "voice_profiles"
        self.voice_dir.mkdir(parents=True, exist_ok=True)
        self.profiles_file = self.voice_dir / "profiles.json"
        self.profiles = self.load_profiles()
    
    def load_profiles(self):
        if self.profiles_file.exists():
            with open(self.profiles_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def save_profiles(self):
        with open(self.profiles_file, 'w', encoding='utf-8') as f:
            json.dump(self.profiles, f, indent=2, ensure_ascii=False)
    
    def analyze_audio(self, audio_path):
        """Analyze audio file for quality metrics"""
        try:
            y, sr = librosa.load(audio_path, sr=None)
            duration = len(y) / sr
            rms = np.sqrt(np.mean(y**2))
            peak = np.max(np.abs(y))
            dynamic_range = 20 * np.log10(peak / (rms + 1e-10))
            
            # Spectral analysis
            stft = np.abs(librosa.stft(y))
            spectral_centroid = np.mean(librosa.feature.spectral_centroid(S=stft, sr=sr))
            spectral_bandwidth = np.mean(librosa.feature.spectral_bandwidth(S=stft, sr=sr))
            
            return {
                "duration": float(duration),
                "sample_rate": int(sr),
                "rms": float(rms),
                "peak": float(peak),
                "dynamic_range_db": float(dynamic_range),
                "spectral_centroid": float(spectral_centroid),
                "spectral_bandwidth": float(spectral_bandwidth),
                "channels": 1 if y.ndim == 1 else y.shape[0]
            }
        except Exception as e:
            return {"error": str(e)}
    
    def create_profile(self, name, audio_files, language="es", gender="unknown", 
                       genre="pop", notes=""):
        """Create a new voice profile from audio samples"""
        profile_dir = self.voice_dir / name
        profile_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy and analyze audio files
        samples = []
        total_duration = 0
        
        for i, audio_file in enumerate(audio_files):
            src = Path(audio_file)
            if not src.exists():
                print(f"Warning: {audio_file} not found, skipping")
                continue
            
            dst = profile_dir / f"sample_{i:03d}{src.suffix}"
            shutil.copy2(src, dst)
            
            analysis = self.analyze_audio(dst)
            if "error" not in analysis:
                samples.append({
                    "file": dst.name,
                    "original": str(src),
                    "analysis": analysis
                })
                total_duration += analysis["duration"]
        
        if not samples:
            raise ValueError("No valid audio samples provided")
        
        profile = {
            "name": name,
            "created": datetime.now().isoformat(),
            "language": language,
            "gender": gender,
            "genre": genre,
            "notes": notes,
            "total_samples": len(samples),
            "total_duration_seconds": total_duration,
            "total_duration_minutes": total_duration / 60,
            "samples": samples,
            "rvc_model_path": None,
            "soulx_adaptation_path": None,
            "status": "ready_for_training"
        }
        
        self.profiles[name] = profile
        self.save_profiles()
        
        print(f"✓ Profile '{name}' created with {len(samples)} samples ({total_duration/60:.1f} min)")
        return profile
    
    def list_profiles(self):
        """List all voice profiles"""
        if not self.profiles:
            print("No voice profiles found.")
            return
        
        print("\n" + "=" * 80)
        print("VOICE PROFILES")
        print("=" * 80)
        for name, profile in self.profiles.items():
            print(f"\n🎤 {name}")
            print(f"   Language: {profile['language']} | Genre: {profile['genre']} | Gender: {profile['gender']}")
            print(f"   Samples: {profile['total_samples']} | Duration: {profile['total_duration_minutes']:.1f} min")
            print(f"   Status: {profile['status']}")
            if profile.get('rvc_model_path'):
                print(f"   RVC Model: ✓ Trained")
            if profile.get('soulx_adaptation_path'):
                print(f"   SoulX Adaptation: ✓ Ready")
    
    def get_profile(self, name):
        return self.profiles.get(name)
    
    def delete_profile(self, name):
        if name in self.profiles:
            profile_dir = self.voice_dir / name
            if profile_dir.exists():
                shutil.rmtree(profile_dir)
            del self.profiles[name]
            self.save_profiles()
            print(f"✓ Profile '{name}' deleted")
        else:
            print(f"Profile '{name}' not found")

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Voice Profile Manager")
    parser.add_argument("--create", help="Create new profile")
    parser.add_argument("--name", help="Profile name")
    parser.add_argument("--files", nargs="+", help="Audio files")
    parser.add_argument("--language", default="es", help="Language (es/en/pt/zh/ja)")
    parser.add_argument("--gender", default="unknown", help="Gender")
    parser.add_argument("--genre", default="pop", help="Genre")
    parser.add_argument("--notes", default="", help="Notes")
    parser.add_argument("--list", action="store_true", help="List profiles")
    parser.add_argument("--delete", help="Delete profile")
    
    args = parser.parse_args()
    
    manager = VoiceProfileManager()
    
    if args.list:
        manager.list_profiles()
    elif args.delete:
        manager.delete_profile(args.delete)
    elif args.create and args.name and args.files:
        manager.create_profile(
            name=args.name,
            audio_files=args.files,
            language=args.language,
            gender=args.gender,
            genre=args.genre,
            notes=args.notes
        )
    else:
        parser.print_help()

if __name__ == "__main__":
    main()