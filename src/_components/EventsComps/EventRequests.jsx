"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import {
  FiAlertTriangle, FiBell, FiCalendar, FiCheck, FiCheckCircle, FiChevronDown, FiClock, FiEdit3,
  FiFileText, FiMapPin, FiMessageSquare, FiNavigation, FiPaperclip, FiSearch, FiTrash2, FiUser, FiUsers, FiX,
  FiXCircle,
} from "react-icons/fi";
import { MdCurrencyRupee } from "react-icons/md";
import { useSelector } from "react-redux";

// Events proposed by portfolio officers. Dummy data until the requests API exists.
const DUMMY_REQUESTS = [
  {
    id: "REQ-1042",
    eventName: "Leadership Training Workshop",
    eventType: { type: "Workshop", points: 3 },
    description:
      "A hands-on, two-day workshop for mid-level members on decision making, delegation and leading cross-functional teams. Includes case studies and peer feedback rounds.",
    startDate: "2026-11-18T10:00:00",
    endDate: "2026-11-19T17:00:00",
    location: "Conference Hall B, Head Office",
    attendees: { member: true, spouse: false, children: false, guests: true },
    registrationOpen: true,
    expectedAttendees: 60,
    speaker: {
      name: "Dr. Anita Menon",
      description: "Executive coach, 15+ years in leadership development",
      weblinks: ["linkedin.com/in/anitamenon"],
    },
    collaborators: [
      { name: "Priya Nair", role: "Co-host" },
      { name: "Vikram Rao", role: "Logistics" },
    ],
    reminders: ["1 day before", "1 hour before"],
    travelInfo: { required: false },
    attachments: [
      { name: "Workshop_Agenda.pdf", size: "240 KB" },
      { name: "Speaker_Profile.pdf", size: "1.1 MB" },
    ],
    additionalNote: "Lunch and tea breaks to be arranged by the venue.",
    budget: { estimated: 1200000, portfolioRemaining: 3800000, portfolioTotal: 8000000 },
    proposedBy: { name: "Rahul Sharma", role: "Learning Portfolio Officer", portfolio: "Learning & Development" },
    submittedAt: "2026-10-28T14:20:00",
    conflict: null,
    status: "pending",
  },
  {
    id: "REQ-1039",
    eventName: "Annual Learning Conference",
    eventType: { type: "Conference", points: 5 },
    description:
      "Flagship annual conference with keynote sessions, breakout tracks and a networking dinner for members and families.",
    startDate: "2026-12-05T09:00:00",
    endDate: "2026-12-06T20:00:00",
    location: "Taj Lands End, Mumbai",
    attendees: { member: true, spouse: true, children: false, guests: true },
    registrationOpen: true,
    expectedAttendees: 250,
    speaker: { name: "Multiple speakers", description: "6 keynote speakers, listed in attachment", weblinks: [] },
    collaborators: [{ name: "Sneha Kapoor", role: "Co-host" }],
    reminders: ["1 week before", "1 day before"],
    travelInfo: { required: true, deadline: "2026-11-25", requiredInfo: ["Ticket details", "Insurance details"] },
    attachments: [{ name: "Conference_Plan.pdf", size: "2.4 MB" }],
    additionalNote: "",
    budget: { estimated: 3200000, portfolioRemaining: 3800000, portfolioTotal: 8000000 },
    proposedBy: { name: "Rahul Sharma", role: "Learning Portfolio Officer", portfolio: "Learning & Development" },
    submittedAt: "2026-10-26T11:05:00",
    conflict: "Diwali Family Meet is already scheduled on 05 Dec 2026",
    status: "pending",
  },
  {
    id: "REQ-1031",
    eventName: "Soft Skills Development",
    eventType: { type: "Training", points: 2 },
    description: "Half-day session on communication, presentation and negotiation skills.",
    startDate: "2026-11-10T14:00:00",
    endDate: "2026-11-10T18:00:00",
    location: "Zoom meeting link",
    attendees: { member: true, spouse: false, children: false, guests: false },
    registrationOpen: false,
    expectedAttendees: 40,
    speaker: { name: "Karan Mehta", description: "Corporate trainer", weblinks: [] },
    collaborators: [],
    reminders: ["1 hour before"],
    travelInfo: { required: false },
    attachments: [],
    additionalNote: "",
    budget: { estimated: 96000, portfolioRemaining: 3800000, portfolioTotal: 8000000 },
    proposedBy: { name: "Meera Iyer", role: "Learning Portfolio Officer", portfolio: "Professional Growth" },
    submittedAt: "2026-10-20T09:40:00",
    conflict: null,
    status: "approved",
  },
];

