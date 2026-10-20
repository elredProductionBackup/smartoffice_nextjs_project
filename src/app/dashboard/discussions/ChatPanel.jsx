"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiCheck,
  FiCheckSquare,
  FiChevronDown,
  FiCornerUpLeft,
  FiMail,
  FiPaperclip,
  FiSend,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { MdOutlineAddReaction } from "react-icons/md";
import NewTopicModal, { CURRENT_USER_ID, PEOPLE, getInitials } from "./NewTopicModal";

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export const formatDay = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const QUICK_REACTIONS = ["👍", "✌️", "✅", "🙌", "❤️"];
const MORE_REACTIONS = ["😀", "😂", "😍", "🤔", "😮", "😢", "🙏", "👏", "🔥", "🎉", "💯", "👀", "👌", "🤝", "🚀", "❌"];

const fileExt =(name = "") => (name.split(".").pop() || "file").slice(0, 4).toUpperCase();

export function Avatar({ person, className = "w-9 h-9 text-[12px]" }) {
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
  // Dummy files have no url, so render them as a plain card
  const Tag = file.url ? "a" : "div";
  return (
    <Tag
      {...(file.url && { href: file.url, target: "_blank", rel: "noreferrer" })}
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
    </Tag>
  );
}

const APPROVAL_STATUS = {
  pending: { className: "bg-[#E3EDFD] text-[#0B57D0]" },
  approved: { className: "bg-[#DCFCE7] text-[#15803D]" },
  declined: { className: "bg-[#FEE2E2] text-[#B91C1C]" },
};

export function ApprovalCard({ approval, approver, tinted, compact, onDecide, onAskWhy }) {
  const btnSize = compact ? "h-9 px-4 text-[14px]" : "h-11 px-6 text-[16px]";
  const isMeApprover = approval.approverId === CURRENT_USER_ID;
  const firstName = isMeApprover ? "you" : approver?.name?.split(" ")[0] || "approver";
  const status = APPROVAL_STATUS[approval.status] || APPROVAL_STATUS.pending;

  return (
    // Received cards sit in a white bubble, so they get a tinted background instead
    <div className={`rounded-xl ${compact ? "px-3 py-3" : "px-4 py-3.5"} ${tinted ? "bg-[#EEF4FF]" : "bg-white"}`}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <span className={`px-2.5 py-1 rounded-md text-[14px] font-bold ${status.className}`}>
          {approval.status === "approved"
            ? approval.approveLabel === "Approve" ? "Approved" : approval.approveLabel
            : approval.status === "declined"
              ? approval.declineLabel === "Decline" ? "Declined" : approval.declineLabel
              : "Approval pending"}
        </span>
        <span className="text-[15px] text-[#64748B]">
          {approval.status === "pending" ? "Approval from" : "By"} <b className="text-[#1E293B]">{firstName}</b>
        </span>
      </div>
      {Number(approval.amount) > 0 && (
        <p className={`${compact ? "text-[22px]" : "text-[28px]"} font-bold text-[#1E293B] mt-2`}>
          ₹{Number(approval.amount).toLocaleString("en-IN")}
        </p>
      )}

      {approval.status !== "pending" ? (
        approval.decidedAt && (
          <p suppressHydrationWarning className="text-[14px] text-[#94A3B8] mt-1">
            {formatDay(approval.decidedAt)}, {formatTime(approval.decidedAt)}
          </p>
        )
      ) : isMeApprover ? (
        <div className={`flex flex-wrap items-center ${compact ? "gap-2" : "gap-3"} mt-3`}>
          <button
            type="button"
            onClick={() => onDecide("approved")}
            className={`${btnSize} rounded-full bg-[#1D72E8] text-white font-bold hover:bg-[#0B57D0] transition cursor-pointer`}
          >
            {approval.approveLabel}
          </button>
          <button
            type="button"
            onClick={() => onDecide("declined")}
            className={`${btnSize} rounded-full border border-[#0B57D0] bg-white text-[#0B57D0] font-bold hover:bg-[#D3E3FD]/50 transition cursor-pointer`}
          >
            {approval.declineLabel}
          </button>
          <button
            type="button"
            onClick={onAskWhy}
            className={`${compact ? "h-9 text-[14px]" : "h-11 text-[16px]"} px-1.5 font-bold text-[#0B57D0] hover:underline cursor-pointer`}
          >
            Ask why
          </button>
        </div>
      ) : (
        <p className="text-[14px] text-[#94A3B8] mt-1">
          Waiting for {firstName} to {approval.approveLabel.toLowerCase()} or {approval.declineLabel.toLowerCase()}
        </p>
      )}

      {(approval.notifyEmail || approval.notifyWhatsapp) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F5F9]">
          <span className="text-[13px] text-[#94A3B8]">Notified via</span>
          {approval.notifyEmail && <NotifyTag icon={FiMail} label="Email" className="text-[#0B57D0] border-[#C9DAF8]" />}
          {approval.notifyWhatsapp && (
            <NotifyTag icon={FaWhatsapp} label="WhatsApp" className="text-[#16A34A] border-[#BBE5C8]" />
          )}
        </div>
      )}
    </div>
  );
}

