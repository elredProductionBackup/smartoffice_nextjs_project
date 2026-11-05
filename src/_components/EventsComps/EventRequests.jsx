"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNotificationsStore } from "@/store/useNotificationsStore";
import { Inbox } from "lucide-react";
import {
  FiAlertTriangle, FiBell, FiCalendar, FiCheck, FiCheckCircle, FiChevronDown, FiClock, FiEdit3, FiExternalLink,
  FiFileText, FiLink, FiMapPin, FiMessageSquare, FiNavigation, FiPaperclip, FiRefreshCw, FiSearch, FiTrash2,
  FiUser, FiUsers, FiX, FiXCircle,
} from "react-icons/fi";
import { MdCurrencyRupee } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { addToast } from "@/store/toastSlice";
import { useBudgetTypeStore } from "@/store/useBudgetTypeStore";
import { deleteEventRequest, getEventRequests, reviewEventRequest } from "@/services/eventRequest.service";

const PAGE_SIZE = 10;
const MAX_CHANGES_LENGTH = 2000;

// API statuses, in tab order
const STATUS = {
  pending: { label: "Pending review", tab: "Pending", Icon: FiClock, className: "bg-[#FEF7E0] text-[#B06000]" },
  changesRequested: {
    label: "Changes requested", tab: "Changes requested", short: "Changes",
    Icon: FiEdit3, className: "bg-[#E8EEFE] text-[#3B63E8]",
  },
  doneWithRequestedChanges: {
    label: "Resubmitted", tab: "Resubmitted", Icon: FiRefreshCw, className: "bg-[#F3E8FF] text-[#7E22CE]",
  },
  approved: { label: "Approved", tab: "Approved", Icon: FiCheckCircle, className: "bg-[#E6F4EA] text-[#137333]" },
  rejected: { label: "Rejected", tab: "Rejected", Icon: FiXCircle, className: "bg-[#FEE2E2] text-[#B91C1C]" },
};
const TABS = Object.keys(STATUS);

// What each side may do in each status (from the API rules)
const OFFICER_CAN_EDIT = ["pending", "changesRequested", "doneWithRequestedChanges"];
const OFFICER_CAN_DELETE = [...OFFICER_CAN_EDIT, "rejected"];
const ADMIN_CAN_REVIEW = ["pending", "doneWithRequestedChanges"];

/* ─── Shaping the API rows ─── */

// The response shape isn't documented yet, so read the likely field names
const pickList = (result) =>
  Array.isArray(result) ? result : result?.list || result?.eventRequests || result?.data || result?.rows || [];

const urlOf = (v) => (typeof v === "string" ? v : v?.url || v?.fileUrl || v?.link || "");
const fileNameOf = (url) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop()) || url;
  } catch {
    return url.split("/").pop() || url;
  }
};
const personName = (p) => {
  if (!p) return "";
  if (typeof p === "string") return "";
  return [p.firstname ?? p.firstName, p.lastname ?? p.lastName].filter(Boolean).join(" ").trim() || p.name || p.fullName || "";
};

const toRequest = (r) => {
  const resource = r.resource || {};
  const documents = [
    ...[1, 2, 3, 4, 5].map((i) => urlOf(r[`uploadDocument${i}`])),
    ...(Array.isArray(r.attachment) ? r.attachment.map(urlOf) : []),
  ].filter(Boolean);

  return {
    id: r.eventRequestId || r._id,
    eventId: r.eventId || "",
    status: STATUS[r.status] ? r.status : "pending",
    eventName: r.eventName || "Untitled event",
    eventTypeId: typeof r.eventType === "object" ? r.eventType?.budgetTypeId : r.eventType,
    eventTypeName: typeof r.eventType === "object" ? r.eventType?.budgetType : "",
    eventImage: urlOf(r.eventImage),
    description: r.eventDescription || "",
    startDate: r.startDateTime,
    endDate: r.endDateTime,
    location: r.eventLocation || "",
    whoCanAttend: r.whoCanAttend || {},
    isRegistration: r.isRegistration,
    budget: r.eventBudget,
    points: r.point,
    resource: {
      name: r.resourceName ?? resource.resourceName ?? "",
      description: r.resourceDescription ?? resource.resourceDescription ?? "",
      links: r.webLink ?? resource.webLink ?? [],
      image: urlOf(r.uploadResourceImageUrl ?? resource.uploadResourceImageUrl),
    },
    collaborators: r.collaborators || [],
    reminders: r.reminder || [],
    travelInfo: r.travelInfo || null,
    documents,
    links: r.attachmentsLink || [],
    additionalNotes: r.additionalNotes || "",
    requestedChanges: r.requestedChanges || "",
    rejectionReason: r.rejectionReason || "",
    proposerName: personName(r.requestedBy || r.createdBy || r.requester || r.requesterDetails || r.userDetails),
    submittedAt: r.createdAt,
  };
};

