"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiCornerUpLeft, FiDownload, FiEdit2, FiExternalLink, FiMail, FiTrash2, FiX } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { MdOutlineAddReaction } from "react-icons/md";
import EventActionConfirmModal from "@/_components/EventsComps/EventActionConfirmModal";
import { openThread } from "@/store/discussions/discussionsSlice";
import {
  cancelApproval,
  decideApproval,
  discardFailed,
  remindApprover,
  retrySend,
  toggleReaction,
} from "@/store/discussions/discussionsThunks";
import {
  colorFor,
  formatAmount,
  formatBytes,
  formatDay,
  formatTime,
  getInitials,
  isAllowedFile,
  MAX_FILE_BYTES,
  MAX_FILES,
  noteText,
} from "@/store/discussions/discussionsUtils";

// ⚠️ The server accepts only the 24 emojis in its picker. Keep these lists inside that set.
export const QUICK_REACTIONS = ["👍", "✌️", "✅", "🙌", "❤️"];
export const MORE_REACTIONS = ["😀", "😂", "😍", "🤔", "😮", "😢", "🙏", "👏", "🔥", "🎉", "💯", "👀", "👌", "🤝", "🚀", "❌"];

export const useMe = () => useSelector((s) => s.discussions.myUserCode);

// budgetTypeId -> name; portfolio ids on users are budget types
export function usePortfolioNames() {
  const types = useSelector((s) => s.budget?.budgetTypes);
  return useMemo(() => Object.fromEntries((types || []).map((t) => [t.budgetTypeId, t.budgetType])), [types]);
}

// The app's own confirmation popup (same one User Management uses), instead of window.confirm.
// ask({ title, message, confirmText, cancelText, onConfirm }) opens it. onConfirm may return a
// promise: the popup shows its loader until it settles, then closes. Failures surface in the page banner.
export function useConfirmDialog() {
  const [request, setRequest] = useState(null);
  const [busy, setBusy] = useState(false);
  const ask = useCallback((next) => setRequest(next), []);

  const cancel = () => !busy && setRequest(null);
  const confirm = async () => {
    setBusy(true);
    try {
      await request.onConfirm();
    } catch {
      /* shown in the banner */
    } finally {
      setBusy(false);
      setRequest(null);
    }
  };

  // Rendered into <body> so a message bubble or panel can never clip or stack above it
  const dialog =
    request && typeof document !== "undefined"
      ? createPortal(
          <EventActionConfirmModal
            title={request.title}
            message={request.message}
            confirmText={request.confirmText || "Delete"}
            cancelText={request.cancelText || "Cancel"}
            isLoading={busy}
            onConfirm={confirm}
            onCancel={cancel}
          />,
          document.body
        )
      : null;

  return [ask, dialog];
}

export function useOutsideClick(ref, active, onOutside) {
  useEffect(() => {
    if (!active) return;
    const onDown = (e) => !ref.current?.contains(e.target) && onOutside();
    const onKey = (e) => e.key === "Escape" && onOutside();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, active, onOutside]);
}

// Files picked in a composer: the File for upload plus a preview for the pending message.
// Enforces the API limits: up to 10 files, 25 MB each, PNG, JPG, WEBP, PDF, DOCX, XLS or HTML.
export function useAttachments() {
  const [items, setItems] = useState([]);
  const [problem, setProblem] = useState("");
  const keyOf = (f) => `${f.name}-${f.size}-${f.lastModified}`;

  const add = (fileList) => {
    const known = new Set(items.map((i) => i.key));
    const picked = Array.from(fileList || []).filter((f) => !known.has(keyOf(f)));
    const wrongType = picked.filter((f) => !isAllowedFile(f));
    const tooBig = picked.filter((f) => isAllowedFile(f) && f.size > MAX_FILE_BYTES);
    const ok = picked.filter((f) => isAllowedFile(f) && f.size > 0 && f.size <= MAX_FILE_BYTES);
    const room = Math.max(0, MAX_FILES - items.length);

    const notes = [];
    if (wrongType.length) notes.push(`${wrongType.map((f) => f.name).join(", ")}: only PNG, JPG, WEBP, PDF, DOCX, XLS or HTML`);
    if (tooBig.length) notes.push(`${tooBig.map((f) => f.name).join(", ")}: over 25 MB`);
    if (ok.length > room) notes.push(`Up to ${MAX_FILES} files per message`);
    setProblem(notes.join(". "));

    const added = ok
      .slice(0, room)
      .map((file) => ({
        key: keyOf(file),
        file,
        preview: {
          name: file.name,
          ext: (file.name.split(".").pop() || "file").toLowerCase(),
          size: null,
          bytes: file.size,
          url: URL.createObjectURL(file),
        },
      }));
    if (added.length) setItems((prev) => [...prev, ...added]);
  };
  const remove = (key) =>
    setItems((prev) => {
      const gone = prev.find((i) => i.key === key);
      if (gone) URL.revokeObjectURL(gone.preview.url);
      return prev.filter((i) => i.key !== key);
    });
  // After sending, the previews belong to the pending message, so they are not revoked here
  const clear = () => {
    setItems([]);
    setProblem("");
  };

  return { items, add, remove, clear, problem };
}

