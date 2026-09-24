"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiArrowLeft,
  FiSend,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiSearch,
  FiChevronDown,
  FiMail,
  FiRefreshCw,
  FiDownload,
  FiCopy,
  FiCheck,
  FiInbox,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getBulkMessageReports, getWhatsAppTemplates } from "@/services/broadcast.service";

const PAGE_SIZE = 20;

// Providers report many raw statuses (PENDING_ENROUTE, sent, failed, READ,
// UNDELIVERABLE…). Collapse them into four buckets the UI can colour-code.
// Failure is checked first so "UNDELIVERABLE" doesn't match "deliver".
function normalizeStatus(raw) {
  const v = String(raw || "").toLowerCase();
  if (!v) return "unknown";
  if (/(fail|reject|undeliver|error|expire|bounce)/.test(v)) return "failed";
  if (/(read|deliver)/.test(v)) return "delivered";
  if (/(pending|enroute|queue|accept|process|submit)/.test(v)) return "pending";
  if (/(sent|success)/.test(v)) return "sent";
  return "unknown";
}

const STATUS_META = {
  delivered: { label: "Delivered", pill: "bg-[#ecfdf5] text-[#047857]", dot: "bg-[#10b981]", bar: "bg-[#10b981]" },
  sent: { label: "Sent", pill: "bg-[#eff6ff] text-[#1d4ed8]", dot: "bg-[#3b82f6]", bar: "bg-[#3b82f6]" },
  pending: { label: "Pending", pill: "bg-[#fffbeb] text-[#b45309]", dot: "bg-[#f59e0b]", bar: "bg-[#f59e0b]" },
  failed: { label: "Failed", pill: "bg-[#fef2f2] text-[#b91c1c]", dot: "bg-[#ef4444]", bar: "bg-[#ef4444]" },
  unknown: { label: "Unknown", pill: "bg-[#f3f4f6] text-[#4b5563]", dot: "bg-[#9ca3af]", bar: "bg-[#9ca3af]" },
};
const STATUS_ORDER = ["delivered", "sent", "pending", "failed", "unknown"];

