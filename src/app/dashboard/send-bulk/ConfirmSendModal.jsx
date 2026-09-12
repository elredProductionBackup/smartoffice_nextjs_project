"use client";

import { useEffect, useRef, useState } from "react";
import { FiX, FiChevronDown, FiHelpCircle, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import CustomCheckbox from "@/_components/UI/CustomCheckbox";
import CustomDatePicker from "@/_components/UI/CustomDatePicker";
import CustomTimePicker from "@/_components/UI/CustomTimePicker";
import { sendBulkBroadcastMessage } from "@/services/broadcast.service";
import { getEmailHtmlTemplate } from "./emailTemplates";

const FIELDS = [
  { key: "workshopName", label: "Workshop name", type: "text", placeholder: "North Cluster Review" },
  { key: "workshopDate", label: "Workshop date", type: "date" },
  { key: "sessionTime", label: "Session time", type: "time" },
  { key: "arrivalTime", label: "Arrival time", type: "time" },
  { key: "venue", label: "Venue", type: "text", placeholder: "Andheri West" },
];

function withIndianCountryCode(phone) {
  const digits = (phone || "").replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  const national = digits.length > 10 ? digits.slice(-10) : digits;
  return `+91${national}`;
}

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
    <div ref={ref}>
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
        <div className="mt-1 bg-white border border-[#e5e7eb] rounded-[10px] shadow-sm py-1.5 px-1.5 max-h-[220px] overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="px-3 py-3 text-[13px] text-[#9ca3af] text-center">
              No contacts selected in Send To yet.
            </div>
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

export default function ConfirmSendModal({ contacts, templateId, messageType, subject, onClose, onConfirm }) {
  const nameOnly = templateId === "prive_media";

  const [attendeeNames, setAttendeeNames] = useState([]);
  const [values, setValues] = useState({
    workshopName: "",
    workshopDate: "",
    sessionTime: "",
    arrivalTime: "",
    venue: "",
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sendStatus, setSendStatus] = useState("idle"); // idle | sending | success | error
  const [sendError, setSendError] = useState("");

  const canSubmit = attendeeNames.length > 0 && (nameOnly || FIELDS.every((f) => values[f.key].trim()));

  const setField = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  const buildPayload = () => ({
    attendeeName: attendeeNames.join(", "),
    workshopName: values.workshopName.trim(),
    workshopDate: values.workshopDate.trim(),
    sessionTime: values.sessionTime.trim(),
    arrivalTime: values.arrivalTime.trim(),
    venue: values.venue.trim(),
  });

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSendStatus("idle");
    setSendError("");
    setConfirmOpen(true);
  };

  const handleFinalConfirm = async () => {
    setSendStatus("sending");
    try {
      const recipients = attendeeNames.map((name) => {
        const match = contacts.find((c) => c.name === name);
        return messageType === "email"
          ? { name, email: match?.email || "" }
          : { name, phone: withIndianCountryCode(match?.phone) };
      });

      const result = await sendBulkBroadcastMessage({
        messageType,
        templateName: templateId,
        contacts: recipients,
        templateVariables: nameOnly
          ? {}
          : {
              workshopName: values.workshopName.trim(),
              workshopDate: values.workshopDate.trim(),
              sessionTime: values.sessionTime.trim(),
              arrivalTime: values.arrivalTime.trim(),
              venue: values.venue.trim(),
            },
        subject: messageType === "email" ? subject || "" : "",
        htmlTemplate: messageType === "email" ? getEmailHtmlTemplate(templateId) : "",
      });

      if (result?.success === false) {
        throw new Error(result?.message || "Failed to send broadcast");
      }
      setSendStatus("success");
    } catch (error) {
      console.error("sendBulkBroadcastMessage error:", error?.response || error);
      setSendError(error?.response?.data?.message || error?.message || "Failed to send broadcast");
      setSendStatus("error");
    }
  };

  const handleDone = () => {
    onConfirm(buildPayload());
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

            {!nameOnly && FIELDS.map((f) => (
              <div key={f.key} className={f.type === "text" ? "col-span-2" : ""}>
                <label className="block text-[13px] font-semibold text-[#333] mb-1.5">{f.label}</label>
                {f.type === "date" ? (
                  <CustomDatePicker compact value={values[f.key]} onChange={(v) => setField(f.key, v)} />
                ) : f.type === "time" ? (
                  <CustomTimePicker compact value={values[f.key]} onChange={(v) => setField(f.key, v)} />
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

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
          onClick={(e) => {
            e.stopPropagation();
            if (sendStatus === "idle") setConfirmOpen(false);
          }}
        >
          <div
            className="bg-white rounded-[16px] w-full max-w-[380px] mx-4 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {sendStatus === "idle" && (
              <>
                <div className="flex items-center gap-2 mb-1.5">
                  <FiHelpCircle className="text-[18px] text-[#2563eb]" />
                  <h3 className="text-[16px] font-bold text-[#1a1a2e]">Send these details?</h3>
                </div>
                <p className="text-[13px] text-[#666] mb-5">
                  This will confirm attendance for{" "}
                  <span className="font-semibold text-[#1a1a2e]">
                    {attendeeNames.length} attendee{attendeeNames.length === 1 ? "" : "s"}
                  </span>{" "}
                  with the details you entered.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setConfirmOpen(false)}
                    className="px-5 h-[38px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalConfirm}
                    className="px-5 h-[38px] rounded-[8px] bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] cursor-pointer transition-colors"
                  >
                    Yes, confirm
                  </button>
                </div>
              </>
            )}

            {sendStatus === "sending" && (
              <div className="flex flex-col items-center py-3 gap-3">
                <div className="w-8 h-8 border-[3px] border-[#2563eb] border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px] font-semibold text-[#333]">Sending broadcast…</p>
              </div>
            )}

            {sendStatus === "success" && (
              <div className="flex flex-col items-center py-3 gap-3">
                <FiCheckCircle className="text-[36px] text-green-500" />
                <p className="text-[15px] font-bold text-[#1a1a2e]">Broadcast sent</p>
                <p className="text-[13px] text-[#666] text-center">
                  Your message has been sent to the selected attendee{attendeeNames.length === 1 ? "" : "s"}.
                </p>
                <button
                  onClick={handleDone}
                  className="mt-2 w-full px-6 h-[38px] rounded-[8px] bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            )}

            {sendStatus === "error" && (
              <div className="flex flex-col items-center py-3 gap-3">
                <FiAlertTriangle className="text-[32px] text-red-500" />
                <p className="text-[15px] font-bold text-[#1a1a2e]">Couldn&apos;t send broadcast</p>
                <p className="text-[13px] text-[#666] text-center">{sendError}</p>
                <div className="flex items-center gap-3 w-full mt-2">
                  <button
                    onClick={() => setConfirmOpen(false)}
                    className="flex-1 h-[38px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalConfirm}
                    className="flex-1 h-[38px] rounded-[8px] bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] cursor-pointer transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