const STATUS = {
  pending: { label: "Pending review", Icon: FiClock, className: "bg-[#FEF7E0] text-[#B06000]" },
  changes: { label: "Changes requested", Icon: FiEdit3, className: "bg-[#E8EEFE] text-[#3B63E8]" },
  approved: { label: "Approved", Icon: FiCheckCircle, className: "bg-[#E6F4EA] text-[#137333]" },
  rejected: { label: "Rejected", Icon: FiXCircle, className: "bg-[#FEE2E2] text-[#B91C1C]" },
};

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "changes", label: "Changes requested", short: "Changes" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const formatAmount = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN")}`;
const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const formatTime = (value) =>
  new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const daysAgo = (value) => {
  const days = Math.floor((new Date("2026-10-30") - new Date(value)) / 86400000);
  return days <= 0 ? "Today" : `${days} day${days > 1 ? "s" : ""} ago`;
};
const initials = (name) => name.split(" ").map((n) => n[0]).slice(0, 2).join("");

const StatusPill = ({ status }) => {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${s.className}`}>
      <s.Icon className="w-3.5 h-3.5" />
      {s.label}
    </span>
  );
};

const Avatar = ({ name, size = 36 }) => (
  <div
    className="rounded-full bg-[#D3E3FD] text-[#0B57D0] font-bold grid place-items-center shrink-0"
    style={{ width: size, height: size, fontSize: size * 0.38 }}
  >
    {initials(name)}
  </div>
);

const Section = ({ Icon, title, children }) => (
  <div className="px-5 md:px-7 py-5 border-b border-[#F1F5F9]">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-[#64748B]" />
      <h4 className="text-[16px] font-bold text-[#1E293B]">{title}</h4>
    </div>
    {children}
  </div>
);

const Fact = ({ Icon, label, value, sub }) => (
  <div className="flex items-start gap-2.5 min-w-0">
    <Icon className="w-[18px] h-[18px] mt-0.5 shrink-0 text-[#2B7FFF]" />
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-[#64748B]">{label}</p>
      <p className="text-[15px] font-bold text-[#0F172A] break-words">{value}</p>
      {sub && <p className="text-[13px] text-[#64748B]">{sub}</p>}
    </div>
  </div>
);

const RequestRow = ({ request, expanded, onToggle, children }) => (
  <div
    className={`shrink-0 rounded-[16px] border bg-white overflow-hidden transition-colors ${
      expanded ? "border-[#0B57D0] shadow-[0px_1px_4px_0px_#0000000d]" : "border-[#EAEEF2]"
    }`}
  >
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`w-full text-left p-4 md:px-5 flex flex-wrap md:flex-nowrap items-center gap-x-6 gap-y-3 cursor-pointer border-0 transition-colors ${
        expanded ? "bg-[#F2F7FF]" : "bg-white hover:bg-[#FAFAFA]"
      }`}
    >
      <div className="min-w-0 flex-1 basis-full md:basis-auto">
        <h3 className="text-[16px] font-bold text-[#1A1A2E] leading-tight">{request.eventName}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[13px] text-[#4B5563]">
          <span className="flex items-center gap-1.5 text-[#2563EB]">
            <FiCalendar className="w-3.5 h-3.5" />
            {formatDate(request.startDate)}
          </span>
          <span className="flex items-center gap-0.5">
            <MdCurrencyRupee className="w-3.5 h-3.5" />
            {formatAmount(request.budget.estimated).slice(1)}
          </span>
          {request.conflict && (
            <span className="flex items-center gap-1 text-[#B06000]">
              <FiAlertTriangle className="w-3.5 h-3.5" />
              Date clash
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 min-w-0 md:w-[200px] shrink-0">
        <Avatar name={request.proposedBy.name} size={28} />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#333] truncate">{request.proposedBy.name}</p>
          <p className="text-[12px] text-[#888]">{daysAgo(request.submittedAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-auto shrink-0">
        <StatusPill status={request.status} />
        <FiChevronDown
          className={`w-5 h-5 text-[#64748B] transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </div>
    </button>
    {expanded && <div className="border-t border-[#EAEEF2]">{children}</div>}
  </div>
);

const DeleteRequestConfirm = ({ eventName, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onCancel}>
    <div
      className="w-full max-w-[480px] rounded-[28px] bg-white pt-12 pb-8 sm:pt-[60px] sm:pb-[40px] px-6 shadow-xl flex flex-col items-center gap-8 sm:gap-[40px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-center">
        <div className="text-[20px] sm:text-[24px] font-[700]">Delete this event request?</div>
        <p className="text-[15px] text-[#666] mt-2">
          &quot;{eventName}&quot; will be withdrawn from admin review. This cannot be undone.
        </p>
      </div>
      <div className="flex gap-4 sm:gap-[60px]">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full text-[18px] sm:text-[20px] bg-[#999999] px-6 py-2 text-white w-[120px] cursor-pointer border-0"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full text-[18px] sm:text-[20px] bg-[#DC2626] px-6 py-2 text-white w-[120px] cursor-pointer border-0"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const RequestDetails = ({ request, isAdmin, onDecision, onEdit, onDelete }) => {
  const [mode, setMode] = useState(null); // 'reject' | 'changes' while the reason field is open
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { budget, attendees } = request;
  const usedAfter = budget.portfolioTotal - budget.portfolioRemaining + budget.estimated;
  const usedPct = Math.min(100, Math.round((usedAfter / budget.portfolioTotal) * 100));
  const overBudget = budget.estimated > budget.portfolioRemaining;
  const audience = Object.entries(attendees).filter(([, on]) => on).map(([k]) => k[0].toUpperCase() + k.slice(1));
  const isPending = request.status === "pending";
  // The proposer can still edit or withdraw a request until the admin approves or rejects it
  const isEditable = isPending || request.status === "changes";

  const submitReason = () => {
    onDecision(request.id, mode === "reject" ? "rejected" : "changes", reason.trim());
    setMode(null);
    setReason("");
  };

  return (
    <div className="flex flex-col">
      <div>
        {/* Proposer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 md:px-7 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={request.proposedBy.name} />
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-[#0F172A]">{request.proposedBy.name}</p>
              <p className="text-[13px] text-[#64748B]">
                {request.proposedBy.role} · {request.proposedBy.portfolio}
              </p>
            </div>
          </div>
          <div className="text-right">
            <StatusPill status={request.status} />
            <p className="text-[12px] text-[#94A3B8] mt-1">
              Submitted {formatDate(request.submittedAt)}, {formatTime(request.submittedAt)}
            </p>
          </div>
        </div>

        {request.conflict && (
          <div className="mx-5 md:mx-7 mt-5 flex items-start gap-2.5 rounded-[12px] bg-[#FEF7E0] border border-[#FCD34D] px-4 py-3 text-[14px] text-[#B06000]">
            <FiAlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span><b>Schedule conflict:</b> {request.conflict}</span>
          </div>
        )}

        {/* Key facts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-5 md:px-7 py-5 border-b border-[#F1F5F9]">
          <Fact
            Icon={FiCalendar}
            label="Date & time"
            value={`${formatDate(request.startDate)}${
              formatDate(request.startDate) !== formatDate(request.endDate) ? ` – ${formatDate(request.endDate)}` : ""
            }`}
            sub={`${formatTime(request.startDate)} – ${formatTime(request.endDate)}`}
          />
          <Fact Icon={FiMapPin} label="Location" value={request.location} />
          <Fact
            Icon={FiUsers}
            label="Who can attend"
            value={audience.join(", ")}
            sub={`~${request.expectedAttendees} expected · Registration ${request.registrationOpen ? "open" : "closed"}`}
          />
          <Fact Icon={MdCurrencyRupee} label="Estimated budget" value={formatAmount(budget.estimated)} />
        </div>

        {/* Budget impact */}
        <Section Icon={MdCurrencyRupee} title="Budget impact">
          <div className="flex justify-between text-[13px] text-[#64748B] mb-1.5">
            <span>{request.proposedBy.portfolio} portfolio</span>
            <span>{formatAmount(budget.portfolioRemaining)} remaining of {formatAmount(budget.portfolioTotal)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className={`h-full rounded-full ${overBudget ? "bg-[#DC2626]" : usedPct > 85 ? "bg-[#F59E0B]" : "bg-[#0B57D0]"}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className={`text-[13px] mt-1.5 ${overBudget ? "text-[#B91C1C] font-semibold" : "text-[#64748B]"}`}>
            {overBudget
              ? `Exceeds remaining portfolio budget by ${formatAmount(budget.estimated - budget.portfolioRemaining)}`
              : `If approved, ${usedPct}% of the portfolio budget will be used`}
          </p>
        </Section>

        <Section Icon={FiFileText} title="Description">
          <p className="text-[15px] text-[#334155] leading-relaxed">{request.description}</p>
        </Section>

        <Section Icon={FiUser} title="Speaker">
          <div className="flex items-start gap-3">
            <Avatar name={request.speaker.name} />
            <div>
              <p className="text-[15px] font-bold text-[#0F172A]">{request.speaker.name}</p>
              <p className="text-[14px] text-[#64748B]">{request.speaker.description}</p>
              {request.speaker.weblinks.map((link) => (
                <p key={link} className="text-[13px] text-[#0B57D0]">{link}</p>
              ))}
            </div>
          </div>
        </Section>

        {request.collaborators.length > 0 && (
          <Section Icon={FiUsers} title={`Collaborators (${request.collaborators.length})`}>
            <div className="flex flex-wrap gap-2">
              {request.collaborators.map((c) => (
                <div key={c.name} className="flex items-center gap-2 rounded-full bg-[#F8FAFC] border border-[#EAEEF2] pl-1 pr-3 py-1">
                  <Avatar name={c.name} size={26} />
                  <span className="text-[13px] font-semibold text-[#333]">{c.name}</span>
                  <span className="text-[12px] text-[#888]">{c.role}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section Icon={FiBell} title="Reminders">
          <div className="flex flex-wrap gap-2">
            {request.reminders.map((r) => (
              <span key={r} className="px-2.5 py-1 rounded-full bg-[#F2F7FF] text-[#0B57D0] text-[13px] font-semibold">{r}</span>
            ))}
          </div>
        </Section>

        {request.travelInfo.required && (
          <Section Icon={FiNavigation} title="Travel">
            <p className="text-[14px] text-[#334155]">
              Attendees must submit {request.travelInfo.requiredInfo.join(", ").toLowerCase()} by{" "}
              <b>{formatDate(request.travelInfo.deadline)}</b>
            </p>
          </Section>
        )}

        {request.attachments.length > 0 && (
          <Section Icon={FiPaperclip} title="Attachments">
            <div className="flex flex-col gap-2">
              {request.attachments.map((a) => (
                <div key={a.name} className="flex items-center justify-between rounded-[10px] border border-[#EAEEF2] px-3 py-2.5">
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-[#333]">
                    <FiFileText className="text-[#DC2626]" />
                    {a.name}
                  </span>
                  <span className="text-[12px] text-[#94A3B8]">{a.size}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {request.additionalNote && (
          <Section Icon={FiMessageSquare} title="Note from proposer">
            <p className="text-[14px] text-[#334155] bg-[#F8FAFC] rounded-lg px-3 py-2.5">{request.additionalNote}</p>
          </Section>
        )}

        {request.decisionNote && (
          <Section Icon={FiMessageSquare} title="Admin remark">
            <p className="text-[14px] text-[#334155] bg-[#F8FAFC] rounded-lg px-3 py-2.5">{request.decisionNote}</p>
          </Section>
        )}
      </div>

      {/* Proposer actions */}
      {!isAdmin && isEditable && (
        <div className="shrink-0 border-t border-[#F1F5F9] pl-5 md:pl-7 pr-[84px] py-4 bg-white flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-semibold text-[#B91C1C] bg-[#FEE2E2] cursor-pointer border-0"
          >
            <FiTrash2 /> Delete
          </button>
          <button
            type="button"
            onClick={() => onEdit(request.id)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-semibold text-white bg-[#0B57D0] cursor-pointer border-0"
          >
            <FiEdit3 /> Edit request
          </button>
        </div>
      )}

      {confirmDelete && (
        <DeleteRequestConfirm
          eventName={request.eventName}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { setConfirmDelete(false); onDelete(request.id); }}
        />
      )}

      {/* Admin actions */}
      {isAdmin && isPending && (
        <div className="shrink-0 border-t border-[#F1F5F9] pl-5 md:pl-7 pr-[84px] py-4 bg-white">
          {mode ? (
            <div className="flex flex-col gap-3">
              <textarea
                autoFocus
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={mode === "reject" ? "Reason for rejecting (shared with the proposer)" : "What should the proposer change?"}
                className="w-full rounded-[12px] border border-[#D9D9D9] px-3 py-2.5 text-[14px] outline-none focus:border-[#0B57D0] resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setMode(null); setReason(""); }}
                  className="px-4 py-2 rounded-full text-[14px] font-semibold text-[#555] bg-[#F3F4F6] cursor-pointer border-0"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!reason.trim()}
                  onClick={submitReason}
                  className={`px-4 py-2 rounded-full text-[14px] font-semibold text-white cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                    mode === "reject" ? "bg-[#DC2626]" : "bg-[#0B57D0]"
                  }`}
                >
                  {mode === "reject" ? "Reject request" : "Send back"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setMode("reject")}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-semibold text-[#B91C1C] bg-[#FEE2E2] cursor-pointer border-0"
              >
                <FiX /> Reject
              </button>
              <button
                type="button"
                onClick={() => setMode("changes")}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-semibold text-[#0B57D0] bg-[#F2F7FF] cursor-pointer border-0"
              >
                <FiEdit3 /> Request changes
              </button>
              <button
                type="button"
                onClick={() => onDecision(request.id, "approved")}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-semibold text-white bg-[#0B57D0] cursor-pointer border-0"
              >
                <FiCheck /> Approve & publish
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function EventRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState(DUMMY_REQUESTS);
  const [tab, setTab] = useState("pending");
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const isAdmin = useSelector((state) => state.auth.selectedRole) !== "portfolioOfficer";

  const query = search.trim().toLowerCase();
  const visible = requests.filter(
    (r) =>
      r.status === tab &&
      (!query || [r.eventName, r.proposedBy.name, r.location].some((v) => v?.toLowerCase().includes(query)))
  );

  const handleDecision = (id, status, note = "") => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status, decisionNote: note } : r)));
  };

  // Requests are dummy data, so no id is sent: a fake id makes the create page fetch event details,
  // the API rejects it with "Invalid eventId" and the user gets logged out.
  // Once the requests API exists, pass the real event id here (`/dashboard/events/create?id=${id}`).
  const handleEdit = () => router.push("/dashboard/events/create");

  const handleDelete = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setExpandedId(null);
  };

  return (
    <div className="h-[calc(100vh-120px)] my-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-5 mb-5">
        <span
          className="maki--arrow rotate-180 cursor-pointer"
          onClick={() => router.push("/dashboard/events")}
        />
        <div>
          <h2 className="font-heading text-[32px] font-semibold">Event Requests</h2>
          <p className="text-[18px] text-[#666666]">
            {isAdmin ? "Events proposed by portfolio officers" : "Events you have proposed for admin approval"}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-3 mb-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-full bg-[#F1F5F9] overflow-x-auto max-w-full self-start md:self-auto">
          {TABS.map((t) => {
            const count = requests.filter((r) => r.status === t.key).length;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => { setTab(t.key); setExpandedId(null); }}
                className={`shrink-0 flex items-center gap-1.5 px-3 md:px-4 h-9 rounded-full text-[14px] font-semibold cursor-pointer border-0 transition-colors ${
                  active ? "bg-white text-[#0B57D0] shadow-[0px_1px_3px_0px_#0000001a]" : "bg-transparent text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                {t.short ? (
                  <>
                    <span className="md:hidden">{t.short}</span>
                    <span className="hidden md:inline">{t.label}</span>
                  </>
                ) : (
                  t.label
                )}
                <span
                  className={`min-w-[20px] h-5 px-1.5 rounded-full text-[12px] leading-5 text-center ${
                    active ? "bg-[#0B57D0] text-white" : "bg-[#E2E8F0] text-[#64748B]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-[300px] shrink-0">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[16px]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event, proposer or location"
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-white border border-[#E2E8F0] text-[16px] md:text-[15px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#0B57D0] transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] cursor-pointer border-0 bg-transparent"
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-[20px] bg-[#F2F7FF] rounded-[20px] px-6 text-center">
          <div className="h-[80px] w-[80px] bg-[#D3E3FD] rounded-full mb-[10px] grid place-items-center">
            {query ? (
              <FiSearch size={30} className="text-[#0B57D0]" />
            ) : (
              <Inbox size={32} strokeWidth={1.75} className="text-[#0B57D0]" />
            )}
          </div>
          <div className="text-[24px] font-[600]">{query ? "No matching requests" : "No requests here"}</div>
          <div className="text-[20px] text-[#666]">
            {query
              ? `Nothing in this tab matches "${search.trim()}"`
              : "Events proposed by portfolio officers will appear here for your review"}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pr-1 pb-4">
          {visible.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              expanded={expandedId === r.id}
              onToggle={() => setExpandedId((prev) => (prev === r.id ? null : r.id))}
            >
              <RequestDetails
                request={r}
                isAdmin={isAdmin}
                onDecision={handleDecision}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </RequestRow>
          ))}
        </div>
      )}
    </div>
  );
}
