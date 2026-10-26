import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiCopy, FiEdit2, FiMinus, FiPlus, FiSearch, FiTrash2, FiUpload } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { UserSearch } from "lucide-react";
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
import AttendanceSelect, { ATTENDANCE } from "./AttendanceSelect";

// `api` is the attendanceStatus / appStatus value getEventAttendees filters on
const FILTERS = [
  { key: "all", label: "All", api: "" },
  { key: "yes", label: "Attended", api: "attended" },
  { key: "no", label: "Didn't attend", api: "notAttended" },
  { key: "none", label: "Not marked", api: "notMarked" },
];

const APP_FILTERS = [
  { key: "joined", label: "Joined" },
  { key: "pending", label: "Pending" },
  { key: "deregistered", label: "Deregistered" },
];

const SHEET_BATCH = 1000; // addOfflineAttendees row limit per call

const ATTENDANCE_FROM_API = { attended: "yes", notAttended: "no", notMarked: "none" };
// Members who registered themselves in the app can't be removed from Smart Office
const isSelfRegistered = (m) => m.registrationSource === "app";

const nameOfMember = (m) => `${m?.firstName || ""} ${m?.lastName || ""}`.trim() || "Attendee";

// What updateEventAttendance stores; "" clears it back to Not marked
const ATTENDANCE_TO_API = { yes: "attended", no: "notAttended", none: "" };

const APP_STATUS_BADGE = {
  pending: { label: "Pending", className: "bg-[#FEF7E0] text-[#B06000]" },
  deregistered: { label: "Deregistered", className: "bg-[#F1F5F9] text-[#475569]" },
};

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

const chipClass = (active) =>
  `inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border text-[14px] font-bold transition cursor-pointer ${
    active
      ? "bg-[#D3E3FD] border-[#B6CFF5] text-[#0B57D0]"
      : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#B6CFF5]"
  }`;

const outlineBtn =
  "inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#0B57D0] bg-white text-[#0B57D0] text-[14px] font-bold hover:bg-[#D3E3FD]/50 transition cursor-pointer";
const fillBtn =
  "inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#1D72E8] text-white text-[14px] font-bold hover:bg-[#0B57D0] transition cursor-pointer";
