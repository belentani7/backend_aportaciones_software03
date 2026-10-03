import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Activity, AudioLines, Check, ChevronDown, Database, Download, FileJson, FileText, Gauge, GitBranch, History, Loader2, LockKeyhole, Mic2, Music2, Play, Power, Radio, RefreshCw, Server, ShieldCheck, Sparkles, Terminal, WandSparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type MusicIRView = {
  metadata: { title: string; artist: string; version: string };
  concept: { core_idea: string; autonomous: boolean };
  musical: { key: string; bpm: number; meter: string; sections: string[] };
  lyrics: { language: string; content: Record<string, string>; phonetic_guidance: Record<string, string>; prosody: { score: number; global: string; sections: Record<string, { syllables: number; lines: number; meanSyllables: number; accentCoverage: number; cantability: number; notes: string }> } };
  harmony: { chords: Record<string, string[]>; progression_notes: string };
  arrangement: { roles_per_section: Record<string, string[]>; dynamics_curve: Record<string, number>; space: Record<string, string> };
  production: { interpretation: string; vocal_delivery: string };
  evaluation: { score: number; feedback: string[]; phonetic_score: number; harmony_score: number; structure_score: number; prosody_score: number };
  model: { provider: string; name: string; mode: string };
  pipeline: Array<{ name: string; status: string; progress: number; message: string }>;
  history: Array<{ agent: string; action: string; timestamp: string }>;
};

type GeneratedComposition = { id: number | null; createdAt: Date; musicIr: MusicIRView; midiBase64: string };
type ArchiveItem = { id: number; title: string; createdAt: Date | string; provider: string; model: string; musicIr: MusicIRView };
type LoreNodeView = { id: string; kind: string; name: string; description: string; season: number; degree: number };
type LoreRelationView = { sourceId: string; targetId: string; relationType: string };

const stages = ["Planner", "Compositor", "Productor", "Evaluador"];
const styles = ["Lady Gaga", "The Smiths", "Anitta", "Nathy Peluso"];
const languages = ["Español", "Portugués", "Inglés", "Catalán", "Francés"];
const keys = ["Am", "C", "Dm", "Em", "F", "G", "Bm", "Fm", "Bb", "Eb"];

