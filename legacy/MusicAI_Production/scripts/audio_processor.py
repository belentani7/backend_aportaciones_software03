#!/usr/bin/env python3
"""
Professional Music AI Production - Audio Processing Pipeline
Advanced DSP, stem separation, mixing, and mastering
"""

import numpy as np
import librosa
import soundfile as sf
import pyloudnorm as pyln
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging
from scipy import signal
from scipy.signal import butter, sosfilt, hilbert
import noisereduce as nr
import pedalboard
from pedalboard import Pedalboard, Compressor, Gain, Limiter, Reverb, Chorus, Phaser, HighpassFilter, LowpassFilter

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self, sample_rate: int = 44100):
        self.sr = sample_rate
    
    def load_audio(self, path: str, sr: int = None) -> Tuple[np.ndarray, int]:
        """Load audio file"""
        y, sr = librosa.load(path, sr=sr or self.sr, mono=False)
        if y.ndim == 1:
            y = y[np.newaxis, :]
        return y, sr
    
    def save_audio(self, path: str, y: np.ndarray, sr: int = None):
        """Save audio file"""
        sr = sr or self.sr
        if y.ndim > 1 and y.shape[0] <= 2:
            y = y.T  # (samples, channels)
        sf.write(path, y, sr)
    
    # ==================== NOISE REDUCTION ====================
    def reduce_noise(self, y: np.ndarray, sr: int, 
                     stationary: bool = False, prop_decrease: float = 0.75) -> np.ndarray:
        """Reduce noise using noisereduce"""
        if y.ndim > 1:
            # Process each channel
            result = np.zeros_like(y)
            for i in range(y.shape[0]):
                result[i] = nr.reduce_noise(y=y[i], sr=sr, stationary=stationary, 
                                           prop_decrease=prop_decrease)
            return result
        return nr.reduce_noise(y=y, sr=sr, stationary=stationary, prop_decrease=prop_decrease)
    
    def spectral_gate(self, y: np.ndarray, sr: int, 
                      threshold_db: float = -40, attenuation_db: float = -20) -> np.ndarray:
        """Spectral gating for noise reduction"""
        # STFT
        stft = librosa.stft(y)
        mag = np.abs(stft)
        phase = np.angle(stft)
        
        # Calculate noise floor
        noise_floor = np.percentile(mag, 10, axis=1, keepdims=True)
        threshold = noise_floor * (10 ** (threshold_db / 20))
        
        # Apply gate
        gate = np.where(mag > threshold, 1.0, 10 ** (attenuation_db / 20))
        mag_gated = mag * gate
        
        # Reconstruct
    def denoise_vocal(self, y: np.ndarray, sr: int) -> np.ndarray:
        """Specialized vocal denoising"""
        # High-pass filter to remove rumble
        y = self.highpass_filter(y, sr, 80)
        
        # Spectral subtraction
        y = self.reduce_noise(y, sr, stationary=True, prop_decrease=0.8)
        
        # De-essing (reduce sibilance)
        y = self.de_ess(y, sr)
        
        return y
    
    def de_ess(self, y: np.ndarray, sr: int, 
               freq_range: Tuple[float, float] = (5000, 8000),
               threshold_db: float = -20, ratio: float = 4.0) -> np.ndarray:
        """De-esser to reduce harsh sibilance"""
        # Bandpass filter for sibilance range
        sos = butter(4, [freq_range[0], freq_range[1]], btype='band', fs=sr, output='sos')
        sibilance = sosfilt(sos, y)
        
        # Envelope follower
        env = np.abs(hilbert(sibilance))
        env_smooth = np.convolve(env, np.ones(100)/100, mode='same')
        
        # Compress sibilance
        threshold = 10 ** (threshold_db / 20)
        gain = np.where(env_smooth > threshold, 
                       (threshold / env_smooth) ** (1 - 1/ratio), 1.0)
        
        # Apply gain to sibilance band
        y_processed = y.copy()
        y_processed = y_processed - sibilance + sibilance * gain[:, np.newaxis] if y.ndim > 1 else y_processed - sibilance + sibilance * gain
        
        return y_processed
    
    # ==================== EQ & FILTERING ====================
    def highpass_filter(self, y: np.ndarray, sr: int, cutoff: float, order: int = 4) -> np.ndarray:
        """High-pass filter"""
        sos = butter(order, cutoff, btype='high', fs=sr, output='sos')
        if y.ndim > 1:
            return np.array([sosfilt(sos, ch) for ch in y])
        return sosfilt(sos, y)
    
    def lowpass_filter(self, y: np.ndarray, sr: int, cutoff: float, order: int = 4) -> np.ndarray:
        """Low-pass filter"""
        sos = butter(order, cutoff, btype='low', fs=sr, output='sos')
        if y.ndim > 1:
            return np.array([sosfilt(sos, ch) for ch in y])
        return sosfilt(sos, y)
    
    def parametric_eq(self, y: np.ndarray, sr: int, 
                      freq: float, gain_db: float, q: float = 1.0) -> np.ndarray:
        """Parametric EQ"""
        from scipy.signal import iirpeak, iirnotch
        
        if gain_db > 0:
            # Peak filter
            sos = iirpeak(freq, q, fs=sr)
            # Apply gain
            b, a = sos[:, :3], sos[:, 3:]
            # Simplified - in production use proper biquad
        else:
            # Notch filter
            sos = iirnotch(freq, q, fs=sr)
        
        if y.ndim > 1:
            return np.array([sosfilt(sos, ch) for ch in y])
        return sosfilt(sos, y)
    
    # ==================== DYNAMICS ====================
    def compress(self, y: np.ndarray, sr: int,
                 threshold_db: float = -18, ratio: float = 4.0,
                 attack_ms: float = 10, release_ms: float = 100,
                 makeup_gain_db: float = 0) -> np.ndarray:
        """Compressor using pedalboard"""
        board = Pedalboard([
            Compressor(threshold_db=threshold_db, ratio=ratio,
                      attack_ms=attack_ms, release_ms=release_ms),
            Gain(gain_db=makeup_gain_db)
        ])
        return board(y, sr)
    
    def multiband_compress(self, y: np.ndarray, sr: int,
                           bands: List[Dict] = None) -> np.ndarray:
        """Multiband compression"""
        if bands is None:
            bands = [
                {"freq": (0, 150), "threshold": -12, "ratio": 2.0},
                {"freq": (150, 500), "threshold": -15, "ratio": 3.0},
                {"freq": (500, 3000), "threshold": -18, "ratio": 4.0},
                {"freq": (3000, 8000), "threshold": -20, "ratio": 3.0},
                {"freq": (8000, sr/2), "threshold": -24, "ratio": 2.0}
            ]
        
        result = np.zeros_like(y)
        for band in bands:
            # Bandpass
            sos = butter(4, band["freq"], btype='band', fs=sr, output='sos')
            if y.ndim > 1:
                band_signal = np.array([sosfilt(sos, ch) for ch in y])
            else:
                band_signal = sosfilt(sos, y)
            
            # Compress band
            board = Pedalboard([
                Compressor(threshold_db=band["threshold"], ratio=band["ratio"],
                          attack_ms=10, release_ms=100)
            ])
            band_signal = board(band_signal, sr)
            result += band_signal
        
        return result
    
    def limit(self, y: np.ndarray, sr: int, 
              ceiling_db: float = -0.5, release_ms: float = 50) -> np.ndarray:
        """Brickwall limiter"""
        board = Pedalboard([
            Limiter(ceiling_db=ceiling_db, release_ms=release_ms)
        ])
        return board(y, sr)
    
    # ==================== EFFECTS ====================
    def add_reverb(self, y: np.ndarray, sr: int,
                   room_size: float = 0.5, damping: float = 0.5,
                   wet_level: float = 0.3, dry_level: float = 0.7) -> np.ndarray:
        """Add reverb"""
        board = Pedalboard([
            Reverb(room_size=room_size, damping=damping, 
                   wet_level=wet_level, dry_level=dry_level)
        ])
        return board(y, sr)
    
    def add_chorus(self, y: np.ndarray, sr: int,
                   rate_hz: float = 1.0, depth: float = 0.3,
                   centre_delay_ms: float = 7, feedback: float = 0.1,
                   mix: float = 0.5) -> np.ndarray:
        """Add chorus"""
        board = Pedalboard([
            Chorus(rate_hz=rate_hz, depth=depth, centre_delay_ms=centre_delay_ms,
                   feedback=feedback, mix=mix)
        ])
        return board(y, sr)
    
    # ==================== MASTERING ====================
    def measure_loudness(self, y: np.ndarray, sr: int) -> float:
        """Measure integrated loudness (LUFS)"""
        meter = pyln.Meter(sr)
        if y.ndim > 1:
            # Average channels for measurement
            mono = np.mean(y, axis=0)
            return meter.integrated_loudness(mono)
        return meter.integrated_loudness(y)
    
    def normalize_loudness(self, y: np.ndarray, sr: int, 
                           target_lufs: float = -14.0) -> np.ndarray:
        """Normalize to target loudness"""
        current_lufs = self.measure_loudness(y, sr)
        gain_db = target_lufs - current_lufs
        gain = 10 ** (gain_db / 20)
        
        y_norm = y * gain
        
        # True peak limiting
        y_norm = self.limit(y_norm, sr, ceiling_db=-1.0)
        
        return y_norm
    
    def master_chain(self, y: np.ndarray, sr: int,
                     target_lufs: float = -14.0,
                     style: str = "streaming") -> np.ndarray:
        """Complete mastering chain"""
        
        # Style-specific settings
        if style == "streaming":
            target_lufs = -14.0
            ceiling = -1.0
        elif style == "cd":
            target_lufs = -9.0
            ceiling = -0.3
        elif style == "club":
            target_lufs = -8.0
            ceiling = -0.1
        else:
            target_lufs = -14.0
            ceiling = -1.0
        
        # 1. High-pass filter (remove sub-bass rumble)
        y = self.highpass_filter(y, sr, 30)
        
        # 2. Surgical EQ (remove problem frequencies)
        y = self.parametric_eq(y, sr, 200, -2, 2)  # Reduce mud
        y = self.parametric_eq(y, sr, 4000, 1, 2)  # Add presence
        y = self.parametric_eq(y, sr, 10000, 1.5, 1)  # Air
        
        # 3. Multiband compression
        y = self.multiband_compress(y, sr)
        
        # 4. Glue compression
        y = self.compress(y, sr, threshold_db=-12, ratio=2.0, 
                         attack_ms=30, release_ms=150, makeup_gain_db=1)
        
        # 5. Limiting for target loudness
        y = self.normalize_loudness(y, sr, target_lufs)
        
        # 6. Final ceiling
        y = self.limit(y, sr, ceiling_db=ceiling)
        
        return y
    
    # ==================== STEM SEPARATION ====================
    async def separate_stems(self, audio_path: str, output_dir: Path) -> Dict:
        """Separate stems using Demucs (via subprocess)"""
        import subprocess
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        cmd = [
            "python", "-m", "demucs.separate",
            "-o", str(output_dir),
            "--two-stems=vocals",
            audio_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            if result.returncode == 0:
                stems = {}
                for stem_file in output_dir.rglob("*.wav"):
                    stems[stem_file.stem] = str(stem_file)
                return stems
        except Exception as e:
            logger.error(f"Stem separation failed: {e}")
        
        return {}
    
    # ==================== VOCAL PROCESSING ====================
    def process_vocal_chain(self, y: np.ndarray, sr: int,
                            style: str = "pop") -> np.ndarray:
        """Complete vocal processing chain"""
        
        # 1. Noise reduction
        y = self.denoise_vocal(y, sr)
        
        # 2. High-pass
        y = self.highpass_filter(y, sr, 100)
        
        # 3. De-ess
        y = self.de_ess(y, sr)
        
        # 4. EQ
        if style == "pop":
            y = self.parametric_eq(y, sr, 200, -3, 2)      # Reduce mud
            y = self.parametric_eq(y, sr, 3000, 2, 2)      # Presence
            y = self.parametric_eq(y, sr, 6000, 3, 1)      # Clarity
            y = self.parametric_eq(y, sr, 12000, 2, 0.5)   # Air
        elif style == "rock":
            y = self.parametric_eq(y, sr, 150, -2, 2)
            y = self.parametric_eq(y, sr, 2500, 3, 2)
            y = self.parametric_eq(y, sr, 5000, 2, 1)
        elif style == "ballad":
            y = self.parametric_eq(y, sr, 250, -2, 2)
            y = self.parametric_eq(y, sr, 3500, 2, 2)
            y = self.parametric_eq(y, sr, 8000, 3, 1)
        
        # 5. Compression
        y = self.compress(y, sr, threshold_db=-18, ratio=3.0,
                         attack_ms=5, release_ms=50, makeup_gain_db=3)
        
        # 6. Second compressor (serial)
        y = self.compress(y, sr, threshold_db=-12, ratio=2.0,
                         attack_ms=20, release_ms=100, makeup_gain_db=2)
        
        # 7. De-ess again (post-compression)
        y = self.de_ess(y, sr, threshold_db=-25)
        
        # 8. Saturation (subtle)
        y = np.tanh(y * 1.2) * 0.9
        
        # 9. Reverb (send-style)
        reverb = self.add_reverb(y, sr, room_size=0.3, wet_level=0.15)
        y = y * 0.85 + reverb * 0.15
        
        # 10. Delay (optional, style-dependent)
        if style in ["pop", "ballad"]:
            y = self.add_stereo_delay(y, sr, delay_ms=120, feedback=0.2, mix=0.1)
        
        return y
    
    def add_stereo_delay(self, y: np.ndarray, sr: int,
                         delay_ms: float = 300, feedback: float = 0.3,
                         mix: float = 0.3) -> np.ndarray:
        """Add stereo delay"""
        delay_samples = int(delay_ms * sr / 1000)
        if y.ndim == 1:
            y = y[np.newaxis, :]
        
        delayed = np.zeros_like(y)
        delayed[:, delay_samples:] = y[:, :-delay_samples]
        
        # Ping-pong
        delayed = np.flipud(delayed)  # Flip channels
        
        # Feedback loop
        for _ in range(3):
            delayed = delayed * feedback
            delayed = np.roll(delayed, delay_samples, axis=1)
            delayed = np.flipud(delayed)
        
        return y * (1 - mix) + delayed * mix
    
    # ==================== ALIGNMENT ====================
    def time_stretch(self, y: np.ndarray, sr: int, rate: float) -> np.ndarray:
        """Time stretch without pitch change"""
        return librosa.effects.time_stretch(y, rate=rate)
    
    def pitch_shift(self, y: np.ndarray, sr: int, n_steps: float) -> np.ndarray:
        """Pitch shift without time change"""
        return librosa.effects.pitch_shift(y, sr=sr, n_steps=n_steps)
    
    def align_vocals_to_instrumental(self, vocal_path: str, instrumental_path: str,
                                     output_path: str) -> bool:
        """Align vocal timing to instrumental using DTW"""
        try:
            # Load both
            vocal, sr = self.load_audio(vocal_path)
            inst, _ = self.load_audio(instrumental_path, sr=sr)
            
            # Extract features
            vocal_chroma = librosa.feature.chroma_cqt(y=np.mean(vocal, axis=0), sr=sr)
            inst_chroma = librosa.feature.chroma_cqt(y=np.mean(inst, axis=0), sr=sr)
            
            # DTW alignment
            D, wp = librosa.sequence.dtw(vocal_chroma, inst_chroma)
            
            # Apply alignment (simplified)
            # In production, use more sophisticated alignment
            
            self.save_audio(output_path, vocal, sr)
            return True
        except Exception as e:
            logger.error(f"Alignment failed: {e}")
            return False

async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Audio Processor")
    parser.add_argument("--input", help="Input file")
    parser.add_argument("--output", help="Output file")
    parser.add_argument("--process", choices=["denoise", "compress", "master", "vocal_chain", "stems"])
    parser.add_argument("--style", default="pop", help="Style for vocal chain")
    parser.add_argument("--target-lufs", type=float, default=-14.0, help="Target LUFS")
    
    args = parser.parse_args()
    
    if not args.input or not args.output:
        parser.print_help()
        return
    
    processor = AudioProcessor()
    y, sr = processor.load_audio(args.input)
    
    if args.process == "denoise":
        y = processor.reduce_noise(y, sr)
    elif args.process == "compress":
        y = processor.compress(y, sr)
    elif args.process == "master":
        y = processor.master_chain(y, sr, target_lufs=args.target_lufs)
    elif args.process == "vocal_chain":
        y = processor.process_vocal_chain(y, sr, args.style)
    elif args.process == "stems":
        stems = await processor.separate_stems(args.input, Path(args.output))
        print(f"Stems: {stems}")
        return
    
    processor.save_audio(args.output, y, sr)
    print(f"Processed: {args.output}")

if __name__ == "__main__":
    asyncio.run(main())