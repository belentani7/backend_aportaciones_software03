import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DuckAudioEngine, type DuckEffectId, type DuckTrackId } from "@/lib/duck/audioEngine";
import { getScalePitchClasses, nearestScaleMidi, type DuckScale } from "@/lib/duck/musicTheory";
import { deleteDuckVocalPreset, exportDuckVocalPreset, loadDuckVocalPresets, saveDuckVocalPreset, type DuckVocalPreset } from "@/lib/duck/presetLibrary";
import { createDefaultDuckProject, exportDuckProject, loadDuckProject, normalizeDuckProject, saveDuckProject, type DuckLane, type DuckProject } from "@/lib/duck/project";
import { canRedoDuckProject, canUndoDuckProject, commitDuckProject, createDuckProjectHistory, redoDuckProject, undoDuckProject, type DuckProjectHistory } from "@/lib/duck/projectHistory";
import { DuckSequencer } from "@/lib/duck/sequencer";
import { addDuckTake, deleteDuckTake, listDuckTakes, type DuckTake } from "@/lib/duck/takeLibrary";
import { AudioLines, ChevronLeft, Circle, Database, Download, FileUp, Headphones, Keyboard, Mic2, Pause, Play, Redo2, Save, Settings2, SlidersHorizontal, Square, Trash2, Undo2, Volume2, Waves } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const EFFECT_LABELS: Record<DuckEffectId, string> = {
  gate: "Gate",
  eq: "EQ vocal",
  deEsser: "De-esser",
  compressor: "Compressor",
  drive: "Saturação",
  chorus: "Chorus",
  delay: "Delay",
  reverb: "Reverb",
  width: "Stereo width",
  limiter: "Limiter",
};

const PIANO_ROWS = [72, 71, 69, 67, 65, 64, 62, 60, 59, 57, 55, 53, 52, 50, 48];

