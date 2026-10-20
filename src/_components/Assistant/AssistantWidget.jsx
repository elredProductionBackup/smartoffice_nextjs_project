"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { FiMessageCircle, FiMic, FiSend, FiX } from "react-icons/fi";
import { DESTRUCTIVE, confirmText, findActionables, needsTarget, runCall } from "@/utils/assistant/commands";
import { clientOps } from "./assistantActions";

const MAX_RECORD_MS = 60_000;

const GREETING = {
  role: "assistant",
  content:
    'Hi! Tell me what to do with your actionables, e.g. "Add call vendor tomorrow" or "Mark call vendor done". Voice recordings are transcribed by OpenAI.',
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
  const resolve = (index) =>
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, resolved: true } : m)));

  const execute = async (call, item) => {
    try {
      push({ role: "assistant", content: await runCall(call, item, clientOps(dispatch, user)) });
    } catch (err) {
      push({ role: "assistant", content: err.message, error: true });
    }
  };

  const handleCall = async (call, item) => {
    if (needsTarget(call.name) && !item) {
      const matches = await findActionables(call.args.query || "", clientOps(dispatch, user));
      if (!matches.length) return push({ role: "assistant", content: `No actionable matching "${call.args.query}".` });
      if (matches.length > 1) {
        return push({ role: "assistant", content: "Which one?", options: matches.slice(0, 5), call });
      }
      item = matches[0];
    }

    if (DESTRUCTIVE.has(call.name)) {
      return push({ role: "assistant", content: confirmText(call, item), confirm: { call, item } });
    }

    await execute(call, item);
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
    const history = [...messages, { role: "user", content }];
    push({ role: "user", content });

    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({
        messages: history.map(({ role, content }) => ({ role, content })),
        now: moment().format("dddd, YYYY-MM-DD HH:mm"),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Assistant unavailable.");
    if (data.call) await handleCall(data.call);
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

                {m.options && !m.resolved && (
                  <div className="mt-2 flex flex-col gap-1">
                    {m.options.map((item) => (
                      <button
                        key={item.actionableId}
                        disabled={busy}
                        onClick={() => {
                          resolve(i);
                          step(() => handleCall(m.call, item));
                        }}
                        className="cursor-pointer rounded-lg border border-[#D3E3FD] px-2 py-1 text-left hover:bg-[#F2F7FF]"
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}

                {m.confirm && !m.resolved && (
                  <div className="mt-2 flex gap-2">
                    <button
                      disabled={busy}
                      onClick={() => {
                        resolve(i);
                        step(() => execute(m.confirm.call, m.confirm.item));
                      }}
                      className="cursor-pointer rounded-full bg-red-600 px-3 py-1 text-white"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        resolve(i);
                        push({ role: "assistant", content: "Cancelled." });
                      }}
                      className="cursor-pointer rounded-full bg-[#999] px-3 py-1 text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
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
              placeholder={listening ? "Recording… tap mic to send" : "Type or speak a command"}
              aria-label="Command"
              maxLength={1000}
              className="flex-1 rounded-full bg-[#F4F5F7] px-4 py-2 text-[14px] outline-none"
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={busy && !listening}
                aria-label={listening ? "Stop recording" : "Speak a command"}
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
