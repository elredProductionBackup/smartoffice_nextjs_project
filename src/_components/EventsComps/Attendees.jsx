import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiCopy, FiEdit2, FiMail, FiMinus, FiPlus, FiSearch, FiTrash2, FiUpload } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { Check, CircleCheck, CircleDashed, CircleX, ListFilter, UserSearch, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { selectIsFinanceOfficer } from "@/store/auth/authSlice";
import { fetchEventMembers } from "@/store/events/eventsThunks";
import {
  addOfflineAttendees,
  removeEventAttendees,
  updateEventAttendance,
  updateOfflineAttendee,
} from "@/services/events.service";
import { openEventsModal } from "@/store/events/eventsUiSlice";
import { addToast } from "@/store/toastSlice";
import { formatMember } from "@/utils/formatMember";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import Pagination from "../UI/Pagination";
import RowMenu from "../UI/RowMenu";
import SuccessPopup from "../ConfirmationPopups/SuccessPopup";
import ConfirmPopup from "../ConfirmationPopups/ConfirmPopup";
import AddAttendeeModal from "./AddAttendeeModal";
import UploadSheetModal from "./UploadSheetModal";
import SheetImportModal from "./SheetImportModal";
import AttendanceSelect, { ATTENDANCE, AttendanceBadge } from "./AttendanceSelect";

// `api` is the attendanceStatus / appStatus value getEventAttendees filters on
const FILTERS = [
  { key: "all", label: "All", api: "" },
  { key: "yes", label: "Attended", api: "attended" },
  { key: "no", label: "Didn't attend", api: "notAttended" },
  { key: "none", label: "Not marked", api: "notMarked" },
];

// appStatus values from getEventAttendees; deregistered means the attendee was deactivated
const APP_STATUS = {
  joined: { label: "Joined", hint: "Linked to an app account", dot: "bg-[#147BFF]", halo: "bg-[#147BFF]/20" },
  pending: { label: "Pending", hint: "Not on the app yet", dot: "bg-[#F59E0B]", halo: "bg-[#F59E0B]/25" },
  deregistered: { label: "Deactivated", hint: "Deactivated · no longer active", dot: "bg-[#9CA3AF]", halo: "bg-[#9CA3AF]/25" },
};

const SHEET_BATCH = 1000; // addOfflineAttendees row limit per call

const ATTENDANCE_FROM_API = { attended: "yes", notAttended: "no", notMarked: "none" };
// Members who registered themselves in the app can't be removed from Smart Office
const isSelfRegistered = (m) => m.registrationSource === "app";

const nameOfMember = (m) => `${m?.firstName || ""} ${m?.lastName || ""}`.trim() || "Attendee";

// What updateEventAttendance stores; "" clears it back to Not marked
const ATTENDANCE_TO_API = { yes: "attended", no: "notAttended", none: "" };

// addOfflineAttendees accepts a 10-digit mobile or E.164, so drop spaces/dashes and keep a leading +.
// Sheets often have numbers without +91: "9876543210" stays as is, "919876543210" gets a +,
// the domestic trunk 0 ("09876543210") is dropped and the international 00 ("0091…") becomes +.
function toApiPhone(value = "") {
  const d = value.replace(/\D/g, "");
  if (!d) return "";
  if (value.trim().startsWith("+")) return `+${d}`;
  if (d.startsWith("00")) return `+${d.slice(2)}`;
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  return d.length > 10 ? `+${d}` : d;
}

// Popup form values → one attendees[] item; empty optional fields are left out
function toApiAttendee(values) {
  const item = {
    name: values.name,
    companyName: values.company,
    title: values.designation,
    phoneNumber: toApiPhone(values.whatsapp),
    email: values.email,
  };
  return Object.fromEntries(Object.entries(item).filter(([, v]) => v));
}

// Which popup field a failed[] reason belongs to, so the error shows under it
function fieldForReason(reason = "") {
  const r = reason.toLowerCase();
  if (r.startsWith("name")) return "name";
  if (r.startsWith("email")) return "email";
  if (r.includes("phone")) return "whatsapp";
  return null;
}

// Counts may come flat or grouped under attendanceStatus / appStatus
function normalizeCounts(raw = {}) {
  const att = raw.attendanceStatus || raw.attendance || raw;
  const app = raw.appStatus || raw.app || raw;
  const num = (v) => Number(v) || 0;
  return {
    all: num(raw.all ?? raw.total ?? raw.totalCount),
    yes: num(att.attended),
    no: num(att.notAttended),
    none: num(att.notMarked),
    joined: num(app.joined),
    pending: num(app.pending),
    deregistered: num(app.deregistered),
  };
}

// Same palette as the event header above the tabs
const primaryBtn =
  "inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#147BFF] text-white text-[14px] font-semibold hover:bg-[#0F6AE0] transition-colors cursor-pointer";
const secondaryBtn =
  "inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[#E5E7EB] bg-white text-[#111] text-[14px] font-semibold hover:bg-[#F7F8FA] transition-colors cursor-pointer";
const eyebrow = "text-[12px] font-medium uppercase tracking-[1.5px] text-[#9CA3AF]";
const bulkBtn =
  "inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[14px] font-semibold hover:bg-white/10 transition-colors cursor-pointer";

// Soft background / text pairs for initials, picked from the name so a person keeps their colour
const AVATAR_TONES = [
  ["#EEF5FF", "#0B5FD9"],
  ["#ECFDF3", "#15803D"],
  ["#FFF6E5", "#B45309"],
  ["#F5F0FF", "#6D28D9"],
  ["#FFF0F3", "#BE123C"],
  ["#EAF8FA", "#0E7490"],
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const capitalize = (v = "") => (v ? v[0].toUpperCase() + v.slice(1) : "");

function formatTitles(titles) {
  if (!titles?.length) return "";
  const vals = titles.map((t) => capitalize(t.value));
  return vals.length <= 2 ? vals.join(" | ") : `${vals.slice(0, 2).join(" | ")} | +${vals.length - 2}`;
}

// getEventAttendees sends `name` and a plain-string `title`, and pending (offline) attendees have no
// userCode, so rows are keyed by attendeeId. Reshape into the firstName/lastName/title[] form the
// table and member popup already use.
function toRow(m) {
  const [first = "", ...rest] = (m.name || "").trim().split(" ");
  return {
    ...m,
    id: m.attendeeId || m.userCode,
    firstName: m.firstName ?? first,
    lastName: m.lastName ?? rest.join(" "),
    title: Array.isArray(m.title) ? m.title : m.title ? [{ value: m.title }] : [],
  };
}

// Per-event browser copy of attendee changes; storage can be blocked, so never let it throw
// Only attendees added before the add API existed are kept here
const EMPTY_LOCAL = { added: [] };
const storageKey = (eventId) => `eventAttendees:${eventId}`;

function loadLocal(eventId) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(eventId)));
    return { ...EMPTY_LOCAL, ...saved };
  } catch {
    return EMPTY_LOCAL;
  }
}

