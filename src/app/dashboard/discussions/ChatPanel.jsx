"use client";

import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiCheck,
  FiCheckSquare,
  FiChevronDown,
  FiEdit2,
  FiLogOut,
  FiMail,
  FiMoreHorizontal,
  FiPaperclip,
  FiSend,
  FiTrash2,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import NewTopicModal from "./NewTopicModal";
import {
  ApprovalCard,
  Avatar,
  DayDivider,
  FileCard,
  InlineEditor,
  MessageToolbar,
  NoteLine,
  PersonAvatar,
  ReactionChips,
  SendState,
  TypingLine,
  useAttachments,
  useMe,
  useOutsideClick,
  usePortfolioNames,
  useTypingSignal,
} from "./DiscussionShared";
import { openThread } from "@/store/discussions/discussionsSlice";
import {
  deleteMessage,
  deleteTopic,
  editMessage,
  fetchMessages,
  leaveTopic,
  sendMessage,
} from "@/store/discussions/discussionsThunks";
import { emitTyping, leaveTopicRoom } from "@/store/discussions/discussionsLive";
import { FILE_ACCEPT, formatDay, formatTime, newTempId, roleLabel } from "@/store/discussions/discussionsUtils";

/* ─── Header ───────────────────────────────────────────── */

function TopicHeader({ topic }) {
  const dispatch = useDispatch();
  const me = useMe();
  const online = useSelector((s) => s.discussions.online[topic.id]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const menuRef = useRef(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useOutsideClick(menuRef, menuOpen, closeMenu);

  const onlineSet = useMemo(() => new Set(online || []), [online]);
  const othersOnline = topic.members.filter((c) => c !== me && onlineSet.has(c)).length;
  const count = topic.members.length || topic.memberCount || 0;
  const subtitle = [topic.eventName, `${count} ${count === 1 ? "person" : "people"}`, othersOnline ? `${othersOnline} online` : ""]
    .filter(Boolean)
    .join(" · ");
  const isCreator = topic.createdBy === me;

  const confirmThen = async (question, thunk) => {
    setMenuOpen(false);
    if (!window.confirm(question)) return;
    try {
      await dispatch(thunk).unwrap();
      dispatch(leaveTopicRoom(topic.id));
    } catch {
      /* shown in the banner */
    }
  };

  const menuItem = "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[15px] font-semibold transition cursor-pointer";

  return (
    <div className="flex items-center justify-between gap-4 px-7 py-5 border-b border-[#DCE5F3] shrink-0">
      <div className="min-w-0">
        <h3 className="text-[24px] font-semibold text-[#1E293B] truncate">{topic.title}</h3>
        <p className="text-[15px] text-[#64748B] truncate">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex -space-x-2">
          {topic.members.slice(0, 4).map((code) => (
            <PersonAvatar key={code} code={code} online={code !== me && onlineSet.has(code)} className="w-9 h-9 text-[12px] ring-2 ring-[#F2F7FF]" />
          ))}
          {count > 4 && (
            <div className="w-9 h-9 rounded-full bg-[#E2E8F0] text-[#475569] text-[12px] font-bold flex items-center justify-center ring-2 ring-[#F2F7FF]">
              +{count - 4}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full border border-[#0B57D0] text-[#0B57D0] text-[15px] font-bold bg-white hover:bg-[#D3E3FD]/50 transition cursor-pointer"
        >
          <FiUserPlus className="text-[17px]" />
          Add people
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            title="Topic options"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#475569] hover:bg-white transition cursor-pointer"
          >
            <FiMoreHorizontal className="text-[20px]" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 z-20 w-[200px] bg-white rounded-xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] py-1.5">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setEditing(true);
                }}
                className={`${menuItem} text-[#1E293B] hover:bg-[#F8FAFC]`}
              >
                <FiEdit2 className="text-[16px]" /> Edit topic
              </button>
              <button
                type="button"
                onClick={() => confirmThen(`Leave "${topic.title}"? You will stop getting its messages.`, leaveTopic({ topicId: topic.id }))}
                className={`${menuItem} text-[#1E293B] hover:bg-[#F8FAFC]`}
              >
                <FiLogOut className="text-[16px]" /> Leave topic
              </button>
              {isCreator && (
                <button
                  type="button"
                  onClick={() => confirmThen(`Delete "${topic.title}" for everyone? This cannot be undone.`, deleteTopic({ topicId: topic.id }))}
                  className={`${menuItem} text-[#B91C1C] hover:bg-[#FEF2F2]`}
                >
                  <FiTrash2 className="text-[16px]" /> Delete topic
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {editing && <NewTopicModal topic={topic} onClose={() => setEditing(false)} />}
    </div>
  );
}

/* ─── Messages ─────────────────────────────────────────── */

const MessageRow = memo(function MessageRow({ id, prevId, highlighted }) {
  const dispatch = useDispatch();
  const m = useSelector((s) => s.discussions.messagesById[id]);
  const prevAt = useSelector((s) => (prevId ? s.discussions.messagesById[prevId]?.createdAt : null));
  const author = useSelector((s) => (m?.by ? s.discussions.usersMap[m.by] : null));
  const me = useMe();
  const portfolioNames = usePortfolioNames();
  const [editing, setEditing] = useState(false);
  if (!m) return null;

  const day = formatDay(m.createdAt);
  const divider = (!prevAt || formatDay(prevAt) !== day) && <DayDivider label={day} />;

  if (m.kind === "note") {
    return (
      <div>
        {divider}
        <NoteLine message={m} />
      </div>
    );
  }

  const isMine = m.by === me;
  const live = !m.tempId && !m.deleted;
  const hasCards = m.files.length > 0 || m.ask;
  const openReplies = (draft) => dispatch(openThread({ messageId: id, draft }));
  const remove = () => {
    if (window.confirm("Delete this message for everyone?")) dispatch(deleteMessage({ messageId: id }));
  };
  const save = (text) => {
    dispatch(editMessage({ messageId: id, text, prevText: m.text, prevEdited: m.edited }));
    setEditing(false);
  };

  const body = (
    <div
      className={`rounded-2xl space-y-2.5 ${hasCards || editing ? "p-4" : "px-4 py-3"} ${
        m.deleted
          ? "bg-transparent border border-dashed border-[#CBD5E1]"
          : isMine
            ? "bg-[#DCE7FB] border border-[#C9DAF8]"
            : "bg-white border border-[#E2E8F0]"
      } ${highlighted ? "ring-2 ring-[#1D72E8]" : ""} ${m.pending ? "opacity-70" : ""}`}
    >
      {m.deleted ? (
        <p className="text-[15px] italic text-[#94A3B8]">This message was deleted</p>
      ) : editing ? (
        <InlineEditor initial={m.text} onSave={save} onCancel={() => setEditing(false)} />
      ) : (
        m.text && <p className="text-[16px] leading-[160%] text-[#1E293B] whitespace-pre-wrap break-words">{m.text}</p>
      )}
      {!m.deleted && m.files.map((f, i) => <FileCard key={`${f.url}-${i}`} file={f} />)}
      {!m.deleted && m.ask && <ApprovalCard message={m} tinted={!isMine} />}
    </div>
  );

  const time = (
    <span suppressHydrationWarning className="text-[13px] text-[#94A3B8]">
      {formatTime(m.createdAt)}
      {m.edited && !m.deleted ? " · edited" : ""}
    </span>
  );

  const meta = (
    <div className={`flex flex-wrap items-center gap-2 mt-1.5 ${isMine ? "justify-end" : ""}`}>
      {!isMine && time}
      <SendState message={m} />
      {m.replyCount > 0 && (
        <button type="button" onClick={() => openReplies()} className="text-[14px] font-bold text-[#0B57D0] hover:underline cursor-pointer px-1">
          {m.replyCount} {m.replyCount === 1 ? "reply" : "replies"}
        </button>
      )}
      <ReactionChips message={m} />
      {live && !isMine && (
        <button type="button" onClick={() => openReplies()} className="text-[14px] font-bold text-[#0B57D0] hover:underline cursor-pointer px-1">
          Reply
        </button>
      )}
      {isMine && time}
    </div>
  );

  const toolbar = live && !editing && (
    <MessageToolbar
      message={m}
      isMine={isMine}
      onReply={() => openReplies()}
      onEdit={m.text ? () => setEditing(true) : undefined}
      // The server refuses to delete a message whose approval is still pending
      onDelete={m.ask?.status === "pending" ? undefined : remove}
    />
  );

  if (isMine) {
    return (
      <div id={`msg-${id}`}>
        {divider}
        <div className="flex flex-col items-end">
          <div className="group relative max-w-[60%] min-w-[200px]">
            {toolbar}
            {body}
          </div>
          {meta}
        </div>
      </div>
    );
  }

  return (
    <div id={`msg-${id}`}>
      {divider}
      <div className="flex gap-3">
        <Avatar person={author || { userCode: m.by, name: "" }} />
        <div className="max-w-[60%] min-w-0">
          <p className="text-[15px] mb-1.5">
            <span className="font-bold text-[#1E293B]">{author?.name || "Former member"}</span>{" "}
            <span className="text-[13px] text-[#64748B]">{roleLabel(author, portfolioNames)}</span>
          </p>
          <div className="group relative">
            {toolbar}
            {body}
          </div>
          {meta}
        </div>
      </div>
    </div>
  );
});

function MessageList({ topicId }) {
  const dispatch = useDispatch();
  const me = useMe();
  const ids = useSelector((s) => s.discussions.messageIds[topicId]);
  const loading = useSelector((s) => s.discussions.messagesLoading[topicId]);
  const error = useSelector((s) => s.discussions.messagesError[topicId]);
  const hasMore = useSelector((s) => s.discussions.messagesHasMore[topicId]);
  const threadId = useSelector((s) => s.discussions.thread?.messageId);
  const lastId = ids?.[ids.length - 1];
  const lastBy = useSelector((s) => (lastId ? s.discussions.messagesById[lastId]?.by : null));

  const scrollRef = useRef(null);
  const nearBottom = useRef(true);
  const heightBeforeOlder = useRef(null);
  const prevLastId = useRef(null);

  // Older page prepended: keep the reader where they were.
  // New message at the end: follow it if the reader was at the bottom or sent it.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (heightBeforeOlder.current != null) {
      el.scrollTop += el.scrollHeight - heightBeforeOlder.current;
      heightBeforeOlder.current = null;
    } else if (lastId !== prevLastId.current && (nearBottom.current || lastBy === me)) {
      el.scrollTop = el.scrollHeight;
    }
    prevLastId.current = lastId;
  }, [ids, lastId, lastBy, me]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (el.scrollTop > 80 || !hasMore || loading || !ids?.length) return;
    heightBeforeOlder.current = el.scrollHeight;
    dispatch(fetchMessages({ topicId, older: true }))
      .unwrap()
      .catch(() => {
        heightBeforeOlder.current = null;
      });
  };

  let content;
  if (error && !ids?.length) {
    content = (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <p className="text-[#333333] font-bold text-[18px]">Messages did not load</p>
        <p className="text-[#777777] text-[15px] mt-1">{error}</p>
        <button
          type="button"
          onClick={() => dispatch(fetchMessages({ topicId }))}
          className="mt-4 h-10 px-5 rounded-full bg-[#1D72E8] text-white text-[15px] font-bold hover:bg-[#0B57D0] cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  } else if (!ids) {
    content = <p className="h-full flex items-center justify-center text-[15px] text-[#94A3B8]">Loading messages…</p>;
  } else if (!ids.length) {
    content = (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <p className="text-[#333333] font-bold text-[18px]">No messages yet</p>
        <p className="text-[#777777] text-[15px] mt-1">Send the first message to start this discussion.</p>
      </div>
    );
  } else {
    content = (
      <div className="space-y-5">
        {loading === "older" && <p className="text-center text-[13px] text-[#94A3B8]">Loading earlier messages…</p>}
        {ids.map((id, i) => (
          <MessageRow key={id} id={id} prevId={i ? ids[i - 1] : null} highlighted={id === threadId} />
        ))}
      </div>
    );
  }

  return (
    <div ref={scrollRef} onScroll={onScroll} style={{ overflowAnchor: "none" }} className="flex-1 min-h-0 overflow-y-auto px-7 py-5">
      {content}
    </div>
  );
}

/* ─── Composer ─────────────────────────────────────────── */

// Opens upwards since the composer sits at the bottom of the chat
function PersonSelect({ people, value, onChange }) {
  const portfolioNames = usePortfolioNames();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(ref, open, close);
  const selected = people.find((p) => p.userCode === value);

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
        <FiChevronDown className={`text-[18px] text-[#64748B] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 z-20 w-full min-w-[260px] max-h-[260px] overflow-y-auto bg-white rounded-xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] py-1.5">
          {people.map((p) => (
            <button
              key={p.userCode}
              type="button"
              onClick={() => {
                onChange(p.userCode);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition cursor-pointer ${
                p.userCode === value ? "bg-[#F2F7FF]" : "hover:bg-[#F8FAFC]"
              }`}
            >
              <Avatar person={p} className="w-8 h-8 text-[12px]" />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#1E293B] truncate">{p.name}</p>
                <p className="text-[13px] text-[#64748B] truncate">{roleLabel(p, portfolioNames)}</p>
              </div>
              {p.userCode === value && <FiCheck className="text-[18px] text-[#0B57D0] shrink-0" />}
            </button>
          ))}
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
      <span className={`relative w-9 h-5 rounded-full transition ${checked ? "bg-[#1D72E8]" : "bg-[#CBD5E1]"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

const EMPTY_ASK = { to: "", amount: "", yesLabel: "Approve", noLabel: "Decline", email: false, whatsapp: false };

function Composer({ topic }) {
  const dispatch = useDispatch();
  const me = useMe();
  const usersMap = useSelector((s) => s.discussions.usersMap);
  const [text, setText] = useState("");
  const attachments = useAttachments();
  const [needApproval, setNeedApproval] = useState(false);
  const [ask, setAsk] = useState(EMPTY_ASK);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const emit = useCallback((isTyping) => dispatch(emitTyping(topic.id, isTyping)), [dispatch, topic.id]);
  const typing = useTypingSignal(emit);

  // ask.to must be another active admin in the topic
  const approvers = useMemo(
    () =>
      topic.members
        .filter((c) => c !== me)
        .map((c) => usersMap[c] || { userCode: c, name: "Unknown" })
        .filter((u) => (u.status || "active") === "active"),
    [topic.members, me, usersMap]
  );
  const setAskField = (key) => (value) => setAsk((prev) => ({ ...prev, [key]: value }));

  // An approval request can go on its own; otherwise a message needs text or files
  const canSend = needApproval
    ? Boolean(ask.to && ask.yesLabel.trim() && ask.noLabel.trim())
    : Boolean(text.trim() || attachments.items.length);

  const approverName = usersMap[ask.to]?.firstname;
  const channels = [ask.email && "Email", ask.whatsapp && "WhatsApp"].filter(Boolean);

  const send = () => {
    if (!canSend) return;
    dispatch(
      sendMessage({
        topicId: topic.id,
        tempId: newTempId(),
        createdAt: new Date().toISOString(),
        text: text.trim(),
        files: attachments.items.map((a) => a.file),
        previews: attachments.items.map((a) => a.preview),
        ask: needApproval
          ? {
              to: ask.to,
              amount: ask.amount ? Number(ask.amount) : undefined,
              yesLabel: ask.yesLabel.trim(),
              noLabel: ask.noLabel.trim(),
              notify: [ask.email && "email", ask.whatsapp && "whatsapp"].filter(Boolean),
            }
          : undefined,
      })
    );
    typing.stop();
    setText("");
    attachments.clear();
    setNeedApproval(false);
    setAsk(EMPTY_ASK);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        attachments.add(e.dataTransfer.files);
      }}
      className={`bg-white rounded-2xl border transition ${isDragging ? "border-[#0B57D0] border-dashed bg-[#F8FBFF]" : "border-[#E2E8F0]"}`}
    >
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          typing.ping(e.target.value);
        }}
        onBlur={typing.stop}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        rows={2}
        maxLength={4000}
        placeholder="Write a message, or drop files here"
        className="w-full resize-none px-5 pt-4 text-[16px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none bg-transparent"
      />

      {attachments.items.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pb-2">
          {attachments.items.map((a) => (
            <span key={a.key} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#F1F5F9] text-[13px] font-semibold text-[#334155]">
              <span className="max-w-[180px] truncate">{a.file.name}</span>
              <button type="button" onClick={() => attachments.remove(a.key)} className="text-[#64748B] hover:text-[#1E293B] cursor-pointer">
                <FiX className="text-[13px]" />
              </button>
            </span>
          ))}
        </div>
      )}

      {attachments.problem && <p className="px-5 pb-2 text-[13px] font-semibold text-[#B45309]">{attachments.problem}</p>}

      {needApproval && (
        <div className="mx-4 mt-1 pt-4 pb-1 border-t border-[#E2E8F0]">
          <div className="grid grid-cols-[1fr_0.85fr_1.5fr] gap-4">
            <div className="min-w-0">
              <span className="block text-[14px] font-bold text-[#475569] mb-1.5">Approval from</span>
              <PersonSelect people={approvers} value={ask.to} onChange={setAskField("to")} />
            </div>

            <label className="block min-w-0">
              <span className="block text-[14px] font-bold text-[#475569] mb-1.5">Amount (optional)</span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-[#64748B]">₹</span>
                <input
                  type="number"
                  min="0"
                  value={ask.amount}
                  onChange={(e) => setAskField("amount")(e.target.value)}
                  placeholder="10,000"
                  className="w-full h-12 pl-9 pr-3 rounded-xl border border-[#E2E8F0] text-[16px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#0B57D0]"
                />
              </div>
            </label>

            <div className="min-w-0">
              <span className="block text-[14px] font-bold text-[#475569] mb-1.5">Button text</span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={ask.yesLabel}
                  onChange={(e) => setAskField("yesLabel")(e.target.value)}
                  maxLength={20}
                  placeholder="Approve"
                  title="Click to rename"
                  className="w-full h-12 px-3 rounded-full bg-[#1D72E8] text-white text-[16px] font-bold text-center placeholder:text-white/60 outline-none focus:ring-2 focus:ring-[#B6CFF5] cursor-text"
                />
                <input
                  value={ask.noLabel}
                  onChange={(e) => setAskField("noLabel")(e.target.value)}
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
            <Toggle icon={FiMail} label="Email" checked={ask.email} onChange={setAskField("email")} />
            <Toggle icon={FaWhatsapp} label="WhatsApp" checked={ask.whatsapp} onChange={setAskField("whatsapp")} />
          </div>

          <p className="text-[13px] text-[#94A3B8] mt-2.5">
            {approvers.length === 0
              ? "Add people to this topic to request approval."
              : !approverName
                ? "Pick who should approve this request."
                : channels.length
                  ? `${approverName} will see this in Discussions and get it on ${channels.join(" and ")}.`
                  : `${approverName} will only see this in Discussions.`}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between px-4 pb-3.5 pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Attach files"
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
            accept={FILE_ACCEPT}
            onChange={(e) => {
              attachments.add(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => setNeedApproval((v) => !v)}
            className={`inline-flex items-center gap-2 h-9 px-4 rounded-full border text-[15px] font-bold transition cursor-pointer ${
              needApproval ? "bg-[#D3E3FD] border-[#B6CFF5] text-[#0B57D0]" : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#B6CFF5]"
            }`}
          >
            <FiCheckSquare className="text-[16px]" />
            Need approval
          </button>
        </div>
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#1D72E8] text-white text-[16px] font-bold hover:bg-[#0B57D0] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSend className="text-[17px]" />
          Send
        </button>
      </div>
    </div>
  );
}

/* ─── Panel ────────────────────────────────────────────── */

export default function ChatPanel({ topicId }) {
  const topic = useSelector((s) => s.discussions.topicsMap[topicId]);
  if (!topic) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <TopicHeader topic={topic} />
      <MessageList topicId={topicId} />
      <div className="px-7 pb-6 pt-1 shrink-0">
        <TypingLine topicId={topicId} />
        <Composer topic={topic} />
      </div>
    </div>
  );
}