// dotRing should match the surface behind the avatar so the dot looks cut out of it
export function Avatar({ person, className = "w-9 h-9 text-[12px]", online = false, dotRing = "ring-[#F2F7FF]", style }) {
  const [broken, setBroken] = useState(false);
  const showImage = person?.dpURL && !broken;
  return (
    <div className={`relative rounded-full shrink-0 ${className}`} style={style}>
      {showImage ? (
        <img src={person.dpURL} alt="" className="w-full h-full rounded-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <div
          className="w-full h-full rounded-full text-white font-bold flex items-center justify-center"
          style={{ backgroundColor: colorFor(person?.userCode || person?.name) }}
        >
          {getInitials(person?.name)}
        </div>
      )}
      {online && (
        <span
          aria-hidden="true"
          className={`absolute bottom-0 right-0 z-10 w-[11px] h-[11px] rounded-full bg-[#16A34A] ring-2 ${dotRing}`}
        />
      )}
    </div>
  );
}

// Everyone the socket reports online in any of my topic rooms, plus me while connected.
// One set for the whole page, so a person is never online in one topic and offline in another.
export function useOnlineSet() {
  const online = useSelector((s) => s.discussions.online);
  const connected = useSelector((s) => s.discussions.socketStatus === "connected");
  const me = useMe();
  return useMemo(() => {
    const set = new Set(Object.values(online).flat());
    if (connected && me) set.add(me);
    return set;
  }, [online, connected, me]);
}

export function PersonAvatar({ code, ...rest }) {
  const person = useSelector((s) => (code ? s.discussions.usersMap[code] : null));
  return <Avatar person={person || { userCode: code, name: "" }} {...rest} />;
}

export function DayDivider({ label }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="flex-1 h-px bg-[#DCE5F3]" />
      <span suppressHydrationWarning className="text-[14px] font-bold text-[#94A3B8]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#DCE5F3]" />
    </div>
  );
}

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
export const isImageFile = (file) => IMAGE_EXTS.has(String(file?.ext || "").toLowerCase());