function NotifyTag({ icon: Icon, label, className }) {
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[13px] font-bold ${className}`}>
      <Icon className="text-[14px]" />
      {label}
    </span>
  );
}

// Opens upwards since the composer sits at the bottom of the chat
function PersonSelect({ people, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = people.find((p) => p.id === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={people.length === 0}
        className={`w-full h-12 flex items-center gap-2.5 pl-3 pr-3.5 rounded-xl border bg-white text-left transition cursor-pointer disabled:cursor-not-allowed disabled:bg-[#F8FAFC] ${
          open ? "border-[#0B57D0] ring-2 ring-[#D3E3FD]" : "border-[#B6CFF5] hover:border-[#0B57D0]"
        }`}
      >
        {selected ? (
          <>
            <Avatar person={selected} className="w-7 h-7 text-[11px]" />
            <span className="flex-1 min-w-0 text-[16px] font-semibold text-[#1E293B] truncate">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-[16px] text-[#94A3B8] pl-1">Select person</span>
        )}
        <FiChevronDown
          className={`text-[18px] text-[#64748B] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 z-20 w-full min-w-[260px] max-h-[260px] overflow-y-auto bg-white rounded-xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] py-1.5">
          {people.map((p) => {
            const isSelected = p.id === value;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition cursor-pointer ${
                  isSelected ? "bg-[#F2F7FF]" : "hover:bg-[#F8FAFC]"
                }`}
              >
                <Avatar person={p} className="w-8 h-8 text-[12px]" />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-[#1E293B] truncate">{p.name}</p>
                  <p className="text-[13px] text-[#64748B] truncate">{p.role}</p>
                </div>
                {isSelected && <FiCheck className="text-[18px] text-[#0B57D0] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Toggle({ icon: Icon, label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 h-9 pl-3.5 pr-2.5 rounded-full border text-[15px] font-bold text-[#334155] transition cursor-pointer ${
        checked ? "border-[#B6CFF5] bg-[#F5F9FF]" : "border-[#E2E8F0] hover:border-[#B6CFF5]"
      }`}
    >
      <Icon className="text-[16px]" />
      {label}
      <span
        className={`relative w-9 h-5 rounded-full transition ${checked ? "bg-[#1D72E8]" : "bg-[#CBD5E1]"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
    </button>
  );
}

function Message({
  message,
  author,
  approver,
  replyTo,
  personById,
  highlighted,
  onReact,
  onReply,
  onDecide,
  onOpenThread,
}) {
  const isMine = message.authorId === CURRENT_USER_ID;
  const hasCards = message.files?.length > 0 || message.approval;
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!isPickerOpen) return;
    const onDown = (e) => !pickerRef.current?.contains(e.target) && setIsPickerOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isPickerOpen]);

  const react = (emoji) => {
    onReact(message.id, emoji);
    setIsPickerOpen(false);
  };

  const threadCount = message.thread?.length || 0;
  const reactions = Object.entries(message.reactions || {}).filter(([, users]) => users.length > 0);

  const body = (
    <div
      className={`rounded-2xl space-y-2.5 ${
        hasCards ? "p-4" : "px-4 py-3"
      } ${isMine ? "bg-[#DCE7FB] border border-[#C9DAF8]" : "bg-white border border-[#E2E8F0]"} ${
        highlighted ? "ring-2 ring-[#1D72E8]" : ""
      }`}
    >
      {replyTo && (
        <button
          type="button"
          onClick={() => document.getElementById(`msg-${replyTo.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="block w-full text-left border-l-[3px] border-[#1D72E8] bg-white/70 rounded-r-lg px-3 py-1.5 cursor-pointer hover:bg-white transition"
        >
          <p className="text-[13px] font-bold text-[#0B57D0]">{replyTo.authorName}</p>
          <p className="text-[13px] text-[#64748B] truncate">{replyTo.preview}</p>
        </button>
      )}
      {message.text && (
        <p className="text-[16px] leading-[160%] text-[#1E293B] whitespace-pre-wrap break-words">{message.text}</p>
      )}
      {message.files?.map((f) => (
        <FileCard key={f.id} file={f} />
      ))}
      {message.approval && (
        <ApprovalCard
          approval={message.approval}
          approver={approver}
          tinted={!isMine}
          onDecide={(status) => onDecide(message.id, status)}
          onAskWhy={() => onOpenThread(message.id, "Why do we need this?")}
        />
      )}
    </div>
  );

  // Floating toolbar shown on hover, anchored to the bubble's top corner
  const toolbar = (
    <div
      ref={pickerRef}
      className={`absolute -top-6 z-10 ${isMine ? "right-3" : "left-3"} ${
        isPickerOpen ? "flex" : "hidden group-hover:flex"
      } flex-col ${isMine ? "items-end" : "items-start"}`}
    >
      <div className="flex items-center gap-0.5 bg-white rounded-full border border-[#E2E8F0] shadow-[0_4px_14px_rgba(15,23,42,0.12)] px-1.5 py-1">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => react(emoji)}
            className={`w-9 h-9 rounded-full text-[20px] flex items-center justify-center transition hover:bg-[#F1F5F9] hover:scale-110 cursor-pointer ${
              message.reactions?.[emoji]?.includes(CURRENT_USER_ID) ? "bg-[#E3EDFD]" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
        <span className="w-px h-6 bg-[#E2E8F0] mx-1" />
        <button
          type="button"
          title="More reactions"
          onClick={() => setIsPickerOpen((v) => !v)}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-[#475569] transition hover:bg-[#F1F5F9] cursor-pointer ${
            isPickerOpen ? "bg-[#F1F5F9]" : ""
          }`}
        >
          <MdOutlineAddReaction className="text-[20px]" />
        </button>
        <button
          type="button"
          title="Reply"
          onClick={() => onReply(message)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#475569] transition hover:bg-[#F1F5F9] cursor-pointer"
        >
          <FiCornerUpLeft className="text-[18px]" />
        </button>
      </div>

      {isPickerOpen && (
        <div className="mt-1.5 grid grid-cols-8 gap-0.5 bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] p-2">
          {MORE_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => react(emoji)}
              className="w-9 h-9 rounded-lg text-[20px] flex items-center justify-center transition hover:bg-[#F1F5F9] cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const meta = (
    <div className={`flex flex-wrap items-center gap-2 mt-1.5 ${isMine ? "justify-end" : ""}`}>
      {!isMine && (
        <span suppressHydrationWarning className="text-[13px] text-[#94A3B8] mr-1">
          {formatTime(message.createdAt)}
        </span>
      )}
      {threadCount > 0 && (
        <button
          type="button"
          onClick={() => onOpenThread(message.id)}
          className="text-[14px] font-bold text-[#0B57D0] hover:underline cursor-pointer px-1"
        >
          {threadCount} {threadCount === 1 ? "reply" : "replies"}
        </button>
      )}
      {reactions.map(([emoji, users]) => {
        const mine = users.includes(CURRENT_USER_ID);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(message.id, emoji)}
            title={users.map((id) => (id === CURRENT_USER_ID ? "You" : personById(id)?.name)).join(", ")}
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-[14px] font-bold transition cursor-pointer ${
              mine
                ? "bg-[#E3EDFD] border-[#B6CFF5] text-[#0B57D0]"
                : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#B6CFF5]"
            }`}
          >
            <span className="text-[15px]">{emoji}</span>
            {users.length}
          </button>
        );
      })}
      {!isMine && (
        <button
          type="button"
          onClick={() => onReply(message)}
          className="text-[14px] font-bold text-[#0B57D0] hover:underline cursor-pointer px-1"
        >
          Reply
        </button>
      )}
      {isMine && (
        <span suppressHydrationWarning className="text-[13px] text-[#94A3B8] ml-1">
          {formatTime(message.createdAt)}
        </span>
      )}
    </div>
  );

  if (isMine) {
    return (
      <div id={`msg-${message.id}`} className="flex flex-col items-end">
        <div className="group relative max-w-[60%] min-w-[200px]">
          {toolbar}
          {body}
        </div>
        {meta}
      </div>
    );
  }

  return (
    <div id={`msg-${message.id}`} className="flex gap-3">
      <Avatar person={author} />
      <div className="max-w-[60%] min-w-0">
        <p className="text-[15px] mb-1.5">
          <span className="font-bold text-[#1E293B]">{author?.name}</span>{" "}
          <span className="text-[13px] text-[#64748B]">{author?.role}</span>
        </p>
        <div className="group relative">
          {toolbar}
          {body}
        </div>
        {meta}
      </div>
    </div>
  );
}

export default function ChatPanel({
  topic,
  threadMessageId,
  onSend,
  onReact,
  onDecide,
  onOpenThread,
  onUpdatePeople,
}) {
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [needApproval, setNeedApproval] = useState(false);
  const [amount, setAmount] = useState("");
  const [approverId, setApproverId] = useState("");
  const [approveLabel, setApproveLabel] = useState("Approve");
  const [declineLabel, setDeclineLabel] = useState("Decline");
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);

  const people = topic.people || [];
  const others = people.filter((p) => p.id !== CURRENT_USER_ID);
  // Falls back to the full list so messages from removed people still show their name
  const personById = (id) => people.find((p) => p.id === id) || PEOPLE.find((p) => p.id === id);
  const messages = topic.messages || [];

  const replyPreview = (msg) =>
    msg && {
      id: msg.id,
      authorName: msg.authorId === CURRENT_USER_ID ? "You" : personById(msg.authorId)?.name,
      preview: msg.text || msg.files?.[0]?.name || "Approval request",
    };

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

  // An approval request can be sent on its own; otherwise a message needs text or files
  const canSend = needApproval
    ? Boolean(approverId && approveLabel.trim() && declineLabel.trim())
    : Boolean(text.trim() || files.length > 0);

  const approverName = personById(approverId)?.name?.split(" ")[0];
  const notifyChannels = [notifyEmail && "Email", notifyWhatsapp && "WhatsApp"].filter(Boolean);

  const handleSend = () => {
    if (!canSend) return;
    onSend({
      id: Date.now(),
      authorId: CURRENT_USER_ID,
      text: text.trim(),
      files,
      approval: needApproval
        ? {
            amount,
            approverId,
            approveLabel: approveLabel.trim(),
            declineLabel: declineLabel.trim(),
            notifyEmail,
            notifyWhatsapp,
            status: "pending",
          }
        : null,
      replyToId: replyTo?.id ?? null,
      reactions: {},
      createdAt: new Date().toISOString(),
    });
    setReplyTo(null);
    setText("");
    setFiles([]);
    setNeedApproval(false);
    setApproveLabel("Approve");
    setDeclineLabel("Decline");
    setNotifyEmail(false);
    setNotifyWhatsapp(false);
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
                    <span suppressHydrationWarning className="text-[14px] font-bold text-[#94A3B8]">{formatDay(m.createdAt)}</span>
                    <div className="flex-1 h-px bg-[#DCE5F3]" />
                  </div>
                )}
                <Message
                  message={m}
                  author={personById(m.authorId)}
                  approver={m.approval ? personById(m.approval.approverId) : null}
                  replyTo={m.replyToId ? replyPreview(messages.find((x) => x.id === m.replyToId)) : null}
                  personById={personById}
                  onReact={onReact}
                  onDecide={onDecide}
                  onOpenThread={onOpenThread}
                  highlighted={m.id === threadMessageId}
                  onReply={(msg, draft) => {
                    setReplyTo(msg);
                    if (draft) setText(draft);
                    textareaRef.current?.focus();
                  }}
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
          {replyTo && (
            <div className="flex items-start gap-3 mx-4 mt-3 border-l-[3px] border-[#1D72E8] bg-[#F2F7FF] rounded-r-lg px-3 py-2">
              <FiCornerUpLeft className="text-[16px] text-[#0B57D0] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#0B57D0]">Replying to {replyPreview(replyTo).authorName}</p>
                <p className="text-[13px] text-[#64748B] truncate">{replyPreview(replyTo).preview}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-[#64748B] hover:text-[#1E293B] cursor-pointer shrink-0"
              >
                <FiX className="text-[16px]" />
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
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
            <div className="mx-4 mt-1 pt-4 pb-1 border-t border-[#E2E8F0]">
              <div className="grid grid-cols-[1fr_0.85fr_1.5fr] gap-4">
                <div className="min-w-0">
                  <span className="block text-[14px] font-bold text-[#475569] mb-1.5">Approval from</span>
                  <PersonSelect people={others} value={approverId} onChange={setApproverId} />
                </div>

                <label className="block min-w-0">
                  <span className="block text-[14px] font-bold text-[#475569] mb-1.5">Amount (optional)</span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-[#64748B]">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="10,000"
                      className="w-full h-12 pl-9 pr-3 rounded-xl border border-[#E2E8F0] text-[16px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#0B57D0]"
                    />
                  </div>
                </label>

                <div className="min-w-0">
                  <span className="block text-[14px] font-bold text-[#475569] mb-1.5">Button text</span>
                  {/* Editable labels for the buttons the approver will see */}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={approveLabel}
                      onChange={(e) => setApproveLabel(e.target.value)}
                      maxLength={20}
                      placeholder="Approve"
                      title="Click to rename"
                      className="w-full h-12 px-3 rounded-full bg-[#1D72E8] text-white text-[16px] font-bold text-center placeholder:text-white/60 outline-none focus:ring-2 focus:ring-[#B6CFF5] cursor-text"
                    />
                    <input
                      value={declineLabel}
                      onChange={(e) => setDeclineLabel(e.target.value)}
                      maxLength={20}
                      placeholder="Decline"
                      title="Click to rename"
                      className="w-full h-12 px-3 rounded-full border border-[#0B57D0] bg-white text-[#0B57D0] text-[16px] font-bold text-center placeholder:text-[#0B57D0]/50 outline-none focus:ring-2 focus:ring-[#B6CFF5] cursor-text"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="text-[14px] font-bold text-[#475569]">Also notify by</span>
                <Toggle icon={FiMail} label="Email" checked={notifyEmail} onChange={setNotifyEmail} />
                <Toggle icon={FaWhatsapp} label="WhatsApp" checked={notifyWhatsapp} onChange={setNotifyWhatsapp} />
              </div>

              <p className="text-[13px] text-[#94A3B8] mt-2.5">
                {others.length === 0
                  ? "Add people to this topic to request approval."
                  : !approverName
                    ? "Pick who should approve this request."
                    : notifyChannels.length
                      ? `${approverName} will see this in Discussions and get it on ${notifyChannels.join(" and ")}.`
                      : `${approverName} will only see this in Discussions.`}
              </p>
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
