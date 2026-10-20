"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheckSquare, FiPaperclip, FiSend, FiUserPlus, FiX } from "react-icons/fi";
import NewTopicModal, { CURRENT_USER_ID, PEOPLE, getInitials } from "./NewTopicModal";

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const formatDay = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const fileExt = (name = "") => (name.split(".").pop() || "file").slice(0, 4).toUpperCase();

function Avatar({ person, className = "w-9 h-9 text-[12px]" }) {
  return (
    <div
      className={`${className} rounded-full text-white font-bold flex items-center justify-center shrink-0`}
      style={{ backgroundColor: person?.color || "#94A3B8" }}
    >
      {getInitials(person?.name)}
    </div>
  );
}

function FileCard({ file }) {
  const ext = fileExt(file.name);
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 bg-white rounded-xl p-2.5 pr-5 max-w-[380px] hover:shadow-sm transition"
    >
      <div
        className={`w-11 h-11 rounded-lg text-white text-[12px] font-bold flex items-center justify-center shrink-0 ${
          ext === "PDF" ? "bg-[#DC2626]" : "bg-[#1D72E8]"
        }`}
      >
        {ext}
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-bold text-[#1E293B] truncate">{file.name}</p>
        <p className="text-[13px] text-[#94A3B8]">
          {ext} file, {formatSize(file.size)}
        </p>
      </div>
    </a>
  );
}