const CHANNEL_META = {
  whatsapp: { label: "WhatsApp", Icon: FaWhatsapp, tile: "bg-[#ecfdf5] text-[#16a34a]" },
  email: { label: "Email", Icon: FiMail, tile: "bg-[#eff6ff] text-[#2563eb]" },
};

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function humanizeTemplate(name) {
  if (!name) return "Untitled template";
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Email subjects are stored with the server-side placeholder still in them.
function cleanSubject(subject) {
  return (subject || "").replace(/\$\{\s*user\.name\s*\}/g, "{name}");
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(date) === dayKey(today)) return "Today";
  if (dayKey(date) === dayKey(yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function timeLabel(date) {
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function shortDateTime(date) {
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function countStatuses(messages) {
  const counts = { delivered: 0, sent: 0, pending: 0, failed: 0, unknown: 0 };
  messages.forEach((m) => {
    counts[m.bucket] += 1;
  });
  return counts;
}

function csvCell(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/* ───────────────────────── small UI pieces ───────────────────────── */

function StatusPill({ bucket, raw }) {
  const meta = STATUS_META[bucket];
  return (
    <span
      title={raw || meta.label}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${meta.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function ChannelIcon({ type, size = "md" }) {
  const meta = CHANNEL_META[type] || CHANNEL_META.whatsapp;
  const box = size === "sm" ? "w-7 h-7 rounded-lg text-[14px]" : "w-11 h-11 rounded-xl text-[20px]";
  return (
    <div title={meta.label} className={`${box} grid place-items-center shrink-0 ${meta.tile}`}>
      <meta.Icon />
    </div>
  );
}

function StatTile({ icon: Icon, iconClass, label, value, hint }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0px_2px_10px_rgba(0,0,0,0.04)] flex items-start gap-3.5">
      <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${iconClass}`}>
        <Icon className="text-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-[#888]">{label}</p>
        <p className="text-[24px] font-bold text-[#1a1a2e] leading-tight mt-0.5 tabular-nums">{value}</p>
        {hint && <p className="text-[12px] text-[#9ca3af] mt-0.5 truncate">{hint}</p>}
      </div>
    </div>
  );
}

function Dropdown({ value, options, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between gap-2 h-[42px] px-3 rounded-[10px] border text-[13px] bg-white transition-colors cursor-pointer ${
          open ? "border-[#2563eb] ring-1 ring-[#2563eb]/30" : "border-[#d1d5db] hover:border-[#9ca3af]"
        }`}
      >
        <span className="text-[#111] truncate">{current?.label}</span>
        <FiChevronDown
          className={`text-[#6b7280] text-[16px] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-30 right-0 min-w-full mt-1 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5 max-h-[260px] overflow-y-auto">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] rounded-[7px] whitespace-nowrap cursor-pointer ${
                value === o.value ? "bg-[#eff6ff] text-[#2563eb] font-medium" : "text-[#111] hover:bg-[#f9fafb]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="inline-flex p-1 rounded-[10px] bg-[#f3f4f6]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex items-center gap-1.5 px-3 h-[34px] rounded-[8px] text-[13px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            value === o.value ? "bg-white text-[#1a1a2e] shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "text-[#6b7280] hover:text-[#1a1a2e]"
          }`}
        >
          {o.icon && <o.icon className="text-[14px]" />}
          {o.label}
          {o.count !== undefined && <span className="text-[11px] font-medium text-[#9ca3af] tabular-nums">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  if (!text) return <span className="w-7" />;
  return (
    <button
      type="button"
      title={`Copy message ID\n${text}`}
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      className="w-7 h-7 grid place-items-center rounded-[6px] text-[#9ca3af] hover:text-[#2563eb] hover:bg-[#eff6ff] cursor-pointer transition-colors"
    >
      {copied ? <FiCheck className="text-[13px] text-[#10b981]" /> : <FiCopy className="text-[13px]" />}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-5 shadow-[0px_2px_10px_rgba(0,0,0,0.04)] flex items-center gap-4 animate-pulse">
          <div className="w-11 h-11 rounded-xl bg-[#f1f5f9]" />
          <div className="flex-1">
            <div className="h-3.5 w-1/3 rounded bg-[#f1f5f9]" />
            <div className="h-3 w-1/4 rounded bg-[#f1f5f9] mt-2.5" />
          </div>
          <div className="h-2 w-28 rounded-full bg-[#f1f5f9]" />
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── message rows ───────────────────────── */

const MESSAGE_GRID =
  "md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,1.4fr)_90px_120px_28px]";

// One day's messages as a flat table: every row is a single recipient with
// its own send time, channel and template, so nothing needs expanding.
function MessageDayTable({ rows }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0px_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
      <div
        className={`hidden md:grid ${MESSAGE_GRID} gap-4 px-5 py-3 border-b border-[#f1f5f9] text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]`}
      >
        <span>Recipient</span>
        <span>Contact</span>
        <span>Message</span>
        <span>Time</span>
        <span>Status</span>
        <span />
      </div>
      {rows.map((m) => (
        <div
          key={m.rowKey}
          className={`grid grid-cols-[minmax(0,1fr)_auto] ${MESSAGE_GRID} gap-x-4 gap-y-1 items-center px-5 py-3 border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f9fafb]`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 min-w-[36px] rounded-full bg-[#E5E7EB] text-[#555] grid place-items-center text-[12px] font-bold">
              {initials(m.name)}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#1a1a2e] truncate">{m.name || "Unnamed"}</p>
              <p className="md:hidden text-[12px] text-[#888] truncate">
                {timeLabel(m.date)} · {m.phone || m.email}
              </p>
            </div>
          </div>
          <span className="hidden md:block text-[13px] text-[#555] truncate tabular-nums">{m.phone || m.email || "—"}</span>
          <div className="hidden md:flex items-center gap-2.5 min-w-0">
            <ChannelIcon type={m.messageType} size="sm" />
            <span className="text-[13px] text-[#1a1a2e] truncate" title={m.title}>
              {m.title}
            </span>
          </div>
          <span className="hidden md:block text-[13px] text-[#555] tabular-nums whitespace-nowrap">{timeLabel(m.date)}</span>
          <div className="flex flex-col items-end md:items-start gap-0.5 min-w-0">
            <StatusPill bucket={m.bucket} raw={m.status} />
            {m.error && (
              <span className="text-[11px] text-[#b91c1c] truncate max-w-[140px]" title={m.error}>
                {m.error}
              </span>
            )}
          </div>
          <div className="hidden md:block">
            <CopyButton text={m.messageId} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── page ───────────────────────── */

export default function BroadcastReportsClient() {
  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  // Filters live in the URL (?q=&template=&status=&channel=&view=) so they
  // survive a refresh and can be shared; unknown values fall back to defaults.
  const searchParams = useSearchParams();
  const pick = (key, allowed, fallback) => {
    const v = searchParams.get(key);
    return v && (!allowed || allowed.includes(v)) ? v : fallback;
  };

  const [templates, setTemplates] = useState([]);
  const [templateFilter, setTemplateFilter] = useState(() => pick("template", null, ""));
  const [channel, setChannel] = useState(() => pick("channel", ["whatsapp", "email"], "all"));
  const [statusFilter, setStatusFilter] = useState(() =>
    pick("status", STATUS_ORDER.filter((b) => b !== "unknown"), "all")
  );
  const [search, setSearch] = useState(() => pick("q", null, ""));
  const [view, setView] = useState(() => pick("view", ["recipients"], "messages"));

  // replaceState (not router.replace) so typing in search doesn't trigger a
  // navigation or add history entries; Next keeps useSearchParams in sync.
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (templateFilter) params.set("template", templateFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (channel !== "all") params.set("channel", channel);
    if (view !== "messages") params.set("view", view);
    const qs = params.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", url);
    }
  }, [search, templateFilter, statusFilter, channel, view]);

  useEffect(() => {
    getWhatsAppTemplates()
      .then((res) => setTemplates(Array.isArray(res?.result) ? res.result : []))
      .catch(() => {});
  }, []);

  const templateLabel = (name) => templates.find((t) => t.templateName === name)?.label || humanizeTemplate(name);

  // start = how many broadcasts to skip; offset = page size.
  const loadReports = async ({ reset }) => {
    const requestId = ++requestIdRef.current;
    const start = reset ? 0 : reports.length;
    if (reset) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const res = await getBulkMessageReports({ templateName: templateFilter, start, offset: PAGE_SIZE });
      if (requestId !== requestIdRef.current) return; // a newer request superseded this one
      const list = Array.isArray(res?.result) ? res.result : [];
      setReports((prev) => {
        if (reset) return list;
        const seen = new Set(prev.map((r) => r._id));
        return [...prev, ...list.filter((r) => !seen.has(r._id))];
      });
      setTotalCount(typeof res?.count === "number" ? res.count : start + list.length);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err?.response?.data?.message || err?.message || "Failed to load reports");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    loadReports({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateFilter]);

  // Normalise once: parsed date, display title, and a status bucket per message.
  const normalized = useMemo(
    () =>
      reports.map((r) => ({
        ...r,
        date: new Date(r.createdAt),
        title:
          r.messageType === "email"
            ? cleanSubject(r.subject) || "Email broadcast"
            : templateLabel(r.templateName),
        messages: (r.messages || []).map((m) => ({ ...m, bucket: normalizeStatus(m.status) })),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reports, templates]
  );

  const byChannel = useMemo(
    () => (channel === "all" ? normalized : normalized.filter((r) => r.messageType === channel)),
    [normalized, channel]
  );

  const stats = useMemo(() => {
    const all = byChannel.flatMap((r) => r.messages);
    const counts = countStatuses(all);
    const successful = counts.delivered + counts.sent;
    return {
      broadcasts: byChannel.length,
      messages: all.length,
      successful,
      rate: all.length ? Math.round((successful / all.length) * 100) : 0,
      pending: counts.pending,
      failed: counts.failed,
      whatsapp: normalized.filter((r) => r.messageType === "whatsapp").length,
      email: normalized.filter((r) => r.messageType === "email").length,
    };
  }, [byChannel, normalized]);

  const query = search.trim().toLowerCase();
  const matchesMessage = (m) =>
    (statusFilter === "all" || m.bucket === statusFilter) &&
    (!query || [m.name, m.phone, m.email].some((v) => (v || "").toLowerCase().includes(query)));

  const visibleReports = useMemo(
    () =>
      byChannel
        .map((r) => ({ ...r, visibleMessages: r.messages.filter(matchesMessage) }))
        .filter((r) => r.visibleMessages.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [byChannel, statusFilter, query]
  );

  // Flatten every visible message into its own row (carrying the broadcast's
  // time, channel and title), grouped under a header per day.
  const groupedByDay = useMemo(() => {
    const groups = [];
    visibleReports.forEach((r) => {
      const key = dayKey(r.date);
      let group = groups[groups.length - 1];
      if (group?.key !== key) {
        group = { key, label: dayLabel(r.date), rows: [] };
        groups.push(group);
      }
      r.visibleMessages.forEach((m, i) => {
        group.rows.push({
          ...m,
          rowKey: `${r._id}-${m.messageId || i}`,
          date: r.date,
          messageType: r.messageType,
          title: r.title,
        });
      });
    });
    return groups;
  }, [visibleReports]);

  // One row per person (by phone, else email) across every loaded broadcast.
  const recipients = useMemo(() => {
    const map = new Map();
    visibleReports.forEach((r) => {
      r.visibleMessages.forEach((m) => {
        const key = (m.phone || m.email || m.name || "").toLowerCase();
        const entry = map.get(key) || {
          key,
          name: m.name,
          phone: m.phone,
          email: m.email,
          channels: new Set(),
          sends: 0,
          failed: 0,
          last: null,
        };
        entry.channels.add(r.messageType);
        entry.sends += 1;
        if (m.bucket === "failed") entry.failed += 1;
        if (!entry.phone && m.phone) entry.phone = m.phone;
        if (!entry.email && m.email) entry.email = m.email;
        if (!entry.last || r.date > entry.last.date) {
          entry.last = { date: r.date, bucket: m.bucket, status: m.status, title: r.title };
          entry.name = m.name || entry.name;
        }
        map.set(key, entry);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.last.date - a.last.date);
  }, [visibleReports]);

  const exportCsv = () => {
    const header = ["Sent at", "Channel", "Template / Subject", "Name", "Phone", "Email", "Status", "Raw status", "Error", "Message ID"];
    const rows = visibleReports.flatMap((r) =>
      r.visibleMessages.map((m) => [
        r.date.toLocaleString("en-IN"),
        CHANNEL_META[r.messageType]?.label || r.messageType,
        r.title,
        m.name,
        m.phone,
        m.email,
        STATUS_META[m.bucket].label,
        m.status,
        m.error,
        m.messageId,
      ])
    );
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `broadcast-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasMore = reports.length < totalCount;
  const filtersActive = channel !== "all" || statusFilter !== "all" || !!query || !!templateFilter;
  const clearFilters = () => {
    setChannel("all");
    setStatusFilter("all");
    setSearch("");
    setTemplateFilter("");
  };

  const templateOptions = [
    { value: "", label: "All templates" },
    ...templates.map((t) => ({ value: t.templateName, label: t.label || humanizeTemplate(t.templateName) })),
  ];
  const statusOptions = [
    { value: "all", label: "Any status" },
    ...STATUS_ORDER.filter((b) => b !== "unknown").map((b) => ({ value: b, label: STATUS_META[b].label })),
  ];

  return (
    <div className="pt-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/send-bulk")}
            title="Back to new broadcast"
            className="w-10 h-10 rounded-xl bg-white shadow-[0px_2px_6px_rgba(0,0,0,0.08)] flex items-center justify-center cursor-pointer text-[#333]"
          >
            <FiArrowLeft className="text-[18px]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">Broadcast reports</h1>
            <p className="text-[13px] text-[#888]">Everyone you&apos;ve messaged on WhatsApp and email, and where each message stands</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadReports({ reset: true })}
            disabled={loading}
            title="Refresh"
            className="w-10 h-10 rounded-[10px] border border-[#d1d5db] bg-white grid place-items-center text-[#555] hover:bg-[#f9fafb] cursor-pointer disabled:cursor-not-allowed"
          >
            <FiRefreshCw className={`text-[16px] ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={exportCsv}
            disabled={visibleReports.length === 0}
            className="flex items-center gap-2 px-4 h-10 rounded-[10px] border border-[#d1d5db] bg-white text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload className="text-[15px]" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 mb-6">
        <StatTile
          icon={FiSend}
          iconClass="bg-[#eff6ff] text-[#2563eb]"
          label="Broadcasts"
          value={loading ? "—" : channel === "all" ? totalCount : stats.broadcasts}
          hint={loading ? "" : `${stats.whatsapp} WhatsApp · ${stats.email} email${hasMore ? " loaded" : ""}`}
        />
        <StatTile
          icon={FiUsers}
          iconClass="bg-[#f5f3ff] text-[#7c3aed]"
          label="Messages sent"
          value={loading ? "—" : stats.messages}
          hint={loading ? "" : `${recipients.length} unique recipient${recipients.length === 1 ? "" : "s"}`}
        />
        <StatTile
          icon={FiCheckCircle}
          iconClass="bg-[#ecfdf5] text-[#059669]"
          label="Sent / delivered"
          value={loading ? "—" : stats.successful}
          hint={loading ? "" : `${stats.rate}% success rate`}
        />
        <StatTile
          icon={FiClock}
          iconClass="bg-[#fffbeb] text-[#d97706]"
          label="Pending"
          value={loading ? "—" : stats.pending}
          hint="Awaiting provider update"
        />
        <StatTile
          icon={FiAlertCircle}
          iconClass="bg-[#fef2f2] text-[#dc2626]"
          label="Failed"
          value={loading ? "—" : stats.failed}
          hint={stats.failed ? "Filter by Failed to review" : "Nothing failed"}
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-[0px_2px_10px_rgba(0,0,0,0.04)] mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[16px]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipient name, phone or email"
              className="w-full h-[42px] pl-10 pr-3 rounded-[10px] border border-[#d1d5db] text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af]"
            />
          </div>
          <Dropdown value={templateFilter} options={templateOptions} onChange={setTemplateFilter} className="w-[220px]" />
          <Dropdown value={statusFilter} options={statusOptions} onChange={setStatusFilter} className="w-[150px]" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={channel}
            onChange={setChannel}
            options={[
              { value: "all", label: "All channels", count: normalized.length },
              { value: "whatsapp", label: "WhatsApp", icon: FaWhatsapp, count: stats.whatsapp },
              { value: "email", label: "Email", icon: FiMail, count: stats.email },
            ]}
          />
          <div className="flex items-center gap-3">
            {filtersActive && (
              <button onClick={clearFilters} className="text-[13px] font-semibold text-[#2563eb] hover:underline cursor-pointer">
                Clear filters
              </button>
            )}
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "messages", label: "All messages" },
                { value: "recipients", label: "By recipient" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="bg-white rounded-2xl p-10 shadow-[0px_2px_10px_rgba(0,0,0,0.04)] flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#fef2f2] text-[#dc2626] grid place-items-center mb-3">
            <FiAlertCircle className="text-[22px]" />
          </div>
          <p className="text-[15px] font-semibold text-[#1a1a2e]">Couldn&apos;t load reports</p>
          <p className="text-[13px] text-[#888] mt-1">{error}</p>
          <button
            onClick={() => loadReports({ reset: true })}
            className="mt-4 px-5 h-[38px] rounded-[8px] bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : visibleReports.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 shadow-[0px_2px_10px_rgba(0,0,0,0.04)] flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#f3f4f6] text-[#9ca3af] grid place-items-center mb-3">
            <FiInbox className="text-[22px]" />
          </div>
          <p className="text-[15px] font-semibold text-[#1a1a2e]">
            {filtersActive ? "No messages match these filters" : "No broadcasts sent yet"}
          </p>
          <p className="text-[13px] text-[#888] mt-1">
            {filtersActive ? "Try a different search or clear the filters." : "Broadcasts you send will show up here with their delivery status."}
          </p>
          {filtersActive ? (
            <button onClick={clearFilters} className="mt-4 text-[13px] font-semibold text-[#2563eb] hover:underline cursor-pointer">
              Clear filters
            </button>
          ) : (
            <button
              onClick={() => router.push("/dashboard/send-bulk")}
              className="mt-4 px-5 h-[38px] rounded-[8px] bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] cursor-pointer"
            >
              Send a broadcast
            </button>
          )}
        </div>
      ) : view === "messages" ? (
        <div className="flex flex-col gap-6">
          {groupedByDay.map((group) => (
            <section key={group.key}>
              <div className="flex items-center gap-3 mb-3 px-1">
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#6b7280]">{group.label}</h2>
                <span className="text-[12px] text-[#9ca3af]">
                  {group.rows.length} message{group.rows.length === 1 ? "" : "s"}
                </span>
                <div className="flex-1 h-px bg-[#e5e7eb]" />
              </div>
              <MessageDayTable rows={group.rows} />
            </section>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0px_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="hidden md:grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_90px_80px_minmax(0,1.3fr)_110px] gap-4 px-5 py-3 border-b border-[#f1f5f9] text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
            <span>Recipient</span>
            <span>Contact</span>
            <span>Channels</span>
            <span>Sent</span>
            <span>Last message</span>
            <span>Last status</span>
          </div>
          {recipients.map((p) => (
            <div
              key={p.key}
              className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_90px_80px_minmax(0,1.3fr)_110px] gap-x-4 gap-y-1 items-center px-5 py-3 border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f9fafb]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 min-w-[36px] rounded-full bg-[#E5E7EB] text-[#555] grid place-items-center text-[12px] font-bold">
                  {initials(p.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#1a1a2e] truncate">{p.name || "Unnamed"}</p>
                  <p className="md:hidden text-[12px] text-[#888] truncate">
                    {p.sends}× · last {shortDateTime(p.last.date)}
                  </p>
                </div>
              </div>
              <div className="hidden md:block min-w-0 text-[13px] text-[#555]">
                {p.phone && <p className="truncate tabular-nums">{p.phone}</p>}
                {p.email && <p className="truncate text-[12px] text-[#888]">{p.email}</p>}
              </div>
              <div className="hidden md:flex items-center gap-1.5">
                {["whatsapp", "email"].filter((c) => p.channels.has(c)).map((c) => (
                  <ChannelIcon key={c} type={c} size="sm" />
                ))}
              </div>
              <div className="hidden md:block text-[13px] text-[#1a1a2e] tabular-nums">
                <span className="font-semibold">{p.sends}×</span>
                {p.failed > 0 && <span className="block text-[11px] text-[#b91c1c]">{p.failed} failed</span>}
              </div>
              <div className="hidden md:block min-w-0">
                <p className="text-[13px] text-[#1a1a2e] truncate">{p.last.title}</p>
                <p className="text-[12px] text-[#888]">{shortDateTime(p.last.date)}</p>
              </div>
              <div className="flex justify-end md:justify-start">
                <StatusPill bucket={p.last.bucket} raw={p.last.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && reports.length > 0 && (
        <div className="flex flex-col items-center gap-2 mt-6">
          <p className="text-[12px] text-[#9ca3af]">
            Showing {reports.length} of {totalCount} broadcast{totalCount === 1 ? "" : "s"}
            {hasMore && filtersActive && " · filters apply to loaded broadcasts"}
          </p>
          {hasMore && (
            <button
              onClick={() => loadReports({ reset: false })}
              disabled={loadingMore}
              className="px-5 h-[38px] rounded-[8px] border border-[#d1d5db] bg-white text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingMore ? "Loading…" : `Load ${Math.min(PAGE_SIZE, totalCount - reports.length)} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
