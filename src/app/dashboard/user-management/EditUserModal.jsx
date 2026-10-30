"use client";

import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { toApiPhone } from "./constants";

// Mounted only while open, so it starts from the user's current details each time.
// Email is how the API finds the user, so it can't be edited here.
// onSave({ name, whatsapp }) is async; the modal stays open until it resolves.
export default function EditUserModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user.name);
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || "+91 ");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const trimmedName = name.trim().replace(/\s+/g, " ");
  const changed = trimmedName !== user.name || toApiPhone(whatsapp) !== toApiPhone(user.whatsapp);
  const blocker = !trimmedName ? "Enter their full name." : "";
  const canSave = !blocker && changed;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSave({ name: trimmedName, whatsapp });
      onClose();
    } catch (err) {
      console.error("Edit user error:", err);
      setSaveError(err.message || "Couldn't save the changes. Please try again.");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full h-12 px-4 rounded-xl border border-[#E2E8F0] text-[16px] placeholder:text-[#94A3B8] outline-none focus:border-[#0B57D0] transition";
  const labelClass = "block text-[14px] font-semibold text-[#64748B] mb-1.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-nunito p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="w-full max-w-[520px] max-h-[calc(100vh-32px)] bg-white rounded-[20px] shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-7 pt-6 pb-4 shrink-0">
          <div>
            <h3 className="text-[24px] font-semibold text-[#1E293B]">Edit user</h3>
            <p className="text-[15px] text-[#64748B]">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#1E293B] hover:bg-[#F1F5F9] transition cursor-pointer"
          >
            <FiX className="text-[20px]" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-7 pb-5 space-y-4">
          <label className="block">
            <span className={labelClass}>
              Full name <span className="text-[#DC2626]">*</span>
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="e.g. Ananya Iyer"
              className={`${inputClass} bg-white text-[#1E293B]`}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              value={user.email}
              disabled
              className={`${inputClass} bg-[#F8FAFC] text-[#64748B] cursor-not-allowed`}
            />
            <span className="block text-[13px] text-[#94A3B8] mt-1.5">Email can&apos;t be changed.</span>
          </label>

          <label className="block">
            <span className={labelClass}>WhatsApp number</span>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="+91 98765 43210"
              className={`${inputClass} bg-white text-[#1E293B]`}
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-[#E2E8F0] shrink-0">
          <span className={`text-[13px] ${saveError ? "font-semibold text-[#DC2626]" : "text-[#B45309]"}`}>
            {saveError || blocker}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 px-4 rounded-full text-[15px] font-bold text-[#334155] hover:bg-[#F1F5F9] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="h-10 px-5 rounded-full bg-[#1D72E8] text-white text-[15px] font-bold hover:bg-[#0B57D0] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
