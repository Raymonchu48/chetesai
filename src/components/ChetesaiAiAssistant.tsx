"use client";

import Image from "next/image";
import { coachAnswer, coachToday, loadCoachContext, type CoachContext } from "@/lib/coach-companion";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Apple,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  LoaderCircle,
  Mail,
  MessageCircle,
  Send,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

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
  { label: "¿Qué como hoy?", icon: Apple, action: "today-food" },
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content:
        "¡Hola! Soy Chetesaí Coach IA. Puedo orientarte sobre entrenamientos, servicios, tarifas y el funcionamiento de Chetesaí Fitness+.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
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
    window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  if (!isVisibleRoute) return null;

  const quickActions = isPortal ? portalActions : publicActions;
  const launcherPosition = isPortal
    ? "bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+5.5rem)] md:bottom-[max(1.25rem,env(safe-area-inset-bottom))]"
    : "bottom-[max(1.25rem,env(safe-area-inset-bottom))]";
  const panelPosition = isPortal
    ? "bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+10.5rem)] max-h-[min(62dvh,580px)] md:bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+5rem)] md:max-h-[min(74dvh,680px)]"
    : "bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+5rem)] max-h-[min(74dvh,680px)]";

  function runQuickAction(action: string) {
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

    const personalAnswer = isPortal ? coachAnswer(content, coachContext) : null;
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
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Cerrar Chetesaí Coach IA" : "Abrir Chetesaí Coach IA"}
        aria-expanded={open}
        className={`group fixed right-4 z-[75] grid h-16 w-16 place-items-center rounded-full border border-[#d7b86b]/60 bg-gradient-to-br from-[#17201c] to-[#080b09] text-white shadow-[0_16px_45px_rgba(0,0,0,0.38)] transition duration-300 hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#8cdb78] focus:ring-offset-2 sm:right-6 ${launcherPosition}`}
      >
        {open ? <X className="h-6 w-6" /> : (
          <span className="absolute inset-[3px] overflow-hidden rounded-full border border-white/20 bg-[#111713] ring-1 ring-[#d7b86b]/35">
            <Image
              src="/brand/chetesai-coach-avatar.webp"
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
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-[#8cdb78]/60 bg-[#15251b]"><Image src="/brand/chetesai-coach-avatar.webp" alt="Mini coach Chetesaí" fill sizes="44px" className="object-cover" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-black">Chetesaí Coach IA</p>
            <p className="flex items-center gap-1.5 text-xs text-white/60">
              <span className="h-2 w-2 rounded-full bg-[#62ce55]" /> {isPortal ? "Tu acompañante personal" : "Orientación inmediata"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-xl text-white/65 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar asistente"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div ref={scrollRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" ? <span className="relative mb-1 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#b6d8a9]"><Image src="/brand/chetesai-coach-avatar.webp" alt="" fill sizes="32px" className="object-cover" /></span> : null}
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