function ApprovalCard({ approval, approver }) {
  const firstName = approver?.name?.split(" ")[0] || "approver";
  return (
    <div className="bg-white rounded-xl px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <span className="px-2.5 py-1 rounded-md bg-[#E3EDFD] text-[#0B57D0] text-[14px] font-bold">
          Approval pending
        </span>
        <span className="text-[15px] text-[#64748B]">
          Approval from <b className="text-[#1E293B]">{firstName}</b>
        </span>
      </div>
      {approval.amount && (
        <p className="text-[28px] font-bold text-[#1E293B] mt-2">
          ₹{Number(approval.amount).toLocaleString("en-IN")}
        </p>
      )}
      <p className="text-[14px] text-[#94A3B8] mt-1">Waiting for {firstName}</p>
    </div>
  );
}

function Message({ message, author, approver }) {
  const isMine = message.authorId === CURRENT_USER_ID;
  const hasCards = message.files?.length > 0 || message.approval;

  const body = (
    <div
      className={`rounded-2xl space-y-2.5 ${
        hasCards ? "p-4" : "px-4 py-3"
      } ${isMine ? "bg-[#DCE7FB] border border-[#C9DAF8]" : "bg-white border border-[#E2E8F0]"}`}
    >
      {message.text && (
        <p className="text-[16px] leading-[160%] text-[#1E293B] whitespace-pre-wrap break-words">{message.text}</p>
      )}
      {message.files?.map((f) => (
        <FileCard key={f.id} file={f} />
      ))}
      {message.approval && <ApprovalCard approval={message.approval} approver={approver} />}
    </div>
  );

  if (isMine) {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[60%] min-w-[200px]">{body}</div>
        <span className="text-[13px] text-[#94A3B8] mt-1.5">{formatTime(message.createdAt)}</span>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Avatar person={author} />
      <div className="max-w-[60%] min-w-0">
        <p className="text-[15px] mb-1.5">
          <span className="font-bold text-[#1E293B]">{author?.name}</span>{" "}
          <span className="text-[13px] text-[#64748B]">{author?.role}</span>
        </p>
        {body}
        <span className="block text-[13px] text-[#94A3B8] mt-1.5">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}

export default function ChatPanel({ topic, onSend, onUpdatePeople }) {
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [needApproval, setNeedApproval] = useState(false);
  const [amount, setAmount] = useState("");
  const [approverId, setApproverId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const people = topic.people || [];
  const others = people.filter((p) => p.id !== CURRENT_USER_ID);
  // Falls back to the full list so messages from removed people still show their name
  const personById = (id) => people.find((p) => p.id === id) || PEOPLE.find((p) => p.id === id);
  const messages = topic.messages || [];

  // Keep the latest message in view
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const addFiles = (fileList) => {
    const added = Array.from(fileList || []).map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}`,
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
    }));
    setFiles((prev) => [...prev, ...added.filter((a) => !prev.some((p) => p.id === a.id))]);
  };

  const canSend =
    (text.trim() || files.length > 0) && (!needApproval || (approverId && Number(amount) > 0));

  const handleSend = () => {
    if (!canSend) return;
    onSend({
      id: Date.now(),
      authorId: CURRENT_USER_ID,
      text: text.trim(),
      files,
      approval: needApproval ? { amount, approverId, status: "pending" } : null,
      createdAt: new Date().toISOString(),
    });
    setText("");
    setFiles([]);
    setNeedApproval(false);
    setAmount("");
    setApproverId("");
  };

  const subtitle = [topic.event, `${people.length} ${people.length === 1 ? "person" : "people"}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-7 py-5 border-b border-[#DCE5F3] shrink-0">
        <div className="min-w-0">
          <h3 className="text-[24px] font-semibold text-[#1E293B] truncate">{topic.title}</h3>
          <p className="text-[15px] text-[#64748B] truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex -space-x-2">
            {people.slice(0, 4).map((p) => (
              <Avatar key={p.id} person={p} className="w-9 h-9 text-[12px] ring-2 ring-[#F2F7FF]" />
            ))}
            {people.length > 4 && (
              <div className="w-9 h-9 rounded-full bg-[#E2E8F0] text-[#475569] text-[12px] font-bold flex items-center justify-center ring-2 ring-[#F2F7FF]">
                +{people.length - 4}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsPeopleOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full border border-[#0B57D0] text-[#0B57D0] text-[15px] font-bold bg-white hover:bg-[#D3E3FD]/50 transition cursor-pointer"
          >
            <FiUserPlus className="text-[17px]" />
            Add people
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-7 py-5 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-[#333333] font-bold text-[18px]">No messages yet</p>
            <p className="text-[#777777] text-[15px] mt-1">Send the first message to start this discussion.</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const showDay = i === 0 || formatDay(m.createdAt) !== formatDay(messages[i - 1].createdAt);
            return (
              <div key={m.id}>
                {showDay && (
                  <div className="flex items-center gap-4 mb-5">
                    <div className="flex-1 h-px bg-[#DCE5F3]" />
                    <span className="text-[14px] font-bold text-[#94A3B8]">{formatDay(m.createdAt)}</span>
                    <div className="flex-1 h-px bg-[#DCE5F3]" />
                  </div>
                )}
                <Message
                  message={m}
                  author={personById(m.authorId)}
                  approver={m.approval ? personById(m.approval.approverId) : null}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="px-7 pb-6 pt-2 shrink-0">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`bg-white rounded-2xl border transition ${
            isDragging ? "border-[#0B57D0] border-dashed bg-[#F8FBFF]" : "border-[#E2E8F0]"
          }`}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder="Write a message, or drop files here"
            className="w-full resize-none px-5 pt-4 text-[16px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none bg-transparent"
          />

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 px-5 pb-2">
              {files.map((f) => (
                <span
                  key={f.id}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#F1F5F9] text-[13px] font-semibold text-[#334155]"
                >
                  <span className="max-w-[180px] truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((p) => p.id !== f.id))}
                    className="text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                  >
                    <FiX className="text-[13px]" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {needApproval && (
            <div className="flex flex-wrap items-center gap-3 px-5 pb-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-[#64748B]">₹</span>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-[150px] h-9 pl-7 pr-3 rounded-lg border border-[#E2E8F0] text-[14px] outline-none focus:border-[#0B57D0]"
                />
              </div>
              <select
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-[14px] text-[#1E293B] outline-none focus:border-[#0B57D0] cursor-pointer"
              >
                <option value="">Approval from…</option>
                {others.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {others.length === 0 && (
                <span className="text-[13px] text-[#B45309]">Add people to this topic to request approval.</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between px-4 pb-3.5 pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition cursor-pointer"
              >
                <FiPaperclip className="text-[20px]" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => setNeedApproval((v) => !v)}
                className={`inline-flex items-center gap-2 h-9 px-4 rounded-full border text-[15px] font-bold transition cursor-pointer ${
                  needApproval
                    ? "bg-[#D3E3FD] border-[#B6CFF5] text-[#0B57D0]"
                    : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#B6CFF5]"
                }`}
              >
                <FiCheckSquare className="text-[16px]" />
                Need approval
              </button>
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#1D72E8] text-white text-[16px] font-bold hover:bg-[#0B57D0] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="text-[17px]" />
              Send
            </button>
          </div>
        </div>
      </div>

      {isPeopleOpen && (
        <NewTopicModal topic={topic} onClose={() => setIsPeopleOpen(false)} onSave={onUpdatePeople} />
      )}
    </div>
  );
}
