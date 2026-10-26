"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiMessageSquare, FiPlus, FiSearch, FiX } from "react-icons/fi";
import NewTopicModal from "./NewTopicModal";
import ChatPanel from "./ChatPanel";
import ThreadPanel from "./ThreadPanel";
import { PersonAvatar, useMe } from "./DiscussionShared";
import {
  clearDiscussionError,
  clearDiscussionNotice,
  selectTopicsList,
  setMyUserCode,
} from "@/store/discussions/discussionsSlice";
import { fetchDiscussionPeople, fetchTopics } from "@/store/discussions/discussionsThunks";
import { fetchBudgetTypes } from "@/store/events/budgetChecklist/budgetThunks";
import {
  joinTopicRooms,
  openTopic,
  pollDiscussions,
  readActiveTopic,
  startDiscussionsSocket,
  stopDiscussionsSocket,
} from "@/store/discussions/discussionsLive";
import { formatListTime, getMyEmail, getMyUserCode, previewText } from "@/store/discussions/discussionsUtils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "approval", label: "Needs my approval" },
];

const POLL_MS = 15000; // only while the socket is down

const TopicItem = memo(function TopicItem({ topic, active, onOpen }) {
  const me = useMe();
  const lastBy = topic.lastMessage?.by;
  const author = useSelector((s) => (lastBy ? s.discussions.usersMap[lastBy] : null));
  const who = lastBy === me ? "You" : author?.firstname;

  return (
    <button
      type="button"
      onClick={() => onOpen(topic.id)}
      className={`w-full text-left flex gap-3 px-4 py-3.5 rounded-2xl transition cursor-pointer ${
        active ? "bg-white border border-[#E2E8F0]" : "border border-transparent hover:bg-white/60"
      }`}
    >
      <PersonAvatar code={topic.createdBy || lastBy} className="w-8 h-8 text-[12px]" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-[16px] leading-[140%] text-[#1E293B] truncate">{topic.title}</p>
          <span suppressHydrationWarning className="text-[13px] text-[#94A3B8] whitespace-nowrap mt-0.5">
            {formatListTime(topic.lastActivityAt)}
          </span>
        </div>
        <p className={`text-[14px] truncate mt-0.5 ${topic.unread ? "font-semibold text-[#1E293B]" : "text-[#64748B]"}`}>
          {previewText(topic.lastMessage, who)}
        </p>

        {(topic.needsMyApproval || topic.unread > 0) && (
          <div className="flex items-center justify-between mt-2">
            {topic.needsMyApproval ? (
              <span className="px-2.5 py-1 rounded-md bg-[#FDECD8] text-[#B45309] text-[13px] font-semibold">Needs your approval</span>
            ) : (
              <span />
            )}
            {topic.unread > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#1D72E8] text-white text-[11px] font-bold flex items-center justify-center">
                {topic.unread > 99 ? "99+" : topic.unread}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
});

const STATUS_DOT = {
  connected: { color: "bg-[#16A34A]", label: "Live" },
  connecting: { color: "bg-[#CA8A04]", label: "Connecting…" },
  disconnected: { color: "bg-[#CA8A04]", label: "Reconnecting…" },
  error: { color: "bg-[#94A3B8]", label: "Offline, refreshing every 15s" },
  idle: { color: "bg-[#94A3B8]", label: "Offline, refreshing every 15s" },
};

export default function DiscussionsPage() {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);
  const people = useSelector((s) => s.discussions.people);
  const budgetTypesLoaded = useSelector((s) => Boolean(s.budget?.budgetTypes?.length));
  const topics = useSelector(selectTopicsList);
  const topicIds = useSelector((s) => s.discussions.topicIds);
  const activeTopicId = useSelector((s) => s.discussions.activeTopicId);
  const hasActiveTopic = useSelector((s) => Boolean(s.discussions.topicsMap[s.discussions.activeTopicId]));
  const topicsLoading = useSelector((s) => s.discussions.topicsLoading);
  const topicsFetched = useSelector((s) => s.discussions.topicsFetched);
  const socketStatus = useSelector((s) => s.discussions.socketStatus);
  const thread = useSelector((s) => s.discussions.thread);
  const lastError = useSelector((s) => s.discussions.lastError);
  const notice = useSelector((s) => s.discussions.notice);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);

  // Who "me" is, for own messages, reactions and approvals: adminDetail.userCode,
  // or the admin whose email matches the logged-in user once the admins list is in
  useEffect(() => {
    const email = getMyEmail(auth);
    const code = getMyUserCode(auth) || (email && people.find((p) => p.email?.toLowerCase() === email)?.userCode);
    dispatch(setMyUserCode(code || null));
  }, [dispatch, auth, people]);

  // Portfolio names for role labels, as on the User Management page
  useEffect(() => {
    if (!budgetTypesLoaded) dispatch(fetchBudgetTypes());
  }, [dispatch, budgetTypesLoaded]);

  // Load once and keep the socket open while the page is mounted
  useEffect(() => {
    dispatch(fetchTopics());
    dispatch(fetchDiscussionPeople());
    dispatch(startDiscussionsSocket());
    return () => dispatch(stopDiscussionsSocket());
  }, [dispatch]);

  // Join every topic room, so the list updates live, not just the open topic
  useEffect(() => {
    if (socketStatus === "connected") dispatch(joinTopicRooms(topicIds));
  }, [dispatch, socketStatus, topicIds]);

  // Open the newest topic on load, and the next one if the open topic goes away
  useEffect(() => {
    if (topicsFetched && !activeTopicId && topicIds.length) dispatch(openTopic(topicIds[0]));
  }, [dispatch, topicsFetched, activeTopicId, topicIds]);

  // Back on the tab: clear the unread badge of the topic on screen
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && dispatch(readActiveTopic());
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [dispatch]);

  // Without a socket, fall back to polling with ?since=
  useEffect(() => {
    if (socketStatus === "connected" || !topicsFetched) return;
    const timer = setInterval(() => dispatch(pollDiscussions()), POLL_MS);
    return () => clearInterval(timer);
  }, [dispatch, socketStatus, topicsFetched]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => dispatch(clearDiscussionNotice()), 4000);
    return () => clearTimeout(t);
  }, [dispatch, notice]);

  const handleOpen = useCallback((id) => dispatch(openTopic(id)), [dispatch]);

  const visibleTopics = useMemo(() => {
    const q = search.trim().toLowerCase();
    return topics.filter(
      (t) =>
        (filter === "all" || t.needsMyApproval) &&
        (!q ||
          t.title.toLowerCase().includes(q) ||
          t.eventName.toLowerCase().includes(q) ||
          (t.lastMessage?.text || "").toLowerCase().includes(q))
    );
  }, [topics, search, filter]);

  const isFiltered = search.trim() || filter !== "all";
  const approvalCount = useMemo(() => topics.filter((t) => t.needsMyApproval).length, [topics]);
  const status = STATUS_DOT[socketStatus] || STATUS_DOT.idle;

  return (
    <div className="h-[calc(100vh-120px)] my-5 flex flex-col font-nunito">
      <div className="flex items-center gap-4">
        <h2 className="font-heading text-[32px] leading-[136%] font-bold text-[#333333]">Discussions</h2>
        {/* <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#64748B]" title="Live updates">
          <span className={`w-2 h-2 rounded-full ${status.color}`} />
          {status.label}
        </span> */}
      </div>

      <div className="flex-1 flex gap-6 min-h-0 mt-[20px]">
        {/* Topics */}
        <div className="w-[340px] shrink-0 bg-[#F2F7FF] rounded-[20px] flex flex-col min-h-0">
          <div className="px-5 pt-6 pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-[24px] font-semibold text-[#1E293B]">Topics</h3>
              <button
                type="button"
                onClick={() => setIsNewTopicOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#0B57D0] text-[#0B57D0] text-[15px] font-bold hover:bg-[#D3E3FD]/50 transition cursor-pointer"
              >
                <FiPlus className="text-[16px]" />
                New topic
              </button>
            </div>

            <div className="relative mt-4">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[16px]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-white border border-[#E2E8F0] text-[15px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#0B57D0] transition"
              />
            </div>

            <div className="flex gap-2 mt-3">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`h-8 px-3.5 rounded-full border text-[14px] font-bold transition cursor-pointer ${
                    filter === f.key
                      ? "bg-[#D3E3FD] border-[#B6CFF5] text-[#0B57D0]"
                      : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#B6CFF5]"
                  }`}
                >
                  {f.label}
                  {f.key === "approval" && approvalCount > 0 && <span className="ml-1.5 opacity-70">{approvalCount}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-1">
            {topicsLoading && !topics.length ? (
              <p className="text-center text-[14px] text-[#94A3B8] py-10">Loading topics…</p>
            ) : visibleTopics.length > 0 ? (
              visibleTopics.map((topic) => (
                <TopicItem key={topic.id} topic={topic} active={topic.id === activeTopicId} onOpen={handleOpen} />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <p className="text-[#333333] font-bold text-[16px]">{isFiltered ? "No matching topics" : "No topics yet"}</p>
                <p className="text-[#777777] text-[14px] mt-1">
                  {isFiltered ? "Try a different search or filter." : "Start a new topic to begin a discussion."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 min-w-0 bg-[#F2F7FF] rounded-[20px] overflow-hidden">
          {hasActiveTopic ? (
            <ChatPanel key={activeTopicId} topicId={activeTopicId} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-[64px] h-[64px] rounded-2xl bg-white text-[#0B57D0] flex items-center justify-center mb-4">
                <FiMessageSquare className="text-3xl" />
              </div>
              <p className="text-[#333333] font-bold text-[20px]">{topics.length ? "Select a topic" : "No discussions yet"}</p>
              <p className="text-[#777777] font-medium text-[16px] mt-1">
                {topics.length ? "Pick a topic on the left to open the discussion." : "Create a topic to start the first discussion."}
              </p>
            </div>
          )}
        </div>

        {/* Replies */}
        {hasActiveTopic && thread && (
          <div className="w-[340px] shrink-0 bg-[#F2F7FF] rounded-[20px] overflow-hidden">
            <ThreadPanel key={`${thread.messageId}-${thread.draft}`} messageId={thread.messageId} initialDraft={thread.draft} />
          </div>
        )}
      </div>

      {isNewTopicOpen && (
        <NewTopicModal onClose={() => setIsNewTopicOpen(false)} onCreated={(id) => id && dispatch(openTopic(id))} />
      )}

      {(lastError || notice) && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 max-w-[380px] flex items-start gap-3 px-4 py-3 rounded-xl shadow-[0_8px_24px_rgba(15,23,42,0.16)] text-[14px] font-semibold ${
            lastError ? "bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]" : "bg-white text-[#1E293B] border border-[#E2E8F0]"
          }`}
        >
          <span className="flex-1">{lastError || notice}</span>
          <button
            type="button"
            title="Dismiss"
            onClick={() => dispatch(lastError ? clearDiscussionError() : clearDiscussionNotice())}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <FiX className="text-[16px]" />
          </button>
        </div>
      )}
    </div>
  );
}