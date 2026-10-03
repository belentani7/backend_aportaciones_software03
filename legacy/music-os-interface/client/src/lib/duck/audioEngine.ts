import { midiToFrequency } from "./musicTheory";

export type DuckEffectId = "gate" | "eq" | "deEsser" | "compressor" | "drive" | "chorus" | "delay" | "reverb" | "width" | "limiter";

export type DuckEffects = Record<DuckEffectId, number>;
export type DuckTrackId = "kick" | "snare" | "hat" | "bass";

export const DEFAULT_DUCK_EFFECTS: DuckEffects = {
  gate: 0.8,
  eq: 0.55,
  deEsser: 0.35,
  compressor: 0.62,
  drive: 0.16,
  chorus: 0.18,
  delay: 0.24,
  reverb: 0.29,
  width: 0.22,
  limiter: 0.72,
};

export type DuckMeter = { peak: number; rms: number; db: number };

export type DuckRecording = {
  blob: Blob;
  durationMs: number;
  mimeType: string;
};

type DuckNodes = {
  input: GainNode;
  gate: GainNode;
  highPass: BiquadFilterNode;
  eq: BiquadFilterNode;
  deEsser: BiquadFilterNode;
  compressor: DynamicsCompressorNode;
  drive: WaveShaperNode;
  chorus: DelayNode;
  chorusLfo: OscillatorNode;
  delay: DelayNode;
  reverb: ConvolverNode;
  reverbWet: GainNode;
  width: StereoPannerNode;
  limiter: DynamicsCompressorNode;
  master: GainNode;
  analyser: AnalyserNode;
  recordDestination: MediaStreamAudioDestinationNode;
  tracks: Record<DuckTrackId, { input: GainNode; tone: BiquadFilterNode; drive: WaveShaperNode; compressor: DynamicsCompressorNode; gain: GainNode; pan: StereoPannerNode; analyser: AnalyserNode }>;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
}

function makeSaturationCurve(amount: number) {
  const size = 1024;
  const curve = new Float32Array(size);
  const k = 1 + amount * 80;
  for (let index = 0; index < size; index += 1) {
    const x = index * 2 / (size - 1) - 1;
    curve[index] = (1 + k) * x / (1 + k * Math.abs(x));
  }
  return curve;
}

function makeImpulse(context: AudioContext, seconds: number, decay: number) {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let sample = 0; sample < length; sample += 1) {
      const envelope = (1 - sample / length) ** decay;
      data[sample] = (Math.random() * 2 - 1) * envelope;
    }
  }
  return impulse;
}

function getNodeMeter(analyser: AnalyserNode): DuckMeter {
  const values = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(values);
  let sum = 0;
  let peak = 0;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index] ?? 0;
    sum += value * value;
    peak = Math.max(peak, Math.abs(value));
  }
  const rms = Math.sqrt(sum / values.length);
  return { peak, rms, db: rms > 0 ? 20 * Math.log10(rms) : -96 };
}

/**
 * Browser-native audio engine. It deliberately uses standard Web Audio nodes rather than emulating or loading proprietary DAW plugins.
 */
export class DuckAudioEngine {
  private context: AudioContext | null = null;
  private nodes: DuckNodes | null = null;
  private stream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordingChunks: BlobPart[] = [];
  private recordingStartedAt = 0;
  private effects: DuckEffects = { ...DEFAULT_DUCK_EFFECTS };

  static isSupported() {
    return typeof window !== "undefined" && ("AudioContext" in window || "webkitAudioContext" in window);
  }

  get state() {
    return this.context?.state ?? "closed";
  }

  get currentTime() {
    return this.context?.currentTime ?? 0;
  }

  get hasMicrophone() {
    return Boolean(this.stream && this.micSource);
  }

  get isRecording() {
    return this.mediaRecorder?.state === "recording";
  }

  getEffectState() {
    return { ...this.effects };
  }

