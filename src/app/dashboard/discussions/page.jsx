"use client";

import { useMemo, useState } from "react";
import { FiMessageSquare, FiPlus, FiSearch } from "react-icons/fi";
import NewTopicModal, { getInitials } from "./NewTopicModal";
import ChatPanel from "./ChatPanel";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "approval", label: "Needs my approval" },
];

const AVATAR_COLORS = ["#EA580C", "#1D72E8", "#0E8FA8", "#7C3AED", "#16A34A"];

function TopicItem({ topic, active, onClick }) {
  const color = AVATAR_COLORS[(topic.title?.length || 0) % AVATAR_COLORS.length];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex gap-3 px-4 py-3.5 rounded-2xl transition cursor-pointer ${
        active ? "bg-white border border-[#E2E8F0]" : "border border-transparent hover:bg-white/60"
      }`}
    >
      <div
        className="w-8 h-8 rounded-full text-white text-[12px] font-bold flex items-center justify-center shrink-0"
        style={{ backgroundColor: color }}
      >
        {getInitials(topic.owner)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-[16px] leading-[140%] text-[#1E293B]">{topic.title}</p>
          <span className="text-[13px] text-[#94A3B8] whitespace-nowrap mt-0.5">{topic.time}</span>
        </div>
        <p className={`text-[14px] truncate mt-0.5 ${topic.unread ? "font-semibold text-[#1E293B]" : "text-[#64748B]"}`}>
          {topic.lastMessage}
        </p>

        {(topic.needsApproval || topic.unread > 0) && (
          <div className="flex items-center justify-between mt-2">
            {topic.needsApproval ? (
              <span className="px-2.5 py-1 rounded-md bg-[#FDECD8] text-[#B45309] text-[13px] font-semibold">
                Needs your approval
              </span>
            ) : (
              <span />
            )}
            {topic.unread > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#1D72E8] text-white text-[11px] font-bold flex items-center justify-center">
                {topic.unread}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

export default function DiscussionsPage() {
  const [topics, setTopics] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);

  // Local only until the discussions API exists
  const handleCreateTopic = ({ title, event, people }) => {
    const topic = {
      id: Date.now(),
      title,
      event,
      people,
      owner: people[0]?.name || "",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      lastMessage: `${people.length} ${people.length === 1 ? "person" : "people"}${event ? ` · ${event}` : ""}`,
      needsApproval: false,
      unread: 0,
      messages: [],
    };
    setTopics((prev) => [topic, ...prev]);
    setActiveTopicId(topic.id);
  };

  const handleSendMessage = (message) => {
    const preview = message.text || (message.files.length ? message.files[0].name : "Approval request");
    setTopics((prev) => {
      const updated = prev.map((t) =>
        t.id === activeTopicId
          ? {
              ...t,
              messages: [...t.messages, message],
              lastMessage: `You: ${preview}`,
              time: new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            }
          : t
      );
      // Most recently active topic goes to the top
      const active = updated.find((t) => t.id === activeTopicId);
      return [active, ...updated.filter((t) => t.id !== activeTopicId)];
    });
  };

  const handleUpdatePeople = (people) => {
    setTopics((prev) => prev.map((t) => (t.id === activeTopicId ? { ...t, people } : t)));
  };

  const activeTopic = topics.find((t) => t.id === activeTopicId);

  const visibleTopics = useMemo(() => {
    const q = search.trim().toLowerCase();
    return topics.filter(
      (t) =>
        (filter === "all" || t.needsApproval) &&
        (!q || t.title?.toLowerCase().includes(q) || t.lastMessage?.toLowerCase().includes(q))
    );
  }, [topics, search, filter]);

  const isFiltered = search.trim() || filter !== "all";

  return (
    <div className="h-[calc(100vh-120px)] my-5 flex flex-col font-nunito">
      <h2 className="text-[32px] leading-[136%] font-bold text-[#333333]">Discussions</h2>

      <div className="flex-1 flex gap-6 min-h-0 mt-[20px]">
        {/* Left panel — Topics */}
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
              {FILTERS.map((f) => {
                const isActive = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`h-8 px-3.5 rounded-full border text-[14px] font-bold transition cursor-pointer ${
                      isActive
                        ? "bg-[#D3E3FD] border-[#B6CFF5] text-[#0B57D0]"
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#B6CFF5]"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-1">
            {visibleTopics.length > 0 ? (
              visibleTopics.map((topic) => (
                <TopicItem
                  key={topic.id}
                  topic={topic}
                  active={topic.id === activeTopicId}
                  onClick={() => setActiveTopicId(topic.id)}
                />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <p className="text-[#333333] font-bold text-[16px]">
                  {isFiltered ? "No matching topics" : "No topics yet"}
                </p>
                <p className="text-[#777777] text-[14px] mt-1">
                  {isFiltered ? "Try a different search or filter." : "Start a new topic to begin a discussion."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — fills remaining width */}
        <div className="flex-1 min-w-0 bg-[#F2F7FF] rounded-[20px] overflow-hidden">
          {activeTopic ? (
            <ChatPanel
              key={activeTopic.id}
              topic={activeTopic}
              onSend={handleSendMessage}
              onUpdatePeople={handleUpdatePeople}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-[64px] h-[64px] rounded-2xl bg-white text-[#0B57D0] flex items-center justify-center mb-4">
                <FiMessageSquare className="text-3xl" />
              </div>
              <p className="text-[#333333] font-bold text-[20px]">
                {topics.length ? "Select a topic" : "No discussions yet"}
              </p>
              <p className="text-[#777777] font-medium text-[16px] mt-1">
                {topics.length
                  ? "Pick a topic on the left to open the discussion."
                  : "Discussions will appear here once they are started."}
              </p>
            </div>
          )}
        </div>
      </div>

      {isNewTopicOpen && (
        <NewTopicModal onClose={() => setIsNewTopicOpen(false)} onCreate={handleCreateTopic} />
      )}
    </div>
  );
}
