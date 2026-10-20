"use client";

import { useEffect, useRef, useState } from "react";
import { FiSend, FiX } from "react-icons/fi";
import { CURRENT_USER_ID, PEOPLE } from "./NewTopicModal";
import { ApprovalCard, Avatar, formatDay, formatTime } from "./ChatPanel";

// Side panel with the replies thread for one message.
// Keyed by message + draft in the page, so the input resets when another thread opens.
export default function ThreadPanel({ topic, message, initialDraft = "", onClose, onReply, onDecide }) {
  const [text, setText] = useState(initialDraft);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const personById = (id) => topic.people?.find((p) => p.id === id) || PEOPLE.find((p) => p.id === id);
  const author = personById(message.authorId);
  const replies = message.thread || [];

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [replies.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    onReply(message.id, {
      id: Date.now(),
      authorId: CURRENT_USER_ID,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    });
    setText("");
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-5 border-b border-[#DCE5F3] shrink-0">
        <div className="min-w-0">
          <h3 className="text-[24px] font-semibold text-[#1E293B]">Replies</h3>
          <p className="text-[15px] text-[#64748B] truncate">{topic.title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#1E293B] hover:bg-white transition cursor-pointer shrink-0"
        >
          <FiX className="text-[20px]" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {/* Original message */}
        <div className="bg-[#E6EEFC] rounded-2xl p-3">
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar person={author} className="w-8 h-8 text-[11px]" />
            <span className="flex-1 min-w-0 text-[15px] font-bold text-[#1E293B] truncate">
              {message.authorId === CURRENT_USER_ID ? "You" : author?.name}
            </span>
            <span suppressHydrationWarning className="text-[13px] text-[#64748B] whitespace-nowrap">
              {formatDay(message.createdAt)}, {formatTime(message.createdAt)}
            </span>
          </div>
          <div className="bg-white rounded-xl p-1 space-y-2">
            {message.text && (
              <p className="px-3 pt-2 text-[15px] leading-[160%] text-[#1E293B] whitespace-pre-wrap break-words">
                {message.text}
              </p>
            )}
            {message.approval && (
              <ApprovalCard
                approval={message.approval}
                approver={personById(message.approval.approverId)}
                compact
                onDecide={(status) => onDecide(message.id, status)}
                onAskWhy={() => inputRef.current?.focus()}
              />
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <span className="text-[14px] font-bold text-[#94A3B8] whitespace-nowrap">
            {replies.length ? `${replies.length} ${replies.length === 1 ? "reply" : "replies"}` : "No replies yet"}
          </span>
          <div className="flex-1 h-px bg-[#DCE5F3]" />
        </div>

        {/* Replies */}
        <div className="space-y-4">
          {replies.map((r) => {
            const replyAuthor = personById(r.authorId);
            return (
              <div key={r.id} className="flex gap-2.5">
                <Avatar person={replyAuthor} className="w-8 h-8 text-[11px]" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px]">
                    <span className="font-bold text-[#1E293B]">
                      {r.authorId === CURRENT_USER_ID ? "You" : replyAuthor?.name}
                    </span>{" "}
                    <span suppressHydrationWarning className="text-[12px] text-[#94A3B8]">
                      {formatTime(r.createdAt)}
                    </span>
                  </p>
                  <p className="text-[15px] leading-[155%] text-[#1E293B] whitespace-pre-wrap break-words mt-0.5">
                    {r.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reply input */}
      <div className="px-4 py-4 border-t border-[#DCE5F3] shrink-0">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-[#E2E8F0] focus-within:border-[#0B57D0] pl-4 pr-1.5 py-1.5 transition">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Reply…"
            className="flex-1 min-w-0 h-10 text-[16px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none bg-transparent"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-10 h-10 rounded-full bg-[#1D72E8] text-white flex items-center justify-center hover:bg-[#0B57D0] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <FiSend className="text-[17px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
