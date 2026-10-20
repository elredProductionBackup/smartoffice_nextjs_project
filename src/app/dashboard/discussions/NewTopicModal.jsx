"use client";

import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";

// Dummy people until the members API is wired in
export const CURRENT_USER_ID = "u1";

export const PEOPLE = [
  { id: "u1", name: "Nandini Handa", role: "Admin", group: "admins", color: "#1D72E8" },
  { id: "u2", name: "Rahul Mehta", role: "Admin & Finance Officer", group: "admins", color: "#16A34A" },
  { id: "u3", name: "Sanjay Gupta", role: "Finance Officer", group: "finance", color: "#7C3AED" },
  { id: "u4", name: "Priya Nair", role: "Finance Officer", group: "finance", color: "#DB2777" },
  { id: "u5", name: "Ankit Verma", role: "Finance Officer", group: "finance", color: "#0891B2" },
  { id: "u6", name: "Meezan Khan", role: "Portfolio Officer (Learning +1)", group: "portfolio", color: "#0E8FA8" },
  { id: "u7", name: "Aditi Rao", role: "Portfolio Officer (Learning +1)", group: "portfolio", color: "#EA580C" },
  { id: "u8", name: "Karan Shah", role: "Portfolio Officer (Engagement)", group: "portfolio", color: "#4F46E5" },
  { id: "u9", name: "Sneha Kapoor", role: "Portfolio Officer (Membership +1)", group: "portfolio", color: "#0D9488" },
  { id: "u10", name: "Vikram Joshi", role: "Portfolio Officer (Governance)", group: "portfolio", color: "#B45309" },
];

const GROUPS = [
  { key: "admins", label: "Admins" },
  { key: "finance", label: "Finance Officers", chip: "Finance" },
  { key: "portfolio", label: "Portfolio Officers", chip: "Portfolio" },
];

export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

function Avatar({ person, size = "w-8 h-8 text-[12px]" }) {
  return (
    <div
      className={`${size} rounded-full text-white font-bold flex items-center justify-center shrink-0`}
      style={{ backgroundColor: person.color }}
    >
      {getInitials(person.name)}
    </div>
  );
}