  async initialize() {
    if (this.context && this.nodes) {
      if (this.context.state === "suspended") await this.context.resume();
      return;
    }
    if (!DuckAudioEngine.isSupported()) throw new Error("Este navegador no implementa Web Audio API.");

    const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
    this.context = new AudioContextConstructor();
    const context = this.context;
    const input = context.createGain();
    const gate = context.createGain();
    const highPass = context.createBiquadFilter();
    const eq = context.createBiquadFilter();
    const deEsser = context.createBiquadFilter();
    const compressor = context.createDynamicsCompressor();
    const drive = context.createWaveShaper();
    const chorus = context.createDelay(0.08);
    const chorusLfo = context.createOscillator();
    const delay = context.createDelay(1.5);
    const delayFeedback = context.createGain();
    const reverb = context.createConvolver();
    const reverbWet = context.createGain();
    const width = context.createStereoPanner();
    const limiter = context.createDynamicsCompressor();
    const master = context.createGain();
    const analyser = context.createAnalyser();
    const recordDestination = context.createMediaStreamDestination();
    const tracks = Object.fromEntries((["kick", "snare", "hat", "bass"] as DuckTrackId[]).map(id => {
      const trackInput = context.createGain();
      const tone = context.createBiquadFilter();
      const trackDrive = context.createWaveShaper();
      const trackCompressor = context.createDynamicsCompressor();
      const trackGain = context.createGain();
      const pan = context.createStereoPanner();
      const trackAnalyser = context.createAnalyser();
      tone.type = "lowpass";
      tone.frequency.value = 15000;
      trackDrive.curve = makeSaturationCurve(0);
      trackDrive.oversample = "2x";
      trackCompressor.threshold.value = -12;
      trackCompressor.ratio.value = 2;
      trackCompressor.attack.value = 0.008;
      trackCompressor.release.value = 0.1;
      trackGain.gain.value = 0.75;
      trackAnalyser.fftSize = 512;
      trackInput.connect(tone).connect(trackDrive).connect(trackCompressor).connect(trackGain).connect(pan).connect(trackAnalyser).connect(input);
      return [id, { input: trackInput, tone, drive: trackDrive, compressor: trackCompressor, gain: trackGain, pan, analyser: trackAnalyser }];
    })) as DuckNodes["tracks"];

    highPass.type = "highpass";
    highPass.frequency.value = 72;
    eq.type = "peaking";
    eq.frequency.value = 2200;
    eq.Q.value = 0.8;
    deEsser.type = "highshelf";
    deEsser.frequency.value = 5800;
    compressor.threshold.value = -22;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.14;
    chorus.delayTime.value = 0.019;
    chorusLfo.frequency.value = 0.32;
    chorusLfo.connect(chorus.delayTime);
    chorusLfo.start();
    delay.delayTime.value = 0.28;
    delayFeedback.gain.value = 0.34;
    delay.connect(delayFeedback).connect(delay);
    reverb.buffer = makeImpulse(context, 1.7, 2.8);
    limiter.threshold.value = -1.2;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.05;
    master.gain.value = 0.76;
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.84;

    input.connect(gate).connect(highPass).connect(eq).connect(deEsser).connect(compressor).connect(drive).connect(chorus).connect(delay);
    delay.connect(reverb).connect(reverbWet).connect(width).connect(limiter).connect(master).connect(analyser).connect(context.destination);
    // Keep the dry path in the chain so effect controls do not silence recording input.
    drive.connect(width);
    master.connect(recordDestination);

    this.nodes = { input, gate, highPass, eq, deEsser, compressor, drive, chorus, chorusLfo, delay, reverb, reverbWet, width, limiter, master, analyser, recordDestination, tracks };
    this.applyEffects(this.effects);
    await context.resume();
  }

  async connectMicrophone(deviceId?: string) {
    await this.initialize();
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("La captura de micrófono no está disponible en este navegador.");
    this.disconnectMicrophone();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    this.micSource = this.context!.createMediaStreamSource(this.stream);
    this.micSource.connect(this.nodes!.input);
    return this.stream.getAudioTracks().map(track => ({ id: track.id, label: track.label, settings: track.getSettings() }));
  }

  disconnectMicrophone() {
    this.micSource?.disconnect();
    this.micSource = null;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
  }

  setEffect(effect: DuckEffectId, rawValue: number) {
    this.effects = { ...this.effects, [effect]: clamp(rawValue) };
    this.applyEffects(this.effects);
  }

  private applyEffects(effects: DuckEffects) {
    if (!this.nodes || !this.context) return;
    const { currentTime } = this.context;
    const { gate, eq, deEsser, compressor, drive, chorus, delay, reverbWet, width, limiter } = this.nodes;
    gate.gain.setTargetAtTime(0.08 + effects.gate * 0.92, currentTime, 0.015);
    eq.gain.setTargetAtTime(-6 + effects.eq * 12, currentTime, 0.015);
    deEsser.gain.setTargetAtTime(-effects.deEsser * 14, currentTime, 0.015);
    compressor.threshold.setTargetAtTime(-10 - effects.compressor * 28, currentTime, 0.015);
    compressor.ratio.setTargetAtTime(1.5 + effects.compressor * 10, currentTime, 0.015);
    drive.curve = makeSaturationCurve(effects.drive);
    drive.oversample = "2x";
    chorus.delayTime.setTargetAtTime(0.008 + effects.chorus * 0.038, currentTime, 0.015);
    delay.delayTime.setTargetAtTime(0.1 + effects.delay * 0.66, currentTime, 0.015);
    reverbWet.gain.setTargetAtTime(effects.reverb * 0.68, currentTime, 0.015);
    width.pan.setTargetAtTime((effects.width - 0.5) * 1.4, currentTime, 0.015);
    limiter.threshold.setTargetAtTime(-0.4 - effects.limiter * 5.6, currentTime, 0.015);
  }