function download(filename: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function Meter({ db }: { db: number }) {
  const normalized = Math.max(0, Math.min(100, (db + 60) / 60 * 100));
  return <div className="h-2 overflow-hidden rounded-full bg-black/45" aria-label={`Nivel master ${db.toFixed(1)} decibelios`}><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-300 to-amber-300 transition-[width] duration-100" style={{ width: `${normalized}%` }} /></div>;
}

function Knob({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="group flex min-w-0 flex-col items-center gap-2 rounded-xl border border-emerald-200/10 bg-black/20 p-3">
    <span className="text-center text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-50/60">{label}</span>
    <input aria-label={label} className="duck-range w-full accent-emerald-400" type="range" min="0" max="1" step="0.01" value={value} onChange={event => onChange(Number(event.target.value))} />
    <span className="font-mono text-[10px] text-emerald-300">{Math.round(value * 100)}%</span>
  </label>;
}

function StepButton({ active, current, lane, index, onToggle }: { active: boolean; current: boolean; lane: DuckLane; index: number; onToggle: () => void }) {
  return <button aria-label={`${lane.name}, paso ${index + 1}`} aria-pressed={active} onClick={onToggle} className={`aspect-square min-w-0 rounded-md border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${active ? "border-emerald-200/60 shadow-[0_0_18px_rgba(55,238,162,0.35)]" : "border-white/5 bg-white/[0.03] hover:bg-white/[0.1]"} ${current ? "ring-2 ring-lime-200 ring-offset-1 ring-offset-[#071911]" : ""}`} style={active ? { backgroundColor: lane.color, boxShadow: `0 0 17px ${lane.color}55` } : undefined} />;
}

export default function DuckStudio() {
  const [, setLocation] = useLocation();
  // Read browser storage only once so the initial project and undo history match.
  const [initialProject] = useState<DuckProject>(() => loadDuckProject());
  const [project, setProject] = useState<DuckProject>(initialProject);
  const [history, setHistory] = useState<DuckProjectHistory>(() => createDuckProjectHistory(initialProject));
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [engineState, setEngineState] = useState("OFFLINE");
  const [meterDb, setMeterDb] = useState(-96);
  const [trackMeters, setTrackMeters] = useState<Record<DuckTrackId, number>>({ kick: -96, snare: -96, hat: -96, bass: -96 });
  const [devices, setDevices] = useState<Array<{ deviceId: string; label: string }>>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [recording, setRecording] = useState(false);
  const [takes, setTakes] = useState<DuckTake[]>([]);
  const [midiStatus, setMidiStatus] = useState("MIDI aguardando");
  const [midiEvents, setMidiEvents] = useState<Array<{ id: string; message: string }>>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [presets, setPresets] = useState<DuckVocalPreset[]>(() => loadDuckVocalPresets());
  const [presetName, setPresetName] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const projectRef = useRef(project);
  const engineRef = useRef<DuckAudioEngine | null>(null);
  const sequencerRef = useRef<DuckSequencer | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  projectRef.current = project;

  const currentScale = useMemo(() => new Set(getScalePitchClasses(project.root, project.scale)), [project.root, project.scale]);

  useEffect(() => {
    const id = window.setTimeout(() => saveDuckProject(project), 180);
    return () => window.clearTimeout(id);
  }, [project]);

  useEffect(() => {
    void refreshTakes();
    return () => {
      sequencerRef.current?.stop();
      void engineRef.current?.close();
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const readMeter = () => {
      const engine = engineRef.current;
      if (engine) {
        setMeterDb(engine.getMeter().db);
        setTrackMeters({ kick: engine.getTrackMeter("kick").db, snare: engine.getTrackMeter("snare").db, hat: engine.getTrackMeter("hat").db, bass: engine.getTrackMeter("bass").db });
      }
      frame = window.requestAnimationFrame(readMeter);
    };
    frame = window.requestAnimationFrame(readMeter);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    project.lanes.forEach(lane => engine.setTrackMix(lane.id, lane.gain, lane.pan, lane.tone, lane.drive, lane.compression));
  }, [project.lanes]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // Preserve native keyboard activation and editing inside interactive controls.
      if (event.defaultPrevented || event.repeat || event.altKey || event.isComposing || event.key === "Process") return;
      if (target?.closest("input, textarea, select, button, a, summary, [role=button], [role=link], [role=menuitem], [role=slider], [role=tab], [role=checkbox], [role=switch], [contenteditable]")) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); saveLocalProject(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "e") { event.preventDefault(); saveProjectFile(); return; }
      // Preserve browser/OS modifiers while allowing Shift+? on keyboard layouts that need it.
      if (event.ctrlKey || event.metaKey) return;
      if (event.key === "?") { event.preventDefault(); setHelpOpen(open => !open); return; }
      if (event.shiftKey) return;
      if (event.key === " ") { event.preventDefault(); void togglePlayback(); return; }
      if (event.key.toLowerCase() === "r") { event.preventDefault(); void toggleRecording(); return; }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function refreshTakes() {
    try { setTakes(await listDuckTakes()); } catch { /* IndexedDB may be disabled; recording remains usable in the current session. */ }
  }

  function refreshPresets() {
    setPresets(loadDuckVocalPresets());
  }

  function logMidi(message: string) {
    setMidiEvents(previous => [{ id: crypto.randomUUID(), message }, ...previous].slice(0, 8));
  }

  function getEngine() {
    if (!engineRef.current) engineRef.current = new DuckAudioEngine();
    return engineRef.current;
  }

  function syncMixer(engine: DuckAudioEngine) {
    projectRef.current.lanes.forEach(lane => engine.setTrackMix(lane.id, lane.gain, lane.pan, lane.tone, lane.drive, lane.compression));
  }

  async function enableAudio() {
    try {
      const engine = getEngine();
      await engine.initialize();
      syncMixer(engine);
      setEngineState("AUDIO READY");
      const inputDevices = await engine.listAudioInputs();
      setDevices(inputDevices);
      if (!selectedDevice && inputDevices[0]) setSelectedDevice(inputDevices[0].deviceId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar el motor de audio.");
    }
  }

  async function connectMic() {
    try {
      const engine = getEngine();
      await engine.connectMicrophone(selectedDevice || undefined);
      setEngineState("MIC ONLINE");
      const inputDevices = await engine.listAudioInputs();
      setDevices(inputDevices);
      toast.success("Micrófono conectado a la cadena vocal local.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "El navegador rechazó el micrófono.");
    }
  }

  async function togglePlayback() {
    try {
      const engine = getEngine();
      await engine.initialize();
      syncMixer(engine);
      if (!sequencerRef.current) sequencerRef.current = new DuckSequencer();
      if (sequencerRef.current.isPlaying) {
        sequencerRef.current.stop();
        setIsPlaying(false);
        setActiveStep(-1);
      } else {
        sequencerRef.current.start(engine, () => projectRef.current, event => setActiveStep(event.step));
        setIsPlaying(true);
        setEngineState("PLAYING");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar la reproducción.");
    }
  }

  async function toggleRecording() {
    try {
      const engine = getEngine();
      if (!engine.hasMicrophone) {
        await connectMic();
        if (!engine.hasMicrophone) return;
      }
      if (engine.isRecording) {
        const capture = await engine.stopRecording();
        const take: DuckTake = { id: crypto.randomUUID(), name: `Voz ${new Date().toLocaleTimeString()}`, blob: capture.blob, durationMs: capture.durationMs, mimeType: capture.mimeType, createdAt: Date.now() };
        await addDuckTake(take);
        await refreshTakes();
        setRecording(false);
        toast.success("Toma guardada en la biblioteca local del navegador.");
      } else {
        engine.startRecording();
        setRecording(true);
        setEngineState("RECORDING");
      }
    } catch (error) {
      setRecording(false);
      toast.error(error instanceof Error ? error.message : "No se pudo completar la grabación.");
    }
  }

  async function connectMidi() {
    const midiNavigator = navigator as Navigator & { requestMIDIAccess?: () => Promise<{ inputs: Map<string, { name?: string | null; onmidimessage: ((event: { data: Uint8Array | null }) => void) | null }> }> };
    if (!midiNavigator.requestMIDIAccess) {
      setMidiStatus("Web MIDI no disponible");
      return;
    }
    try {
      const access = await midiNavigator.requestMIDIAccess();
      const inputs = Array.from(access.inputs.values());
      inputs.forEach(input => { input.onmidimessage = event => {
        const data = event.data;
        if (!data) return;
        const command = (data[0] ?? 0) >> 4;
        const note = data[1] ?? 0;
        const value = data[2] ?? 0;
        if (command === 9 && value > 0) {
          if (projectRef.current.midiMapping === "transport" && note === 36) {
            logMidi("NOTE 36 → transporte");
            void togglePlayback();
            return;
          }
          const target = projectRef.current.scaleAssist ? nearestScaleMidi(note, projectRef.current.root, projectRef.current.scale) : note;
          getEngine().scheduleSynthNote(target, getEngine().currentTime + 0.01, 0.4, value / 127, 0);
          logMidi(`NOTE ON ${note}${target !== note ? ` → ${target}` : ""} · vel ${value}`);
        } else if (command === 8 || (command === 9 && value === 0)) logMidi(`NOTE OFF ${note}`);
        else if (command === 11) logMidi(`CC ${note} · ${value}`);
        else if (command === 14) logMidi("PITCH BEND");
      }; });
      setMidiStatus(inputs.length ? `${inputs.length} controlador(es) MIDI online` : "No se detectó un controlador MIDI");
    } catch {
      setMidiStatus("Permiso MIDI rechazado");
    }
  }

  function applyProject(next: DuckProject, recordHistory = true) {
    projectRef.current = next;
    setProject(next);
    if (recordHistory) setHistory(previous => commitDuckProject(previous, next));
  }

  function updateProject(updater: (previous: DuckProject) => DuckProject) {
    applyProject({ ...updater(projectRef.current), updatedAt: Date.now() });
  }

  function restoreHistory(direction: "undo" | "redo") {
    const nextHistory = direction === "undo" ? undoDuckProject(history) : redoDuckProject(history);
    const restored = nextHistory.entries[nextHistory.index];
    if (!restored) return;
    setHistory(nextHistory);
    applyProject(restored, false);
    toast.success(direction === "undo" ? "Cambio deshecho." : "Cambio rehecho.");
  }

  function updateLane(laneId: DuckLane["id"], updater: (lane: DuckLane) => DuckLane) {
    updateProject(previous => ({ ...previous, lanes: previous.lanes.map(lane => lane.id === laneId ? updater(lane) : lane) }));
  }

  function togglePiano(midi: number, step: number) {
    updateProject(previous => {
      const targetMidi = previous.scaleAssist ? nearestScaleMidi(midi, previous.root, previous.scale) : midi;
      const match = previous.pianoNotes.find(note => note.midi === targetMidi && note.start === step);
      return match ? { ...previous, pianoNotes: previous.pianoNotes.filter(note => note.id !== match.id) } : { ...previous, pianoNotes: [...previous.pianoNotes, { id: crypto.randomUUID(), midi: targetMidi, start: step, length: 1, velocity: 0.76 }] };
    });
  }

  function updateEffect(effect: DuckEffectId, value: number) {
    getEngine().setEffect(effect, value);
    updateProject(previous => ({ ...previous, effects: { ...previous.effects, [effect]: value } }));
  }

  function saveProjectFile() {
    download(`${project.name.trim().replace(/\s+/g, "-").toLowerCase() || "duck-project"}.duck.json`, exportDuckProject(project), "application/json");
    toast.success("Proyecto exportado. Las tomas de audio se descargan desde la biblioteca.");
  }

  function saveLocalProject() {
    try {
      saveDuckProject(projectRef.current);
      toast.success("Proyecto guardado localmente en este navegador.");
    } catch {
      toast.error("No fue posible guardar el proyecto localmente.");
    }
  }

  function importProjectFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_000_000) { toast.error("El proyecto supera el límite de importación de 1 MB."); return; }
    const reader = new FileReader();
    reader.onerror = () => toast.error("No fue posible leer el archivo de proyecto.");
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result)) as { version?: unknown; lanes?: unknown };
        if (raw.version !== 1 || !Array.isArray(raw.lanes)) throw new Error("El archivo no contiene un proyecto Duck v1 válido.");
        applyProject({ ...normalizeDuckProject(raw), updatedAt: Date.now() });
        toast.success("Proyecto Duck importado y validado localmente.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "El JSON de proyecto no es válido.");
      } finally {
        if (importInputRef.current) importInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  function applyPreset(preset: DuckVocalPreset) {
    for (const [effect, value] of Object.entries(preset.effects) as Array<[DuckEffectId, number]>) getEngine().setEffect(effect, value);
    updateProject(previous => ({ ...previous, effects: { ...preset.effects } }));
    toast.success(`Preset “${preset.name}” aplicado.`);
  }

  function savePreset() {
    try {
      const preset = saveDuckVocalPreset(presetName, project.effects);
      setPresetName("");
      refreshPresets();
      toast.success(`Preset “${preset.name}” guardado localmente.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible guardar el preset.");
    }
  }

  return <DashboardLayout>
    <div className="min-h-screen pb-12 text-emerald-50">
      <header className="mb-6 flex flex-col gap-4 border-b border-emerald-200/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-3">
          <button onClick={() => setLocation("/")} className="mt-1 rounded-lg border border-emerald-100/10 p-2 text-emerald-100/65 transition hover:bg-emerald-100/10 hover:text-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300" aria-label="Volver a MUSIC OS"><ChevronLeft className="size-4" /></button>
          <div><div className="mb-2 flex items-center gap-2"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-300 text-[#04120b] shadow-[0_0_35px_rgba(52,237,157,0.34)]"><Waves className="size-5" /></span><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">DUCK STUDIO SUITE / LOCAL AUDIO</p><h1 className="text-3xl font-bold tracking-tight">Duck, que beat é esse?</h1></div></div><p className="max-w-2xl text-sm leading-6 text-emerald-50/55">Estúdio de voz e produção no navegador. O áudio, os projetos e as tomadas ficam no seu dispositivo até você decidir exportar.</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2"><input ref={importInputRef} className="hidden" type="file" accept="application/json,.json,.duck.json" onChange={event => importProjectFile(event.target.files?.[0])} /><Badge variant="outline" className="border-emerald-300/30 bg-emerald-300/5 font-mono text-[10px] text-emerald-200"><span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-300" />{engineState}</Badge><Button size="icon" variant="outline" aria-label="Desfazer" disabled={!canUndoDuckProject(history)} onClick={() => restoreHistory("undo")} className="border-emerald-200/15 text-emerald-100 hover:bg-emerald-200/10"><Undo2 className="size-4" /></Button><Button size="icon" variant="outline" aria-label="Refazer" disabled={!canRedoDuckProject(history)} onClick={() => restoreHistory("redo")} className="border-emerald-200/15 text-emerald-100 hover:bg-emerald-200/10"><Redo2 className="size-4" /></Button><Button size="icon" variant="outline" aria-label="Mostrar atalhos" onClick={() => setHelpOpen(open => !open)} className="border-emerald-200/15 text-emerald-100 hover:bg-emerald-200/10"><Keyboard className="size-4" /></Button><Button variant="outline" className="border-emerald-200/15 bg-emerald-200/5 text-emerald-100 hover:bg-emerald-200/10" onClick={() => void enableAudio()}><Headphones className="size-4" />Ativar áudio</Button><Button variant="outline" className="border-emerald-200/15 bg-emerald-200/5 text-emerald-100 hover:bg-emerald-200/10" onClick={() => importInputRef.current?.click()}><FileUp className="size-4" />Importar</Button><Button variant="outline" className="border-emerald-200/15 bg-emerald-200/5 text-emerald-100 hover:bg-emerald-200/10" onClick={saveLocalProject}><Save className="size-4" />Salvar local</Button><Button className="bg-emerald-300 text-[#062114] hover:bg-emerald-200" onClick={saveProjectFile}><Download className="size-4" />Exportar projeto</Button></div>
      </header>

      {helpOpen && <Card className="mb-5 border-emerald-200/15 bg-emerald-200/[0.04] text-emerald-50"><CardContent className="flex flex-wrap items-center gap-x-5 gap-y-2 p-3 text-xs text-emerald-50/70"><span><kbd className="rounded bg-black/30 px-1.5 py-0.5 font-mono">Espaço</kbd> tocar/parar</span><span><kbd className="rounded bg-black/30 px-1.5 py-0.5 font-mono">R</kbd> gravar</span><span><kbd className="rounded bg-black/30 px-1.5 py-0.5 font-mono">Ctrl/Cmd + S</kbd> salvar local</span><span><kbd className="rounded bg-black/30 px-1.5 py-0.5 font-mono">Ctrl/Cmd + E</kbd> exportar arquivo</span><span><kbd className="rounded bg-black/30 px-1.5 py-0.5 font-mono">?</kbd> alternar ajuda</span></CardContent></Card>}

      <main className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <Card className="overflow-hidden border-emerald-200/10 bg-[#071911]/90 text-emerald-50 shadow-2xl shadow-black/30"><CardHeader className="border-b border-emerald-200/10 bg-emerald-200/[0.025] pb-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">PATTERN / 16 STEPS</p><CardTitle className="mt-1 flex items-center gap-2 text-base"><AudioLines className="size-4 text-emerald-300" />Channel rack</CardTitle></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" className="border-emerald-200/15 bg-black/15 text-emerald-100 hover:bg-emerald-200/10" onClick={() => updateProject(previous => ({ ...previous, lanes: previous.lanes.map(lane => ({ ...lane, steps: lane.steps.map(() => false) })), pianoNotes: [] }))}><Square className="size-3.5" />Limpar</Button><Button size="sm" className={isPlaying ? "bg-lime-200 text-[#082114] hover:bg-lime-100" : "bg-emerald-300 text-[#082114] hover:bg-emerald-200"} onClick={() => void togglePlayback()}>{isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}{isPlaying ? "Parar" : "Tocar"}</Button></div></div></CardHeader><CardContent className="space-y-3 p-4">{project.lanes.map(lane => <div key={lane.id} className="grid gap-2 rounded-xl border border-white/[0.055] bg-black/20 p-2.5 sm:grid-cols-[128px_minmax(0,1fr)]"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold" style={{ color: lane.color }}>{lane.name}</p><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-50/35">MIDI {lane.midi}</p></div><div className="flex gap-1"><button aria-label={`Silenciar ${lane.name}`} aria-pressed={lane.muted} onClick={() => updateLane(lane.id, current => ({ ...current, muted: !current.muted }))} className={`rounded px-1.5 py-1 text-[10px] font-bold ${lane.muted ? "bg-rose-400/20 text-rose-200" : "bg-white/[0.05] text-emerald-50/55"}`}>M</button><button aria-label={`Solo ${lane.name}`} aria-pressed={lane.solo} onClick={() => updateLane(lane.id, current => ({ ...current, solo: !current.solo }))} className={`rounded px-1.5 py-1 text-[10px] font-bold ${lane.solo ? "bg-lime-200/20 text-lime-100" : "bg-white/[0.05] text-emerald-50/55"}`}>S</button></div></div><div className="grid grid-cols-8 gap-1.5 sm:grid-cols-16">{lane.steps.map((active, index) => <StepButton key={index} active={active} current={activeStep === index} lane={lane} index={index} onToggle={() => updateLane(lane.id, current => ({ ...current, steps: current.steps.map((step, stepIndex) => stepIndex === index ? !step : step) }))} />)}</div></div>)}</CardContent></Card>
            <Card className="border-emerald-200/10 bg-[#0a1e15]/90 text-emerald-50"><CardHeader className="pb-3"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">TRANSPORT</p><CardTitle className="mt-1 flex items-center gap-2 text-base"><SlidersHorizontal className="size-4 text-emerald-300" />Groove</CardTitle></CardHeader><CardContent className="space-y-5"><div><Label htmlFor="duck-name" className="text-xs text-emerald-50/60">Nome do projeto</Label><Input id="duck-name" value={project.name} onChange={event => updateProject(previous => ({ ...previous, name: event.target.value }))} className="mt-2 border-emerald-100/10 bg-black/20 text-emerald-50" /></div><div className="grid grid-cols-2 gap-3"><div><Label className="text-xs text-emerald-50/60">BPM</Label><Input type="number" min="40" max="240" value={project.bpm} onChange={event => updateProject(previous => ({ ...previous, bpm: Math.max(40, Math.min(240, Number(event.target.value) || 40)) }))} className="mt-2 border-emerald-100/10 bg-black/20 text-emerald-50" /></div><div><Label className="text-xs text-emerald-50/60">Swing</Label><input aria-label="Swing" className="mt-3 w-full accent-lime-200" type="range" min="0" max="0.5" step="0.01" value={project.swing} onChange={event => updateProject(previous => ({ ...previous, swing: Number(event.target.value) }))} /><p className="mt-1 text-right font-mono text-[10px] text-emerald-300">{Math.round(project.swing * 100)}%</p></div></div><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="duck-root" className="text-xs text-emerald-50/60">Tonalidade</Label><select id="duck-root" className="mt-2 h-9 w-full rounded-md border border-emerald-100/10 bg-black/20 px-3 text-sm text-emerald-50" value={project.root} onChange={event => updateProject(previous => ({ ...previous, root: event.target.value }))}>{["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(root => <option key={root}>{root}</option>)}</select></div><div><Label htmlFor="duck-scale" className="text-xs text-emerald-50/60">Escala</Label><select id="duck-scale" className="mt-2 h-9 w-full rounded-md border border-emerald-100/10 bg-black/20 px-3 text-sm text-emerald-50" value={project.scale} onChange={event => updateProject(previous => ({ ...previous, scale: event.target.value as DuckScale }))}>{(["minor", "major", "pentatonic", "blues", "chromatic"] as DuckScale[]).map(scale => <option key={scale} value={scale}>{scale}</option>)}</select></div></div><div><div className="mb-2 flex justify-between text-xs text-emerald-50/60"><span>Master</span><span className="font-mono text-emerald-200">{meterDb.toFixed(1)} dB</span></div><Meter db={meterDb} /></div></CardContent></Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border-emerald-200/10 bg-[#071911]/90 text-emerald-50"><CardHeader className="border-b border-emerald-200/10 pb-4"><div className="flex items-center justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">PIANO ROLL / SCALE GUIDED</p><CardTitle className="mt-1 flex items-center gap-2 text-base"><Waves className="size-4 text-emerald-300" />Notas e velocidade</CardTitle></div><Badge variant="outline" className="border-emerald-200/20 font-mono text-[10px] text-emerald-200">{project.root} {project.scale}</Badge></div></CardHeader><CardContent className="overflow-x-auto p-4"><div className="min-w-[630px] overflow-hidden rounded-xl border border-white/[0.06] bg-black/30">{PIANO_ROWS.map(midi => <div key={midi} className="grid grid-cols-[55px_repeat(16,minmax(0,1fr))] border-b border-white/[0.045] last:border-b-0"><div className={`flex items-center px-2 font-mono text-[10px] ${currentScale.has(midi % 12) ? "bg-emerald-300/10 text-emerald-100" : "bg-white/[0.025] text-emerald-50/35"}`}>{midi}</div>{Array.from({ length: 16 }, (_, step) => { const note = project.pianoNotes.find(item => item.midi === midi && item.start === step); return <button key={step} onClick={() => { togglePiano(midi, step); setSelectedNote(note?.id ?? null); }} aria-label={`MIDI ${midi}, passo ${step + 1}`} className={`h-7 border-l border-white/[0.04] transition ${note ? "bg-emerald-300 shadow-[inset_0_0_12px_rgba(232,255,122,0.3)]" : currentScale.has(midi % 12) ? "bg-emerald-100/[0.025] hover:bg-emerald-100/[0.10]" : "hover:bg-white/[0.06]"} ${activeStep === step ? "ring-1 ring-inset ring-lime-200/70" : ""}`} />; })}</div>)}</div>{selectedNote && <div className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-200/10 bg-black/20 p-3 text-xs"><span className="text-emerald-50/55">Nota selecionada</span><input aria-label="Velocidade da nota selecionada" className="flex-1 accent-lime-200" type="range" min="0.1" max="1" step="0.01" value={project.pianoNotes.find(note => note.id === selectedNote)?.velocity ?? 0.76} onChange={event => updateProject(previous => ({ ...previous, pianoNotes: previous.pianoNotes.map(note => note.id === selectedNote ? { ...note, velocity: Number(event.target.value) } : note) }))} /><button onClick={() => { updateProject(previous => ({ ...previous, pianoNotes: previous.pianoNotes.filter(note => note.id !== selectedNote) })); setSelectedNote(null); }} className="text-rose-200 hover:text-rose-100">Excluir</button></div>}</CardContent></Card>
            <Card className="border-emerald-200/10 bg-[#0a1e15]/90 text-emerald-50"><CardHeader className="pb-3"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">MIXER / CHANNEL STRIPS</p><CardTitle className="mt-1 flex items-center gap-2 text-base"><Volume2 className="size-4 text-emerald-300" />Mixagem</CardTitle></CardHeader><CardContent className="space-y-3">{project.lanes.map(lane => <div key={lane.id} className="rounded-xl border border-white/[0.06] bg-black/20 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold" style={{ color: lane.color }}>{lane.name}</span><span className="font-mono text-[10px] text-emerald-50/45">{Math.round(lane.gain * 100)}% · {trackMeters[lane.id].toFixed(1)} dB</span></div><Meter db={trackMeters[lane.id]} /><input aria-label={`Ganancia ${lane.name}`} className="mt-2 w-full accent-emerald-300" type="range" min="0" max="1" step="0.01" value={lane.gain} onChange={event => updateLane(lane.id, current => ({ ...current, gain: Number(event.target.value) }))} /><div className="mt-2 flex items-center justify-between text-[10px] text-emerald-50/45"><span>TONE</span><input aria-label={`Tono ${lane.name}`} className="w-24 accent-cyan-200" type="range" min="0" max="1" step="0.01" value={lane.tone} onChange={event => updateLane(lane.id, current => ({ ...current, tone: Number(event.target.value) }))} /><span>{Math.round(lane.tone * 100)}%</span></div><div className="mt-2 flex items-center justify-between text-[10px] text-emerald-50/45"><span>DRIVE</span><input aria-label={`Drive ${lane.name}`} className="w-24 accent-amber-200" type="range" min="0" max="1" step="0.01" value={lane.drive} onChange={event => updateLane(lane.id, current => ({ ...current, drive: Number(event.target.value) }))} /><span>{Math.round(lane.drive * 100)}%</span></div><div className="mt-2 flex items-center justify-between text-[10px] text-emerald-50/45"><span>COMP</span><input aria-label={`Compresión ${lane.name}`} className="w-24 accent-violet-200" type="range" min="0" max="1" step="0.01" value={lane.compression} onChange={event => updateLane(lane.id, current => ({ ...current, compression: Number(event.target.value) }))} /><span>{Math.round(lane.compression * 100)}%</span></div><div className="mt-2 flex items-center justify-between text-[10px] text-emerald-50/45"><span>PAN</span><input aria-label={`Panorama ${lane.name}`} className="w-28 accent-lime-200" type="range" min="-1" max="1" step="0.01" value={lane.pan} onChange={event => updateLane(lane.id, current => ({ ...current, pan: Number(event.target.value) }))} /><span>{lane.pan > 0 ? "R" : lane.pan < 0 ? "L" : "C"}</span></div></div>)}</CardContent></Card>
          </section>
        </div>

        <aside className="space-y-5">
            <Card className="border-emerald-200/10 bg-[#0a1e15]/90 text-emerald-50"><CardHeader className="pb-3"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">VOICE LAB / LIVE CHAIN</p><CardTitle className="mt-1 flex items-center gap-2 text-base"><Mic2 className="size-4 text-emerald-300" />Gravador vocal</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-[1fr_auto] gap-2"><select aria-label="Entrada de microfone" value={selectedDevice} onChange={event => setSelectedDevice(event.target.value)} className="h-9 min-w-0 rounded-md border border-emerald-100/10 bg-black/20 px-2 text-xs text-emerald-50">{devices.length ? devices.map(device => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>) : <option value="">Ative o áudio para listar entradas</option>}</select><Button size="sm" variant="outline" onClick={() => void connectMic()} className="border-emerald-200/15 text-emerald-100 hover:bg-emerald-200/10">Conectar</Button></div><Button className={`w-full ${recording ? "bg-rose-400 text-white hover:bg-rose-300" : "bg-emerald-300 text-[#082114] hover:bg-emerald-200"}`} onClick={() => void toggleRecording()}>{recording ? <Square className="size-4" /> : <Circle className="size-4" />}{recording ? "Parar e salvar tomada" : "Gravar tomada"}</Button><p className="text-[11px] leading-5 text-emerald-50/48">Não envia o seu microfone a um servidor. A tomada guarda a saída processada da cadeia local desta aba.</p></CardContent></Card>

          <Card className="border-emerald-200/10 bg-[#071911]/90 text-emerald-50"><CardHeader className="pb-3"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">EFFECTS / WEB AUDIO</p><CardTitle className="mt-1 flex items-center gap-2 text-base"><Settings2 className="size-4 text-emerald-300" />Cadeia vocal</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2">{(Object.keys(EFFECT_LABELS) as DuckEffectId[]).map(effect => <Knob key={effect} label={EFFECT_LABELS[effect]} value={project.effects[effect]} onChange={value => updateEffect(effect, value)} />)}</CardContent></Card>

          <Card className="border-emerald-200/10 bg-[#0a1e15]/90 text-emerald-50"><CardHeader className="pb-3"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">SCALE ASSIST / OPTIONAL</p><CardTitle className="mt-1 text-base">Guia tonal</CardTitle></CardHeader><CardContent className="space-y-3"><button aria-pressed={project.scaleAssist} onClick={() => updateProject(previous => ({ ...previous, scaleAssist: !previous.scaleAssist }))} className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold transition ${project.scaleAssist ? "border-lime-200/40 bg-lime-200/10 text-lime-100" : "border-emerald-200/15 bg-black/20 text-emerald-50/55"}`}>Scale Assist {project.scaleAssist ? "ativo" : "desativado"}</button><p className="text-[11px] leading-5 text-emerald-50/48">Quando ativo, notas adicionadas e MIDI recebido são movidos para a nota mais próxima de {project.root} {project.scale}. Não altera a afinação do microfone.</p></CardContent></Card>

          <Card className="border-emerald-200/10 bg-[#0a1e15]/90 text-emerald-50"><CardHeader className="pb-3"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">PRESETS / LOCAL</p><CardTitle className="mt-1 text-base">Presets vocais</CardTitle></CardHeader><CardContent className="space-y-2"><div className="flex gap-2"><Input aria-label="Nome do preset" value={presetName} onChange={event => setPresetName(event.target.value)} placeholder="Novo preset" className="h-8 border-emerald-200/10 bg-black/20 text-xs text-emerald-50" /><Button size="sm" onClick={savePreset} className="bg-emerald-300 text-[#082114] hover:bg-emerald-200">Salvar</Button></div><div className="max-h-48 space-y-1 overflow-auto pr-1">{presets.map(preset => <div key={preset.id} className="flex items-center gap-1 rounded-lg border border-white/[0.05] bg-black/20 p-1.5"><button onClick={() => applyPreset(preset)} className="min-w-0 flex-1 truncate px-1 text-left text-xs text-emerald-100 hover:text-lime-100">{preset.name}</button><button aria-label={`Exportar ${preset.name}`} onClick={() => download(`${preset.name.replace(/\s+/g, "-").toLowerCase()}.duck-preset.json`, exportDuckVocalPreset(preset), "application/json")} className="rounded p-1 text-emerald-200 hover:bg-emerald-200/10"><Download className="size-3" /></button>{!preset.builtIn && <button aria-label={`Excluir ${preset.name}`} onClick={() => { deleteDuckVocalPreset(preset.id); refreshPresets(); }} className="rounded p-1 text-rose-200 hover:bg-rose-300/10"><Trash2 className="size-3" /></button>}</div>)}</div></CardContent></Card>

          <Card className="border-emerald-200/10 bg-[#0a1e15]/90 text-emerald-50"><CardHeader className="pb-3"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">MIDI / HARDWARE</p><CardTitle className="mt-1 flex items-center gap-2 text-base"><SlidersHorizontal className="size-4 text-emerald-300" />Controladores</CardTitle></CardHeader><CardContent className="space-y-3"><Button variant="outline" onClick={() => void connectMidi()} className="w-full border-emerald-200/15 text-emerald-100 hover:bg-emerald-200/10">Conectar Web MIDI</Button><select aria-label="Mapeamento MIDI" value={project.midiMapping} onChange={event => updateProject(previous => ({ ...previous, midiMapping: event.target.value === "transport" ? "transport" : "none" }))} className="h-8 w-full rounded-md border border-emerald-100/10 bg-black/20 px-2 text-xs text-emerald-50"><option value="transport">Nota MIDI 36 → tocar/parar</option><option value="none">Sem mapeamento</option></select><p className="text-xs leading-5 text-emerald-50/48">{midiStatus}</p><div aria-live="polite" className="max-h-28 space-y-1 overflow-auto rounded-lg border border-white/[0.06] bg-black/20 p-2 font-mono text-[9px] text-emerald-100/60">{midiEvents.length ? midiEvents.map(event => <p key={event.id}>{event.message}</p>) : <p>Monitor sem eventos.</p>}</div></CardContent></Card>

          <Card className="border-emerald-200/10 bg-[#071911]/90 text-emerald-50"><CardHeader className="pb-3"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">LOCAL LIBRARY / INDEXEDDB</p><CardTitle className="mt-1 flex items-center gap-2 text-base"><Database className="size-4 text-emerald-300" />Tomadas</CardTitle></CardHeader><CardContent className="space-y-2">{takes.length ? takes.map(take => <div key={take.id} className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-medium">{take.name}</p><p className="font-mono text-[9px] text-emerald-50/38">{(take.durationMs / 1000).toFixed(1)}s · {take.mimeType || "audio"}</p></div><div className="flex gap-1"><button aria-label={`Baixar ${take.name}`} onClick={() => download(`${take.name.replace(/\s+/g, "-")}.webm`, take.blob, take.mimeType)} className="rounded p-1.5 text-emerald-200 hover:bg-emerald-200/10"><Download className="size-3.5" /></button><button aria-label={`Excluir ${take.name}`} onClick={() => void deleteDuckTake(take.id).then(refreshTakes)} className="rounded p-1.5 text-rose-200 hover:bg-rose-300/10"><Trash2 className="size-3.5" /></button></div></div></div>) : <p className="rounded-lg border border-dashed border-emerald-200/12 p-4 text-center text-xs leading-5 text-emerald-50/42">Sem tomadas guardadas. Conecte um microfone e grave a primeira voz.</p>}</CardContent></Card>

          <Card className="border-emerald-200/10 bg-black/20 text-emerald-50"><CardContent className="p-4"><p className="mb-1 text-xs font-semibold text-emerald-200">Limites transparentes</p><p className="text-[11px] leading-5 text-emerald-50/45">Duck usa nós nativos do Web Audio e não carrega plugins proprietários de outros DAWs. A assistência tonal é guiada por escala, não uma emulação de autotune comercial.</p></CardContent></Card>
        </aside>
      </main>
    </div>
  </DashboardLayout>;
}
