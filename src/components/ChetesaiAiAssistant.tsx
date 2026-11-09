"use client";

import Image from "next/image";
import { coachAnswer, coachToday, loadCoachContext, specificMealAnswer, type CoachContext } from "@/lib/coach-companion";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Apple,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  CheckCircle2,
  Play,
  Timer,
  HeartPulse,
  LoaderCircle,
  Mail,
  MessageCircle,
  Send,
  Sparkles,
  TrendingUp,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type GuidedSet = {
  id: string;
  rutina_ejercicio_id: string;
  numero_serie: number;
  completada: boolean;
  repeticiones_objetivo: string | null;
  peso_objetivo: number | null;
};
type GuidedSession = { sesion: { id: string; estado?: string }; series: GuidedSet[] };
type Wellness = { energy: number; effort: number; notes: string; discomfort: boolean };

type QuickAction = {
  label: string;
  icon: typeof CalendarDays;
  action: "valuation" | "services" | "rates" | "contact" | string;
};

const publicActions: QuickAction[] = [
  { label: "Solicitar valoración", icon: CalendarDays, action: "valuation" },
  { label: "Ver servicios", icon: Dumbbell, action: "services" },
  { label: "Consultar tarifas", icon: TrendingUp, action: "rates" },
];

const portalActions: QuickAction[] = [
  { label: "¿Qué me toca hoy?", icon: Dumbbell, action: "today-workout" },
  { label: "Iniciar sesión", icon: Play, action: "start-workout" },
  { label: "¿Qué como hoy?", icon: Apple, action: "today-food" },
  { label: "Mi bienestar", icon: HeartPulse, action: "wellness" },
  { label: "Mi progreso", icon: TrendingUp, action: "/portal/progreso" },
  { label: "Mis citas", icon: CalendarDays, action: "/portal/citas" },
];

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

