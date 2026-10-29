"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiCalendar, FiSearch, FiX } from "react-icons/fi";
import { Avatar, useMe, useOutsideClick, usePortfolioNames } from "./DiscussionShared";
import { PeopleSkeleton } from "./DiscussionSkeletons";
import {
  createTopic,
  fetchDiscussionPeople,
  fetchEventOptions,
  saveTopicMembers,
  updateTopic,
} from "@/store/discussions/discussionsThunks";
import { groupOf, roleLabel, topicIdOf } from "@/store/discussions/discussionsUtils";

const GROUPS = [
  { key: "admins", label: "Admins" },
  { key: "finance", label: "Finance Officers", chip: "Finance" },
  { key: "portfolio", label: "Portfolio Officers", chip: "Portfolio" },
];

const inputClass =
  "w-full h-11 px-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[16px] md:text-[15px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#0B57D0] transition";

const chipClass = (active) =>
  `h-8 px-3.5 rounded-full border text-[14px] font-bold transition cursor-pointer ${
    active ? "bg-[#D3E3FD] border-[#B6CFF5] text-[#0B57D0]" : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#B6CFF5]"
  }`;

const sameMembers = (set, list) => set.size === list.length && list.every((c) => set.has(c));

// Searches the cluster's events; the newest search always wins (see the slice)
function EventPicker({ value, onChange }) {
  const dispatch = useDispatch();
  const options = useSelector((s) => s.discussions.eventOptions);
  const loading = useSelector((s) => s.discussions.eventOptionsLoading);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(ref, open, close);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => dispatch(fetchEventOptions({ search: query.trim(), silent: true })), 250);
    return () => clearTimeout(t);
  }, [dispatch, open, query]);

  if (value) {
    return (
      <div className="h-11 flex items-center gap-2 px-3.5 rounded-xl bg-[#EAF1FE] text-[#0B57D0] text-[15px] font-bold">
        <FiCalendar className="text-[16px] shrink-0" />
        <span className="flex-1 min-w-0 truncate">{value.eventName || "Linked event"}</span>
        <button type="button" title="Remove event" onClick={() => onChange(null)} className="text-[#0B57D0]/70 hover:text-[#0B57D0] cursor-pointer">
          <FiX className="text-[15px]" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Search events"
        className={inputClass}
      />
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-30 w-full max-h-[220px] overflow-y-auto bg-white rounded-xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.12)] py-1.5">
          {loading && !options.length ? (
            <p className="px-3.5 py-2 text-[14px] text-[#94A3B8]">Searching…</p>
          ) : !options.length ? (
            <p className="px-3.5 py-2 text-[14px] text-[#94A3B8]">No events match</p>
          ) : (
            options.map((o) => (
              <button
                key={o.eventId}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full px-3.5 py-2 text-left text-[15px] font-semibold text-[#1E293B] hover:bg-[#F8FAFC] truncate cursor-pointer"
              >
                {o.eventName}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Mounted only while open, so the form starts fresh each time.
// Pass `topic` to edit it (title, event and people); otherwise it creates a topic.
export default function NewTopicModal({ topic, onClose, onCreated }) {
  const isEdit = Boolean(topic);
  const dispatch = useDispatch();
  const me = useMe();
  const people = useSelector((s) => s.discussions.people);
  const peopleFetched = useSelector((s) => s.discussions.peopleFetched);
  const peopleError = useSelector((s) => s.discussions.peopleError);
  const usersMap = useSelector((s) => s.discussions.usersMap);
  const portfolioNames = usePortfolioNames();

  const [title, setTitle] = useState(topic?.title || "");
  const [event, setEvent] = useState(topic?.eventId ? { eventId: topic.eventId, eventName: topic.eventName } : null);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [selected, setSelected] = useState(() => new Set([me, ...(topic?.members || [])].filter(Boolean)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(fetchDiscussionPeople()); // no-op once loaded
  }, [dispatch]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  // Deactivated admins are refused by the API, so they are not offered
  const active = useMemo(() => people.filter((p) => (p.status || "active") === "active"), [people]);

  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GROUPS.filter((g) => groupFilter === "all" || g.key === groupFilter)
      .map((g) => ({ ...g, people: active.filter((p) => groupOf(p) === g.key && (!q || p.name.toLowerCase().includes(q))) }))
      .filter((g) => g.people.length > 0);
  }, [active, search, groupFilter]);

  const groupCounts = useMemo(
    () => Object.fromEntries(GROUPS.map((g) => [g.key, active.filter((p) => groupOf(p) === g.key).length])),
    [active]
  );

  const toggle = (code) => {
    if (code === me) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const toggleGroup = (list) => {
    const codes = list.map((p) => p.userCode).filter((c) => c !== me);
    const allSelected = codes.every((c) => selected.has(c));
    setSelected((prev) => {
      const next = new Set(prev);
      codes.forEach((c) => (allSelected ? next.delete(c) : next.add(c)));
      return next;
    });
  };

  const selectedPeople = [...selected].map((c) => usersMap[c] || { userCode: c, name: "Unknown" });
  const others = [...selected].filter((c) => c !== me);
  // A new topic needs at least one other active admin
  const blocker = !title.trim() ? "Give the topic a name." : !isEdit && !others.length ? "Add at least one person." : "";
  const canSave = !saving && !blocker;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        const jobs = [];
        const titleChanged = title.trim() !== topic.title;
        const eventChanged = (event?.eventId || "") !== (topic.eventId || "");
        if (titleChanged || eventChanged) {
          jobs.push(
            dispatch(
              updateTopic({
                topicId: topic.id,
                ...(titleChanged && { title: title.trim() }),
                ...(eventChanged && { event: event?.eventId || "", eventName: event?.eventName || "" }),
                silent: true,
              })
            ).unwrap()
          );
        }
        // The complete list; the server keeps the caller in anyway
        if (!sameMembers(selected, topic.members)) {
          jobs.push(dispatch(saveTopicMembers({ topicId: topic.id, memberUserCodes: [...selected], silent: true })).unwrap());
        }
        await Promise.all(jobs);
      } else {
        const { topic: created } = await dispatch(
          createTopic({ title: title.trim(), event: event?.eventId, memberUserCodes: others, silent: true })
        ).unwrap();
        onCreated?.(topicIdOf(created));
      }
      onClose();
    } catch (msg) {
      setError(typeof msg === "string" ? msg : "Could not save the topic");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-nunito p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="w-full max-w-[620px] max-h-[calc(100dvh-32px)] md:max-h-[calc(100vh-32px)] bg-white rounded-[20px] shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 md:px-7 md:pt-6 pb-4 shrink-0">
          <h3 className="text-[20px] md:text-[24px] font-semibold text-[#1E293B]">{isEdit ? "Edit topic" : "New topic"}</h3>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="w-10 h-10 -mr-1 md:mr-0 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[#1E293B] hover:bg-[#F1F5F9] transition cursor-pointer"
          >
            <FiX className="text-[20px]" />
          </button>
        </div>

        {/* Phones: the whole body scrolls, since the stacked fields leave little room for the list */}
        <div className="flex-1 min-h-0 flex flex-col px-5 md:px-7 pb-5 max-md:overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
            <label className="block">
              <span className="block text-[14px] font-semibold text-[#64748B] mb-1.5">Topic</span>
              <input
                autoFocus={!isEdit}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pune venue shortlist"
                maxLength={120}
                className={inputClass}
              />
            </label>
            <div className="block">
              <span className="block text-[14px] font-semibold text-[#64748B] mb-1.5">Related event (optional)</span>
              <EventPicker value={event} onChange={setEvent} />
            </div>
          </div>

          <span className="block text-[14px] font-semibold text-[#64748B] mt-5 mb-2 shrink-0">People</span>
          <div className="flex flex-wrap gap-2 mb-3 shrink-0 max-h-[88px] overflow-y-auto">
            {selectedPeople.map((p) => (
              <span key={p.userCode} className="inline-flex items-center gap-1.5 max-w-full h-8 pl-1 pr-3 rounded-full bg-[#EAF1FE] text-[#0B57D0] text-[14px] font-bold">
                <Avatar person={p} className="w-6 h-6 text-[10px]" />
                <span className="truncate">{p.userCode === me ? "You" : p.name}</span>
                {p.userCode !== me && (
                  <button type="button" onClick={() => toggle(p.userCode)} className="ml-0.5 text-[#0B57D0]/70 hover:text-[#0B57D0] cursor-pointer">
                    <FiX className="text-[13px]" />
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex-1 min-h-[220px] max-md:shrink-0 border border-[#E2E8F0] rounded-2xl flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[#E2E8F0] shrink-0">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[16px]" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" className={`${inputClass} pl-10`} />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" onClick={() => setGroupFilter("all")} className={chipClass(groupFilter === "all")}>
                  All
                </button>
                {GROUPS.map((g) => (
                  <button key={g.key} type="button" onClick={() => setGroupFilter(g.key)} className={chipClass(groupFilter === g.key)}>
                    {g.chip || g.label}
                    {peopleFetched && ` (${groupCounts[g.key]})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto max-h-[300px]">
              {peopleError && !peopleFetched ? (
                <div className="text-center py-8">
                  <p className="text-[14px] text-[#777777]">People did not load.</p>
                  <button type="button" onClick={() => dispatch(fetchDiscussionPeople())} className="mt-1 text-[14px] font-bold text-[#0B57D0] hover:underline cursor-pointer">
                    Try again
                  </button>
                </div>
              ) : !peopleFetched ? (
                <PeopleSkeleton />
              ) : visibleGroups.length === 0 ? (
                <p className="text-center text-[14px] text-[#777777] py-8">No people found</p>
              ) : (
                visibleGroups.map((g) => (
                  <div key={g.key}>
                    <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                      <span className="text-[13px] font-bold text-[#64748B]">{g.label}</span>
                      <button type="button" onClick={() => toggleGroup(g.people)} className="text-[14px] font-bold text-[#0B57D0] hover:underline cursor-pointer">
                        {g.people.every((p) => selected.has(p.userCode)) ? "Clear all" : "Select all"}
                      </button>
                    </div>
                    {g.people.map((p) => {
                      const isMe = p.userCode === me;
                      return (
                        <label
                          key={p.userCode}
                          className={`flex items-center gap-3 px-4 py-2.5 transition ${isMe ? "bg-[#F8FAFC] cursor-default" : "hover:bg-[#F8FAFC] cursor-pointer"}`}
                        >
                          <Avatar person={p} className="w-8 h-8 text-[12px]" />
                          <div className={`flex-1 min-w-0 ${isMe ? "opacity-60" : ""}`}>
                            <p className="text-[15px] font-semibold text-[#1E293B] truncate">
                              {p.name}
                              {isMe && " (you)"}
                            </p>
                            <p className="text-[13px] text-[#64748B] truncate">{roleLabel(p, portfolioNames)}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={selected.has(p.userCode)}
                            disabled={isMe}
                            onChange={() => toggle(p.userCode)}
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

          {error && (
            <p role="alert" className="mt-3 text-[14px] font-semibold text-[#B91C1C] shrink-0">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 md:px-7 py-4 border-t border-[#E2E8F0] shrink-0">
          {blocker && (title || others.length) ? (
            <span aria-live="polite" className="text-[15px] font-semibold text-[#B45309]">{blocker}</span>
          ) : (
            <span className="text-[15px] text-[#64748B]">
              {selected.size} {selected.size === 1 ? "person" : "people"} selected
            </span>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button type="button" onClick={onClose} disabled={saving} className="h-10 px-4 rounded-full text-[15px] font-bold text-[#334155] hover:bg-[#F1F5F9] transition cursor-pointer disabled:opacity-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="h-10 px-5 rounded-full bg-[#1D72E8] text-white text-[15px] font-bold hover:bg-[#0B57D0] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create topic"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}