const contactBtn =
  "w-10 h-10 bg-[#E6EBF2] rounded-full flex items-center justify-center shrink-0 transition";

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
      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${
        checked || indeterminate ? "bg-[#1D72E8] border-[#1D72E8] text-white" : "border-[#94A3B8] bg-white"
      }`}
    >
      {indeterminate ? <FiMinus className="text-[13px]" /> : checked && <FiCheck className="text-[13px]" />}
    </button>
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

  const loadAttendees = useCallback(() => {
    if (!eventId) return;

    return dispatch(
      fetchEventMembers({
        eventId,
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        attendanceStatus: FILTERS.find((f) => f.key === filter)?.api || "",
        appStatus: appFilter,
      })
    );
  }, [dispatch, eventId, currentPage, debouncedSearch, filter, appFilter]);

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
          title: "Attendance updated",
          descrip: `${attendeeIds.length} attendees marked as ${ATTENDANCE[value].label.toLowerCase()}.`,
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

  // Also covers the server render, so browser-only attendees never cause a hydration mismatch
  if (!isMembersFetched) {
    return <div className="p-10 text-center">Loading attendees...</div>;
  }

  // Nobody added yet: header + call to action instead of the table
  if (isMembersFetched && !filtersActive && membersList.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-[inherit] rounded-[20px] overflow-hidden">
        <div className="flex items-center justify-between py-[16px] px-[30px] font-bold text-lg text-[#333333]">
          <div>Name / Title</div>
          {!isFinanceManager && <div>Actions</div>}
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center px-5 py-10">
          <div className="h-[90px] w-[90px] rounded-full bg-[#D3E3FD] text-[#0B57D0] grid place-items-center mb-[22px]">
            <UserSearch size={40} strokeWidth={2} />
          </div>

          <h2 className="mb-2 text-2xl font-semibold text-[#333333]">No attendees yet</h2>

          <p className="max-w-[440px] text-[15px] leading-normal text-[#666666]">
            Add people one at a time, or upload a sheet with everyone&apos;s details.
          </p>

          {!isFinanceManager && (
            <div className="mt-[22px] flex flex-wrap justify-center gap-2.5">
              <button type="button" onClick={() => setShowUploadModal(true)} className={outlineBtn}>
                <FiUpload className="text-[16px]" />
                Upload sheet
              </button>
              <button type="button" onClick={() => setShowAddModal(true)} className={fillBtn}>
                <FiPlus className="text-[16px]" />
                Add attendee
              </button>
            </div>
          )}
        </div>
        {addModal}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[inherit] p-5 font-nunito">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <div className="relative w-[300px] max-w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[16px]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attendees"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-[#E2E8F0] text-[15px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#0B57D0] transition"
          />
        </div>

        {FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={chipClass(filter === f.key)}>
            {f.label} <span className="font-semibold opacity-60">{f.key === "all" ? allCount : counts[f.key]}</span>
          </button>
        ))}

        <span className="h-6 w-px bg-[#E2E8F0]" aria-hidden />

        {/* App status; clicking the active chip clears it */}
        {APP_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setAppFilter((cur) => (cur === f.key ? "" : f.key))}
            className={chipClass(appFilter === f.key)}
          >
            {f.label} <span className="font-semibold opacity-60">{counts[f.key]}</span>
          </button>
        ))}

        {!isFinanceManager && (
          <div className="ml-auto flex items-center gap-2.5">
            <button type="button" onClick={() => setShowUploadModal(true)} className={outlineBtn}>
              <FiUpload className="text-[16px]" />
              Upload sheet
            </button>
            <button type="button" onClick={() => setShowAddModal(true)} className={fillBtn}>
              <FiPlus className="text-[16px]" />
              Add attendee
            </button>
          </div>
        )}
      </div>

      {/* Bulk actions for the ticked rows */}
      {!isFinanceManager && selectedVisible.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-white border border-[#B6CFF5] shrink-0">
          <span className="mr-2 text-[14px] font-bold text-[#0B57D0]">{selectedVisible.length} selected</span>
          <button type="button" onClick={() => markAttendance(selectedVisible, "yes")} className={chipClass(false)}>
            Mark attended
          </button>
          <button type="button" onClick={() => markAttendance(selectedVisible, "no")} className={chipClass(false)}>
            Mark didn&apos;t attend
          </button>
          {selectedRemovable.length > 0 && (
            <button
              type="button"
              onClick={() => askRemove(selectedRemovable)}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-[#FECACA] bg-white text-[14px] font-bold text-[#B91C1C] hover:bg-[#FEF2F2] transition cursor-pointer"
            >
              <FiTrash2 className="text-[14px]" />
              Remove{selectedRemovable.length < selectedVisible.length ? ` ${selectedRemovable.length}` : ""}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelected([])}
            className="ml-auto text-[14px] font-bold text-[#475569] hover:text-[#1E293B] cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 mt-4 rounded-[20px] border border-[#E2E8F0] overflow-auto bg-white">
        <table className="w-full min-w-[900px] table-fixed border-collapse">
          <colgroup>
            {!isFinanceManager && <col className="w-[56px]" />}
            <col className="w-[38%]" />
            <col />
            <col className="w-[200px]" />
            {!isFinanceManager && <col className="w-[170px]" />}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[#F2F7FF]">
            <tr className="text-left text-[15px] font-bold text-[#475569]">
              {!isFinanceManager && (
                <th className="pl-6 py-4">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && selectedVisible.length > 0}
                    onChange={toggleAll}
                    label="Select all attendees"
                  />
                </th>
              )}
              <th className={`${isFinanceManager ? "px-6" : "px-4"} py-4 font-bold`}>Name / Title</th>
              <th className="px-4 py-4 font-bold">Company</th>
              <th className="px-4 py-4 font-bold">Attendance</th>
              {!isFinanceManager && <th className="px-4 py-4 font-bold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleMembers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-[15px] text-[#777777]">
                  No attendees match your search or filters.
                </td>
              </tr>
            ) : (
              visibleMembers.map((member, i) => {
                const id = member.id;
                const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "No Name";
                const titles = formatTitles(member.title);
                const status = statusOf(member);
                const statusInfo = ATTENDANCE[status];
                const phoneDigits = (member.phoneNumber || "").replace(/\D/g, "");
                const isSelected = selected.includes(id);

                return (
                  <tr
                    key={id || i}
                    onClick={() => openDetails(member)}
                    className={`border-t border-[#E2E8F0] transition cursor-pointer ${
                      isSelected ? "bg-[#F2F7FF]" : "hover:bg-[#FAFCFF]"
                    }`}
                  >
                    {!isFinanceManager && (
                      <td className="pl-6 py-4">
                        <Checkbox checked={isSelected} onChange={() => toggleRow(id)} label={`Select ${fullName}`} />
                      </td>
                    )}

                    <td className={`${isFinanceManager ? "px-6" : "px-4"} py-4`}>
                      <div className="flex items-center gap-3.5">
                        {member.dpURL ? (
                          <Image
                            src={member.dpURL}
                            alt={fullName}
                            width={44}
                            height={44}
                            className="w-11 h-11 rounded-full object-cover border border-[#D4DFF1] shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#1D72E8] text-white text-[14px] font-bold flex items-center justify-center shrink-0">
                            {getInitials(fullName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="truncate text-[17px] font-semibold text-[#1E293B]">{fullName}</p>
                            {APP_STATUS_BADGE[member.appStatus] && (
                              <span
                                className={`shrink-0 px-2 py-0.5 rounded-md text-[12px] font-semibold ${APP_STATUS_BADGE[member.appStatus].className}`}
                              >
                                {APP_STATUS_BADGE[member.appStatus].label}
                              </span>
                            )}
                          </div>
                          {titles && <p className="truncate mt-0.5 text-[13px] text-[#94A3B8]">{titles}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-[15px] truncate">
                      {member.companyName ? (
                        <span className="text-[#1E293B]">{member.companyName}</span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      {isFinanceManager ? (
                        <span className={`inline-flex items-center gap-2 h-9 px-3 rounded-full border text-[14px] font-bold ${statusInfo.pill}`}>
                          <statusInfo.icon size={16} strokeWidth={2.25} className={statusInfo.iconColor} />
                          {statusInfo.label}
                        </span>
                      ) : (
                        <AttendanceSelect
                          value={status}
                          onChange={(value) => markAttendance([id], value)}
                          openUp={i >= visibleMembers.length - 2 && visibleMembers.length > 3}
                        />
                      )}
                    </td>

                    {!isFinanceManager && (
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          {phoneDigits ? (
                            <a
                              href={`https://wa.me/${phoneDigits}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={member.phoneNumber}
                              className={`${contactBtn} text-[#333333] hover:text-[#16A34A]`}
                            >
                              <FaWhatsapp className="text-[20px]" />
                            </a>
                          ) : (
                            <span title="No WhatsApp number" className={`${contactBtn} text-[#333333] opacity-40 cursor-not-allowed`}>
                              <FaWhatsapp className="text-[20px]" />
                            </span>
                          )}
                          {member.email ? (
                            <a href={`mailto:${member.email}`} title={member.email} className={contactBtn}>
                              <span className="oui--email"></span>
                            </a>
                          ) : (
                            <span title="No email" className={`${contactBtn} opacity-40 cursor-not-allowed`}>
                              <span className="oui--email"></span>
                            </span>
                          )}
                          <RowMenu
                            openUp={i >= visibleMembers.length - 2 && visibleMembers.length > 3}
                            items={[
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
                            ]}
                          />
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

      <Pagination
        total={membersTotal}
        currentPage={currentPage}
        perPage={10}
      />

      {addModal}
    </div>
  );
};

export default Attendees;
