"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { FiMessageCircle, FiMic, FiSend, FiX } from "react-icons/fi";
import { ADMIN_ONLY, createFromCall } from "@/utils/assistant/commands";
import { clientCreate } from "./assistantActions";
import { refreshActionables } from "@/store/actionable/actionableUiSlice";

const MAX_RECORD_MS = 60_000;
const POLL_MS = 30_000;
const MAX_SAVED = 20;

const GREETING = {
  role: "assistant",
  content:
    'Hi! Type or say a task and I\'ll add it to your actionables, e.g. "Call vendor tomorrow at 5pm". Voice recordings are transcribed by OpenAI.',
};

export default function AssistantWidget() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const recorderRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setVoiceSupported(typeof window.MediaRecorder !== "undefined");
    return () => recorderRef.current?.state === "recording" && recorderRef.current.stop();
  }, []);

  // Changes made on WhatsApp happen server-side: poll while the tab is visible, and refresh when it regains focus.
  // ponytail: 30s polling; switch to SSE/websockets if changes must show instantly
  useEffect(() => {
    const refresh = () => document.visibilityState === "visible" && dispatch(refreshActionables());
    const timer = setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [dispatch]);

  // Chat survives refresh: last MAX_SAVED messages per user in localStorage (per-browser only)
  const storageKey = `assistantChat:${user?._id || user?.email || "me"}`;
  const [loadedKey, setLoadedKey] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      setMessages(Array.isArray(saved) && saved.length ? saved : [GREETING]);
    } catch {
      setMessages([GREETING]);
    }
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) return; // don't overwrite before this user's saved chat is loaded
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-MAX_SAVED)));
    } catch {}
  }, [messages, storageKey, loadedKey]);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const push = (msg) => setMessages((prev) => [...prev, msg]);
  const isAdmin = user?.userType?.toLowerCase() === "admin"; // same rule as the Actionable page

  const addActionable = async (call) => {
    if (!isAdmin) return push({ role: "assistant", content: ADMIN_ONLY });
    push({ role: "assistant", content: await createFromCall(call, clientCreate(dispatch)) });
    dispatch(refreshActionables()); // the thunk only patches the list already loaded; refetch so every list shows it
  };

  const step = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      push({ role: "assistant", content: err.message || "Something went wrong.", error: true });
    } finally {
      setBusy(false);
    }
  };

  const ask = async (text) => {
    const content = text.trim();
    if (!content) return;
    setInput("");
    push({ role: "user", content });

    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({
        text: content,
        now: moment().format("dddd, YYYY-MM-DD HH:mm [UTC]Z"), // offset lets the model write due times in the user's zone
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Assistant unavailable.");
    if (data.call) await addActionable(data.call);
    else push({ role: "assistant", content: data.reply });
  };

  const send = (text) => step(() => ask(text));

  const transcribe = (blob) =>
    step(async () => {
      const ext = blob.type.split(";")[0].split("/")[1] || "webm";
      const form = new FormData();
      form.append("audio", blob, `voice.${ext}`);
      const res = await fetch("/api/assistant/transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transcription failed.");
      if (!data.text.trim()) throw new Error("Didn't catch that, try again.");
      await ask(data.text);
    });

  const toggleVoice = async () => {
    if (listening) return recorderRef.current?.stop();

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      return push({ role: "assistant", content: "Voice needs HTTPS. Open the app over https:// or localhost.", error: true });
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const content =
        err.name === "NotFoundError"
          ? "No microphone found. Check the OS microphone settings."
          : "Microphone permission denied. Allow it in the browser's site settings.";
      return push({ role: "assistant", content, error: true });
    }

    const recorder = new MediaRecorder(stream);
    const chunks = [];
    const autoStop = setTimeout(() => recorder.state === "recording" && recorder.stop(), MAX_RECORD_MS);
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      clearTimeout(autoStop);
      stream.getTracks().forEach((t) => t.stop());
      setListening(false);
      if (chunks.length) transcribe(new Blob(chunks, { type: recorder.mimeType }));
    };
    recorderRef.current = recorder;
    recorder.start();
    setListening(true);
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Actionable assistant"
          className="fixed bottom-24 right-4 sm:right-6 z-50 flex h-[520px] max-h-[calc(100vh-120px)] w-[calc(100vw-32px)] sm:w-[360px] flex-col overflow-hidden rounded-[20px] border border-[#D3E3FD] bg-white shadow-xl"
        >
          <div className="flex items-center justify-between bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] px-4 py-3 text-white">
            <span className="font-semibold">Assistant</span>
            <button aria-label="Close assistant" onClick={() => setOpen(false)} className="cursor-pointer">
              <FiX className="text-[20px]" />
            </button>
          </div>

          <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#F2F7FF] p-4" aria-live="polite">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[14px] ${
                  m.role === "user"
                    ? "self-end bg-[#0B57D0] text-white"
                    : `self-start bg-white ${m.error ? "text-red-600" : "text-[#333]"}`
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy && <div className="self-start text-[13px] text-[#666]">Working…</div>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) send(input);
            }}
            className="flex items-center gap-2 border-t border-[#E9E9E9] p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Recording… tap mic to send" : "Type or say a task"}
              aria-label="Task"
              maxLength={1000}
              className="flex-1 rounded-full bg-[#F4F5F7] px-4 py-2 text-[14px] outline-none"
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={busy && !listening}
                aria-label={listening ? "Stop recording" : "Say a task"}
                aria-pressed={listening}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full ${
                  listening ? "animate-pulse bg-red-500 text-white" : "bg-[#F4F5F7] text-[#0B57D0]"
                }`}
              >
                <FiMic />
              </button>
            )}
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#0B57D0] text-white disabled:opacity-50"
            >
              <FiSend />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-6 right-4 sm:right-6 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] text-white shadow-lg hover:opacity-90"
      >
        {open ? <FiX className="text-[24px]" /> : <FiMessageCircle className="text-[24px]" />}
      </button>
    </>
  );
}
