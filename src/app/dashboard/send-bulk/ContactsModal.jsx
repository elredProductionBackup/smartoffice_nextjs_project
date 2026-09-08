"use client";

import { useEffect, useRef, useState } from "react";
import { FiX, FiTrash2, FiChevronDown, FiCheckCircle } from "react-icons/fi";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function GroupSelect({ groups, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between h-[42px] px-3 rounded-[8px] border text-[13px] bg-white transition-colors cursor-pointer ${
          open ? "border-[#2563eb] ring-1 ring-[#2563eb]/30" : "border-[#d1d5db] hover:border-[#9ca3af]"
        }`}
      >
        <span className={value ? "text-[#111]" : "text-[#9ca3af]"}>{value || "No group"}</span>
        <FiChevronDown className={`text-[#6b7280] text-[16px] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5 max-h-[200px] overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-[13px] rounded-[7px] cursor-pointer ${
              !value ? "bg-[#eff6ff] text-[#2563eb] font-medium" : "text-[#111] hover:bg-[#f9fafb]"
            }`}
          >
            No group
          </button>
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                onChange(g);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[13px] rounded-[7px] cursor-pointer ${
                value === g ? "bg-[#eff6ff] text-[#2563eb] font-medium" : "text-[#111] hover:bg-[#f9fafb]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContactsModal({ mode, contacts, groups, onClose, onAddContact, onDeleteContact }) {
  const isManageMode = mode === "manage";
  const isEmailMode = mode === "email";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [group, setGroup] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState("idle"); // idle | deleting | deleted

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setDeleteStatus("deleting");
    setTimeout(() => {
      onDeleteContact(pendingDelete.id);
      setDeleteStatus("deleted");
      setTimeout(() => {
        setPendingDelete(null);
        setDeleteStatus("idle");
      }, 700);
    }, 500);
  };

  const canSubmit = isEmailMode
    ? fullName.trim() && email.trim()
    : fullName.trim() && (email.trim() || phone.trim());

  const handleAdd = () => {
    if (!canSubmit) return;
    onAddContact({
      name: fullName.trim(),
      email: email.trim(),
      phone: isEmailMode ? "" : phone.trim(),
      group: group || null,
      hasWhatsApp: isEmailMode ? false : !!phone.trim(),
    });
    setFullName("");
    setEmail("");
    setPhone("");
    setGroup("");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] w-full max-w-[620px] mx-4 shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-[#f1f5f9]">
          <div>
            <h2 className="text-[22px] font-bold text-[#1a1a2e] leading-tight">Contacts</h2>
            <p className="text-[13px] text-[#888] mt-0.5">{contacts.length} saved</p>
          </div>
          <button onClick={onClose} className="text-[#999] hover:text-[#333] transition-colors cursor-pointer mt-1">
            <FiX className="text-[20px]" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {/* Add form */}
          {!isManageMode && (
          <div className="bg-[#eff6ff] rounded-[12px] p-4 mb-5">
            <label className="block text-[14px] font-bold text-[#2563eb] mb-3">
              {isEmailMode ? "Add an email contact" : "Add a contact"}
            </label>

            <div className="mb-3">
              <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Kavita Menon"
                className="w-full h-[42px] px-3 rounded-[8px] border border-[#d1d5db] bg-white text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af]"
              />
            </div>

            {isEmailMode ? (
              <div className="mb-3">
                <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.in"
                  className="w-full h-[42px] px-3 rounded-[8px] border border-[#d1d5db] bg-white text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af]"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.in"
                    className="w-full h-[42px] px-3 rounded-[8px] border border-[#d1d5db] bg-white text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-[42px] px-3 rounded-[8px] border border-[#d1d5db] bg-white text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af]"
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Group</label>
              <GroupSelect groups={groups} value={group} onChange={setGroup} />
            </div>

            <button
              onClick={handleAdd}
              disabled={!canSubmit}
              className={`px-5 h-[42px] rounded-[8px] text-[13px] font-semibold transition-colors ${
                canSubmit
                  ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8] cursor-pointer"
                  : "bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"
              }`}
            >
              {isEmailMode ? "Add email contact" : "Add contact"}
            </button>
          </div>
          )}

          {/* Existing contacts */}
          {isManageMode && (
          <div className="flex flex-col">
            {contacts.map((c) => {
              const subtext = [c.email, c.phone].filter(Boolean).join(" · ");
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 py-3 border-b border-[#f1f5f9] last:border-b-0"
                >
                  <div className="w-10 h-10 min-w-[40px] rounded-full bg-[#E5E7EB] text-[#555] grid place-items-center text-[13px] font-bold">
                    {initials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#1a1a2e] truncate">{c.name}</p>
                    {subtext && <p className="text-[12px] text-[#888] truncate">{subtext}</p>}
                  </div>
                  <button
                    onClick={() => {
                      setDeleteStatus("idle");
                      setPendingDelete(c);
                    }}
                    title="Delete contact"
                    className="text-red-500 hover:bg-red-50 rounded-[6px] p-1.5 cursor-pointer transition-colors"
                  >
                    <FiTrash2 className="text-[15px]" />
                  </button>
                </div>
              );
            })}

            {contacts.length === 0 && (
              <div className="py-10 text-center text-[13px] text-[#9ca3af]">No contacts yet.</div>
            )}
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-7 py-4 border-t border-[#f1f5f9]">
          <button
            onClick={onClose}
            className="px-6 h-[42px] rounded-[8px] bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
          onClick={() => deleteStatus === "idle" && setPendingDelete(null)}
        >
          <div
            className="bg-white rounded-[16px] w-full max-w-[360px] mx-4 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {deleteStatus === "idle" && (
              <>
                <h3 className="text-[16px] font-bold text-[#1a1a2e] mb-1.5">Delete contact?</h3>
                <p className="text-[13px] text-[#666] mb-5">
                  <span className="font-semibold text-[#1a1a2e]">{pendingDelete.name}</span> will be removed from
                  your contacts and any groups they belong to. This can&apos;t be undone.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setPendingDelete(null)}
                    className="px-5 h-[38px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-5 h-[38px] rounded-[8px] bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 cursor-pointer transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}

            {deleteStatus === "deleting" && (
              <div className="flex flex-col items-center py-3 gap-3">
                <div className="w-8 h-8 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px] font-semibold text-[#333]">Deleting {pendingDelete.name}…</p>
              </div>
            )}

            {deleteStatus === "deleted" && (
              <div className="flex flex-col items-center py-3 gap-3">
                <FiCheckCircle className="text-[32px] text-green-500" />
                <p className="text-[13px] font-semibold text-[#333]">{pendingDelete.name} deleted</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