  startRecording() {
    if (!this.stream) throw new Error("Conecta un micrófono antes de grabar.");
    if (!window.MediaRecorder) throw new Error("MediaRecorder no está disponible en este navegador.");
    if (this.mediaRecorder?.state === "recording") return;
    this.recordingChunks = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
    this.mediaRecorder = new MediaRecorder(this.nodes!.recordDestination.stream, { mimeType });
    this.recordingStartedAt = performance.now();
    this.mediaRecorder.ondataavailable = event => { if (event.data.size) this.recordingChunks.push(event.data); };
    this.mediaRecorder.start(250);
  }

  stopRecording() {
    return new Promise<DuckRecording>((resolve, reject) => {
      const recorder = this.mediaRecorder;
      if (!recorder || recorder.state === "inactive") {
        reject(new Error("No hay una grabación activa."));
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(this.recordingChunks, { type: recorder.mimeType || "audio/webm" });
        resolve({ blob, durationMs: Math.round(performance.now() - this.recordingStartedAt), mimeType: blob.type });
      };
      recorder.stop();
    });
  }

  getMeter(): DuckMeter {
    if (!this.nodes) return { peak: 0, rms: 0, db: -96 };
    return getNodeMeter(this.nodes.analyser);
  }

  setTrackMix(track: DuckTrackId, gain: number, pan: number, tone: number, drive: number, compression: number) {
    if (!this.nodes || !this.context) return;
    const nodes = this.nodes.tracks[track];
    const now = this.context.currentTime;
    nodes.gain.gain.setTargetAtTime(clamp(gain), now, 0.012);
    nodes.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), now, 0.012);
    nodes.tone.frequency.setTargetAtTime(450 + clamp(tone) * 18500, now, 0.012);
    nodes.drive.curve = makeSaturationCurve(clamp(drive));
    nodes.compressor.threshold.setTargetAtTime(-5 - clamp(compression) * 30, now, 0.012);
    nodes.compressor.ratio.setTargetAtTime(1 + clamp(compression) * 10, now, 0.012);
  }

  getTrackMeter(track: DuckTrackId): DuckMeter {
    return this.nodes ? getNodeMeter(this.nodes.tracks[track].analyser) : { peak: 0, rms: 0, db: -96 };
  }

  getTrackInput(track: DuckTrackId) {
    return this.nodes?.tracks[track].input ?? this.nodes?.input;
  }

  scheduleSynthNote(midi: number, when: number, duration = 0.16, velocity = 0.78, pan = 0, destination?: AudioNode) {
    if (!this.context || !this.nodes) return;
    const oscillator = this.context.createOscillator();
    const amp = this.context.createGain();
    const panner = this.context.createStereoPanner();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(midiToFrequency(midi), when);
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.16), when + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(0.04, duration));
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    oscillator.connect(amp).connect(panner).connect(destination ?? this.nodes.input);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.03);
  }

  scheduleDrum(voice: "kick" | "snare" | "hat", when: number, velocity = 0.82, pan = 0, destination?: AudioNode) {
    if (!this.context || !this.nodes) return;
    const output = destination ?? this.nodes.input;
    if (voice === "kick") {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const panner = this.context.createStereoPanner();
      oscillator.frequency.setValueAtTime(145, when);
      oscillator.frequency.exponentialRampToValueAtTime(42, when + 0.11);
      gain.gain.setValueAtTime(Math.max(0.001, velocity * 0.48), when);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      oscillator.connect(gain).connect(panner).connect(output);
      oscillator.start(when); oscillator.stop(when + 0.2);
      return;
    }
    const buffer = this.context.createBuffer(1, Math.floor(this.context.sampleRate * (voice === "snare" ? 0.16 : 0.055)), this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    source.buffer = buffer;
    filter.type = voice === "snare" ? "bandpass" : "highpass";
    filter.frequency.value = voice === "snare" ? 1450 : 7200;
    gain.gain.setValueAtTime(Math.max(0.001, velocity * (voice === "snare" ? 0.2 : 0.09)), when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + (voice === "snare" ? 0.14 : 0.05));
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    source.connect(filter).connect(gain).connect(panner).connect(output);
    source.start(when); source.stop(when + 0.2);
  }

  async listAudioInputs() {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === "audioinput").map(device => ({ deviceId: device.deviceId, label: device.label || "Entrada de audio sin permiso" }));
  }

  async close() {
    this.disconnectMicrophone();
    this.nodes?.chorusLfo.stop();
    await this.context?.close();
    this.nodes = null;
    this.context = null;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