// Full-screen preview for an image attachment. Rendered into <body> so no chat bubble can clip it.
function ImageLightbox({ file, size, onClose }) {
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // keep the page behind from scrolling
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const closeOnBackdrop = (e) => e.target === e.currentTarget && onClose();
  const action =
    "w-10 h-10 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15 transition cursor-pointer";

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={file.name} className="fixed inset-0 z-[60] flex flex-col bg-black/80 font-nunito" onMouseDown={closeOnBackdrop}>
      <div className="flex items-center gap-3 px-5 py-4 shrink-0" onMouseDown={closeOnBackdrop}>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold text-white truncate">{file.name}</p>
          {size && <p className="text-[13px] text-white/60">{size}</p>}
        </div>
        <a href={file.url} target="_blank" rel="noreferrer" title="Open in new tab" className={action}>
          <FiExternalLink className="text-[19px]" />
        </a>
        <a href={file.url} download={file.name} target="_blank" rel="noreferrer" title="Download" className={action}>
          <FiDownload className="text-[19px]" />
        </a>
        <button type="button" title="Close" autoFocus onClick={onClose} className={action}>
          <FiX className="text-[22px]" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center px-6 pb-6" onMouseDown={closeOnBackdrop}>
        {status === "loading" && <p className="absolute text-[15px] text-white/70">Loading image…</p>}
        {status === "error" ? (
          <div className="text-center">
            <p className="text-[16px] font-semibold text-white">This image could not be shown.</p>
            <a href={file.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[15px] font-bold text-[#93C5FD] hover:underline">
              Open it in a new tab
            </a>
          </div>
        ) : (
          <img
            src={file.url}
            alt={file.name}
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
            className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity ${status === "ready" ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

// Long names shorten in the middle of the name, never the extension: "463301abf06fbe…929.png"
function FileName({ name = "" }) {
  const dot = name.lastIndexOf(".");
  const hasExt = dot > 0 && name.length - dot <= 6;
  const base = hasExt ? name.slice(0, dot) : name;
  const ext = hasExt ? name.slice(dot) : "";
  return (
    <p title={name} className="flex min-w-0 text-[15px] font-bold text-[#1E293B]">
      <span className="truncate">{base}</span>
      {ext && <span className="shrink-0">{ext}</span>}
    </p>
  );
}

export function FileCard({ file }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [thumbBroken, setThumbBroken] = useState(false);
  const ext = (file.ext || "file").slice(0, 4).toUpperCase();
  const size = typeof file.size === "string" ? file.size : formatBytes(file.bytes ?? file.size);
  const isImage = isImageFile(file) && Boolean(file.url);
  const closePreview = useCallback(() => setPreviewOpen(false), []);

  const icon =
    isImage && !thumbBroken ? (
      <img src={file.url} alt="" loading="lazy" onError={() => setThumbBroken(true)} className="w-11 h-11 rounded-lg object-cover bg-[#F1F5F9] shrink-0" />
    ) : (
      <div
        className={`w-11 h-11 rounded-lg text-white text-[12px] font-bold flex items-center justify-center shrink-0 ${
          ext === "PDF" ? "bg-[#DC2626]" : "bg-[#1D72E8]"
        }`}
      >
        {ext}
      </div>
    );

  const body = (
    <>
      {icon}
      <div className="min-w-0 flex-1">
        <FileName name={file.name} />
        <p className="text-[13px] text-[#94A3B8]">
          {ext} file{size ? `, ${size}` : ""}
        </p>
      </div>
    </>
  );
  // w-full + min-w-0: the card fits whatever holds it (bubble or replies panel) instead of the name's length
  const cardClass =
    "flex items-center gap-3 w-full min-w-0 max-w-[380px] bg-white rounded-xl p-2.5 pr-4 text-left hover:shadow-sm transition";

  // Images open in the popup; other files still open in a new tab
  if (isImage) {
    return (
      <>
        <button type="button" title="Preview image" onClick={() => setPreviewOpen(true)} className={`${cardClass} cursor-zoom-in`}>
          {body}
        </button>
        {previewOpen && <ImageLightbox file={file} size={size} onClose={closePreview} />}
      </>
    );
  }
  if (file.url) {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" className={cardClass}>
        {body}
      </a>
    );
  }
  return <div className={cardClass}>{body}</div>;
}

function NotifyTag({ icon: Icon, label, className }) {
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[13px] font-bold ${className}`}>
      <Icon className="text-[14px]" />
      {label}
    </span>
  );
}

const STATUS_STYLE = {
  pending: "bg-[#E3EDFD] text-[#0B57D0]",
  approved: "bg-[#DCFCE7] text-[#15803D]",
  declined: "bg-[#FEE2E2] text-[#B91C1C]",
  cancelled: "bg-[#F1F5F9] text-[#475569]",
};

const REMIND_CHANNELS = [
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "both", label: "Both" },
];

export const ApprovalCard = memo(function ApprovalCard({ message, compact = false, tinted = false }) {
  const dispatch = useDispatch();
  const me = useMe();
  const ask = message.ask;
  const approver = useSelector((s) => (ask?.to ? s.discussions.usersMap[ask.to] : null));
  const decider = useSelector((s) => (ask?.decidedBy ? s.discussions.usersMap[ask.decidedBy] : null));
  const [mode, setMode] = useState(null); // "decline" | "cancel" | "remind"
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (!ask) return null;

  // Socket payloads always say canDecide:false, so it is worked out from ask.to
  const isApprover = ask.to === me;
  const isRequester = message.by === me;
  const sent = !message.tempId && !message.deleted;
  const pending = ask.status === "pending";
  const approverName = isApprover ? "you" : approver?.firstname || "the approver";
  const deciderName = ask.decidedBy === me ? "you" : decider?.firstname || (ask.status === "cancelled" ? "the requester" : approverName);
  const btn = compact ? "h-9 px-4 text-[14px]" : "h-11 px-6 text-[16px]";
  const link = `${compact ? "h-9 text-[14px]" : "h-11 text-[16px]"} px-1.5 font-bold text-[#0B57D0] hover:underline cursor-pointer disabled:opacity-50`;
  const primary = `${btn} rounded-full bg-[#1D72E8] text-white font-bold hover:bg-[#0B57D0] transition cursor-pointer disabled:opacity-50`;
  const secondary = `${btn} rounded-full border border-[#0B57D0] bg-white text-[#0B57D0] font-bold hover:bg-[#D3E3FD]/50 transition cursor-pointer disabled:opacity-50`;

  const label = {
    pending: "Approval pending",
    approved: ask.yesLabel === "Approve" ? "Approved" : ask.yesLabel,
    declined: ask.noLabel === "Decline" ? "Declined" : ask.noLabel,
    cancelled: "Request cancelled",
  }[ask.status];

  // Errors surface in the page banner (lastError), so the catch only stops the spinner
  const run = async (thunk) => {
    setBusy(true);
    try {
      await dispatch(thunk).unwrap();
      setMode(null);
      setReason("");
    } catch {
      /* shown in the banner */
    } finally {
      setBusy(false);
    }
  };

  const reasonForm = (placeholder, confirmLabel, onConfirm) => (
    <div className="mt-3 space-y-2">
      <input
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !busy && onConfirm()}
        placeholder={placeholder}
        maxLength={300}
        className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] bg-white text-[15px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#0B57D0]"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={onConfirm} className={primary}>
          {confirmLabel}
        </button>
        <button type="button" disabled={busy} onClick={() => setMode(null)} className={link}>
          Back
        </button>
      </div>
    </div>
  );

  let actions = null;
  if (pending && sent && isApprover) {
    actions =
      mode === "decline" ? (
        reasonForm("Reason (optional)", ask.noLabel, () =>
          run(decideApproval({ messageId: message.id, decision: "no", reason: reason.trim() || undefined }))
        )
      ) : (
        <div className={`flex flex-wrap items-center ${compact ? "gap-2" : "gap-3"} mt-3`}>
          <button type="button" disabled={busy} onClick={() => run(decideApproval({ messageId: message.id, decision: "yes" }))} className={primary}>
            {ask.yesLabel}
          </button>
          <button type="button" disabled={busy} onClick={() => setMode("decline")} className={secondary}>
            {ask.noLabel}
          </button>
          <button
            type="button"
            onClick={() => dispatch(openThread({ messageId: message.id, draft: "Why do we need this?" }))}
            className={link}
          >
            Ask why
          </button>
        </div>
      );
  } else if (pending && sent && isRequester) {
    if (mode === "cancel") {
      actions = reasonForm("Why are you cancelling? (optional)", "Cancel request", () =>
        run(cancelApproval({ messageId: message.id, reason: reason.trim() || undefined }))
      );
    } else if (mode === "remind") {
      actions = (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-[14px] text-[#64748B]">Remind by</span>
          {REMIND_CHANNELS.map((c) => (
            <button
              key={c.key}
              type="button"
              disabled={busy}
              onClick={() => run(remindApprover({ messageId: message.id, notificationType: c.key }))}
              className="h-8 px-3.5 rounded-full border border-[#B6CFF5] bg-white text-[14px] font-bold text-[#0B57D0] hover:bg-[#D3E3FD]/50 transition cursor-pointer disabled:opacity-50"
            >
              {c.label}
            </button>
          ))}
          <button type="button" disabled={busy} onClick={() => setMode(null)} className={link}>
            Back
          </button>
        </div>
      );
    } else {
      actions = (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-[14px] text-[#94A3B8]">Waiting for {approverName}</span>
          <button type="button" onClick={() => setMode("remind")} className={link}>
            Remind
          </button>
          <button type="button" onClick={() => setMode("cancel")} className={link}>
            Cancel request
          </button>
        </div>
      );
    }
  } else if (pending) {
    actions = (
      <p className="text-[14px] text-[#94A3B8] mt-1">
        Waiting for {approverName} to {ask.yesLabel.toLowerCase()} or {ask.noLabel.toLowerCase()}
      </p>
    );
  }

  return (
    <div className={`rounded-xl ${compact ? "px-3 py-3" : "px-4 py-3.5"} ${tinted ? "bg-[#EEF4FF]" : "bg-white"}`}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <span className={`px-2.5 py-1 rounded-md text-[14px] font-bold ${STATUS_STYLE[ask.status]}`}>{label}</span>
        <span className="text-[15px] text-[#64748B]">
          {pending ? "Approval from" : "By"} <b className="text-[#1E293B]">{pending ? approverName : deciderName}</b>
        </span>
      </div>

      {ask.amount > 0 && (
        <p className={`${compact ? "text-[22px]" : "text-[28px]"} font-bold text-[#1E293B] mt-2`}>{formatAmount(ask.amount)}</p>
      )}

      {ask.decidedAt && !pending && (
        <p suppressHydrationWarning className="text-[14px] text-[#94A3B8] mt-1">
          {formatDay(ask.decidedAt)}, {formatTime(ask.decidedAt)}
        </p>
      )}
      {!pending && ask.decisionReason && (
        <p className="text-[14px] text-[#475569] mt-1.5 [overflow-wrap:anywhere]">“{ask.decisionReason}”</p>
      )}

      {actions}

      {ask.notify.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F5F9]">
          <span className="text-[13px] text-[#94A3B8]">Notified via</span>
          {ask.notify.includes("email") && <NotifyTag icon={FiMail} label="Email" className="text-[#0B57D0] border-[#C9DAF8]" />}
          {ask.notify.includes("whatsapp") && (
            <NotifyTag icon={FaWhatsapp} label="WhatsApp" className="text-[#16A34A] border-[#BBE5C8]" />
          )}
        </div>
      )}
    </div>
  );
});

// System line: "Nandini added SG", "SG chose Approve", …
export function NoteLine({ message }) {
  const usersMap = useSelector((s) => s.discussions.usersMap);
  const me = useMe();
  return <p className="text-center text-[13px] text-[#94A3B8] px-4 [overflow-wrap:anywhere]">{noteText(message, usersMap, me)}</p>;
}

export const ReactionChips = memo(function ReactionChips({ message, small = false }) {
  const dispatch = useDispatch();
  const me = useMe();
  const usersMap = useSelector((s) => s.discussions.usersMap);
  if (!message.reactions?.length) return null;

  return (
    <>
      {message.reactions.map((r) => {
        const mine = r.people.includes(me);
        const names = r.people.map((c) => (c === me ? "You" : usersMap[c]?.name || "Someone")).join(", ");
        return (
          <button
            key={r.emoji}
            type="button"
            title={names}
            disabled={Boolean(message.tempId)}
            onClick={() => dispatch(toggleReaction({ messageId: message.id, emoji: r.emoji }))}
            className={`inline-flex items-center gap-1.5 ${small ? "h-6 px-2 text-[12px]" : "h-7 px-2.5 text-[14px]"} rounded-full border font-bold transition cursor-pointer ${
              mine
                ? "bg-[#E3EDFD] border-[#B6CFF5] text-[#0B57D0]"
                : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#B6CFF5]"
            }`}
          >
            <span className={small ? "text-[13px]" : "text-[15px]"}>{r.emoji}</span>
            {r.count}
          </button>
        );
      })}
    </>
  );
});

// Floating hover toolbar: reactions, reply, and edit/delete for your own messages
export function MessageToolbar({ message, isMine, compact = false, onReply, onEdit, onDelete }) {
  const dispatch = useDispatch();
  const me = useMe();
  const [pickerOpen, setPickerOpen] = useState(false);
  const ref = useRef(null);
  const closePicker = useCallback(() => setPickerOpen(false), []);
  useOutsideClick(ref, pickerOpen, closePicker);

  const react = (emoji) => {
    dispatch(toggleReaction({ messageId: message.id, emoji }));
    setPickerOpen(false);
  };
  const reactedByMe = (emoji) => message.reactions.some((r) => r.emoji === emoji && r.people.includes(me));
  const size = compact ? "w-8 h-8" : "w-9 h-9";
  const icon = `${size} rounded-full flex items-center justify-center text-[#475569] transition hover:bg-[#F1F5F9] cursor-pointer`;

  return (
    <div
      ref={ref}
      className={`absolute -top-6 z-10 ${isMine ? "right-3" : "left-3"} ${
        pickerOpen ? "flex" : "hidden group-hover:flex"
      } flex-col ${isMine ? "items-end" : "items-start"}`}
    >
      <div className="flex items-center gap-0.5 bg-white rounded-full border border-[#E2E8F0] shadow-[0_4px_14px_rgba(15,23,42,0.12)] px-1.5 py-1">
        {(compact ? QUICK_REACTIONS.slice(0, 3) : QUICK_REACTIONS).map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => react(emoji)}
            className={`${size} rounded-full ${compact ? "text-[17px]" : "text-[20px]"} flex items-center justify-center transition hover:bg-[#F1F5F9] hover:scale-110 cursor-pointer ${
              reactedByMe(emoji) ? "bg-[#E3EDFD]" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
        <span className="w-px h-6 bg-[#E2E8F0] mx-1" />
        <button type="button" title="More reactions" onClick={() => setPickerOpen((v) => !v)} className={`${icon} ${pickerOpen ? "bg-[#F1F5F9]" : ""}`}>
          <MdOutlineAddReaction className="text-[20px]" />
        </button>
        {onReply && (
          <button type="button" title="Reply in thread" onClick={onReply} className={icon}>
            <FiCornerUpLeft className="text-[18px]" />
          </button>
        )}
        {isMine && onEdit && (
          <button type="button" title="Edit" onClick={onEdit} className={icon}>
            <FiEdit2 className="text-[16px]" />
          </button>
        )}
        {isMine && onDelete && (
          <button type="button" title="Delete" onClick={onDelete} className={`${icon} hover:text-[#B91C1C]`}>
            <FiTrash2 className="text-[16px]" />
          </button>
        )}
      </div>

      {pickerOpen && (
        <div
          className={`mt-1.5 grid ${compact ? "grid-cols-6" : "grid-cols-8"} gap-0.5 bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] p-2`}
        >
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
}

export function InlineEditor({ initial, onSave, onCancel }) {
  const [value, setValue] = useState(initial);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const save = () => {
    const next = value.trim();
    if (!next || next === initial.trim()) return onCancel();
    onSave(next);
  };

  return (
    <div className="space-y-2">
      <textarea
        ref={ref}
        value={value}
        rows={Math.min(6, Math.max(2, value.split("\n").length))}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            save();
          }
        }}
        className="w-full min-w-[240px] resize-none rounded-xl border border-[#B6CFF5] bg-white px-3 py-2 text-[15px] text-[#1E293B] outline-none focus:border-[#0B57D0]"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-8 px-3 rounded-full text-[14px] font-bold text-[#334155] hover:bg-white/70 cursor-pointer">
          Cancel
        </button>
        <button type="button" onClick={save} className="h-8 px-4 rounded-full bg-[#1D72E8] text-white text-[14px] font-bold hover:bg-[#0B57D0] cursor-pointer">
          Save
        </button>
      </div>
    </div>
  );
}

export function SendState({ message }) {
  const dispatch = useDispatch();
  if (message.pending) return <span className="text-[13px] text-[#94A3B8]">Sending…</span>;
  if (!message.failed) return null;
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#B91C1C]">
      Not sent
      <button type="button" onClick={() => dispatch(retrySend(message.id))} className="underline cursor-pointer">
        Retry
      </button>
      <button type="button" onClick={() => dispatch(discardFailed(message.id))} className="underline text-[#64748B] cursor-pointer">
        Remove
      </button>
    </span>
  );
}

// parentId null = main chat, otherwise the replies panel of that message
export function TypingLine({ topicId, parentId = null }) {
  const room = useSelector((s) => s.discussions.typing[topicId]);
  const me = useMe();
  const names = Object.entries(room || {})
    .filter(([code, t]) => code !== me && (t.parentId || null) === parentId)
    .map(([, t]) => t.name?.split(" ")[0] || "Someone");

  const label = !names.length
    ? ""
    : names.length === 1
      ? `${names[0]} is typing…`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing…`
        : `${names.length} people are typing…`;

  return (
    <p aria-live="polite" className="h-5 px-1 text-[13px] text-[#64748B] truncate">
      {label}
    </p>
  );
}

// Sends typing:start at most every 3 s while typing, typing:stop when cleared or sent
export function useTypingSignal(emit) {
  const lastAt = useRef(0);
  const stop = useCallback(() => {
    if (!lastAt.current) return;
    lastAt.current = 0;
    emit(false);
  }, [emit]);
  const ping = useCallback(
    (value) => {
      if (!value.trim()) return stop();
      const now = Date.now();
      if (now - lastAt.current > 3000) {
        lastAt.current = now;
        emit(true);
      }
    },
    [emit, stop]
  );
  useEffect(() => stop, [stop]);
  return { ping, stop };
}