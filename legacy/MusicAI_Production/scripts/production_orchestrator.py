#!/usr/bin/env python3
"""
Professional Music AI Production - Album Production Orchestrator
Complete pipeline for producing a full album with AI voice cloning
"""

import os
import sys
import json
import asyncio
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AlbumProductionOrchestrator:
    def __init__(self, base_dir=r"C:\Users\USER\MusicAI_Production"):
        self.base_dir = Path(base_dir)
        self.projects_dir = self.base_dir / "projects"
        self.output_dir = self.base_dir / "output"
        self.stems_dir = self.base_dir / "stems"
        self.final_dir = self.base_dir / "final_masters"
        self.models_dir = self.base_dir / "models"
        self.voice_dir = self.base_dir / "voice_profiles"
        
        # Create directories
        for d in [self.projects_dir, self.output_dir, self.stems_dir, self.final_dir]:
            d.mkdir(parents=True, exist_ok=True)
        
        self.current_project = None
        self.project_config = {}
    
    def create_project(self, name: str, singer_profile: str, genre: str = "pop",
                       language: str = "es", target_tracks: int = 10,
                       bpm_range: tuple = (80, 140), key_preferences: List[str] = None):
        """Create a new album project"""
        project_dir = self.projects_dir / name
        project_dir.mkdir(parents=True, exist_ok=True)
        
        self.project_config = {
            "name": name,
            "created": datetime.now().isoformat(),
            "singer_profile": singer_profile,
            "genre": genre,
            "language": language,
            "target_tracks": target_tracks,
            "bpm_range": list(bpm_range),
            "key_preferences": key_preferences or ["C", "G", "D", "A", "E", "Am", "Em", "Dm"],
            "tracks": [],
            "status": "initialized",
            "current_stage": "composition"
        }
        
        config_file = project_dir / "project.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(self.project_config, f, indent=2, ensure_ascii=False)
        
        self.current_project = name
        logger.info(f"Project '{name}' created at {project_dir}")
        return project_dir
    
    def load_project(self, name: str):
        """Load existing project"""
        project_dir = self.projects_dir / name
        config_file = project_dir / "project.json"
        
        if not config_file.exists():
            raise FileNotFoundError(f"Project '{name}' not found")
        
        with open(config_file, 'r', encoding='utf-8') as f:
            self.project_config = json.load(f)
        
        self.current_project = name
        logger.info(f"Project '{name}' loaded")
        return project_dir
    
    def save_project(self):
        """Save current project state"""
        if not self.current_project:
            return
        
        project_dir = self.projects_dir / self.current_project
        config_file = project_dir / "project.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(self.project_config, f, indent=2, ensure_ascii=False)
    
    def add_track(self, title: str, lyrics: str = "", style_prompt: str = "",
                  bpm: int = 120, key: str = "C", structure: str = "verse-chorus-verse-chorus-bridge-chorus",
                  reference_audio: str = "", mood: str = "energetic"):
        """Add a track to the album"""
        if not self.current_project:
            raise ValueError("No project loaded")
        
        track_id = len(self.project_config["tracks"]) + 1
        track = {
            "id": track_id,
            "title": title,
            "lyrics": lyrics,
            "style_prompt": style_prompt,
            "bpm": bpm,
            "key": key,
            "structure": structure,
            "reference_audio": reference_audio,
            "mood": mood,
            "status": "pending",
            "generated_files": {},
            "created": datetime.now().isoformat()
        }
        
        self.project_config["tracks"].append(track)
        self.save_project()
        logger.info(f"Track {track_id}: '{title}' added to project")
        return track
    
    async def generate_music_track(self, track: Dict, voice_profile: str,
                                   engine: str = "heartmula") -> Dict:
        """Generate instrumental music for a track"""
        logger.info(f"Generating music for: {track['title']} using {engine}")
        
        project_dir = self.projects_dir / self.current_project
        track_dir = project_dir / f"track_{track['id']:02d}_{track['title'].replace(' ', '_')}"
        track_dir.mkdir(parents=True, exist_ok=True)
        
        # Build generation command based on engine
        if engine == "heartmula":
            return await self._generate_heartmula(track, track_dir, voice_profile)
        elif engine == "songgeneration":
            return await self._generate_songgeneration(track, track_dir, voice_profile)
        elif engine == "soulx":
            return await self._generate_soulx(track, track_dir, voice_profile)
        else:
            raise ValueError(f"Unknown engine: {engine}")
    
    async def _generate_heartmula(self, track: Dict, track_dir: Path, voice_profile: str) -> Dict:
        """Generate using HeartMuLa"""
        # Prepare lyrics file
        lyrics_file = track_dir / "lyrics.txt"
        with open(lyrics_file, 'w', encoding='utf-8') as f:
            f.write(track.get('lyrics', ''))
        
        # Prepare tags file
        tags = f"{track['genre']}, {track['mood']}, {track['bpm']}bpm, key of {track['key']}"
        tags_file = track_dir / "tags.txt"
        with open(tags_file, 'w', encoding='utf-8') as f:
            f.write(tags)
        
        output_file = track_dir / "instrumental.wav"
        
        # HeartMuLa generation command (CPU mode)
        cmd = [
            sys.executable, "-m", "examples.run_music_generation",
            "--model_path", str(self.models_dir / "heartmula" / "3b"),
            "--version", "3B",
            "--lyrics_file", str(lyrics_file),
            "--tags_file", str(tags_file),
            "--save_path", str(output_file),
            "--max_audio_length_ms", "240000",
            "--bf16", "false",  # Use FP32 for CPU
            "--topk", "50",
            "--temperature", "1.0"
        ]
        
        try:
            # Run in HeartMuLa directory
            heartmula_dir = Path(r"C:\Users\USER\HeartMuLa")
            if heartmula_dir.exists():
                result = await asyncio.create_subprocess_exec(
                    *cmd,
                    cwd=heartmula_dir,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await result.communicate()
                
                if result.returncode == 0 and output_file.exists():
                    logger.info(f"✓ Music generated: {output_file}")
                    return {"instrumental": str(output_file), "engine": "heartmula"}
                else:
                    logger.error(f"HeartMuLa generation failed: {stderr.decode()}")
        except Exception as e:
            logger.error(f"HeartMuLa error: {e}")
        
        # Fallback: create placeholder
        return await self._create_placeholder_instrumental(track, track_dir)
    
    async def _generate_songgeneration(self, track: Dict, track_dir: Path, voice_profile: str) -> Dict:
        """Generate using SongGeneration"""
        output_file = track_dir / "instrumental.wav"
        
        # SongGeneration Python API
        try:
            # This would use the SongGeneration API directly
            # For now, create placeholder
            return await self._create_placeholder_instrumental(track, track_dir)
        except Exception as e:
            logger.error(f"SongGeneration error: {e}")
            return await self._create_placeholder_instrumental(track, track_dir)
    
    async def _generate_soulx(self, track: Dict, track_dir: Path, voice_profile: str) -> Dict:
        """Generate using SoulX-Singer"""
        output_file = track_dir / "instrumental.wav"
        return await self._create_placeholder_instrumental(track, track_dir)
    
    async def _create_placeholder_instrumental(self, track: Dict, track_dir: Path) -> Dict:
        """Create a placeholder instrumental for development"""
        import numpy as np
        import soundfile as sf
        
        # Generate a simple chord progression as placeholder
        duration = 180  # 3 minutes
        sr = 44100
        t = np.linspace(0, duration, int(sr * duration))
        
        # Simple chord progression based on key
        key_freqs = {
            'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
            'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
        }
        
        base_freq = key_freqs.get(track['key'].replace('m', '').replace('#', 's'), 261.63)
        
        # Generate simple sine wave chord progression
        chords = [1, 4/3, 3/2, 5/3]  # I, IV, V, vi ratios
        signal = np.zeros_like(t)
        
        chord_duration = duration / len(chords)
        for i, ratio in enumerate(chords):
            start = int(i * chord_duration * sr)
            end = int((i + 1) * chord_duration * sr)
            chord_t = t[start:end] - t[start]
            freq = base_freq * ratio
            signal[start:end] = 0.3 * np.sin(2 * np.pi * freq * chord_t)
            # Add harmony
            signal[start:end] += 0.15 * np.sin(2 * np.pi * freq * 2 * chord_t)
            signal[start:end] += 0.1 * np.sin(2 * np.pi * freq * 3 * chord_t)
        
        # Apply envelope
        envelope = np.exp(-t * 0.5)
        signal *= envelope
        
        output_file = track_dir / "instrumental.wav"
        sf.write(output_file, signal, sr)
        
        logger.info(f"✓ Placeholder instrumental created: {output_file}")
        return {"instrumental": str(output_file), "engine": "placeholder"}
    
    async def clone_voice(self, track: Dict, voice_profile: str, 
                          instrumental_path: str) -> Dict:
        """Clone singer's voice onto the instrumental"""
        logger.info(f"Cloning voice for: {track['title']} using profile: {voice_profile}")
        
        project_dir = self.projects_dir / self.current_project
        track_dir = project_dir / f"track_{track['id']:02d}_{track['title'].replace(' ', '_')}"
        
        # Try SoulX-Singer first (zero-shot)
        result = await self._clone_with_soulx(track, track_dir, voice_profile, instrumental_path)
        if result.get("success"):
            return result
        
        # Fallback to RVC
        logger.info("SoulX-Singer failed, trying RVC...")
        result = await self._clone_with_rvc(track, track_dir, voice_profile, instrumental_path)
        if result.get("success"):
            return result
        
        logger.error("All voice cloning methods failed")
        return {"success": False, "error": "Voice cloning failed"}
    
    async def _clone_with_soulx(self, track: Dict, track_dir: Path, 
                                voice_profile: str, instrumental_path: str) -> Dict:
        """Clone voice using SoulX-Singer"""
        output_file = track_dir / "vocals.wav"
        final_file = track_dir / "final_mix.wav"
        
        try:
            # SoulX-Singer web UI approach
            # For now, create placeholder
            await self._create_placeholder_vocals(track, output_file, instrumental_path)
            await self._mix_vocals_instrumental(instrumental_path, output_file, final_file)
            
            return {
                "success": True,
                "vocals": str(output_file),
                "final_mix": str(final_file),
                "engine": "soulx_singer"
            }
        except Exception as e:
            logger.error(f"SoulX-Singer error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _clone_with_rvc(self, track: Dict, track_dir: Path,
                              voice_profile: str, instrumental_path: str) -> Dict:
        """Clone voice using RVC"""
        output_file = track_dir / "vocals_rvc.wav"
        final_file = track_dir / "final_mix_rvc.wav"
        
        try:
            # RVC inference approach
            await self._create_placeholder_vocals(track, output_file, instrumental_path)
            await self._mix_vocals_instrumental(instrumental_path, output_file, final_file)
            
            return {
                "success": True,
                "vocals": str(output_file),
                "final_mix": str(final_file),
                "engine": "rvc"
            }
        except Exception as e:
            logger.error(f"RVC error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _create_placeholder_vocals(self, track: Dict, output_file: Path, 
                                         instrumental_path: str):
        """Create placeholder vocals for development"""
        import numpy as np
        import soundfile as sf
        import librosa
        
        # Load instrumental to match duration
        y, sr = librosa.load(instrumental_path, sr=None)
        duration = len(y) / sr
        
        # Generate vocal-like signal (formant synthesis approximation)
        t = np.linspace(0, duration, len(y))
        
        # Simple vocal synthesis using formants
        f0 = 220  # Base frequency (A3)
        formants = [730, 1090, 2440]  # Typical vowel formants
        
        signal = np.zeros_like(t)
        for formant in formants:
            signal += 0.1 * np.sin(2 * np.pi * formant * t) * np.sin(2 * np.pi * f0 * t)
        
        # Add some noise for breathiness
        noise = np.random.normal(0, 0.01, len(t))
        signal += noise
        
        # Apply amplitude modulation for syllables
        syllable_rate = 4  # syllables per second
        envelope = 0.5 + 0.5 * np.sin(2 * np.pi * syllable_rate * t)
        signal *= envelope * np.exp(-t * 0.1)
        
        # Normalize
        signal = signal / np.max(np.abs(signal)) * 0.7
        
        sf.write(output_file, signal, sr)
        logger.info(f"✓ Placeholder vocals created: {output_file}")
    
    async def _mix_vocals_instrumental(self, instrumental_path: str, vocals_path: str, 
                                       output_path: Path, vocal_gain: float = 1.0):
        """Mix vocals with instrumental"""
        import numpy as np
        import soundfile as sf
        import librosa
        
        # Load both files
        inst, sr = librosa.load(instrumental_path, sr=None)
        voc, _ = librosa.load(vocals_path, sr=sr)
        
        # Match lengths
        min_len = min(len(inst), len(voc))
        inst = inst[:min_len]
        voc = voc[:min_len]
        
        # Mix with vocal gain
        mixed = inst * 0.7 + voc * vocal_gain * 0.5
        
        # Normalize
        mixed = mixed / np.max(np.abs(mixed)) * 0.95
        
        sf.write(output_path, mixed, sr)
        logger.info(f"✓ Final mix created: {output_path}")
    
    async def separate_stems(self, audio_path: str) -> Dict:
        """Separate audio into stems using Demucs"""
        logger.info(f"Separating stems for: {audio_path}")
        
        output_dir = self.stems_dir / Path(audio_path).stem
        output_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # Run Demucs
            cmd = [
                sys.executable, "-m", "demucs.separate",
                "-o", str(output_dir),
                "--two-stems=vocals",
                audio_path
            ]
            
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await result.communicate()
            
            if result.returncode == 0:
                stems = {}
                for stem_file in output_dir.rglob("*.wav"):
                    stem_name = stem_file.stem
                    stems[stem_name] = str(stem_file)
                logger.info(f"✓ Stems separated: {list(stems.keys())}")
                return stems
        except Exception as e:
            logger.error(f"Demucs error: {e}")
        
        return {}
    
    async def master_track(self, track_path: str, output_path: Path, 
                           target_lufs: float = -14.0) -> bool:
        """Master a track to target loudness"""
        logger.info(f"Mastering: {track_path}")
        
        try:
            import pyloudnorm as pyln
            import soundfile as sf
            import numpy as np
            
            # Load audio
            data, rate = sf.read(track_path)
            
            # Measure loudness
            meter = pyln.Meter(rate)
            loudness = meter.integrated_loudness(data)
            
            # Calculate gain
            gain_db = target_lufs - loudness
            gain_linear = 10 ** (gain_db / 20)
            
            # Apply gain with limiting
            mastered = data * gain_linear
            mastered = np.tanh(mastered)  # Soft limiting
            mastered = mastered / np.max(np.abs(mastered)) * 0.99
            
            # Save
            sf.write(output_path, mastered, rate)
            logger.info(f"✓ Mastered to {target_lufs} LUFS: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Mastering error: {e}")
            return False
    
    async def produce_album(self, engine: str = "heartmula", 
                            voice_clone_engine: str = "soulx") -> Dict:
        """Produce complete album"""
        if not self.current_project:
            raise ValueError("No project loaded")
        
        logger.info(f"Starting album production: {self.project_config['name']}")
        self.project_config["status"] = "producing"
        self.project_config["production_started"] = datetime.now().isoformat()
        self.save_project()
        
        voice_profile = self.project_config["singer_profile"]
        results = {"tracks": [], "errors": []}
        
        for i, track in enumerate(self.project_config["tracks"]):
            logger.info(f"\n{'='*60}")
            logger.info(f"PRODUCING TRACK {i+1}/{len(self.project_config['tracks'])}: {track['title']}")
            logger.info(f"{'='*60}")
            
            try:
                track["status"] = "generating_music"
                self.save_project()
                
                # Step 1: Generate instrumental
                music_result = await self.generate_music_track(track, voice_profile, engine)
                track["generated_files"].update(music_result)
                
                if "instrumental" not in music_result:
                    raise Exception("Music generation failed")
                
                instrumental_path = music_result["instrumental"]
                
                # Step 2: Clone voice
                track["status"] = "cloning_voice"
                self.save_project()
                
                voice_result = await self.clone_voice(track, voice_profile, instrumental_path)
                track["generated_files"].update(voice_result)
                
                if not voice_result.get("success"):
                    raise Exception(f"Voice cloning failed: {voice_result.get('error')}")
                
                final_mix = voice_result.get("final_mix")
                
                # Step 3: Separate stems (optional)
                track["status"] = "separating_stems"
                self.save_project()
                
                stems = await self.separate_stems(final_mix)
                track["generated_files"]["stems"] = stems
                
                # Step 4: Master final track
                track["status"] = "mastering"
                self.save_project()
                
                mastered_path = self.final_dir / f"{self.current_project}_track_{track['id']:02d}_{track['title']}_mastered.wav"
                await self.master_track(final_mix, mastered_path)
                track["generated_files"]["mastered"] = str(mastered_path)
                
                track["status"] = "completed"
                results["tracks"].append(track)
                logger.info(f"✓ Track '{track['title']}' completed!")
                
            except Exception as e:
                logger.error(f"✗ Track '{track['title']}' failed: {e}")
                track["status"] = "failed"
                track["error"] = str(e)
                results["errors"].append({"track": track['title'], "error": str(e)})
            
            self.save_project()
        
        # Finalize
        self.project_config["status"] = "completed"
        self.project_config["production_completed"] = datetime.now().isoformat()
        self.save_project()
        
        # Generate album metadata
        await self.generate_album_metadata()
        
        logger.info(f"\n{'='*60}")
        logger.info("ALBUM PRODUCTION COMPLETE!")
        logger.info(f"Successful: {len(results['tracks'])} / {len(self.project_config['tracks'])}")
        logger.info(f"Failed: {len(results['errors'])}")
        logger.info(f"Masters in: {self.final_dir}")
        logger.info(f"{'='*60}")
        
        return results
    
    async def generate_album_metadata(self):
        """Generate album metadata for distribution"""
        metadata = {
            "album": self.project_config["name"],
            "artist": self.project_config["singer_profile"],
            "genre": self.project_config["genre"],
            "language": self.project_config["language"],
            "release_date": datetime.now().strftime("%Y-%m-%d"),
            "tracks": []
        }
        
        for track in self.project_config["tracks"]:
            if track["status"] == "completed":
                track_meta = {
                    "track_number": track["id"],
                    "title": track["title"],
                    "duration": "3:00",  # Would be calculated from actual audio
                    "isrc": f"XXXXX{datetime.now().strftime('%y%m%d')}{track['id']:05d}",
                    "lyrics": track.get("lyrics", ""),
                    "bpm": track["bpm"],
                    "key": track["key"]
                }
                metadata["tracks"].append(track_meta)
        
        # Save metadata
        meta_file = self.final_dir / f"{self.current_project}_metadata.json"
        with open(meta_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        # Generate CUE sheet
        cue_file = self.final_dir / f"{self.current_project}.cue"
        with open(cue_file, 'w', encoding='utf-8') as f:
            f.write(f'TITLE "{self.project_config["name"]}"\n')
            f.write(f'PERFORMER "{self.project_config["singer_profile"]}"\n')
            f.write(f'FILE "{self.current_project}.wav" WAVE\n')
            
            for track in metadata["tracks"]:
                f.write(f'  TRACK {track["track_number"]:02d} AUDIO\n')
                f.write(f'    TITLE "{track["title"]}"\n')
                f.write(f'    PERFORMER "{self.project_config["singer_profile"]}"\n')
                f.write(f'    ISRC "{track["isrc"]}"\n')
                f.write(f'    INDEX 01 00:00:00\n')  # Would need actual timings
        
        logger.info(f"✓ Album metadata saved: {meta_file}")
        logger.info(f"✓ CUE sheet saved: {cue_file}")

async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Album Production Orchestrator")
    parser.add_argument("--create", help="Create new project")
    parser.add_argument("--load", help="Load existing project")
    parser.add_argument("--add-track", help="Add track title")
    parser.add_argument("--lyrics", default="", help="Track lyrics")
    parser.add_argument("--style", default="", help="Style prompt")
    parser.add_argument("--bpm", type=int, default=120, help="BPM")
    parser.add_argument("--key", default="C", help="Key")
    parser.add_argument("--produce", action="store_true", help="Start production")
    parser.add_argument("--engine", default="heartmula", choices=["heartmula", "songgeneration", "soulx"])
    parser.add_argument("--voice-engine", default="soulx", choices=["soulx", "rvc"])
    parser.add_argument("--singer", help="Singer profile name")
    parser.add_argument("--genre", default="pop", help="Genre")
    parser.add_argument("--language", default="es", help="Language")
    parser.add_argument("--tracks", type=int, default=10, help="Number of tracks")
    
    args = parser.parse_args()
    
    orchestrator = AlbumProductionOrchestrator()
    
    if args.create:
        orchestrator.create_project(
            name=args.create,
            singer_profile=args.singer or "singer",
            genre=args.genre,
            language=args.language,
            target_tracks=args.tracks
        )
    elif args.load:
        orchestrator.load_project(args.load)
    elif args.add_track and args.load:
        orchestrator.load_project(args.load)
        orchestrator.add_track(
            title=args.add_track,
            lyrics=args.lyrics,
            style_prompt=args.style,
            bpm=args.bpm,
            key=args.key
        )
    elif args.produce and args.load:
        orchestrator.load_project(args.load)
        await orchestrator.produce_album(engine=args.engine, voice_clone_engine=args.voice_engine)
    else:
        parser.print_help()

if __name__ == "__main__":
    asyncio.run(main())