export function ChetesaiAiAssistant() {
  const pathname = usePathname();
  const router = useRouter();
  const isPortal = pathname.startsWith("/portal");
  const isVisibleRoute = pathname === "/" || isPortal;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [coachContext, setCoachContext] = useState<CoachContext | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [guidedSession, setGuidedSession] = useState<GuidedSession | null>(null);
  const [workingOut, setWorkingOut] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [wellnessOpen, setWellnessOpen] = useState(false);
  const [preEnergy, setPreEnergy] = useState(3);
  const [preDiscomfort, setPreDiscomfort] = useState(false);
  const [postEffort, setPostEffort] = useState(5);
  const [actualReps, setActualReps] = useState("");
  const [actualWeight, setActualWeight] = useState("");
  const [wellnessNotes, setWellnessNotes] = useState("");
  const [preWellness, setPreWellness] = useState<Wellness | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const spokenMessageRef = useRef<string | null>(null);
  const coachAvatar = "/brand/chetesai-mini-coach.svg";
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content:
        "¡Hola! Soy Chetesaí Coach IA. Puedo orientarte sobre entrenamientos, servicios, tarifas y el funcionamiento de Chetesaí Fitness+.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPortal || restSeconds <= 0) return;
    const interval = window.setInterval(() => setRestSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [restSeconds, isPortal]);

  function respond(content: string) {
    setMessages((previous) => [...previous, createMessage("assistant", content)]);
  }

  const todayIndex = coachToday().index;
  const todayExercises = (coachContext?.exercises || []).filter((exercise) => Number(exercise.dia) === todayIndex).sort((a,b) => a.orden-b.orden);
  const pendingSet = guidedSession?.series.find((serie) => !serie.completada) || null;
  const pendingExercise = pendingSet ? todayExercises.find((exercise) => String(exercise.id) === String(pendingSet.rutina_ejercicio_id)) : null;
  const exerciseVideo = pendingExercise?.ejercicios ? (coachContext?.visualModel === "mujer" ? pendingExercise.ejercicios.video_mujer_url || pendingExercise.ejercicios.video_url : pendingExercise.ejercicios.video_url) : null;
  const safeExerciseVideo = exerciseVideo && (/^https:\/\//i.test(exerciseVideo) || /^\/(?!\/)/.test(exerciseVideo)) ? exerciseVideo : null;

  async function startGuidedWorkout() {
    if (!isPortal || workingOut) return;
    if (!preWellness) {
      setWellnessOpen(true);
      respond("Antes de comenzar, indica cómo te encuentras. Es una comprobación rápida para adaptar el acompañamiento sin cambiar tu rutina.");
      return;
    }
    if (preWellness.discomfort) {
      respond("Has indicado molestias antes de entrenar. No iniciaré una sesión guiada sin que lo revise tu profesional. Si tienes dolor agudo o síntomas preocupantes, no entrenes y busca atención sanitaria.");
      setWellnessOpen(true);
      return;
    }
    if (!coachContext?.workout || !todayExercises.length) {
      respond("No tengo ejercicios asignados para hoy. Comprueba tu calendario de entrenamiento con tu profesional.");
      return;
    }
    setWorkingOut(true);
    try {
      const response = await fetch("/api/portal/entrenamiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dia: todayIndex }),
      });
      const result = await response.json() as { ok?: boolean; data?: GuidedSession; error?: string };
      if (!response.ok || !result.ok || !result.data) throw Error(result.error || "No se pudo iniciar la sesión");
      setGuidedSession(result.data);
      const remaining = result.data.series.filter((s) => !s.completada).length;
      respond(`Tu sesión «${coachContext.workout.nombre}» está iniciada. Tienes ${remaining} series pendientes. Te guiaré paso a paso; marca «Serie terminada» cuando finalices cada una. Si no te encuentras bien, detente y avisa a tu profesional.`);
    } catch (error) {
      respond(error instanceof Error ? error.message : "No he podido iniciar el entrenamiento.");
    } finally {
      setWorkingOut(false);
    }
  }

  async function completeGuidedSet() {
    if (!pendingSet || workingOut || !guidedSession) return;
    if ((actualReps && (!Number.isInteger(Number(actualReps)) || Number(actualReps) < 0 || Number(actualReps) > 1000)) || (actualWeight && (!Number.isFinite(Number(actualWeight)) || Number(actualWeight) < 0 || Number(actualWeight) > 1000))) {
      respond("Introduce repeticiones y peso válidos, o déjalos vacíos si no deseas registrarlos.");
      return;
    }
    setWorkingOut(true);
    try {
      const response = await fetch("/api/portal/entrenamiento", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_set", serie_id: pendingSet.id, completada: true,
          repeticiones_realizadas: actualReps, peso_real: actualWeight, rpe_real: "",
          comentario: "Serie completada desde Chetesaí Coach IA; repeticiones y carga reales sin registrar",
        }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw Error(result.error || "No se pudo guardar la serie");
      const updated = { ...guidedSession, series: guidedSession.series.map((set) => set.id === pendingSet.id ? { ...set, completada: true } : set) };
      setGuidedSession(updated);
      setActualReps("");
      setActualWeight("");
      const remaining = updated.series.filter((set) => !set.completada).length;
      if (remaining) {
        setRestSeconds(Math.max(0, Math.min(600, Number((pendingExercise as { descanso_segundos?: number } | undefined)?.descanso_segundos || 60))));
        respond(`Serie ${pendingSet.numero_serie} registrada. Quedan ${remaining} series. Descansa y después continúa con la siguiente serie.`);
      } else {
        setRestSeconds(0);
        respond("¡Todas las series marcadas! Valora el esfuerzo de la sesión y pulsa «Finalizar sesión» para guardar tu resumen.");
      }
    } catch (error) { respond(error instanceof Error ? error.message : "No se pudo registrar la serie."); }
    finally { setWorkingOut(false); }
  }

  async function finishGuidedWorkout() {
    if (!guidedSession || workingOut) return;
    if (guidedSession.series.some((serie) => !serie.completada)) {
      respond("Aún quedan series pendientes. Puedes completarlas desde el coach o terminar la sesión desde el portal de entrenamiento.");
      return;
    }
    setWorkingOut(true);
    const checkin = preWellness ? `Energía previa: ${preWellness.energy}/5. Molestias previas: ${preWellness.discomfort ? "sí" : "no"}.` : "Sin valoración previa.";
    const note = `Chetesaí Coach IA · ${checkin} Esfuerzo final: ${postEffort}/10. ${wellnessNotes.trim()}`.slice(0,1000);
    try {
      const response = await fetch("/api/portal/entrenamiento", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish_session", session_id: guidedSession.sesion.id, rpe_sesion: postEffort, comentario_cliente: note }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw Error(result.error || "No se pudo finalizar");
      setGuidedSession(null);
      setPreWellness(null);
      setWellnessNotes("");
      setRestSeconds(0);
      respond("¡Entrenamiento completado! He guardado tu valoración del esfuerzo en la sesión para que tu profesional pueda revisarla. ¡Buen trabajo!");
    } catch (error) { respond(error instanceof Error ? error.message : "No he podido finalizar la sesión."); }
    finally { setWorkingOut(false); }
  }

  function savePreWellness() {
    setPreWellness({ energy: preEnergy, discomfort: preDiscomfort, effort: 0, notes: "" });
    setWellnessOpen(false);
    respond(preDiscomfort ? "He anotado que tienes molestias. No iniciaré la sesión guiada hasta que tu profesional las revise." : `Valoración previa registrada para esta sesión: energía ${preEnergy}/5. Puedes comenzar cuando estés preparado. Al finalizar guardaremos tu esfuerzo para el seguimiento profesional.`);
  }


  useEffect(() => {
    const supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    setVoiceAvailable(supported);
    if (supported) {
      const refresh = () => {
        const spanish = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith("es"));
        setAvailableVoices(spanish);
        setSelectedVoice(previous => previous || spanish.find(v => /alvaro|álvaro|pablo|jorge|diego|antonio|enrique|raul|raúl|carlos|male|hombre/i.test(v.name))?.voiceURI || spanish[0]?.voiceURI || "");
      };
      refresh();
      window.speechSynthesis.addEventListener("voiceschanged", refresh);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", refresh);
        window.speechSynthesis.cancel();
      };
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function speakMessage(message: ChatMessage) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = "es-ES";
    utterance.rate = 0.96;
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.voiceURI === selectedVoice) ||
      voices.find(v => v.lang.toLowerCase().startsWith("es") && /alvaro|álvaro|pablo|jorge|diego|antonio|enrique|raul|raúl|carlos|male|hombre/i.test(v.name)) ||
      voices.find(v => v.lang.toLowerCase() === "es-es") || voices.find(v => v.lang.toLowerCase().startsWith("es"));
    if (spanishVoice) utterance.voice = spanishVoice;
    window.speechSynthesis.speak(utterance);
    spokenMessageRef.current = message.id;
  }

  function toggleVoice() {
    if (!voiceAvailable) return;
    if (voiceEnabled) {
      window.speechSynthesis.cancel();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
      const latest = [...messages].reverse().find((message) => message.role === "assistant");
      if (latest) speakMessage(latest);
    }
  }

  useEffect(() => {
    if (!voiceEnabled || !open || !isPortal) return;
    const latest = messages[messages.length - 1];
    if (latest?.role === "assistant" && latest.id !== spokenMessageRef.current) speakMessage(latest);
  }, [messages, voiceEnabled, open, isPortal]);

  const greetedRef = useRef(false);
  useEffect(() => {
    if (!isPortal) { setCoachContext(null); greetedRef.current = false; return; }
    let active = true;
    setLoadingCoach(true);
    loadCoachContext().then((ctx) => {
      if (!active) return;
      setCoachContext(ctx);
      if (!greetedRef.current) {
        greetedRef.current = true;
        const { greeting } = coachToday();
        setMessages([createMessage("assistant", `${greeting}${ctx.name ? ", " + ctx.name : ""}! Soy tu Chetesaí Coach IA. Me alegra verte de nuevo. ¿Qué hacemos hoy? Pregúntame qué te toca entrenar, qué comes hoy o cómo consultar tu progreso.`)]);
        if (ctx.workoutLoaded || ctx.nutritionLoaded) setOpen(true);
      }
    }).catch(() => {
      if (active && !greetedRef.current) {
        greetedRef.current = true;
        setMessages([createMessage("assistant", "¡Hola! Soy tu Chetesaí Coach IA. ¿Qué hacemos hoy? Puedes consultar tu entrenamiento, nutrición o progreso.")]);
      }
    }).finally(() => { if (active) setLoadingCoach(false); });
    return () => { active = false; };
  }, [isPortal]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    if (!isPortal) window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, isPortal]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  if (!isVisibleRoute) return null;

  const quickActions = isPortal ? portalActions : publicActions;
  const launcherPosition = isPortal
    ? "bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+5.5rem)] md:bottom-[max(1.25rem,env(safe-area-inset-bottom))]"
    : "bottom-[max(1.25rem,env(safe-area-inset-bottom))]";
  const panelPosition = isPortal
    ? "bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+10.5rem)] max-h-[min(62dvh,580px)] md:top-24 md:bottom-6 md:h-[min(680px,calc(100dvh-7rem))] md:max-h-none"
    : "bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+5rem)] max-h-[min(74dvh,680px)]";

  function runQuickAction(action: string) {
    if (action === "start-workout") { void startGuidedWorkout(); return; }
    if (action === "wellness") { setWellnessOpen(true); return; }
    if (action === "today-workout" || action === "today-food") {
      const question = action === "today-workout" ? "¿Qué me toca entrenar hoy?" : "¿Qué como hoy?";
      const reply = coachAnswer(question, coachContext) || "Consulta tu planificación en el portal.";
      setMessages((current) => [...current, createMessage("user", question), createMessage("assistant", reply)]);
      return;
    }
    if (action.startsWith("/")) {
      router.push(action);
      setOpen(false);
      return;
    }

    if (action === "contact") {
      window.location.href = "mailto:chetesaifitness@gmail.com?subject=Consulta%20desde%20Chetesa%C3%AD%20Fitness%2B";
      return;
    }

    if (action === "valuation") {
      window.dispatchEvent(new CustomEvent("chetesai:open-valuation"));
      setOpen(false);
      return;
    }

    if (action === "rates") {
      window.dispatchEvent(new CustomEvent("chetesai:open-rates"));
      setOpen(false);
      return;
    }

    document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    if (isPortal && /^(empezamos|iniciar (mi )?(sesion|entrenamiento)|comenzar entrenamiento)[!?. ]*$/i.test(content)) {
      setInput("");
      setMessages((current) => [...current, createMessage("user", content)]);
      void startGuidedWorkout();
      return;
    }
    const mealAnswer = isPortal ? specificMealAnswer(content, coachContext) : null;
    const personalAnswer = mealAnswer || (isPortal ? coachAnswer(content, coachContext) : null);
    if (personalAnswer) {
      setMessages((current) => [...current, createMessage("user", content), createMessage("assistant", personalAnswer)]);
      setInput("");
      return;
    }
    const userMessage = createMessage("user", content);
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation.slice(-10).map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
        }),
      });
      const result = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !result.reply) throw new Error(result.error || "No se pudo responder");
      setMessages((current) => [...current, createMessage("assistant", result.reply || "")]);
    } catch {
      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          "Ahora mismo no puedo responder por chat. Puedes escribir directamente a Ramón en chetesaifitness@gmail.com.",
        ),
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { if (open && voiceAvailable) window.speechSynthesis.cancel(); setOpen((current) => !current); }}
        aria-label={open ? "Cerrar Chetesaí Coach IA" : "Abrir Chetesaí Coach IA"}
        aria-expanded={open}
        className={`group fixed right-4 z-[75] grid h-16 w-16 place-items-center rounded-full border border-[#d7b86b]/60 bg-gradient-to-br from-[#17201c] to-[#080b09] text-white shadow-[0_16px_45px_rgba(0,0,0,0.38)] transition duration-300 hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#8cdb78] focus:ring-offset-2 sm:right-6 ${launcherPosition}`}
      >
        {open ? <X className="h-6 w-6" /> : (
          <span className="absolute inset-[3px] overflow-hidden rounded-full border border-white/20 bg-[#111713] ring-1 ring-[#d7b86b]/35">
            <Image
              src={coachAvatar}
              alt=""
              fill
              sizes="64px"
              className="object-cover transition duration-300 group-hover:scale-110"
            />
          </span>
        )}
        {!open ? (
          <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border-2 border-[#101713] bg-[#2f9e24] px-1 text-[10px] font-black">
            IA
          </span>
        ) : null}
      </button>

      {open ? <section
        role="dialog"
        aria-modal="false"
        aria-label="Chetesaí Coach IA"
        className={`fixed inset-x-3 z-[74] flex flex-col overflow-hidden rounded-[28px] border border-[#b38d45]/35 bg-[#f9f7f2] shadow-[0_28px_80px_rgba(0,0,0,0.45)] animate-in fade-in slide-in-from-bottom-4 duration-300 sm:inset-x-auto sm:right-6 sm:w-[390px] ${panelPosition}`}
      >
        <header className="flex items-center gap-3 bg-gradient-to-r from-[#111713] to-[#1b2721] px-5 py-4 text-white">
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-[#8cdb78]/60 bg-[#15251b]"><Image src={coachAvatar} alt="Mini coach Chetesaí" fill sizes="44px" className="object-cover" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-black">Chetesaí Coach IA</p>
            <p className="flex items-center gap-1.5 text-xs text-white/60">
              <span className="h-2 w-2 rounded-full bg-[#62ce55]" /> {isPortal ? "Tu acompañante personal" : "Orientación inmediata"}
            </p>
          </div>
          {isPortal && voiceAvailable ? (
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={voiceEnabled ? "Silenciar voz del coach" : "Activar voz del coach"}
              aria-pressed={voiceEnabled}
              title={voiceEnabled ? "Desactivar voz" : "Escuchar al coach"}
              className="grid h-10 w-10 place-items-center rounded-xl text-[#c7e9bd] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8cdb78]"
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => { setOpen(false); if (voiceAvailable) window.speechSynthesis.cancel(); }}
            className="grid h-10 w-10 place-items-center rounded-xl text-white/65 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar asistente"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div ref={scrollRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" ? <span className="relative mb-1 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#b6d8a9]"><Image src={coachAvatar} alt="" fill sizes="32px" className="object-cover" /></span> : null}
              <p
                className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "rounded-br-md bg-[#2f9e24] text-white"
                    : "rounded-bl-md border border-[#ded8cd] bg-white text-[#303a35] shadow-sm"
                }`}
              >
                {message.content}
              </p>
            </div>
          ))}
          {sending ? (
            <div className="flex justify-start">
              <p className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-[#ded8cd] bg-white px-4 py-3 text-sm text-[#67706b] shadow-sm">
                <LoaderCircle className="h-4 w-4 animate-spin text-[#2f9e24]" /> Pensando…
              </p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-[#ded8cd] bg-white/80 px-4 py-3">
          {isPortal && guidedSession ? (
            <div className="mb-3 rounded-2xl border border-[#c6dbc1] bg-[#f0f8ed] p-3 text-xs text-[#244528]">
              <p className="mb-1 flex items-center gap-2 font-black"><Dumbbell className="h-4 w-4" /> Entrenamiento guiado {workingOut ? "· Guardando…" : ""}</p>
              {pendingSet ? (
                <>
                  <p className="font-semibold">{pendingExercise?.ejercicios?.nombre || "Siguiente ejercicio"} · Serie {pendingSet.numero_serie}</p>
                  <p>{pendingSet.repeticiones_objetivo || "Repeticiones según tu plan"} {restSeconds > 0 ? `· Descanso ${restSeconds}s` : ""}</p>
                  {safeExerciseVideo ? (
                    <video key={safeExerciseVideo} controls playsInline preload="none" src={safeExerciseVideo} className="mt-2 max-h-36 w-full rounded-xl bg-black" aria-label={`Vídeo: ${pendingExercise?.ejercicios?.nombre || "Ejercicio"}`}>
                      Tu navegador no puede reproducir este vídeo. Consulta el ejercicio en el portal.
                    </video>
                  ) : (
                    <p className="mt-2 text-[11px] text-[#536c52]">La demostración técnica está disponible en el portal si tu profesional la ha publicado.</p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="text-[11px]">Repeticiones reales
                      <input inputMode="numeric" type="number" min="0" max="1000" value={actualReps} onChange={e=>setActualReps(e.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-lg border bg-white p-2" />
                    </label>
                    <label className="text-[11px]">Peso real (kg)
                      <input inputMode="decimal" type="number" min="0" max="1000" step="0.5" value={actualWeight} onChange={e=>setActualWeight(e.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-lg border bg-white p-2" />
                    </label>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" disabled={workingOut || restSeconds > 0} onClick={() => void completeGuidedSet()} className="flex items-center gap-1 rounded-xl bg-[#2f9e24] px-3 py-2 font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Serie terminada</button>
                    <button type="button" onClick={() => { setRestSeconds(0); router.push("/portal"); setOpen(false); }} className="rounded-xl border border-[#bad0b5] px-3 py-2 font-bold">Ver ejercicios</button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <p>Series terminadas. Esfuerzo percibido (RPE 1–10):</p>
                  <select aria-label="Esfuerzo final" value={postEffort} onChange={(e) => setPostEffort(Number(e.target.value))} className="rounded-lg border bg-white p-2">
                    {Array.from({ length: 10 }, (_, i) => <option key={i+1} value={i+1}>{i+1}/10</option>)}
                  </select>
                  <input aria-label="Notas finales" value={wellnessNotes} onChange={(e)=>setWellnessNotes(e.target.value)} maxLength={500} placeholder="¿Cómo te has sentido? (opcional)" className="w-full rounded-lg border bg-white p-2" />
                  <button type="button" disabled={workingOut} onClick={() => void finishGuidedWorkout()} className="rounded-xl bg-[#2f9e24] px-3 py-2 font-bold text-white disabled:opacity-50">Finalizar sesión</button>
                </div>
              )}
            </div>
          ) : null}
          {isPortal && wellnessOpen ? (
            <div className="mb-3 rounded-2xl border border-[#c6dbc1] bg-[#f0f8ed] p-3 text-xs text-[#244528]">
              <p className="mb-2 flex items-center gap-2 font-bold"><HeartPulse className="h-4 w-4" /> ¿Cómo te encuentras antes de entrenar?</p>
              <label className="block">Energía: {preEnergy}/5
                <input type="range" min="1" max="5" value={preEnergy} onChange={e=>setPreEnergy(Number(e.target.value))} className="mt-1 w-full accent-[#2f9e24]" />
              </label>
              <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={preDiscomfort} onChange={(e)=>setPreDiscomfort(e.target.checked)} /> Tengo molestias o dolor</label>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={savePreWellness} className="rounded-xl bg-[#2f9e24] px-3 py-2 font-bold text-white">Guardar valoración</button>
                <button type="button" onClick={()=>setWellnessOpen(false)} className="rounded-xl border px-3 py-2 font-bold">Cerrar</button>
              </div>
            </div>
          ) : null}
          {isPortal && voiceAvailable && voiceEnabled && availableVoices.length ? (
            <label className="mb-2 flex items-center gap-2 text-xs text-[#46624f]">
              <span className="shrink-0">Voz del coach</span>
              <select aria-label="Seleccionar voz española" value={selectedVoice} onChange={e => { setSelectedVoice(e.target.value); window.speechSynthesis.cancel(); }} className="min-w-0 max-w-[240px] flex-1 rounded-lg border border-[#cfd9cb] bg-white px-2 py-1">
                {availableVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
              </select>
            </label>
          ) : null}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => runQuickAction(item.action)}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-[#cfd9cb] bg-[#f3f8f1] px-3 py-2 text-xs font-bold text-[#23551e] transition hover:border-[#2f9e24] hover:bg-[#eaf5e6]"
                >
                  <Icon className="h-3.5 w-3.5" /> {item.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={submitMessage} className="flex items-center gap-2">
            <label htmlFor="chetesai-ai-input" className="sr-only">
              Escribe tu consulta
            </label>
            <input
              ref={inputRef}
              id="chetesai-ai-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={800}
              placeholder={isPortal ? "Pregunta por tu entrenamiento o nutrición…" : "Pregúntame sobre Chetesaí…"}
              className="min-w-0 flex-1 rounded-2xl border border-[#d8d2c8] bg-white px-4 py-3 text-sm text-[#202724] outline-none transition placeholder:text-[#89918d] focus:border-[#2f9e24] focus:ring-2 focus:ring-[#2f9e24]/15"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Enviar mensaje"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#2f9e24] text-white transition hover:bg-[#27891e] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-3 flex items-center justify-between gap-3 text-[10px] leading-4 text-[#737b77]">
            <p>{isPortal ? (loadingCoach ? "Consultando tus planes…" : "Seguimiento personalizado · Supervisión profesional") : "Orientación general · No sustituye atención médica"}</p>
            <button type="button" onClick={() => runQuickAction("contact")} className="flex shrink-0 items-center gap-1 font-bold text-[#2f6f28] hover:underline">
              <Mail className="h-3 w-3" /> Ramón <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section> : null}

      {!open ? (
        <span className={`pointer-events-none fixed right-[5.25rem] z-[73] hidden rounded-full border border-[#b38d45]/25 bg-[#111713]/95 px-3 py-2 text-xs font-bold text-white shadow-xl sm:block ${isPortal ? "bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+6.6rem)] md:bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+1.1rem)]" : "bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+1.1rem)]"}`}>
          <MessageCircle className="mr-1.5 inline h-3.5 w-3.5 text-[#9fe68f]" /> ¿Te ayudo?
        </span>
      ) : null}
    </>
  );
}
