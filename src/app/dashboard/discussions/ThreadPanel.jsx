"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiPaperclip, FiSend, FiX } from "react-icons/fi";
import {
  ApprovalCard,
  Avatar,
  FileCard,
  InlineEditor,
  MessageToolbar,
  NoteLine,
  ReactionChips,
  SendState,
  TypingLine,
  useAttachments,
  useConfirmDialog,
  useMe,
  useTypingSignal,
} from "./DiscussionShared";
import { Bone, RepliesSkeleton } from "./DiscussionSkeletons";
import { closeThread } from "@/store/discussions/discussionsSlice";
import { deleteMessage, editMessage, fetchReplies, sendReply } from "@/store/discussions/discussionsThunks";
import { emitTyping } from "@/store/discussions/discussionsLive";
import { FILE_ACCEPT, formatDay, formatTime, isTempId, newTempId } from "@/store/discussions/discussionsUtils";

const ReplyRow = memo(function ReplyRow({ id }) {
  const dispatch = useDispatch();
  const r = useSelector((s) => s.discussions.messagesById[id]);
  const author = useSelector((s) => (r?.by ? s.discussions.usersMap[r.by] : null));
  const me = useMe();
  const [editing, setEditing] = useState(false);
  const [askConfirm, confirmDialog] = useConfirmDialog();
  if (!r) return null;
  if (r.kind === "note") return <NoteLine message={r} />;

  const isMine = r.by === me;
  const live = !r.tempId && !r.deleted;
  const remove = () =>
    askConfirm({
      title: "Delete this reply?",
      message: "It will be removed for everyone in this thread.",
      confirmText: "Delete",
      onConfirm: () => dispatch(deleteMessage({ messageId: id, parentId: r.parentId })).unwrap(),
    });
  const save = (text) => {
    dispatch(editMessage({ messageId: id, text, isReply: true, prevText: r.text, prevEdited: r.edited }));
    setEditing(false);
  };

  return (
    <div className={`group relative flex gap-2.5 rounded-xl px-1.5 py-1 -mx-1.5 hover:bg-white/60 ${r.pending ? "opacity-70" : ""}`}>
      {confirmDialog}
      {live && !editing && (
        <MessageToolbar
          message={r}
          isMine={isMine}
          compact
          onEdit={r.text ? () => setEditing(true) : undefined}
          onDelete={remove}
        />
      )}
      <Avatar person={author || { userCode: r.by, name: "" }} className="w-8 h-8 text-[11px]" />
      <div className="flex-1 min-w-0">
        <p className="text-[14px]">
          <span className="font-bold text-[#1E293B]">{isMine ? "You" : author?.name || "Former member"}</span>{" "}
          <span suppressHydrationWarning className="text-[12px] text-[#94A3B8]">
            {formatTime(r.createdAt)}
            {r.edited ? " · edited" : ""}
          </span>
        </p>
        {editing ? (
          <div className="mt-1">
            <InlineEditor initial={r.text} onSave={save} onCancel={() => setEditing(false)} />
          </div>
        ) : (
          r.text && <p className="text-[15px] leading-[155%] text-[#1E293B] whitespace-pre-wrap break-words mt-0.5">{r.text}</p>
        )}
        {r.files.length > 0 && (
          <div className="space-y-2 mt-2">
            {r.files.map((f, i) => (
              <FileCard key={`${f.url}-${i}`} file={f} />
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 empty:hidden">
          <ReactionChips message={r} small />
          <SendState message={r} />
        </div>
      </div>
    </div>
  );
});

export default function ThreadPanel({ messageId, initialDraft = "" }) {
  const dispatch = useDispatch();
  const me = useMe();
  const parent = useSelector((s) => s.discussions.messagesById[messageId]);
  const topic = useSelector((s) => (parent ? s.discussions.topicsMap[parent.topicId] : null));
  const author = useSelector((s) => (parent?.by ? s.discussions.usersMap[parent.by] : null));
  const ids = useSelector((s) => s.discussions.replyIds[messageId]);
  const fetched = useSelector((s) => s.discussions.repliesFetched[messageId]);

  const [text, setText] = useState(initialDraft);
  const attachments = useAttachments();
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const topicId = parent?.topicId;
  const emit = useCallback((isTyping) => dispatch(emitTyping(topicId, isTyping, messageId)), [dispatch, topicId, messageId]);
  const typing = useTypingSignal(emit);

  useEffect(() => {
    if (!fetched && !isTempId(messageId)) dispatch(fetchReplies({ messageId }));
  }, [dispatch, messageId, fetched]);

  // Its topic went away. A deleted message keeps its thread, so that stays open.
  useEffect(() => {
    if (!parent) dispatch(closeThread());
  }, [dispatch, parent]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [ids?.length]);

  if (!parent || !topic) return null;

  const canSend = Boolean(text.trim() || attachments.items.length);
  const send = () => {
    if (!canSend) return;
    dispatch(
      sendReply({
        topicId,
        parentMessageId: messageId,
        tempId: newTempId(),
        createdAt: new Date().toISOString(),
        text: text.trim(),
        files: attachments.items.map((a) => a.file),
        previews: attachments.items.map((a) => a.preview),
      })
    );
    typing.stop();
    setText("");
    attachments.clear();
  };

  const count = ids?.length ?? parent.replyCount;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-start justify-between gap-3 px-5 py-5 border-b border-[#DCE5F3] shrink-0">
        <div className="min-w-0">
          <h3 className="text-[24px] font-semibold text-[#1E293B]">Replies</h3>
          <p className="text-[15px] text-[#64748B] truncate">{topic.title}</p>
        </div>
        <button
          type="button"
          title="Close replies"
          onClick={() => dispatch(closeThread())}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#1E293B] hover:bg-white transition cursor-pointer shrink-0"
        >
          <FiX className="text-[20px]" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {/* Original message */}
        <div className="bg-[#E6EEFC] rounded-2xl p-3">
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar person={author || { userCode: parent.by, name: "" }} className="w-8 h-8 text-[11px]" />
            <span className="flex-1 min-w-0 text-[15px] font-bold text-[#1E293B] truncate">
              {parent.by === me ? "You" : author?.name || "Former member"}
            </span>
            <span suppressHydrationWarning className="text-[13px] text-[#64748B] whitespace-nowrap">
              {formatDay(parent.createdAt)}, {formatTime(parent.createdAt)}
            </span>
          </div>
          <div className="bg-white rounded-xl p-1 space-y-2">
            {parent.deleted && <p className="px-3 py-2 text-[15px] italic text-[#94A3B8]">This message was deleted</p>}
            {parent.text && (
              <p className="px-3 pt-2 text-[15px] leading-[160%] text-[#1E293B] whitespace-pre-wrap break-words">{parent.text}</p>
            )}
            {parent.files.map((f, i) => (
              <FileCard key={`${f.url}-${i}`} file={f} />
            ))}
            {parent.ask && <ApprovalCard message={parent} compact />}
          </div>
        </div>

        <div className="flex items-center gap-3 my-5">
          {!ids ? (
            <Bone className="h-3.5 w-16 rounded-md" />
          ) : (
            <span className="text-[14px] font-bold text-[#94A3B8] whitespace-nowrap">
              {count ? `${count} ${count === 1 ? "reply" : "replies"}` : "No replies yet"}
            </span>
          )}
          <div className="flex-1 h-px bg-[#DCE5F3]" />
        </div>

        {!ids ? (
          <RepliesSkeleton />
        ) : (
          <div className="space-y-3">
            {ids.map((id) => (
              <ReplyRow key={id} id={id} />
            ))}
          </div>
        )}
      </div>

      {!parent.deleted && (
      <div className="px-4 pb-4 pt-1 border-t border-[#DCE5F3] shrink-0">
        <TypingLine topicId={topicId} parentId={messageId} />
        {attachments.problem && <p className="pb-2 text-[12px] font-semibold text-[#B45309]">{attachments.problem}</p>}
        {attachments.items.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {attachments.items.map((a) => (
              <span key={a.key} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white text-[12px] font-semibold text-[#334155]">
                <span className="max-w-[160px] truncate">{a.file.name}</span>
                <button type="button" onClick={() => attachments.remove(a.key)} className="text-[#64748B] hover:text-[#1E293B] cursor-pointer">
                  <FiX className="text-[12px]" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 bg-white rounded-2xl border border-[#E2E8F0] focus-within:border-[#0B57D0] pl-2 pr-1.5 py-1.5 transition">
          <button
            type="button"
            title="Attach files"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition cursor-pointer shrink-0"
          >
            <FiPaperclip className="text-[18px]" />
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
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              typing.ping(e.target.value);
            }}
            onBlur={typing.stop}
            onKeyDown={(e) => e.key === "Enter" && send()}
            maxLength={4000}
            placeholder="Reply…"
            className="flex-1 min-w-0 h-10 text-[16px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none bg-transparent"
          />
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="w-10 h-10 rounded-full bg-[#1D72E8] text-white flex items-center justify-center hover:bg-[#0B57D0] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <FiSend className="text-[17px]" />
          </button>
        </div>
      </div>
      )}
    </div>
  );
}