function downloadText(filename: string, content: string, mime = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadMidi(filename: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "audio/midi" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SectionBlock({ section, ir }: { section: string; ir: MusicIRView }) {
  const chords = ir.harmony.chords[section] ?? [];
  const lyrics = ir.lyrics.content[section] ?? "";
  const dynamic = ir.arrangement.dynamics_curve[section] ?? 0;
  return (
    <details className="group rounded-xl border border-border/70 bg-background/30 open:bg-background/60">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
        <span className="flex items-center gap-3 text-sm font-semibold"><ChevronDown className="size-4 text-primary transition-transform group-open:rotate-180" />{section}</span>
        <span className="console-font text-xs text-primary">ENERGY_{dynamic}%</span>
      </summary>
      <div className="grid gap-4 border-t border-border/60 px-4 py-4 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Armonía extendida</p>
          <div className="flex flex-wrap gap-2">{chords.map(chord => <Badge key={chord} variant="outline" className="console-font border-primary/40 text-primary">{chord.replace("sharp", "#")}</Badge>)}</div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">{ir.arrangement.space[section] ?? "Espacio no definido"}</p>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Letra nativa</p>
          <p className="whitespace-pre-line text-sm leading-7 text-foreground/90">{lyrics}</p>
        </div>
      </div>
    </details>
  );
}

function PipelineRail({ activeIndex, isRunning, completed }: { activeIndex: number; isRunning: boolean; completed: boolean }) {
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {stages.map((stage, index) => {
        const isComplete = completed || index < activeIndex;
        const isActive = isRunning && index === activeIndex;
        return <div key={stage} className={`relative rounded-xl border p-3 transition-colors ${isActive ? "border-primary bg-primary/10" : isComplete ? "border-primary/40 bg-primary/5" : "border-border/70 bg-background/30"}`}>
          <div className="mb-2 flex items-center justify-between"><span className="console-font text-[10px] uppercase tracking-[0.16em] text-muted-foreground">0{index + 1}</span>{isComplete ? <Check className="size-4 text-primary" /> : isActive ? <Loader2 className="size-4 animate-spin text-primary" /> : <span className="size-2 rounded-full bg-muted-foreground/30" />}</div>
          <p className="text-sm font-semibold">{stage}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{isComplete ? "Completado" : isActive ? "Procesando..." : "En espera"}</p>
        </div>;
      })}
    </div>
  );
}

export default function Home() {
  const [theme, setTheme] = useState("");
  const [language, setLanguage] = useState("Español");
  const [selectedStyles, setSelectedStyles] = useState(["The Smiths", "Nathy Peluso"]);
  const [bpm, setBpm] = useState(105);
  const [key, setKey] = useState("Am");
  const [provider, setProvider] = useState("local");
  const [model, setModel] = useState("deterministic-kernel");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<GeneratedComposition | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [activeLoreNodeId, setActiveLoreNodeId] = useState<string | null>(null);

  const prepare = trpc.composition.prepare.useMutation();
  const run = trpc.composition.run.useMutation();
  const history = trpc.composition.list.useQuery(undefined, { staleTime: 20_000 });
  const organism = trpc.organism.status.useQuery(undefined, { staleTime: 10_000, refetchInterval: 20_000 });
  const lore = trpc.organism.lore.useQuery(undefined, { staleTime: 20_000 });
  const setKillSwitch = trpc.organism.setKillSwitch.useMutation({
    onSuccess: () => { organism.refetch(); toast.success("Estado operativo actualizado en el backend."); },
    onError: error => toast.error(error.message),
  });
  const historical = trpc.composition.get.useQuery({ id: selectedHistoryId ?? 0 }, { enabled: selectedHistoryId !== null });
  const [jobId, setJobId] = useState<string | null>(null);
  const jobStatus = trpc.composition.status.useQuery({ jobId: jobId ?? "pending-job" }, {
    enabled: Boolean(jobId),
    refetchInterval: query => {
      const status = query.state.data?.status;
      return status === "complete" || status === "error" ? false : 700;
    },
  });
  const isRunning = prepare.isPending || run.isPending || jobStatus.data?.status === "queued" || jobStatus.data?.status === "running";

  useEffect(() => {
    const liveStages = jobStatus.data?.stages;
    if (!liveStages) return;
    const current = liveStages.findIndex(stage => stage.status === "active");
    setActiveIndex(current >= 0 ? current : liveStages.every(stage => stage.status === "complete") ? stages.length : 0);
  }, [jobStatus.data?.stages]);

  useEffect(() => {
    const result = jobStatus.data?.result;
    if (jobStatus.data?.status === "complete" && result) {
      setSelected(result as GeneratedComposition);
      setSelectedHistoryId(null);
      history.refetch();
    }
  }, [jobStatus.data?.status, jobStatus.data?.result, history]);

  useEffect(() => {
    if (historical.data) setSelected(historical.data as GeneratedComposition);
  }, [historical.data]);

  const ir = selected?.musicIr;
  const activeLoreNode = (lore.data?.nodes as LoreNodeView[] | undefined)?.find(node => node.id === activeLoreNodeId) ?? null;
  const liveHistory = jobStatus.data?.history ?? ir?.history ?? [];
  const scoreColor = useMemo(() => ir && ir.evaluation.score >= 80 ? "text-primary" : "text-amber-300", [ir]);

  const toggleStyle = (style: string) => setSelectedStyles(current => current.includes(style) ? current.filter(item => item !== style) : [...current, style]);
  const runPipeline = async () => {
    if (selectedStyles.length === 0) {
      toast.error("Selecciona al menos un ADN artístico.");
      return;
    }
    setSelected(null);
    setSelectedHistoryId(null);
    try {
      const prepared = await prepare.mutateAsync({ theme: theme.trim() || undefined, language: language as never, styles: selectedStyles, bpm, key, provider: provider as never, model: model.trim() || undefined });
      setJobId(prepared.jobId);
      await run.mutateAsync({ jobId: prepared.jobId });
      toast.success("Gemelo Digital generado y guardado en tu historial.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo ejecutar el pipeline.");
    }
  };

  const exportJson = () => ir && downloadText(`${ir.metadata.title.replace(/\s+/g, "_")}.json`, JSON.stringify(ir, null, 2), "application/json");
  const exportTxt = () => ir && downloadText(`${ir.metadata.title.replace(/\s+/g, "_")}.txt`, [
    `TÍTULO: ${ir.metadata.title}`, `IDIOMA: ${ir.lyrics.language}`, `TONALIDAD: ${ir.musical.key}`, `BPM: ${ir.musical.bpm}`, "", ...ir.musical.sections.flatMap(section => [`[${section}] · ${ir.arrangement.dynamics_curve[section] ?? 0}%`, `ACORDES: ${(ir.harmony.chords[section] ?? []).join(" | ")}`, ir.lyrics.content[section] ?? "", ""]),
  ].join("\n"));

  return <DashboardLayout>
    <div className="min-h-screen bg-transparent pb-12">
      <header className="mb-6 flex flex-col gap-4 border-b border-border/70 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_30px_rgba(29,185,84,0.28)]"><Music2 className="size-5" /></div><div><p className="console-font text-[10px] uppercase tracking-[0.28em] text-primary">MUSIC OS / KERNEL 1.1</p><h1 className="text-3xl font-bold tracking-tight">Cockpit de composición autónoma</h1></div></div>
          <p className="max-w-2xl text-sm text-muted-foreground">Un entorno de composición por agentes que convierte intención, prosodia y teoría armónica en un Gemelo Digital auditable.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><a href="/duck" className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-primary transition hover:bg-primary/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Mic2 className="size-3.5" />Abrir Duck Studio</a><div className="flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-primary"><span className="size-2 animate-pulse rounded-full bg-primary" />Sistema operativo · {provider === "local" ? "modo local" : provider === "ollama" ? "Ollama local" : "capa online"}</div></div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
        <aside className="space-y-4">
          <Card className="border-primary/20 bg-card/80 shadow-2xl shadow-black/20"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Gauge className="size-4 text-primary" />Director de proyecto</CardTitle><p className="text-xs text-muted-foreground">Todos los parámetros son ajustables; el concepto central es opcional.</p></CardHeader><CardContent className="space-y-5">
            <div className="space-y-2"><Label htmlFor="theme">Concepto central <span className="text-muted-foreground">(opcional)</span></Label><Textarea id="theme" value={theme} onChange={event => setTheme(event.target.value)} placeholder="Déjalo vacío para composición autónoma..." className="min-h-24 resize-y bg-background/50" /></div>
            <div className="space-y-2"><Label>Idioma nativo</Label><Select value={language} onValueChange={setLanguage}><SelectTrigger className="w-full bg-background/50"><SelectValue /></SelectTrigger><SelectContent>{languages.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>ADN artístico · fusión</Label><div className="grid grid-cols-2 gap-2">{styles.map(style => <button type="button" key={style} onClick={() => toggleStyle(style)} className={`rounded-lg border px-2 py-2 text-left text-[11px] transition-colors ${selectedStyles.includes(style) ? "border-primary bg-primary/10 text-primary" : "border-border/70 text-muted-foreground hover:border-primary/50"}`}><span className="flex items-center justify-between gap-1">{style}{selectedStyles.includes(style) ? <Check className="size-3" /> : <PlusMark />}</span></button>)}</div></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="bpm">BPM</Label><span className="console-font text-sm text-primary">{bpm}</span></div><input id="bpm" type="range" min="40" max="240" value={bpm} onChange={event => setBpm(Number(event.target.value))} className="w-full accent-[oklch(0.65_0.18_145)]" /></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Tonalidad</Label><Select value={key} onValueChange={setKey}><SelectTrigger className="w-full bg-background/50"><SelectValue /></SelectTrigger><SelectContent>{keys.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Motor</Label><Select value={provider} onValueChange={value => { setProvider(value); setModel(value === "local" ? "deterministic-kernel" : value === "ollama" ? "qwen2.5:7b" : "gpt-5-mini"); }}><SelectTrigger className="w-full bg-background/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="local">Kernel local</SelectItem><SelectItem value="ollama">Ollama local</SelectItem><SelectItem value="forge">Proxy online</SelectItem></SelectContent></Select></div></div>
            <div className="space-y-2"><Label htmlFor="model">Modelo / perfil</Label><Input id="model" value={model} onChange={event => setModel(event.target.value)} className="bg-background/50 console-font text-xs" /><p className="text-[10px] leading-4 text-muted-foreground">Local no requiere API. Online usa el proxy seguro del servidor.</p></div>
            <Button className="w-full gap-2 shadow-lg shadow-primary/10" size="lg" onClick={runPipeline} disabled={isRunning}><span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/15">{isRunning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />}</span>{isRunning ? "Ejecutando agentes..." : "Ejecutar pipeline"}</Button>
          </CardContent></Card>
          <Card className="border-border/70 bg-card/50"><CardContent className="flex gap-3 p-4 text-xs text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" /><p>Las composiciones se guardan con aislamiento por usuario. Las claves no pasan al navegador.</p></CardContent></Card>
        </aside>

        <main className="min-w-0 space-y-6">
          <section><div className="mb-3 flex items-center justify-between"><div><p className="console-font text-[10px] uppercase tracking-[0.22em] text-primary">EVENT BUS / PIPELINE</p><h2 className="text-lg font-semibold">Orquestación multi-agente</h2></div><Badge variant="outline" className="console-font border-primary/30 text-primary">{isRunning ? "RUNNING" : ir ? "READY" : "IDLE"}</Badge></div><PipelineRail activeIndex={activeIndex} isRunning={isRunning} completed={Boolean(ir && !isRunning)} />{jobId && <div className="mt-3 flex items-center gap-3"><Progress value={jobStatus.data?.progress ?? 0} className="h-1.5 flex-1 bg-muted" /><span className="console-font w-12 text-right text-xs text-primary">{jobStatus.data?.progress ?? 0}%</span></div>}</section>

          <section aria-label="Máquina operativa"><Card className="border-primary/25 bg-card/75 shadow-xl shadow-black/20"><CardHeader className="pb-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="console-font text-[10px] uppercase tracking-[0.22em] text-primary">MACHINE / CONTROL PLANE</p><CardTitle className="mt-1 flex items-center gap-2 text-base"><Server className="size-4 text-primary" />Motor operativo conectado</CardTitle><p className="mt-1 text-xs text-muted-foreground">Estado, archivo y lore consultados desde el backend persistente.</p></div><Badge variant="outline" className={organism.data?.governance.status === "active" ? "border-primary/30 text-primary" : "border-amber-400/40 text-amber-300"}>{organism.isLoading ? "SYNC…" : organism.data?.governance.status?.toUpperCase() ?? "OFFLINE"}</Badge></div></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-3 gap-2"><Metric label="Lore" value={`${organism.data?.lore.nodeCount ?? 0} nodos`} icon={<GitBranch className="size-4" />} /><Metric label="Huérfanos" value={`${organism.data?.lore.orphanIds.length ?? 0}`} icon={<Database className="size-4" />} /><Metric label="Coste" value={`$${organism.data?.economics.dailyGenCost ?? 0}/día`} icon={<Activity className="size-4" />} /></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/30 p-3 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" /><span>Constitución {organism.data?.governance.constitutionVersion ?? "—"}; filtro de seguridad {organism.data?.governance.nsfwFilterActive ? "activo" : "inactivo"}.</span></div><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" disabled={setKillSwitch.isPending} onClick={() => setKillSwitch.mutate({ status: "paused_production" })}><Power className="size-3.5" />Pausar</Button><Button size="sm" disabled={setKillSwitch.isPending} onClick={() => setKillSwitch.mutate({ status: "active" })}>Reanudar</Button></div></div></CardContent></Card></section>

          <section aria-label="Modo arqueológico"><Card className="border-border/70 bg-card/60"><CardHeader className="pb-3"><p className="console-font text-[10px] uppercase tracking-[0.22em] text-primary">ARCHAEOLOGY / LORE GRAPH</p><CardTitle className="mt-1 flex items-center gap-2 text-base"><GitBranch className="size-4 text-primary" />Grafo de lore persistente</CardTitle></CardHeader><CardContent className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"><div>{lore.isLoading ? <p className="text-xs text-muted-foreground">Cargando relaciones...</p> : <LoreRelationGraph nodes={(lore.data?.nodes ?? []) as LoreNodeView[]} relations={(lore.data?.relations ?? []) as LoreRelationView[]} activeId={activeLoreNodeId} onSelect={setActiveLoreNodeId} />}</div><div className="rounded-xl border border-border/70 bg-background/30 p-4"><p className="console-font text-[10px] uppercase tracking-[0.14em] text-primary">Nodo seleccionado</p>{activeLoreNode ? <><p className="mt-2 font-semibold">{activeLoreNode.name}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{activeLoreNode.description}</p><p className="mt-3 text-[11px] text-primary">ID: {activeLoreNode.id}</p></> : <p className="mt-2 text-xs leading-5 text-muted-foreground">Selecciona un nodo para inspeccionar su archivo y relaciones reales.</p>}</div></CardContent></Card></section>

          {!ir ? <><Card className="flex min-h-[390px] items-center justify-center border-dashed border-border/80 bg-card/30"><CardContent className="max-w-md text-center"><div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 text-primary"><WandSparkles className="size-7" /></div><h2 className="mb-2 text-xl font-semibold">{isRunning ? "Pipeline en ejecución" : "El escenario está listo"}</h2><p className="text-sm leading-6 text-muted-foreground">{isRunning ? (jobStatus.data?.stages.find(stage => stage.status === "active")?.message ?? "Los agentes están trabajando...") : "Escribe un concepto o pulsa ejecutar con el campo vacío. El sistema rellenará una idea autónoma, respetará el idioma nativo y calculará armonía, prosodia y producción."}</p></CardContent></Card>{liveHistory.length > 0 && <LiveEventLog history={liveHistory} />}</> : <>
            <Card className="overflow-hidden border-primary/25 bg-card/80 shadow-2xl shadow-black/20"><CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/10 to-transparent"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="mb-2 flex flex-wrap items-center gap-2"><Badge className="bg-primary/15 text-primary hover:bg-primary/20">MUSIC IR</Badge><span className="console-font text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{ir.model.mode} · {ir.model.name}</span></div><CardTitle className="text-2xl">{ir.metadata.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{ir.concept.autonomous ? "Concepto generado de forma autónoma" : ir.concept.core_idea}</p></div><div className={`flex items-center gap-2 text-2xl font-bold ${scoreColor}`}><Sparkles className="size-5" />{ir.evaluation.score}<span className="text-xs font-normal text-muted-foreground">/100</span></div></div></CardHeader><CardContent className="grid gap-3 p-4 sm:grid-cols-4"><Metric label="Tonalidad" value={ir.musical.key} icon={<AudioLines className="size-4" />} /><Metric label="Tempo" value={`${ir.musical.bpm} BPM`} icon={<Activity className="size-4" />} /><Metric label="Idioma" value={ir.lyrics.language} icon={<Radio className="size-4" />} /><Metric label="Prosodia" value={`${ir.evaluation.phonetic_score}/100`} icon={<Sparkles className="size-4" />} /></CardContent></Card>

            <Tabs defaultValue="composition" className="space-y-4"><TabsList className="grid h-auto w-full grid-cols-3 bg-card/70"><TabsTrigger value="composition">Estructura</TabsTrigger><TabsTrigger value="production">Producción</TabsTrigger><TabsTrigger value="audit">Auditoría</TabsTrigger></TabsList><TabsContent value="composition" className="space-y-3">{ir.musical.sections.map(section => <SectionBlock key={section} section={section} ir={ir} />)}</TabsContent><TabsContent value="production"><ProductionPanel ir={ir} /></TabsContent><TabsContent value="audit"><AuditPanel ir={ir} /></TabsContent></Tabs>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"><Card className="border-border/70 bg-[#07110b] shadow-xl"><CardHeader className="flex-row items-center justify-between space-y-0 pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Terminal className="size-4 text-primary" />Event Bus Log</CardTitle><span className="console-font text-[10px] text-primary">LIVE_TRACE</span></CardHeader><CardContent className="console-font max-h-64 space-y-2 overflow-auto text-[11px] leading-5">{liveHistory.map((entry, index) => <div key={`${entry.timestamp}-${index}`} className="flex gap-3 border-b border-primary/10 pb-2 last:border-0"><span className="shrink-0 text-primary/50">{entry.timestamp.slice(11, 19)}</span><span className="shrink-0 font-bold text-primary">[{entry.agent}]</span><span className="text-emerald-100/80">{entry.action}</span></div>)}</CardContent></Card><Card className="border-border/70 bg-card/70"><CardHeader className="pb-3"><CardTitle className="text-sm">Exportadores universales</CardTitle></CardHeader><CardContent className="grid gap-2"><Button variant="outline" className="justify-start gap-2" onClick={exportJson}><FileJson className="size-4 text-primary" />Descargar Music IR · JSON</Button><Button variant="outline" className="justify-start gap-2" onClick={exportTxt}><FileText className="size-4 text-primary" />Descargar partitura · TXT</Button><Button variant="outline" className="justify-start gap-2" onClick={() => selected?.midiBase64 && downloadMidi(`${ir.metadata.title.replace(/\s+/g, "_")}.mid`, selected.midiBase64)}><Download className="size-4 text-primary" />Descargar MIDI calculado</Button></CardContent></Card></div>
          </>}

          <section><div className="mb-3 flex items-center justify-between"><div><p className="console-font text-[10px] uppercase tracking-[0.22em] text-primary">ARCHIVE / USER SPACE</p><h2 className="text-lg font-semibold">Archivo arqueológico de composiciones</h2></div><Button variant="ghost" size="sm" onClick={() => history.refetch()} className="gap-2 text-muted-foreground"><RefreshCw className="size-3.5" />Actualizar</Button></div><ArchiveGallery items={(history.data ?? []) as ArchiveItem[]} loading={history.isLoading} onSelect={id => setSelectedHistoryId(id)} /></section>
        </main>
      </div>
    </div>
  </DashboardLayout>;
}

function LiveEventLog({ history }: { history: Array<{ agent: string; action: string; timestamp: string }> }) {
  return <Card className="border-border/70 bg-[#07110b] shadow-xl"><CardHeader className="flex-row items-center justify-between space-y-0 pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Terminal className="size-4 text-primary" />Event Bus Log</CardTitle><span className="console-font text-[10px] text-primary">LIVE_TRACE</span></CardHeader><CardContent className="console-font max-h-64 space-y-2 overflow-auto text-[11px] leading-5">{history.map((entry, index) => <div key={`${entry.timestamp}-${index}`} className="flex gap-3 border-b border-primary/10 pb-2 last:border-0"><span className="shrink-0 text-primary/50">{entry.timestamp.slice(11, 19)}</span><span className="shrink-0 font-bold text-primary">[{entry.agent}]</span><span className="text-emerald-100/80">{entry.action}</span></div>)}</CardContent></Card>;
}

function ArchiveGallery({ items, loading, onSelect }: { items: ArchiveItem[]; loading: boolean; onSelect: (id: number) => void }) {
  const rowHeight = 86;
  const viewportHeight = 344;
  const [scrollTop, setScrollTop] = useState(0);
  if (loading) return <Card className="border-border/70 bg-card/50"><CardContent className="flex items-center gap-2 p-5 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Leyendo archivo...</CardContent></Card>;
  if (!items.length) return <Card className="border-dashed border-border/70 bg-card/30"><CardContent className="p-6 text-sm text-muted-foreground">Aún no hay composiciones guardadas. Tu primera ejecución aparecerá aquí.</CardContent></Card>;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const end = Math.min(items.length, start + Math.ceil(viewportHeight / rowHeight) + 5);
  const visible = items.slice(start, end);
  const dates = items.slice(0, 4).map(item => new Date(item.createdAt).toLocaleDateString());
  return <Card className="overflow-hidden border-border/70 bg-card/50"><CardContent className="p-0"><div className="flex flex-wrap gap-2 border-b border-border/60 px-4 py-3">{dates.map((date, index) => <span key={`${date}-${index}`} className="console-font text-[10px] text-primary">{index ? "→" : ""} {date}</span>)}</div><div className="max-h-[344px] overflow-auto" onScroll={event => setScrollTop(event.currentTarget.scrollTop)}><div style={{ height: items.length * rowHeight, position: "relative" }}><div className="absolute inset-x-0" style={{ transform: `translateY(${start * rowHeight}px)` }}>{visible.map(item => <button type="button" key={item.id} onClick={() => onSelect(item.id)} className="block h-[86px] w-full border-b border-border/50 px-4 text-left transition-colors hover:bg-primary/5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{item.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()} · {item.musicIr.musical?.key} · {item.musicIr.musical?.bpm} BPM</p></div><span className="console-font shrink-0 text-[10px] text-primary">#{item.id}</span></div></button>)}</div></div></div></CardContent></Card>;
}

function LoreRelationGraph({ nodes, relations, activeId, onSelect }: { nodes: LoreNodeView[]; relations: LoreRelationView[]; activeId: string | null; onSelect: (id: string) => void }) {
  const width = 640;
  const height = 190;
  const positions = new Map(nodes.map((node, index) => [node.id, { x: 94 + index * ((width - 188) / Math.max(1, nodes.length - 1)), y: index % 2 ? 126 : 62 }]));
  return <div className="relative min-h-[190px] overflow-hidden rounded-xl border border-border/70 bg-background/30"><svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 size-full" role="img" aria-label="Relaciones del lore">{relations.map(relation => { const from = positions.get(relation.sourceId); const to = positions.get(relation.targetId); if (!from || !to) return null; const active = activeId === relation.sourceId || activeId === relation.targetId; return <g key={`${relation.sourceId}-${relation.targetId}-${relation.relationType}`}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={active ? "#1DB954" : "#3a5441"} strokeWidth={active ? 2.5 : 1.2} /><text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6} textAnchor="middle" fill="#7fb88d" fontSize="10">{relation.relationType}</text></g>; })}</svg>{nodes.map(node => { const pos = positions.get(node.id)!; const active = activeId === node.id; return <button key={node.id} type="button" onClick={() => onSelect(node.id)} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border px-2 py-1.5 text-left shadow-lg transition-colors ${active ? "border-primary bg-primary/20 text-primary" : "border-border/80 bg-card text-foreground hover:border-primary/60"}`} style={{ left: `${(pos.x / width) * 100}%`, top: `${(pos.y / height) * 100}%` }}><span className="block max-w-24 truncate text-[10px] font-semibold">{node.name}</span><span className="console-font block text-[8px] uppercase tracking-wide opacity-70">{node.kind}</span></button>; })}</div>;
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="min-w-0 rounded-xl border border-border/60 bg-background/30 p-3"><div className="mb-2 flex min-w-0 items-center gap-2 text-muted-foreground">{icon}<span className="truncate text-[10px] uppercase tracking-[0.1em]">{label}</span></div><p className="truncate console-font text-sm text-primary">{value}</p></div>; }
function ProductionPanel({ ir }: { ir: MusicIRView }) { return <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]"><Card className="border-border/70 bg-card/60"><CardHeader><CardTitle className="text-sm">Roles abstractos</CardTitle></CardHeader><CardContent className="space-y-3">{Object.entries(ir.arrangement.roles_per_section).map(([section, roles]) => <div key={section}><div className="mb-1 flex justify-between text-xs font-semibold"><span>{section}</span><span className="console-font text-primary">{ir.arrangement.dynamics_curve[section] ?? 0}%</span></div><div className="flex flex-wrap gap-1.5">{roles.map(role => <Badge key={role} variant="secondary" className="text-[10px]">{role}</Badge>)}</div><Progress value={ir.arrangement.dynamics_curve[section] ?? 0} className="mt-2 h-1 bg-muted" /></div>)}</CardContent></Card><Card className="border-border/70 bg-card/60"><CardHeader><CardTitle className="text-sm">Diseño de espacio</CardTitle></CardHeader><CardContent className="space-y-3">{Object.entries(ir.arrangement.space).map(([section, space]) => <div key={section} className="border-b border-border/50 pb-2 last:border-0"><p className="text-xs font-semibold text-primary">{section}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{space}</p></div>)}</CardContent></Card></div>; }
function AuditPanel({ ir }: { ir: MusicIRView }) { return <div className="grid gap-4 sm:grid-cols-4"><Metric label="Fonética" value={`${ir.evaluation.phonetic_score}/100`} icon={<Sparkles className="size-4" />} /><Metric label="Prosodia" value={`${ir.evaluation.prosody_score}/100`} icon={<Radio className="size-4" />} /><Metric label="Armonía" value={`${ir.evaluation.harmony_score}/100`} icon={<AudioLines className="size-4" />} /><Metric label="Estructura" value={`${ir.evaluation.structure_score}/100`} icon={<Server className="size-4" />} /><Card className="sm:col-span-4 border-border/70 bg-card/60"><CardHeader><CardTitle className="text-sm">Hallazgos del evaluador</CardTitle></CardHeader><CardContent className="space-y-2">{ir.evaluation.feedback.map(item => <p key={item} className="flex gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{item}</p>)}<p className="mt-3 border-t border-border/60 pt-3 text-xs leading-5 text-muted-foreground">{ir.lyrics.prosody.global} {ir.lyrics.phonetic_guidance.global}</p>{Object.entries(ir.lyrics.prosody.sections).slice(0, 3).map(([section, data]) => <p key={section} className="text-xs text-muted-foreground"><span className="font-semibold text-primary">{section}:</span> {data.syllables} sílabas, {data.meanSyllables} por línea, cantabilidad {data.cantability}/100.</p>)}</CardContent></Card></div>; }
function PlusMark() { return <span className="text-muted-foreground">+</span>; }
