import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiCopy, FiEdit2, FiMinus, FiPlus, FiSearch, FiTrash2, FiUpload } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { UserSearch } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { selectIsFinanceOfficer } from "@/store/auth/authSlice";
import { fetchEventMembers } from "@/store/events/eventsThunks";
import { openEventsModal } from "@/store/events/eventsUiSlice";
import { addToast } from "@/store/toastSlice";
import { formatMember } from "@/utils/formatMember";
import { useSearchParams } from "next/navigation";
import Pagination from "../UI/Pagination";
import RowMenu from "../UI/RowMenu";
import SuccessPopup from "../ConfirmationPopups/SuccessPopup";
import AddAttendeeModal from "./AddAttendeeModal";
import UploadSheetModal from "./UploadSheetModal";
import AttendanceSelect, { ATTENDANCE } from "./AttendanceSelect";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "yes", label: "Attended" },
  { key: "no", label: "Didn't attend" },
  { key: "none", label: "Not marked" },
];

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

// Per-event browser copy of attendee changes; storage can be blocked, so never let it throw
// edited holds field overrides for attendees that came from the API
const EMPTY_LOCAL = { added: [], removed: [], edited: {}, attendance: {} };
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
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const membersTotal = useSelector(
    (state) => state.events.membersTotal[eventId] || 0
  );

  const {
    membersMap,
    membersFetched,
  } = useSelector((state) => state.events);

  const isFinanceManager = useSelector(selectIsFinanceOfficer);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [success, setSuccess] = useState(null); // { title, message } after a save
  // Added attendees, removals and attendance live in the browser until the attendee APIs exist
  const [local, setLocal] = useState(() => loadLocal(eventId));
  const attendance = local.attendance;

  useEffect(() => saveLocal(eventId, local), [eventId, local]);

  const membersList = useMemo(
    () =>
      [...local.added, ...(membersMap[eventId] || [])]
        .filter((m) => !local.removed.includes(m.userCode))
        .map((m) => (local.edited[m.userCode] ? { ...m, ...local.edited[m.userCode] } : m)),
    [local, membersMap, eventId]
  );
  const isMembersFetched = membersFetched[eventId];

  useEffect(() => {
    if (!eventId) return;

    dispatch(
      fetchEventMembers({
        eventId,
        page: currentPage,
        limit: 10,
      })
    );
  }, [eventId, currentPage]);

  const statusOf = (m) => attendance[m.userCode] || "none";

  const counts = useMemo(() => {
    const c = { all: membersList.length, yes: 0, no: 0, none: 0 };
    membersList.forEach((m) => c[attendance[m.userCode] || "none"]++);
    return c;
  }, [membersList, attendance]);

  const visibleMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return membersList.filter((m) => {
      if (filter !== "all" && (attendance[m.userCode] || "none") !== filter) return false;
      if (!q) return true;
      return [m.firstName, m.lastName, m.companyName, m.email, m.phoneNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [membersList, attendance, search, filter]);

  const visibleIds = visibleMembers.map((m) => m.userCode);
  const selectedVisible = visibleIds.filter((id) => selected.includes(id));
  const allSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;

  const toggleRow = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) =>
      allSelected ? prev.filter((id) => !visibleIds.includes(id)) : [...new Set([...prev, ...visibleIds])]
    );

  const markAttendance = (ids, value) =>
    setLocal((prev) => {
      const next = { ...prev.attendance };
      ids.forEach((id) => (value === "none" ? delete next[id] : (next[id] = value)));
      return { ...prev, attendance: next };
    });

  // Adds a new attendee, or saves edits when `existing` is passed.
  // "Save and add another" skips the popup; the modal shows its own "Added …" line instead
  const saveAttendee = (values, existing, { addAnother } = {}) => {
    const digits = (s = "") => s.replace(/\D/g, "");
    const dup = membersList.find(
      (m) =>
        m.userCode !== existing?.userCode &&
        ((values.email && m.email?.toLowerCase() === values.email.toLowerCase()) ||
        (values.whatsapp && digits(m.phoneNumber) === digits(values.whatsapp)))
    );
    if (dup) {
      const what = values.email && dup.email?.toLowerCase() === values.email.toLowerCase() ? "This email" : "This WhatsApp number";
      const dupName = `${dup.firstName || ""} ${dup.lastName || ""}`.trim();
      dispatch(addToast({
        message: { title: "Already on the list", descrip: `${what} already belongs to ${dupName}.` },
        type: "error",
      }));
      throw new Error("Duplicate attendee");
    }

    // Same shape as the event members API so the table treats both alike
    const [firstName, ...rest] = values.name.split(" ");
    const fields = {
      firstName,
      lastName: rest.join(" "),
      title: values.designation ? [{ value: values.designation }] : [],
      companyName: values.company,
      phoneNumber: values.whatsapp,
      email: values.email,
    };

    if (existing) {
      const id = existing.userCode;
      setLocal((prev) =>
        id.startsWith("local-")
          ? { ...prev, added: prev.added.map((m) => (m.userCode === id ? { ...m, ...fields } : m)) }
          : { ...prev, edited: { ...prev.edited, [id]: fields } }
      );
      setSuccess({ title: "Changes saved", message: `${values.name}'s details have been updated.` });
      return;
    }

    setLocal((prev) => ({ ...prev, added: [{ userCode: `local-${Date.now()}`, ...fields }, ...prev.added] }));
    if (!addAnother) {
      setSuccess({ title: "Attendee added", message: `${values.name} has been added to this event.` });
    }
  };

  const removeAttendee = (member) => {
    setLocal((prev) => ({
      ...prev,
      added: prev.added.filter((m) => m.userCode !== member.userCode),
      removed: member.userCode.startsWith("local-") ? prev.removed : [...prev.removed, member.userCode],
    }));
    setSelected((prev) => prev.filter((id) => id !== member.userCode));
  };

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
    // TODO: hand the file to the column mapping step once it's built
    setShowUploadModal(false);
  };

  const addModal = (
    <>
      {showAddModal && (
        <AddAttendeeModal
          onClose={() => setShowAddModal(false)}
          onSubmit={(values, opts) => saveAttendee(values, null, opts)}
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
      <SuccessPopup
        isOpen={!!success}
        title={success?.title}
        message={success?.message}
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
  if (isMembersFetched && membersList.length === 0) {
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
                  No attendees match your search.
                </td>
              </tr>
            ) : (
              visibleMembers.map((member, i) => {
                const id = member.userCode;
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
                          <p className="truncate text-[17px] font-semibold text-[#1E293B]">{fullName}</p>
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
                              { label: "Edit details", icon: FiEdit2, onClick: () => setEditing(member) },
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
                              { label: "Remove", icon: FiTrash2, danger: true, divider: true, onClick: () => removeAttendee(member) },
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