function saveLocal(eventId, data) {
  try {
    localStorage.setItem(storageKey(eventId), JSON.stringify(data));
  } catch {}
}

function Checkbox({ checked, indeterminate, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition cursor-pointer ${
        checked || indeterminate ? "bg-[#147BFF] border-[#147BFF] text-white" : "border-[#D1D5DB] bg-white hover:border-[#9CA3AF]"
      }`}
    >
      {indeterminate ? <FiMinus className="text-[12px]" /> : checked && <FiCheck className="text-[12px]" />}
    </button>
  );
}

function Avatar({ src, name }) {
  if (src) {
    return <Image src={src} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover shrink-0" />;
  }
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0);
  const [bg, fg] = AVATAR_TONES[hash % AVATAR_TONES.length];
  return (
    <div
      aria-hidden
      className="w-10 h-10 rounded-full grid place-items-center shrink-0 text-[14px] font-semibold"
      style={{ background: bg, color: fg }}
    >
      {getInitials(name)}
    </div>
  );
}

// Small ringed dot next to the name for the exceptions (pending, deactivated); joined shows nothing.
// Hover or keyboard focus shows what it means.
function AppStatusDot({ status }) {
  const s = APP_STATUS[status];
  if (!s || status === "joined") return null;
  return (
    <span
      tabIndex={0}
      aria-label={s.hint}
      className="group/tip relative inline-grid place-items-center shrink-0 w-4 h-4 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#147BFF]/30 cursor-default"
    >
      <span aria-hidden className={`grid place-items-center w-3 h-3 rounded-full ${s.halo}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-[#111] px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-[0_4px_12px_rgba(17,17,17,0.2)] transition duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-focus-visible/tip:translate-y-0 group-focus-visible/tip:opacity-100"
      >
        {s.hint}
        <span aria-hidden className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#111]" />
      </span>
    </span>
  );
}

// One white pill slides and resizes to the selected option. Every option keeps the same font
// weight so widths don't jump mid-slide; the selected one is marked by colour and the pill.
function Segmented({ label, options, value, onChange }) {
  const trackRef = useRef(null);
  const buttonRefs = useRef({});
  const [pill, setPill] = useState(null); // { left, width }
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const btn = buttonRefs.current[value];
      if (!btn) return;
      const next = { left: btn.offsetLeft, width: btn.offsetWidth };
      // Keep the same object when nothing moved, or every re-measure would re-render again
      setPill((prev) => (prev && prev.left === next.left && prev.width === next.width ? prev : next));
    };
    measure();
    // Counts and web fonts change button widths after the first paint
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
    // Re-measure when the selection or the counts change (options is rebuilt each render, so key on content)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options.map((o) => `${o.key}:${o.count}`).join("|")]);

  // Place the pill instantly on mount, then animate later moves
  useEffect(() => {
    if (pill && !animate) requestAnimationFrame(() => setAnimate(true));
  }, [pill, animate]);

  return (
    <div
      ref={trackRef}
      role="radiogroup"
      aria-label={label}
      className="relative inline-flex items-center gap-0.5 rounded-full bg-[#F3F4F6] p-1"
    >
      {pill && (
        <span
          aria-hidden
          className={`absolute top-1 bottom-1 rounded-full bg-white shadow-[0_1px_3px_rgba(17,17,17,0.10)] motion-reduce:transition-none ${
            animate ? "transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" : ""
          }`}
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            ref={(el) => (buttonRefs.current[o.key] = el)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.key)}
            className={`relative z-[1] inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer ${
              active ? "text-[#111]" : "text-[#6B7280] hover:text-[#111]"
            }`}
          >
            {o.label}
            <span className={`transition-colors duration-200 ${active ? "text-[#147BFF]" : "text-[#9CA3AF]"}`}>{o.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function AppStatusFilter({ value, onChange, counts }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = APP_STATUS[value];

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options = [{ key: "", label: "Any app status" }, ...Object.entries(APP_STATUS).map(([key, s]) => ({ key, ...s }))];

  // Icon-only trigger: blue with a status-coloured dot while a filter is applied.
  // The tooltip and menu are pinned to the right edge so they never widen the page.
  const tooltip = current ? `App status: ${current.label}` : "Filter by app status";

  return (
    <div ref={ref} className="group/tip relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={tooltip}
        onClick={() => setOpen((o) => !o)}
        className={`relative grid place-items-center w-10 h-10 rounded-full border transition-colors cursor-pointer ${
          value || open
            ? "border-[#147BFF] bg-[#EEF5FF] text-[#147BFF]"
            : "border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F7F8FA]"
        }`}
      >
        <ListFilter size={18} />
        {current && (
          <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${current.dot}`} />
        )}
      </button>

      {!open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute top-full right-0 z-30 mt-2 -translate-y-1 whitespace-nowrap rounded-md bg-[#111] px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-[0_4px_12px_rgba(17,17,17,0.2)] transition duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-has-[:focus-visible]/tip:translate-y-0 group-has-[:focus-visible]/tip:opacity-100"
        >
          {tooltip}
          <span aria-hidden className="absolute bottom-full right-4 border-4 border-transparent border-b-[#111]" />
        </span>
      )}

      {open && (
        <div
          role="listbox"
          aria-label="App status"
          className="absolute right-0 top-full z-30 mt-1.5 w-[250px] rounded-xl border border-[#F0F1F3] bg-white p-1.5 shadow-[0_8px_24px_rgba(17,17,17,0.10)]"
        >
          {options.map((o) => (
            <button
              key={o.key || "any"}
              type="button"
              role="option"
              aria-selected={value === o.key}
              onClick={() => {
                onChange(o.key);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${o.dot || ""}`} />
              <span className="flex-1 min-w-0">
                <span className="block font-medium text-[#111]">{o.label}</span>
                {o.hint && <span className="block text-[12px] text-[#9CA3AF]">{o.hint}</span>}
              </span>
              {o.key && <span className="text-[13px] text-[#9CA3AF]">{counts[o.key]}</span>}
              <Check size={16} className={`shrink-0 text-[#147BFF] ${value === o.key ? "" : "invisible"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Round icon button; the label shows as a tooltip below on hover/focus and is read by screen readers.
// align="end" pins the tooltip to the button's right edge: a hidden tooltip still counts towards the
// page width, so a centred one on the last button would make the page scroll sideways.
function IconAction({ label, onClick, className, align = "center", children }) {
  const place = align === "end" ? "right-0" : "left-1/2 -translate-x-1/2";
  const arrow = align === "end" ? "right-4" : "left-1/2 -translate-x-1/2";
  return (
    <span className="group/tip relative inline-flex">
      <button type="button" aria-label={label} onClick={onClick} className={`${className} w-10 px-0! justify-center`}>
        {children}
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-30 mt-2 -translate-y-1 whitespace-nowrap rounded-md bg-[#111] px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-[0_4px_12px_rgba(17,17,17,0.2)] transition duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-has-[:focus-visible]/tip:translate-y-0 group-has-[:focus-visible]/tip:opacity-100 ${place}`}
      >
        {label}
        <span aria-hidden className={`absolute bottom-full border-4 border-transparent border-b-[#111] ${arrow}`} />
      </span>
    </span>
  );
}

// Placeholder block with a light sweeping highlight (the .shimmer keyframes live in globals.css)
const Bone = ({ className = "" }) => <div className={`shimmer rounded ${className}`} />;

// Rows laid out like the real table cells, shown while a search/filter/page change is loading.
// Widths vary per row so it doesn't read as a solid block.
const SHIMMER_WIDTHS = [
  ["w-36", "w-24", "w-28", "w-32"],
  ["w-28", "w-20", "w-32", "w-40"],
  ["w-40", "w-28", "w-24", "w-36"],
  ["w-32", "w-16", "w-28", "w-32"],
  ["w-24", "w-24", "w-36", "w-28"],
];

function ShimmerRows({ canEdit }) {
  return SHIMMER_WIDTHS.map(([name, title, company, email], i) => (
    <tr key={i} aria-hidden className="border-b border-[#F5F6F8] last:border-0">
      {canEdit && (
        <td className="pl-5 py-3.5">
          <Bone className="w-[18px] h-[18px] rounded-[5px]" />
        </td>
      )}
      <td className={`${canEdit ? "px-3" : "pl-5 pr-3"} py-3.5`}>
        <div className="flex items-center gap-3">
          <Bone className="w-10 h-10 rounded-full shrink-0" />
          <div className="space-y-2">
            <Bone className={`h-3.5 ${name}`} />
            <Bone className={`h-3 ${title}`} />
          </div>
        </div>
      </td>
      <td className="px-3 py-3.5">
        <Bone className={`h-3.5 ${company}`} />
      </td>
      <td className="px-3 py-3.5">
        <div className="space-y-2">
          <Bone className="h-3 w-28" />
          <Bone className={`h-3 ${email}`} />
        </div>
      </td>
      <td className="px-3 py-3.5">
        <Bone className="h-8 w-32 rounded-lg" />
      </td>
      {canEdit && (
        <td className="pr-4 py-3.5">
          <Bone className="ml-auto w-1.5 h-5 rounded-full" />
        </td>
      )}
    </tr>
  ));
}

// Phone version of the shimmer rows, laid out like the attendee cards
function ShimmerCards({ canEdit }) {
  return SHIMMER_WIDTHS.map(([name, title, company], i) => (
    <li key={i} aria-hidden className="flex gap-3 px-4 py-3.5 border-b border-[#F5F6F8] last:border-0">
      {canEdit && <Bone className="mt-2.5 w-[18px] h-[18px] rounded-[5px] shrink-0" />}
      <Bone className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-2 pt-0.5">
        <Bone className={`h-3.5 ${name}`} />
        <Bone className={`h-3 ${title}`} />
        <Bone className={`h-3 ${company}`} />
        <Bone className="h-8 w-32 rounded-lg" />
      </div>
    </li>
  ));
}

// First load: the table frame with shimmer rows (cards on phones)
function TableSkeleton({ canEdit }) {
  return (
    <div className="rounded-2xl border border-[#F0F1F3] bg-white overflow-hidden" aria-hidden>
      <ul className="md:hidden">
        <ShimmerCards canEdit={canEdit} />
      </ul>
      <table className="hidden md:table w-full table-fixed border-collapse">
        <tbody>
          <ShimmerRows canEdit={canEdit} />
        </tbody>
      </table>
    </div>
  );
}

const Attendees = ({ eventId }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const membersTotal = useSelector(
    (state) => state.events.membersTotal[eventId] || 0
  );
  const apiCounts = useSelector((state) => state.events.membersCounts[eventId]);

  const {
    membersMap,
    membersFetched,
  } = useSelector((state) => state.events);

  const isFinanceManager = useSelector(selectIsFinanceOfficer);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sheetFile, setSheetFile] = useState(null); // picked sheet, open in the column matching step
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [appFilter, setAppFilter] = useState(""); // "" = any app status
  const debouncedSearch = useDebounce(search.trim());
  const filtersActive = !!debouncedSearch || filter !== "all" || !!appFilter;
  const [selected, setSelected] = useState([]);
  const [success, setSuccess] = useState(null); // { title, message } after a save
  // Edits and removals live in the browser until the attendee APIs exist
  const [local, setLocal] = useState(() => loadLocal(eventId));
  // Attendance picked but not yet confirmed by a refetch, so the pill changes straight away
  const [pendingAttendance, setPendingAttendance] = useState({});
  // Attendees waiting on the remove confirmation: { members, error }
  const [removing, setRemoving] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  useEffect(() => saveLocal(eventId, local), [eventId, local]);

  // Search and filters run on the server; browser-only additions show on the unfiltered first page
  const membersList = useMemo(
    () =>
      [...(filtersActive || currentPage > 1 ? [] : local.added), ...(membersMap[eventId] || [])]
        .map(toRow),
    [local, membersMap, eventId, filtersActive, currentPage]
  );
  const isMembersFetched = membersFetched[eventId];

  // Which page/search/filters the rows on screen belong to. Until the fetch for the current
  // combination lands, the table shows shimmer rows instead of the previous filter's rows
  // (otherwise switching to "All" from an empty filter flashes the "No attendees yet" screen).
  const queryKey = `${currentPage}|${debouncedSearch}|${filter}|${appFilter}`;
  const latestQueryRef = useRef(queryKey);
  const [loadedQuery, setLoadedQuery] = useState(null);
  const isSwitching = loadedQuery !== queryKey;

  const loadAttendees = useCallback(() => {
    if (!eventId) return;

    latestQueryRef.current = queryKey;
    return dispatch(
      fetchEventMembers({
        eventId,
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        attendanceStatus: FILTERS.find((f) => f.key === filter)?.api || "",
        appStatus: appFilter,
      })
    ).then((action) => {
      // Ignore answers to a filter the user has already moved away from
      if (latestQueryRef.current === queryKey) setLoadedQuery(queryKey);
      return action;
    });
  }, [dispatch, eventId, currentPage, debouncedSearch, filter, appFilter, queryKey]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  // A new search or filter starts back on page 1
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!searchParams.get("page")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filter, appFilter]);

  const statusOf = (m) => pendingAttendance[m.id] || ATTENDANCE_FROM_API[m.attendanceStatus] || "none";

  // Counts come from the API and ignore search/filters
  const counts = useMemo(() => normalizeCounts(apiCounts), [apiCounts]);
  const allCount = counts.all || (filtersActive ? 0 : membersTotal);

  const visibleMembers = membersList;

  const visibleIds = visibleMembers.map((m) => m.id);
  const selectedVisible = visibleIds.filter((id) => selected.includes(id));
  const allSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
  // Ticked rows the bulk Remove can act on (app self-registrations are left out)
  const selectedRemovable = visibleMembers.filter((m) => selected.includes(m.id) && !isSelfRegistered(m));

  const toggleRow = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) =>
      allSelected ? prev.filter((id) => !visibleIds.includes(id)) : [...new Set([...prev, ...visibleIds])]
    );

  // The dropdown sends one id, the bulk bar every selected one. The pill updates at once; a refetch
  // then brings the saved status and fresh chip counts, and a failure puts the old status back.
  const markAttendance = async (ids, value) => {
    // Rows only stored in this browser (local-…) don't exist on the server
    const attendeeIds = ids.filter((id) => !String(id).startsWith("local-"));
    if (!attendeeIds.length) return;

    const clearPending = () =>
      setPendingAttendance((prev) => {
        const next = { ...prev };
        attendeeIds.forEach((id) => delete next[id]);
        return next;
      });

    setPendingAttendance((prev) => ({ ...prev, ...Object.fromEntries(attendeeIds.map((id) => [id, value])) }));

    try {
      await updateEventAttendance({ eventId, attendeeIds, attendanceStatus: ATTENDANCE_TO_API[value] });
    } catch (err) {
      clearPending();
      dispatch(addToast({
        message: { title: "Couldn't update attendance", descrip: err.message || "Please try again." },
        type: "error",
      }));
      return;
    }

    if (attendeeIds.length > 1) {
      setSelected((prev) => prev.filter((id) => !attendeeIds.includes(id)));
      dispatch(addToast({
        message: {
          title: value === "none" ? "Attendance cleared" : "Attendance updated",
          descrip:
            value === "none"
              ? `${attendeeIds.length} attendees are back to not marked.`
              : `${attendeeIds.length} attendees marked as ${ATTENDANCE[value].label.toLowerCase()}.`,
        },
        type: "success",
      }));
    }

    await loadAttendees();
    clearPending();
  };

  // Adds a new attendee through the API. Returns the modal's "Added …" line; throwing keeps the modal
  // open, and an error with `field` shows under that input.
  // "Save and add another" skips the popup; the modal shows the returned line instead
  const addAttendee = async (values, { addAnother } = {}) => {
    let res;
    try {
      res = await addOfflineAttendees({ eventId, attendees: [toApiAttendee(values)] });
    } catch (err) {
      dispatch(addToast({
        message: { title: "Couldn't add attendee", descrip: err.message || "Please try again." },
        type: "error",
      }));
      throw err;
    }

    const failed = res.failed?.[0];
    if (failed) {
      const err = new Error(failed.reason || "Couldn't add this attendee.");
      err.field = fieldForReason(failed.reason);
      throw err;
    }

    loadAttendees();

    // A matched mobile links the row to an app account; show who, so a mistyped number is easy to spot
    const joined = res.joined?.[0];
    const linked = joined ? ` → linked to ${joined.matchedProfileName}` : "";
    if (!addAnother) {
      setSuccess({
        title: "Attendee added",
        message: joined
          ? `${values.name} has been added and linked to ${joined.matchedProfileName}'s app profile.`
          : `${values.name} has been added to this event.`,
      });
    }
    return `Added ${values.name}${linked}`;
  };

  // Saves edits to a pending or deregistered attendee, sending only the fields that changed.
  // Throwing keeps the modal open; an error with `field` shows under that input.
  const saveAttendee = async (values, existing) => {
    const id = existing.id;

    // Rows only stored in this browser (local-…) aren't on the server
    if (id.startsWith("local-")) {
      const [firstName, ...rest] = values.name.split(" ");
      const fields = {
        firstName,
        lastName: rest.join(" "),
        title: values.designation ? [{ value: values.designation }] : [],
        companyName: values.company,
        phoneNumber: values.whatsapp,
        email: values.email,
      };
      setLocal((prev) => ({ ...prev, added: prev.added.map((m) => (m.userCode === id ? { ...m, ...fields } : m)) }));
      setSuccess({ title: "Changes saved", message: `${values.name}'s details have been updated.` });
      return;
    }

    // Compare in API form so "98765 43210" vs "9876543210" doesn't count as a change.
    // A cleared optional field is sent as "" so the API clears it.
    const before = toFormValues(existing);
    const toApi = { name: "name", company: "companyName", designation: "title", whatsapp: "phoneNumber", email: "email" };
    const changes = {};
    Object.entries(toApi).forEach(([key, apiKey]) => {
      const next = key === "whatsapp" ? toApiPhone(values[key]) : values[key];
      const prev = key === "whatsapp" ? toApiPhone(before[key]) : before[key];
      if (next !== prev) changes[apiKey] = next;
    });

    if (!Object.keys(changes).length) return; // nothing changed; the modal just closes

    let res;
    try {
      res = await updateOfflineAttendee({ attendeeId: id, ...changes });
    } catch (err) {
      const e = new Error(err.message || "Couldn't save the changes.");
      e.field = fieldForReason(err.message);
      throw e;
    }

    loadAttendees();

    // A pending row whose new mobile belongs to an app account joins on save
    const joined = res.appStatus === "joined" && res.matchedProfileName;
    setSuccess({
      title: joined ? "Saved and linked" : "Changes saved",
      message: joined
        ? `${values.name} is now linked to ${res.matchedProfileName}'s app profile and has joined.`
        : `${values.name}'s details have been updated.`,
    });
  };

  // Runs after the confirm popup. Browser-only rows (local-…) are dropped here; the rest go to the API,
  // which reports any it couldn't remove (e.g. app self-registrations) in failed[]
  const confirmRemove = async () => {
    const { members } = removing;
    const localIds = members.filter((m) => m.id.startsWith("local-")).map((m) => m.id);
    const attendeeIds = members.filter((m) => !m.id.startsWith("local-")).map((m) => m.id);

    let res = { removedCount: 0, failed: [] };
    if (attendeeIds.length) {
      setRemoveLoading(true);
      try {
        res = await removeEventAttendees({ eventId, attendeeIds });
      } catch (err) {
        setRemoving((prev) => ({ ...prev, error: err.message || "Couldn't remove. Please try again." }));
        return;
      } finally {
        setRemoveLoading(false);
      }
    }

    if (localIds.length) {
      setLocal((prev) => ({ ...prev, added: prev.added.filter((m) => !localIds.includes(m.userCode)) }));
    }

    const failedIds = (res.failed || []).map((f) => f.attendeeId);
    const removedIds = members.map((m) => m.id).filter((id) => !failedIds.includes(id));
    setSelected((prev) => prev.filter((id) => !removedIds.includes(id)));
    setRemoving(null);
    if (attendeeIds.length) loadAttendees();

    const removedCount = (res.removedCount || 0) + localIds.length;
    const failed = res.failed || [];
    if (failed.length) {
      const nameOf = (id) => nameOfMember(members.find((x) => x.id === id));
      dispatch(addToast({
        message: {
          title: removedCount ? `Removed ${removedCount}, kept ${failed.length}` : "Couldn't remove",
          descrip: failed.map((f) => `${nameOf(f.attendeeId)}: ${f.reason}`).join(" · "),
        },
        type: "error",
      }));
    } else {
      dispatch(addToast({
        message: {
          title: removedCount === 1 ? "Attendee removed" : "Attendees removed",
          descrip: removedCount === 1
            ? `${nameOfMember(members[0])} has been removed from this event.`
            : `${removedCount} attendees have been removed from this event.`,
        },
        type: "success",
      }));
    }
  };

  const askRemove = (members) => setRemoving({ members, error: "" });

  const copyToClipboard = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      dispatch(addToast({ message: { title: `${what} copied`, descrip: text }, type: "success" }));
    } catch {
      dispatch(addToast({ message: { title: "Couldn't copy", descrip: `Copy the ${what.toLowerCase()} manually: ${text}` }, type: "error" }));
    }
  };

  const toFormValues = (m) => ({
    name: `${m.firstName || ""} ${m.lastName || ""}`.trim(),
    company: m.companyName || "",
    designation: m.title?.[0]?.value || "",
    whatsapp: m.phoneNumber || "",
    email: m.email || "",
  });

  // Three-dot menu for a row (table) or card (phones)
  const rowMenuItems = (member) => [
    {
      // Joined attendees' details come from their app profile
      label: member.appStatus === "joined" ? "Edit in app profile" : "Edit details",
      icon: FiEdit2,
      disabled: member.appStatus === "joined",
      onClick: () => setEditing(member),
    },
    {
      label: "Copy WhatsApp number",
      icon: FiCopy,
      disabled: !member.phoneNumber,
      onClick: () => copyToClipboard(member.phoneNumber, "WhatsApp number"),
    },
    {
      label: "Copy email",
      icon: FiCopy,
      disabled: !member.email,
      onClick: () => copyToClipboard(member.email, "Email"),
    },
    {
      // Self-registered app members can only leave from the app
      label: isSelfRegistered(member) ? "Registered in app" : "Remove",
      icon: FiTrash2,
      danger: true,
      divider: true,
      disabled: isSelfRegistered(member),
      onClick: () => askRemove([member]),
    },
  ];

  const openDetails = (member) =>
    dispatch(openEventsModal({ type: "ATTENDEE_POPUP", payload: formatMember(member) }));

  const handleSheet = (file) => {
    setShowUploadModal(false);
    setSheetFile(file);
  };

  // Sends every mapped sheet row, up to 1000 per call, and merges the results.
  // index in joined[]/failed[] is shifted back to the position in `items`.
  const importAttendees = async (items) => {
    const total = { addedCount: 0, joined: [], failed: [] };
    try {
      for (let start = 0; start < items.length; start += SHEET_BATCH) {
        const res = await addOfflineAttendees({
          eventId,
          attendees: items.slice(start, start + SHEET_BATCH).map(toApiAttendee),
        });
        total.addedCount += res.addedCount || 0;
        total.joined.push(...(res.joined || []).map((j) => ({ ...j, index: j.index + start })));
        total.failed.push(...(res.failed || []).map((f) => ({ ...f, index: f.index + start })));
      }
    } finally {
      // Earlier batches may have saved even if a later one failed
      loadAttendees();
    }
    return total;
  };

  // Success popup once a sheet import saves anything. A clean import also closes the import window;
  // with linked or skipped rows the summary stays underneath so they can be reviewed after OK.
  const handleImported = ({ addedCount, joined, failed }) => {
    if (!addedCount) return;
    const needsReview = joined.length > 0 || failed.length > 0;
    if (!needsReview) setSheetFile(null);
    setSuccess({
      title: "Attendees added",
      message: needsReview
        ? `${addedCount} ${addedCount === 1 ? "attendee was" : "attendees were"} added. Check the linked and skipped rows next.`
        : `All ${addedCount} ${addedCount === 1 ? "attendee was" : "attendees were"} added to this event.`,
      stats: [
        { label: "Added", value: addedCount },
        ...(joined.length ? [{ label: "Linked to app profiles", value: joined.length }] : []),
        ...(failed.length ? [{ label: "Skipped", value: failed.length }] : []),
      ],
    });
  };

  const addModal = (
    <>
      {showAddModal && (
        <AddAttendeeModal
          onClose={() => setShowAddModal(false)}
          onSubmit={addAttendee}
        />
      )}
      {editing && (
        <AddAttendeeModal
          initialValues={toFormValues(editing)}
          onClose={() => setEditing(null)}
          onSubmit={(values) => saveAttendee(values, editing)}
        />
      )}
      {showUploadModal && <UploadSheetModal onClose={() => setShowUploadModal(false)} onSelect={handleSheet} />}
      {sheetFile && (
        <SheetImportModal
          file={sheetFile}
          onClose={() => setSheetFile(null)}
          onBack={() => {
            setSheetFile(null);
            setShowUploadModal(true);
          }}
          onImport={importAttendees}
          onImported={handleImported}
        />
      )}
      <ConfirmPopup
        isOpen={!!removing}
        title={removing?.members.length === 1 ? "Remove attendee?" : `Remove ${removing?.members.length} attendees?`}
        message={
          removing?.members.length === 1
            ? `${nameOfMember(removing.members[0])} will be taken off this event's attendee list.`
            : "They'll be taken off this event's attendee list."
        }
        confirmText="Remove"
        isLoading={removeLoading}
        error={removing?.error}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
      <SuccessPopup
        isOpen={!!success}
        title={success?.title}
        message={success?.message}
        stats={success?.stats}
        onClose={() => setSuccess(null)}
        zIndex={300}
      />
    </>
  );

  const canEdit = !isFinanceManager;
  const clearFilters = () => {
    setSearch("");
    setFilter("all");
    setAppFilter("");
  };

  // Icon-only versions for the toolbar; the empty state keeps the labelled buttons below
  const toolbarActions = canEdit && (
    <div className="flex items-center gap-2">
      <IconAction label="Upload sheet" onClick={() => setShowUploadModal(true)} className={secondaryBtn}>
        <FiUpload className="text-[17px]" />
      </IconAction>
      <IconAction label="Add attendee" align="end" onClick={() => setShowAddModal(true)} className={primaryBtn}>
        <FiPlus className="text-[18px]" />
      </IconAction>
    </div>
  );

  const actions = canEdit && (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      <button type="button" onClick={() => setShowUploadModal(true)} className={secondaryBtn}>
        <FiUpload className="text-[16px]" />
        Upload sheet
      </button>
      <button type="button" onClick={() => setShowAddModal(true)} className={primaryBtn}>
        <FiPlus className="text-[16px]" />
        Add attendee
      </button>
    </div>
  );

  // Also covers the server render, so browser-only attendees never cause a hydration mismatch
  if (!isMembersFetched) {
    return (
      <div className="flex flex-col gap-5 pt-6 pb-24 md:pb-6 font-nunito" aria-busy="true">
        <TableSkeleton canEdit={canEdit} />
      </div>
    );
  }

  // Nobody added yet: call to action instead of the table
  // Only once the unfiltered list has actually come back empty, never mid-switch
  if (isMembersFetched && !isSwitching && !filtersActive && membersList.length === 0) {
    return (
      <div className="flex flex-col gap-5 pt-6 pb-24 md:pb-6 font-nunito">
        <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[#E5E7EB] px-5 py-12 md:px-6 md:py-16">
          <div className="w-16 h-16 rounded-full bg-[#EEF5FF] text-[#147BFF] grid place-items-center">
            <UserSearch size={28} strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 font-heading text-[20px] md:text-[24px] font-semibold text-[#111]">No attendees yet</h3>
          <p className="mt-2 max-w-[460px] text-[15px] leading-[24px] text-[#6B7280]">
            Add people one at a time, or upload a sheet with everyone&apos;s details. On published events, anyone
            whose mobile matches an app account is linked automatically.
          </p>
          {canEdit && <div className="mt-6">{actions}</div>}
        </div>
        {addModal}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pt-6 pb-24 md:pb-6 font-nunito">
      {/* Toolbar: search on the left, filters and actions on the right */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[280px] max-w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-[16px]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company or number"
            aria-label="Search attendees"
            className="w-full h-10 pl-10 pr-9 rounded-full bg-[#F7F8FA] border border-transparent text-[16px] md:text-[14px] text-[#111] placeholder:text-[#9CA3AF] outline-none focus:bg-white focus:border-[#147BFF] transition"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full text-[#9CA3AF] hover:bg-[#EEF0F3] hover:text-[#111] cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[14px] font-medium text-[#147BFF] hover:underline underline-offset-4 cursor-pointer"
          >
            Clear filters
          </button>
        )}

        {/* On phones the filter chips get their own scrollable row and the icon buttons sit on the right */}
        <div className="ml-auto flex flex-wrap items-center justify-end md:justify-normal gap-3 max-w-full">
          <div className="flex max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Segmented
              label="Attendance"
              options={FILTERS.map((f) => ({ key: f.key, label: f.label, count: f.key === "all" ? allCount : counts[f.key] }))}
              value={filter}
              onChange={setFilter}
            />
          </div>
          {/* Last on phones so its right-aligned menu has room to open leftwards */}
          <div className="order-last md:order-none">
            <AppStatusFilter value={appFilter} onChange={setAppFilter} counts={counts} />
          </div>
          {toolbarActions && (
            <>
              <span className="hidden md:block mx-1 h-6 w-px bg-[#E5E7EB]" aria-hidden />
              {toolbarActions}
            </>
          )}
        </div>
      </div>

      {/* Phones: one card per attendee, same data and handlers as the table rows */}
      <div className="md:hidden rounded-2xl border border-[#F0F1F3] bg-white overflow-hidden">
        {canEdit && visibleMembers.length > 0 && !isSwitching && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F1F3] text-[12px] font-bold uppercase tracking-[1.2px] text-[#6B7280]">
            <Checkbox
              checked={allSelected}
              indeterminate={!allSelected && selectedVisible.length > 0}
              onChange={toggleAll}
              label="Select all attendees"
            />
            Attendee
          </div>
        )}
        <ul aria-busy={isSwitching}>
          {isSwitching ? (
            <ShimmerCards canEdit={canEdit} />
          ) : visibleMembers.length === 0 ? (
            <li className="px-5 py-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#F3F4F6] grid place-items-center text-[#9CA3AF]">
                <FiSearch className="text-[20px]" />
              </div>
              <p className="mt-3 text-[16px] font-semibold text-[#111]">No one matches</p>
              <p className="mt-1 text-[14px] text-[#6B7280]">Try another name or number, or clear the filters.</p>
              <button type="button" onClick={clearFilters} className={`${secondaryBtn} mt-4`}>
                Clear filters
              </button>
            </li>
          ) : (
            visibleMembers.map((member, i) => {
              const id = member.id;
              const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "No Name";
              const titles = formatTitles(member.title);
              const status = statusOf(member);
              const phoneDigits = (member.phoneNumber || "").replace(/\D/g, "");
              const isSelected = selected.includes(id);
              const isDeactivated = member.appStatus === "deregistered";
              // Pending / deactivated shown as a small label, since the dot's tooltip needs hover
              const appStatus = member.appStatus !== "joined" ? APP_STATUS[member.appStatus] : null;

              return (
                <li
                  key={id || i}
                  onClick={() => openDetails(member)}
                  className={`flex gap-3 px-4 py-3.5 border-b border-[#F5F6F8] last:border-0 cursor-pointer transition-colors ${
                    isSelected ? "bg-[#F5F9FF]" : "active:bg-[#FAFAFB]"
                  }`}
                >
                  {canEdit && (
                    <div
                      className="-mx-2 px-2 pt-[11px] pb-2 self-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(id);
                      }}
                    >
                      <Checkbox checked={isSelected} onChange={() => toggleRow(id)} label={`Select ${fullName}`} />
                    </div>
                  )}
                  <div className={`shrink-0 ${isDeactivated ? "opacity-50 grayscale" : ""}`}>
                    <Avatar src={member.dpURL} name={fullName} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`truncate text-[15px] font-semibold ${isDeactivated ? "text-[#9CA3AF]" : "text-[#111]"}`}>
                          {fullName}
                        </p>
                        {titles && <p className="truncate text-[13px] text-[#9CA3AF]">{titles}</p>}
                        {member.companyName && <p className="truncate text-[13px] text-[#374151]">{member.companyName}</p>}
                        {appStatus && (
                          <span className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6B7280]">
                            <span className={`w-1.5 h-1.5 rounded-full ${appStatus.dot}`} />
                            {appStatus.label}
                          </span>
                        )}
                      </div>
                      {canEdit && (
                        <div className="-mr-2 -mt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <RowMenu items={rowMenuItems(member)} />
                        </div>
                      )}
                    </div>

                    {(member.phoneNumber || member.email) && (
                      <div className="mt-2 flex flex-col gap-1 min-w-0 text-[13px]" onClick={(e) => e.stopPropagation()}>
                        {member.phoneNumber && (
                          <a
                            href={phoneDigits ? `https://wa.me/${phoneDigits}` : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 w-fit max-w-full py-0.5 text-[#374151]"
                          >
                            <FaWhatsapp className="shrink-0 text-[14px] opacity-60" />
                            <span className="truncate">{member.phoneNumber}</span>
                          </a>
                        )}
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="inline-flex items-center gap-1.5 w-fit max-w-full py-0.5 text-[#374151]"
                          >
                            <FiMail className="shrink-0 text-[14px] opacity-60" />
                            <span className="truncate">{member.email}</span>
                          </a>
                        )}
                      </div>
                    )}

                    <div className="mt-2.5 w-fit" onClick={(e) => e.stopPropagation()}>
                      {canEdit ? (
                        <AttendanceSelect value={status} onChange={(value) => markAttendance([id], value)} />
                      ) : (
                        <AttendanceBadge value={status} />
                      )}
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Table */}
      <div className="hidden md:block rounded-2xl border border-[#F0F1F3] bg-white overflow-x-auto">
        <table className="w-full min-w-[920px] table-fixed border-collapse">
          <colgroup>
            {/* Attendee, company and contact split the remaining width equally */}
            {canEdit && <col className="w-[52px]" />}
            <col />
            <col />
            <col />
            <col className="w-[190px]" />
            {canEdit && <col className="w-[60px]" />}
          </colgroup>
          <thead>
            <tr className="border-b border-[#F0F1F3] text-left text-[12px] uppercase tracking-[1.2px] text-[#6B7280]">
              {canEdit && (
                <th className="pl-5 py-3.5 font-bold">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && selectedVisible.length > 0}
                    onChange={toggleAll}
                    label="Select all attendees"
                  />
                </th>
              )}
              <th className={`${canEdit ? "px-3" : "pl-5 pr-3"} py-3.5 font-bold`}>Attendee</th>
              <th className="px-3 py-3.5 font-bold">Company</th>
              <th className="px-3 py-3.5 font-bold">Contact</th>
              <th className="px-3 py-3.5 font-bold">Attendance</th>
              {canEdit && (
                <th className="py-3.5">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody aria-busy={isSwitching}>
            {isSwitching ? (
              <ShimmerRows canEdit={canEdit} />
            ) : visibleMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F3F4F6] grid place-items-center text-[#9CA3AF]">
                      <FiSearch className="text-[20px]" />
                    </div>
                    <p className="mt-3 text-[16px] font-semibold text-[#111]">No one matches</p>
                    <p className="mt-1 text-[14px] text-[#6B7280]">Try another name or number, or clear the filters.</p>
                    <button type="button" onClick={clearFilters} className={`${secondaryBtn} mt-4`}>
                      Clear filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              visibleMembers.map((member, i) => {
                const id = member.id;
                const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "No Name";
                const titles = formatTitles(member.title);
                const status = statusOf(member);
                const phoneDigits = (member.phoneNumber || "").replace(/\D/g, "");
                const isSelected = selected.includes(id);
                const isDeactivated = member.appStatus === "deregistered";

                return (
                  <tr
                    key={id || i}
                    onClick={() => openDetails(member)}
                    className={`border-b border-[#F5F6F8] last:border-0 transition-colors cursor-pointer ${
                      isSelected ? "bg-[#F5F9FF]" : "hover:bg-[#FAFAFB]"
                    }`}
                  >
                    {canEdit && (
                      <td className="pl-5 py-3.5">
                        <Checkbox checked={isSelected} onChange={() => toggleRow(id)} label={`Select ${fullName}`} />
                      </td>
                    )}

                    <td className={`${canEdit ? "px-3" : "pl-5 pr-3"} py-3.5`}>
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Deactivated attendees fade back */}
                        <div className={isDeactivated ? "opacity-50 grayscale" : ""}>
                          <Avatar src={member.dpURL} name={fullName} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className={`truncate text-[15px] font-semibold ${isDeactivated ? "text-[#9CA3AF]" : "text-[#111]"}`}>
                              {fullName}
                            </p>
                            <AppStatusDot status={member.appStatus} />
                          </div>
                          {titles && <p className="truncate text-[13px] text-[#9CA3AF]">{titles}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-[14px] text-[#374151] truncate">
                      {member.companyName || <span className="text-[#D1D5DB]">—</span>}
                    </td>

                    <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1 min-w-0 text-[13px]">
                        {member.phoneNumber && (
                          <a
                            href={phoneDigits ? `https://wa.me/${phoneDigits}` : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in WhatsApp"
                            className="inline-flex items-center gap-1.5 w-fit max-w-full text-[#374151] hover:text-[#16A34A] transition-colors"
                          >
                            <FaWhatsapp className="shrink-0 text-[14px] opacity-60" />
                            <span className="truncate">{member.phoneNumber}</span>
                          </a>
                        )}
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            title="Send email"
                            className="inline-flex items-center gap-1.5 w-fit max-w-full text-[#374151] hover:text-[#147BFF] transition-colors"
                          >
                            <FiMail className="shrink-0 text-[14px] opacity-60" />
                            <span className="truncate">{member.email}</span>
                          </a>
                        )}
                        {!member.phoneNumber && !member.email && <span className="text-[#D1D5DB]">—</span>}
                      </div>
                    </td>

                    <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                      {canEdit ? (
                        <AttendanceSelect value={status} onChange={(value) => markAttendance([id], value)} />
                      ) : (
                        <AttendanceBadge value={status} />
                      )}
                    </td>

                    {canEdit && (
                      <td className="pr-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          <RowMenu items={rowMenuItems(member)} />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination total={membersTotal} currentPage={currentPage} perPage={10} className="bg-white! px-1! pb-2!" />

      {/* Bulk actions for the ticked rows, floating above the table */}
      {canEdit && selectedVisible.length > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="fixed bottom-24 left-4 right-4 md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2 z-40 flex flex-wrap md:flex-nowrap items-center justify-center gap-1 rounded-2xl md:rounded-full bg-[#111] px-2 md:pl-5 md:pr-2 py-2 text-white shadow-[0_12px_32px_rgba(17,17,17,0.25)]"
        >
          {/* Phones: count + close on the first line, the actions wrap underneath */}
          <div className="flex items-center justify-between w-full md:w-auto pl-2 md:pl-0 md:mr-2">
            <span className="text-[14px] font-semibold whitespace-nowrap">{selectedVisible.length} selected</span>
            <button
              type="button"
              onClick={() => setSelected([])}
              aria-label="Clear selection"
              className="md:hidden w-9 h-9 grid place-items-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <span className="hidden md:block mx-1 h-5 w-px bg-white/20" aria-hidden />
          <button type="button" onClick={() => markAttendance(selectedVisible, "yes")} className={bulkBtn}>
            <CircleCheck size={16} className="text-[#4ADE80]" />
            Attended
          </button>
          <button type="button" onClick={() => markAttendance(selectedVisible, "no")} className={bulkBtn}>
            <CircleX size={16} className="text-[#F87171]" />
            Didn&apos;t attend
          </button>
          <button type="button" onClick={() => markAttendance(selectedVisible, "none")} className={bulkBtn}>
            <CircleDashed size={16} className="text-white/60" />
            Clear
          </button>
          {selectedRemovable.length > 0 && (
            <>
              <span className="hidden md:block mx-1 h-5 w-px bg-white/20" aria-hidden />
              <button type="button" onClick={() => askRemove(selectedRemovable)} className={`${bulkBtn} text-[#FCA5A5]`}>
                <FiTrash2 className="text-[15px]" />
                Remove{selectedRemovable.length < selectedVisible.length ? ` ${selectedRemovable.length}` : ""}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setSelected([])}
            aria-label="Clear selection"
            className="hidden md:grid ml-1 w-9 h-9 place-items-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {addModal}
    </div>
  );
};

export default Attendees;