// Mounted only while open, so the form starts fresh each time.
// Pass `topic` to edit that topic's people instead of creating a new one.
export default function NewTopicModal({ topic, onClose, onCreate, onSave }) {
  const isEdit = Boolean(topic);
  const [title, setTitle] = useState("");
  const [event, setEvent] = useState("");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [selected, setSelected] = useState(
    () => new Set([CURRENT_USER_ID, ...(topic?.people || []).map((p) => p.id)])
  );

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GROUPS.filter((g) => groupFilter === "all" || g.key === groupFilter)
      .map((g) => ({
        ...g,
        people: PEOPLE.filter((p) => p.group === g.key && (!q || p.name.toLowerCase().includes(q))),
      }))
      .filter((g) => g.people.length > 0);
  }, [search, groupFilter]);

  const toggle = (id) => {
    if (id === CURRENT_USER_ID) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroup = (people) => {
    const ids = people.map((p) => p.id).filter((id) => id !== CURRENT_USER_ID);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const selectedPeople = PEOPLE.filter((p) => selected.has(p.id));
  const canCreate = isEdit || title.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    if (isEdit) onSave?.(selectedPeople);
    else onCreate?.({ title: title.trim(), event: event.trim(), people: selectedPeople });
    onClose();
  };

  const chipClass = (active) =>
    `h-8 px-3.5 rounded-full border text-[14px] font-bold transition cursor-pointer ${
      active
        ? "bg-[#D3E3FD] border-[#B6CFF5] text-[#0B57D0]"
        : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#B6CFF5]"
    }`;

  const inputClass =
    "w-full h-11 px-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[15px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#0B57D0] transition";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-nunito p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[620px] max-h-[calc(100vh-32px)] bg-white rounded-[20px] shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 shrink-0">
          <h3 className="text-[24px] font-semibold text-[#1E293B]">{isEdit ? "People in this topic" : "New topic"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#1E293B] hover:bg-[#F1F5F9] transition cursor-pointer"
          >
            <FiX className="text-[20px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col px-7 pb-5">
          {isEdit ? (
            <p className="text-[15px] font-semibold text-[#64748B] shrink-0">{topic.title}</p>
          ) : (
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <label className="block">
              <span className="block text-[14px] font-semibold text-[#64748B] mb-1.5">Topic</span>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pune venue shortlist"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="block text-[14px] font-semibold text-[#64748B] mb-1.5">Related event (optional)</span>
              <input
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="e.g. Leadership Offsite"
                className={inputClass}
              />
            </label>
          </div>
          )}

          <span className="block text-[14px] font-semibold text-[#64748B] mt-5 mb-2 shrink-0">People</span>
          <div className="flex flex-wrap gap-2 mb-3 shrink-0">
            {selectedPeople.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 h-8 pl-1 pr-3 rounded-full bg-[#EAF1FE] text-[#0B57D0] text-[14px] font-bold"
              >
                <Avatar person={p} size="w-6 h-6 text-[10px]" />
                {p.id === CURRENT_USER_ID ? "You" : p.name}
                {p.id !== CURRENT_USER_ID && (
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    className="ml-0.5 text-[#0B57D0]/70 hover:text-[#0B57D0] cursor-pointer"
                  >
                    <FiX className="text-[13px]" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {/* People picker */}
          <div className="flex-1 min-h-[220px] border border-[#E2E8F0] rounded-2xl flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[#E2E8F0] shrink-0">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[16px]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name"
                  className={`${inputClass} pl-10`}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" onClick={() => setGroupFilter("all")} className={chipClass(groupFilter === "all")}>
                  All
                </button>
                {GROUPS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGroupFilter(g.key)}
                    className={chipClass(groupFilter === g.key)}
                  >
                    {g.chip || g.label} ({PEOPLE.filter((p) => p.group === g.key).length})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto max-h-[300px]">
              {visibleGroups.length === 0 ? (
                <p className="text-center text-[14px] text-[#777777] py-8">No people found</p>
              ) : (
                visibleGroups.map((g) => (
                  <div key={g.key}>
                    <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                      <span className="text-[13px] font-bold tracking-wider text-[#64748B] uppercase">{g.label}</span>
                      <button
                        type="button"
                        onClick={() => toggleGroup(g.people)}
                        className="text-[14px] font-bold text-[#0B57D0] hover:underline cursor-pointer"
                      >
                        {g.people.every((p) => selected.has(p.id)) ? "Clear all" : "Select all"}
                      </button>
                    </div>
                    {g.people.map((p) => {
                      const isMe = p.id === CURRENT_USER_ID;
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-3 px-4 py-2.5 transition ${
                            isMe ? "bg-[#F8FAFC] cursor-default" : "hover:bg-[#F8FAFC] cursor-pointer"
                          }`}
                        >
                          <Avatar person={p} />
                          <div className={`flex-1 min-w-0 ${isMe ? "opacity-60" : ""}`}>
                            <p className="text-[15px] font-semibold text-[#1E293B] truncate">
                              {p.name}
                              {isMe && " (you)"}
                            </p>
                            <p className="text-[13px] text-[#64748B] truncate">{p.role}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            disabled={isMe}
                            onChange={() => toggle(p.id)}
                            className="w-[18px] h-[18px] accent-[#0B57D0] cursor-pointer disabled:cursor-default"
                          />
                        </label>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-[#E2E8F0] shrink-0">
          <span className="text-[15px] text-[#64748B]">
            {selected.size} {selected.size === 1 ? "person" : "people"} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-full text-[15px] font-bold text-[#334155] hover:bg-[#F1F5F9] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate}
              className="h-10 px-5 rounded-full bg-[#1D72E8] text-white text-[15px] font-bold hover:bg-[#0B57D0] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEdit ? "Save" : "Create topic"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