/* ─── Formatting ─── */

const formatAmount = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN")}`;
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatTime = (value) =>
  value ? new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "";
const timeAgo = (value) => {
  if (!value) return "";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};
const initials = (name = "") => name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
const hasBudget = (v) => v !== undefined && v !== null && v !== "";

/* ─── Small pieces ─── */

const StatusPill = ({ status }) => {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap ${s.className}`}>
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
    {initials(name) || <FiUser />}
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

const Note = ({ tone = "neutral", children }) => {
  const tones = {
    neutral: "bg-[#F8FAFC] text-[#334155]",
    blue: "bg-[#E8EEFE] text-[#1E3A8A]",
    red: "bg-[#FEF2F2] text-[#991B1B]",
  };
  return <p className={`text-[14px] rounded-lg px-3 py-2.5 whitespace-pre-wrap break-words ${tones[tone]}`}>{children}</p>;
};

const RequestRow = ({ request, showProposer, expanded, onToggle, children }) => (
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
        <h3 className="text-[16px] font-bold text-[#1A1A2E] leading-tight break-words">{request.eventName}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[13px] text-[#4B5563]">
          <span className="flex items-center gap-1.5 text-[#2563EB]">
            <FiCalendar className="w-3.5 h-3.5" />
            {formatDate(request.startDate)}
          </span>
          {hasBudget(request.budget) && (
            <span className="flex items-center gap-0.5">
              <MdCurrencyRupee className="w-3.5 h-3.5" />
              {formatAmount(request.budget).slice(1)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 min-w-0 md:w-[200px] shrink-0">
        {showProposer && request.proposerName && <Avatar name={request.proposerName} size={28} />}
        <div className="min-w-0">
          {showProposer && request.proposerName && (
            <p className="text-[13px] font-semibold text-[#333] truncate">{request.proposerName}</p>
          )}
          <p className="text-[12px] text-[#888]">Submitted {timeAgo(request.submittedAt).toLowerCase()}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-auto shrink-0">
        <StatusPill status={request.status} />
        <FiChevronDown className={`w-5 h-5 text-[#64748B] transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>
    </button>
    {expanded && <div className="border-t border-[#EAEEF2]">{children}</div>}
  </div>
);

const DeleteRequestConfirm = ({ eventName, deleting, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => !deleting && onCancel()}>
    <div
      className="w-full max-w-[480px] rounded-[28px] bg-white pt-12 pb-8 sm:pt-[60px] sm:pb-[40px] px-6 shadow-xl flex flex-col items-center gap-8 sm:gap-[40px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-center">
        <div className="text-[20px] sm:text-[24px] font-[700]">Delete this event request?</div>
        <p className="text-[15px] text-[#666] mt-2">
          &quot;{eventName}&quot; will be removed and the admins will be told. This cannot be undone.
        </p>
      </div>
      <div className="flex gap-4 sm:gap-[60px]">
        <button
          type="button"
          onClick={onCancel}
          disabled={deleting}
          className="rounded-full text-[18px] sm:text-[20px] bg-[#999999] px-6 py-2 text-white w-[120px] cursor-pointer border-0 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={deleting}
          className="rounded-full text-[18px] sm:text-[20px] bg-[#DC2626] px-6 py-2 text-white w-[120px] cursor-pointer border-0 disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  </div>
);

/* ─── Expanded request ─── */

const RequestDetails = ({ request, isAdmin, eventTypeName, onReview, onEdit, onDelete, onViewEvent }) => {
  const [mode, setMode] = useState(null); // "reject" | "changes" while the text box is open
  const [text, setText] = useState("");
  const [busyAction, setBusyAction] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { status, resource, whoCanAttend, travelInfo } = request;
  const audience = [
    whoCanAttend.members && "Members",
    whoCanAttend.spouce && "Spouse",
    whoCanAttend.children && "Children",
    whoCanAttend.guests && "Guests",
  ].filter(Boolean);
  const startPassed = request.startDate && new Date(request.startDate) < new Date();
  const canReview = isAdmin && ADMIN_CAN_REVIEW.includes(status);
  const canEdit = !isAdmin && OFFICER_CAN_EDIT.includes(status);
  const canDelete = !isAdmin && OFFICER_CAN_DELETE.includes(status);
  const travelNeeds = travelInfo?.attendeesInfo
    ? [
        travelInfo.attendeesInfo.ticketDetails && "ticket details",
        travelInfo.attendeesInfo.insuranceDetails && "insurance details",
        travelInfo.attendeesInfo.visaInformation && "visa information",
      ].filter(Boolean)
    : [];
  const hasTravel = !!(travelInfo?.venueLink || travelInfo?.hotelLink || travelInfo?.deadLine || travelNeeds.length);

  const review = async (action) => {
    setBusyAction(action);
    const ok = await onReview(request, action, text.trim());
    setBusyAction(null);
    if (ok) {
      setMode(null);
      setText("");
    }
  };

  const remove = async () => {
    setDeleting(true);
    const ok = await onDelete(request);
    setDeleting(false);
    if (ok) setConfirmDelete(false);
  };

  return (
    <div className="flex flex-col">
      {/* Proposer (admin view) and status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 md:px-7 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
        {isAdmin && request.proposerName ? (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={request.proposerName} />
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-[#0F172A]">{request.proposerName}</p>
              <p className="text-[13px] text-[#64748B]">Portfolio Officer</p>
            </div>
          </div>
        ) : (
          <span />
        )}
        <div className="text-right">
          <StatusPill status={status} />
          {request.submittedAt && (
            <p className="text-[12px] text-[#94A3B8] mt-1">
              Submitted {formatDate(request.submittedAt)}, {formatTime(request.submittedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Admin feedback, newest context first */}
      {status === "changesRequested" && request.requestedChanges && (
        <Section Icon={FiEdit3} title={isAdmin ? "You asked for these changes" : "Admin asked for changes"}>
          <Note tone="blue">{request.requestedChanges}</Note>
        </Section>
      )}
      {status === "doneWithRequestedChanges" && request.requestedChanges && (
        <Section Icon={FiRefreshCw} title="Resubmitted after these requested changes">
          <Note tone="blue">{request.requestedChanges}</Note>
        </Section>
      )}
      {status === "rejected" && (
        <Section Icon={FiXCircle} title="Rejected">
          <Note tone="red">{request.rejectionReason || "No reason was given."}</Note>
        </Section>
      )}

      {canReview && startPassed && (
        <div className="mx-5 md:mx-7 mt-5 flex items-start gap-2.5 rounded-[12px] bg-[#FEF7E0] border border-[#FCD34D] px-4 py-3 text-[14px] text-[#B06000]">
          <FiAlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <b>The start date has passed,</b> so this can&apos;t be approved. Request changes so the officer can pick new dates.
          </span>
        </div>
      )}

      {request.eventImage && (
        <div className="px-5 md:px-7 pt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={request.eventImage}
            alt=""
            className="block w-auto h-auto max-w-full sm:max-w-[360px] max-h-[200px] object-contain rounded-[14px] border border-[#EAEEF2] bg-[#F8FAFC]"
          />
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
        {request.location && <Fact Icon={FiMapPin} label="Location" value={request.location} />}
        {eventTypeName && (
          <Fact
            Icon={FiFileText}
            label="Event type"
            value={eventTypeName}
            sub={request.points ? `${request.points} point${request.points > 1 ? "s" : ""}` : undefined}
          />
        )}
        {audience.length > 0 && (
          <Fact
            Icon={FiUsers}
            label="Who can attend"
            value={audience.join(", ")}
            sub={request.isRegistration !== undefined ? `Registration ${request.isRegistration ? "open" : "closed"}` : undefined}
          />
        )}
        {hasBudget(request.budget) && (
          <Fact Icon={MdCurrencyRupee} label="Estimated budget" value={formatAmount(request.budget)} />
        )}
      </div>

      {request.description && (
        <Section Icon={FiFileText} title="Description">
          <p className="text-[15px] text-[#334155] leading-relaxed whitespace-pre-wrap break-words">{request.description}</p>
        </Section>
      )}

      {(resource.name || resource.description) && (
        <Section Icon={FiUser} title="Speaker">
          <div className="flex items-start gap-3">
            {resource.image && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(resource.image) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resource.image} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <Avatar name={resource.name} />
            )}
            <div className="min-w-0">
              {resource.name && <p className="text-[15px] font-bold text-[#0F172A]">{resource.name}</p>}
              {resource.description && <p className="text-[14px] text-[#64748B]">{resource.description}</p>}
              {resource.links.map((link) => (
                <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="block text-[13px] text-[#0B57D0] hover:underline break-all">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </Section>
      )}

      {request.collaborators.length > 0 && (
        <Section Icon={FiUsers} title={`Collaborators (${request.collaborators.length})`}>
          <div className="flex flex-wrap gap-2">
            {request.collaborators.map((c, i) => {
              const name = personName(c) || "Collaborator";
              return (
                <div key={c.userCode || i} className="flex items-center gap-2 rounded-full bg-[#F8FAFC] border border-[#EAEEF2] pl-1 pr-3 py-1">
                  <Avatar name={name} size={26} />
                  <span className="text-[13px] font-semibold text-[#333]">{name}</span>
                  {c.points ? <span className="text-[12px] text-[#888]">{c.points} pts</span> : null}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {request.reminders.length > 0 && (
        <Section Icon={FiBell} title="Reminders">
          <div className="flex flex-wrap gap-2">
            {request.reminders.map((r, i) => (
              <span key={r._id || i} className="px-2.5 py-1 rounded-full bg-[#F2F7FF] text-[#0B57D0] text-[13px] font-semibold">
                {r.reminderName || "Reminder"} · {formatDate(r.time)}, {formatTime(r.time)}
              </span>
            ))}
          </div>
        </Section>
      )}

      {hasTravel && (
        <Section Icon={FiNavigation} title="Travel">
          <div className="flex flex-col gap-1.5 text-[14px] text-[#334155]">
            {travelNeeds.length > 0 && (
              <p>
                Attendees must submit {travelNeeds.join(", ")}
                {travelInfo.deadLine && <> by <b>{formatDate(travelInfo.deadLine)}</b></>}
              </p>
            )}
            {travelInfo.venueLink && (
              <a href={travelInfo.venueLink} target="_blank" rel="noopener noreferrer" className="text-[#0B57D0] hover:underline break-all">
                Venue: {travelInfo.venueLink}
              </a>
            )}
            {travelInfo.hotelLink && (
              <a href={travelInfo.hotelLink} target="_blank" rel="noopener noreferrer" className="text-[#0B57D0] hover:underline break-all">
                Hotel: {travelInfo.hotelLink}
              </a>
            )}
          </div>
        </Section>
      )}

      {(request.documents.length > 0 || request.links.length > 0) && (
        <Section Icon={FiPaperclip} title="Attachments">
          <div className="flex flex-col gap-2">
            {request.documents.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-[10px] border border-[#EAEEF2] px-3 py-2.5 text-[14px] font-semibold text-[#333] hover:border-[#0B57D0]"
              >
                <FiFileText className="text-[#DC2626] shrink-0" />
                <span className="truncate">{fileNameOf(url)}</span>
              </a>
            ))}
            {request.links.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-[10px] border border-[#EAEEF2] px-3 py-2.5 text-[14px] text-[#0B57D0] hover:border-[#0B57D0]"
              >
                <FiLink className="shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        </Section>
      )}

      {request.additionalNotes && (
        <Section Icon={FiMessageSquare} title={isAdmin ? "Note from the officer" : "Your note"}>
          <Note>{request.additionalNotes}</Note>
        </Section>
      )}

      {/* Approved: link to the live event (history of requested changes kept underneath) */}
      {status === "approved" && (
        <div className="px-5 md:px-7 py-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[14px] text-[#137333] font-semibold">The event has been created.</span>
          {request.eventId && (
            <button
              type="button"
              onClick={() => onViewEvent(request.eventId)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-semibold text-white bg-[#0B57D0] cursor-pointer border-0"
            >
              <FiExternalLink /> View event
            </button>
          )}
        </div>
      )}

      {/* Officer actions */}
      {(canEdit || canDelete) && (
        <div className="shrink-0 border-t border-[#F1F5F9] pl-5 md:pl-7 pr-5 md:pr-[84px] py-4 bg-white flex flex-wrap justify-end gap-2">
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-semibold text-[#B91C1C] bg-[#FEE2E2] cursor-pointer border-0"
            >
              <FiTrash2 /> Delete
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(request)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-semibold text-white bg-[#0B57D0] cursor-pointer border-0"
            >
              <FiEdit3 /> {status === "changesRequested" ? "Make changes" : "Edit request"}
            </button>
          )}
        </div>
      )}

      {confirmDelete && (
        <DeleteRequestConfirm
          eventName={request.eventName}
          deleting={deleting}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}

      {/* Admin actions */}
      {canReview && (
        <div className="shrink-0 border-t border-[#F1F5F9] pl-5 md:pl-7 pr-5 md:pr-[84px] py-4 bg-white">
          {mode ? (
            <div className="flex flex-col gap-2">
              <textarea
                autoFocus
                rows={3}
                value={text}
                maxLength={mode === "changes" ? MAX_CHANGES_LENGTH : undefined}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  mode === "reject"
                    ? "Reason for rejecting (optional, shared with the officer)"
                    : "What should the officer change?"
                }
                className="w-full rounded-[12px] border border-[#D9D9D9] px-3 py-2.5 text-[14px] outline-none focus:border-[#0B57D0] resize-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] text-[#94A3B8]">
                  {mode === "changes" && `${text.length}/${MAX_CHANGES_LENGTH}`}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!!busyAction}
                    onClick={() => { setMode(null); setText(""); }}
                    className="px-4 py-2 rounded-full text-[14px] font-semibold text-[#555] bg-[#F3F4F6] cursor-pointer border-0 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!!busyAction || (mode === "changes" && !text.trim())}
                    onClick={() => review(mode === "reject" ? "reject" : "requestChanges")}
                    className={`px-4 py-2 rounded-full text-[14px] font-semibold text-white cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                      mode === "reject" ? "bg-[#DC2626]" : "bg-[#0B57D0]"
                    }`}
                  >
                    {busyAction ? "Sending..." : mode === "reject" ? "Reject request" : "Send back"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={!!busyAction}
                onClick={() => setMode("reject")}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-semibold text-[#B91C1C] bg-[#FEE2E2] cursor-pointer border-0 disabled:opacity-50"
              >
                <FiX /> Reject
              </button>
              <button
                type="button"
                disabled={!!busyAction}
                onClick={() => setMode("changes")}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-semibold text-[#0B57D0] bg-[#F2F7FF] cursor-pointer border-0 disabled:opacity-50"
              >
                <FiEdit3 /> Request changes
              </button>
              <button
                type="button"
                disabled={!!busyAction || startPassed}
                title={startPassed ? "The start date has passed" : undefined}
                onClick={() => review("approve")}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-semibold text-white bg-[#0B57D0] cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiCheck /> {busyAction === "approve" ? "Approving..." : "Approve & publish"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Page ─── */

export default function EventRequests() {
  const router = useRouter();
  const dispatch = useDispatch();
  const isAdmin = useSelector((state) => state.auth.selectedRole) !== "portfolioOfficer";
  const { budgetTypes, fetchBudgetTypes } = useBudgetTypeStore();

  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [searchKey, setSearchKey] = useState(""); // debounced copy that goes to the API
  const [requests, setRequests] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const requestSeq = useRef(0); // ignore answers to older searches / tabs

  // ?id= (from a notification): that request, opened on its own tab even if it isn't on the first page
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");
  const [focus, setFocus] = useState(null);
  const notificationsVersion = useNotificationsStore((s) => s.version);

  useEffect(() => {
    fetchBudgetTypes().catch(() => {});
  }, [fetchBudgetTypes]);

  useEffect(() => {
    const t = setTimeout(() => setSearchKey(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // start = how many rows to skip (the docs show start=0&offset=10)
  // silent: refresh in place (live updates) without the full-page spinner
  const load = useCallback(
    async ({ append = false, skip = 0, silent = false } = {}) => {
      const seq = ++requestSeq.current;
      if (append) setLoadingMore(true);
      else if (!silent) setLoading(true);
      setLoadError("");
      try {
        const res = await getEventRequests({ status: tab, searchKey, start: skip, offset: PAGE_SIZE });
        if (seq !== requestSeq.current) return;
        if (!res?.data?.success) throw new Error(res?.data?.message || "Couldn't load event requests");
        const result = res.data.result;
        const rows = pickList(result).map(toRequest);
        setRequests((prev) => (append ? [...prev, ...rows] : rows));
        setStatusCounts(result?.statusCounts || res.data.statusCounts || {});
        setTotalCount(result?.totalCount ?? res.data.totalCount ?? rows.length);
      } catch (err) {
        if (seq !== requestSeq.current) return;
        console.error("Event requests load error:", err);
        setLoadError(err.message || "Couldn't load event requests");
        if (!append) setRequests([]);
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [tab, searchKey]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Fetch the ?id= request. openIt: switch to its tab and expand it (first open, not live refreshes).
  const loadFocus = useCallback(
    async (id, { openIt = false } = {}) => {
      try {
        const res = await getEventRequests({ eventRequestId: id });
        if (!res?.data?.success) throw new Error(res?.data?.message || "This request couldn't be found");
        const result = res.data.result;
        const row = Array.isArray(result) ? result[0] : pickList(result)[0] || result;
        if (!row?.eventName) throw new Error("It may have been deleted.");
        const request = toRequest(row);
        setFocus(request);
        if (openIt) {
          setTab(request.status);
          setExpandedId(request.id);
        }
      } catch (err) {
        setFocus(null);
        if (openIt) {
          dispatch(addToast({ message: { title: "Couldn't open that request", descrip: err.message }, type: "error" }));
        }
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (focusId) loadFocus(focusId, { openIt: true });
    else setFocus(null);
  }, [focusId, loadFocus]);

  // A notification arrived (created, edited, reviewed, deleted…): refresh what's on screen
  const seenVersion = useRef(notificationsVersion);
  useEffect(() => {
    if (seenVersion.current === notificationsVersion) return;
    seenVersion.current = notificationsVersion;
    load({ silent: true });
    if (focusId) loadFocus(focusId);
  }, [notificationsVersion, load, loadFocus, focusId]);

  const typeName = (request) =>
    request.eventTypeName ||
    budgetTypes.find((t) => t.budgetTypeId === request.eventTypeId)?.budgetType ||
    "";

  const toast = (type, title, descrip) => dispatch(addToast({ message: { title, descrip }, type }));

  // Resolves true when the review went through. Any refusal reloads the list,
  // since the request may have been reviewed, deleted or reverted meanwhile.
  const handleReview = async (request, action, text) => {
    try {
      const res = await reviewEventRequest({
        eventRequestId: request.id,
        action,
        ...(action === "reject" && { rejectionReason: text }),
        ...(action === "requestChanges" && { requestedChanges: text }),
      });
      if (!res?.data?.success) throw new Error(res?.data?.message || "Please try again.");

      if (action === "approve") toast("success", "Event approved", `"${request.eventName}" is now live.`);
      else if (action === "reject") toast("success", "Request rejected", "The officer has been told.");
      else toast("success", "Sent back for changes", "The officer has been asked to update the request.");
      setExpandedId(null);
      if (focus?.id === request.id) setFocus(null);
      load();
      return true;
    } catch (err) {
      console.error("Review error:", err);
      const title = action === "approve" ? "Couldn't approve" : action === "reject" ? "Couldn't reject" : "Couldn't send back";
      toast("error", title, err.message);
      load();
      return false;
    }
  };

  const handleDelete = async (request) => {
    try {
      const res = await deleteEventRequest({ eventRequestId: request.id });
      if (!res?.data?.success) throw new Error(res?.data?.message || "Please try again.");
      toast("success", "Request deleted", `"${request.eventName}" has been removed.`);
      setExpandedId(null);
      if (focus?.id === request.id) setFocus(null);
      load();
      return true;
    } catch (err) {
      console.error("Delete request error:", err);
      toast("error", "Couldn't delete the request", err.message);
      load();
      return false;
    }
  };

  // requestId (not id) so the create page loads it as a request, not an event
  const handleEdit = (request) => router.push(`/dashboard/events/create?requestId=${request.id}`);

  const hasMore = requests.length < totalCount;
  const query = searchKey;
  // The ?id= request goes on top of its tab when it isn't on the loaded page
  const shown =
    focus && focus.status === tab && !query && !requests.some((r) => r.id === focus.id)
      ? [focus, ...requests]
      : requests;

  return (
    <div className="h-[calc(100vh-120px)] my-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-5 mb-5">
        <span className="maki--arrow rotate-180 cursor-pointer" onClick={() => router.push("/dashboard/events")} />
        <div>
          <h2 className="font-heading text-[32px] font-semibold">Event Requests</h2>
          <p className="text-[18px] text-[#666666]">
            {isAdmin ? "Events proposed by portfolio officers" : "Events you have proposed for admin approval"}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 p-1 rounded-full bg-[#F1F5F9] overflow-x-auto max-w-full self-start md:self-auto">
          {TABS.map((key) => {
            const t = STATUS[key];
            const active = tab === key;
            const count = statusCounts[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setTab(key); setExpandedId(null); }}
                className={`shrink-0 flex items-center gap-1.5 px-3 md:px-4 h-9 rounded-full text-[14px] font-semibold cursor-pointer border-0 transition-colors ${
                  active ? "bg-white text-[#0B57D0] shadow-[0px_1px_3px_0px_#0000001a]" : "bg-transparent text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                {t.short ? (
                  <>
                    <span className="md:hidden">{t.short}</span>
                    <span className="hidden md:inline">{t.tab}</span>
                  </>
                ) : (
                  t.tab
                )}
                {count !== undefined && (
                  <span
                    className={`min-w-[20px] h-5 px-1.5 rounded-full text-[12px] leading-5 text-center ${
                      active ? "bg-[#0B57D0] text-white" : "bg-[#E2E8F0] text-[#64748B]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-[300px] shrink-0">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[16px]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event requests"
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

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#0B57D0] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : loadError && requests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#F2F7FF] rounded-[20px] px-6 text-center">
          <div className="text-[20px] font-[600]">Couldn&apos;t load event requests</div>
          <div className="text-[15px] text-[#666]">{loadError}</div>
          <button
            type="button"
            onClick={() => load()}
            className="mt-2 px-5 py-2 rounded-full text-[14px] font-semibold text-white bg-[#0B57D0] cursor-pointer border-0"
          >
            Try again
          </button>
        </div>
      ) : shown.length === 0 ? (
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
              ? `Nothing in this tab matches "${query}"`
              : isAdmin
                ? "Events proposed by portfolio officers will appear here for your review"
                : "Events you propose will appear here"}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pr-1 pb-4">
          {shown.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              showProposer={isAdmin}
              expanded={expandedId === r.id}
              onToggle={() => setExpandedId((prev) => (prev === r.id ? null : r.id))}
            >
              <RequestDetails
                request={r}
                isAdmin={isAdmin}
                eventTypeName={typeName(r)}
                onReview={handleReview}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewEvent={(eventId) => router.push(`/dashboard/events/${eventId}`)}
              />
            </RequestRow>
          ))}
          {hasMore && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => load({ append: true, skip: requests.length })}
              className="self-center mt-1 px-5 py-2 rounded-full text-[14px] font-semibold text-[#0B57D0] bg-[#F2F7FF] cursor-pointer border-0 disabled:opacity-60"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
