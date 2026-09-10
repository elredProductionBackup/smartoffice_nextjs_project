"use client";

import { useEffect, useRef, useState } from "react";
import { FiX, FiChevronDown } from "react-icons/fi";
import CustomCheckbox from "@/_components/UI/CustomCheckbox";
import CustomDatePicker from "@/_components/UI/CustomDatePicker";

const FIELDS = [
  { key: "workshopName", label: "Workshop name", type: "text", placeholder: "North Cluster Review" },
  { key: "workshopDate", label: "Workshop date", type: "date" },
  { key: "sessionTime", label: "Session time", type: "time" },
  { key: "arrivalTime", label: "Arrival time", type: "time" },
  { key: "venue", label: "Venue", type: "text", placeholder: "Andheri West" },
];

function AttendeeSelect({ contacts, selectedNames, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allSelected = contacts.length > 0 && selectedNames.length === contacts.length;

  const toggleAll = () => {
    onChange(allSelected ? [] : contacts.map((c) => c.name));
  };

  const toggleOne = (name) => {
    onChange(
      selectedNames.includes(name) ? selectedNames.filter((n) => n !== name) : [...selectedNames, name]
    );
  };

  const label =
    selectedNames.length === 0
      ? "Select attendee(s)"
      : selectedNames.length === contacts.length
      ? "All attendees"
      : selectedNames.join(", ");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between h-[42px] px-3 rounded-[8px] border text-[13px] bg-white transition-colors cursor-pointer ${
          open ? "border-[#2563eb] ring-1 ring-[#2563eb]/30" : "border-[#d1d5db] hover:border-[#9ca3af]"
        }`}
      >
        <span className={`truncate text-left ${selectedNames.length ? "text-[#111]" : "text-[#9ca3af]"}`}>
          {label}
        </span>
        <FiChevronDown
          className={`shrink-0 text-[#6b7280] text-[16px] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5 max-h-[240px] overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="px-3 py-3 text-[13px] text-[#9ca3af] text-center">No contacts yet.</div>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleAll}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[#2563eb] hover:bg-[#f9fafb] rounded-[7px] cursor-pointer"
              >
                <CustomCheckbox checked={allSelected} onChange={toggleAll} />
                Select all
              </button>
              <div className="my-1 border-t border-[#f1f5f9]" />
              {contacts.map((c) => {
                const checked = selectedNames.includes(c.name);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleOne(c.name)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left rounded-[7px] cursor-pointer ${
                      checked ? "bg-[#eff6ff] text-[#2563eb] font-medium" : "text-[#111] hover:bg-[#f9fafb]"
                    }`}
                  >
                    <CustomCheckbox checked={checked} onChange={() => toggleOne(c.name)} />
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConfirmSendModal({ contacts, onClose, onConfirm }) {
  const [attendeeNames, setAttendeeNames] = useState([]);
  const [values, setValues] = useState({
    workshopName: "",
    workshopDate: "",
    sessionTime: "",
    arrivalTime: "",
    venue: "",
  });

  const canSubmit = attendeeNames.length > 0 && FIELDS.every((f) => values[f.key].trim());

  const setField = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm({
      attendeeName: attendeeNames.join(", "),
      workshopName: values.workshopName.trim(),
      workshopDate: values.workshopDate.trim(),
      sessionTime: values.sessionTime.trim(),
      arrivalTime: values.arrivalTime.trim(),
      venue: values.venue.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] w-full max-w-[480px] mx-4 shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-[#f1f5f9]">
          <div>
            <h2 className="text-[22px] font-bold text-[#1a1a2e] leading-tight">Confirm details</h2>
            <p className="text-[13px] text-[#888] mt-0.5">These values fill the message before it goes out</p>
          </div>
          <button onClick={onClose} className="text-[#999] hover:text-[#333] transition-colors cursor-pointer mt-1">
            <FiX className="text-[20px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Attendee name</label>
              <AttendeeSelect contacts={contacts} selectedNames={attendeeNames} onChange={setAttendeeNames} />
            </div>

            {FIELDS.map((f) => (
              <div key={f.key} className={f.type === "text" ? "col-span-2" : ""}>
                <label className="block text-[13px] font-semibold text-[#333] mb-1.5">{f.label}</label>
                {f.type === "date" ? (
                  <CustomDatePicker value={values[f.key]} onChange={(v) => setField(f.key, v)} />
                ) : (
                  <input
                    type={f.type}
                    value={values[f.key]}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full h-[42px] px-3 rounded-[8px] border border-[#d1d5db] bg-white text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-[#f1f5f9]">
          <button
            onClick={onClose}
            className="px-5 h-[42px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-6 h-[42px] rounded-[8px] text-[13px] font-semibold transition-colors ${
              canSubmit
                ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8] cursor-pointer"
                : "bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
