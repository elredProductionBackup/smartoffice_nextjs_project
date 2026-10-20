"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { AVATAR_COLORS, PORTFOLIOS, ROLES } from "./constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Checkbox({ checked }) {
  return (
    <span
      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
        checked ? "bg-[#1D72E8] border-[#1D72E8] text-white" : "border-[#94A3B8] bg-white"
      }`}
    >
      {checked && <FiCheck className="text-[13px]" />}
    </span>
  );
}

// Mounted only while open, so the form starts empty each time
export default function InviteUserModal({ users, onClose, onInvite }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [roles, setRoles] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  // Who already covers each portfolio, e.g. "With Meezan, Aditi"
  const officersFor = (p) =>
    users
      .filter((u) => u.status !== "deactivated" && u.roles.includes("portfolio") && u.portfolios.includes(p))
      .map((u) => u.name.split(" ")[0]);

  const isPortfolio = roles.includes("portfolio");

  // Unticking Portfolio Officer clears portfolios; picking a portfolio ticks Portfolio Officer
  const toggleRole = (key) => {
    if (key === "portfolio" && isPortfolio) setPortfolios([]);
    toggle(roles, setRoles, key);
  };

  const togglePortfolio = (p) => {
    if (!isPortfolio) setRoles((prev) => [...prev, "portfolio"]);
    toggle(portfolios, setPortfolios, p);
  };
  const trimmedEmail = email.trim().toLowerCase();
  const emailTaken = users.some((u) => u.email.toLowerCase() === trimmedEmail);
  const emailError = !trimmedEmail
    ? ""
    : !EMAIL_RE.test(trimmedEmail)
      ? "Enter a valid email address."
      : emailTaken
        ? "Someone with this email is already on the team."
        : "";

  const canSend =
    name.trim() &&
    trimmedEmail &&
    !emailError &&
    roles.length > 0 &&
    (!isPortfolio || portfolios.length > 0);

  const handleSend = () => {
    if (!canSend) return;
    onInvite({
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: trimmedEmail,
      whatsapp: whatsapp.trim().replace(/^\+91\s*$/, ""),
      roles,
      portfolios: isPortfolio ? portfolios : [],
      status: "invited",
      openApprovals: 0,
      color: AVATAR_COLORS[users.length % AVATAR_COLORS.length],
    });
    onClose();
  };

  const inputClass =
    "w-full h-12 px-4 rounded-xl bg-white border border-[#E2E8F0] text-[16px] text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#0B57D0] transition";
  const labelClass = "block text-[15px] font-semibold text-[#334155] mb-1.5";
  const hintClass = "text-[13px] text-[#94A3B8]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-nunito p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[800px] max-h-[calc(100vh-32px)] bg-white rounded-[20px] shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4 shrink-0">
          <h3 className="text-[26px] font-semibold text-[#1E293B]">Invite a user</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#1E293B] hover:bg-[#F1F5F9] transition cursor-pointer"
          >
            <FiX className="text-[22px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>
                Full name <span className="text-[#DC2626]">*</span>
              </span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ananya Iyer"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>
                Work email <span className="text-[#DC2626]">*</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                placeholder="name@prive.network"
                className={`${inputClass} ${emailTouched && emailError ? "border-[#DC2626] focus:border-[#DC2626]" : ""}`}
              />
              {emailTouched && emailError && <p className="text-[13px] text-[#DC2626] mt-1">{emailError}</p>}
            </label>
          </div>

          <label className="block mt-5">
            <span className={labelClass}>
              WhatsApp number <span className="font-normal text-[#94A3B8]">(optional)</span>
            </span>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+91 98XXX XXXXX"
              className={inputClass}
            />
            <p className={`${hintClass} mt-1.5`}>
              Used for WhatsApp alerts when someone asks this person for an approval.
            </p>
          </label>

          {/* Roles */}
          <span className={`${labelClass} mt-5`}>
            Roles <span className="font-normal text-[#94A3B8]">(pick one or more)</span>
          </span>
          <div className="space-y-2.5">
            {Object.entries(ROLES).map(([key, role]) => {
              const isOn = roles.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleRole(key)}
                  className={`w-full flex items-start gap-3.5 px-4 py-3.5 rounded-xl border text-left transition cursor-pointer ${
                    isOn ? "border-[#2BA597] bg-[#ECF8F5]" : "border-[#E2E8F0] hover:border-[#B6CFF5]"
                  }`}
                >
                  <span className="mt-0.5">
                    <Checkbox checked={isOn} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[17px] font-semibold text-[#1E293B]">{role.label}</span>
                    <span className="block text-[14px] text-[#475569]">{role.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className={`${hintClass} mt-2`}>
            Someone can hold more than one role, for example Admin and Finance Officer.
          </p>

          {/* Portfolios — always visible; dimmed until Portfolio Officer is picked */}
          <span className={`${labelClass} mt-5`}>
            Portfolios{" "}
            {!isPortfolio && <span className="font-normal text-[#94A3B8]">(for Portfolio Officers)</span>}
          </span>
              <div className={`grid grid-cols-3 gap-2.5 transition ${isPortfolio ? "" : "opacity-60"}`}>
                {PORTFOLIOS.map((p) => {
                  const isOn = portfolios.includes(p);
                  const officers = officersFor(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePortfolio(p)}
                      className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl border text-left transition cursor-pointer ${
                        isOn ? "border-[#2BA597] bg-[#ECF8F5]" : "border-[#E2E8F0] hover:border-[#B6CFF5]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-[16px] font-semibold text-[#1E293B]">{p}</span>
                        <span className="block text-[14px] text-[#94A3B8]">
                          {officers.length ? `With ${officers.join(", ")}` : "No officer yet"}
                        </span>
                      </span>
                      <span className="mt-0.5">
                        <Checkbox checked={isOn} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className={`${hintClass} mt-2`}>
                {isPortfolio
                  ? "Pick one or more. You can change this later."
                  : "Picking a portfolio also makes them a Portfolio Officer."}
              </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-8 py-4 border-t border-[#E2E8F0] shrink-0">
          <span className="text-[15px] text-[#64748B]">They&apos;ll get an email invite to join Prive Network.</span>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-full text-[16px] font-bold text-[#334155] hover:bg-[#F1F5F9] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="h-11 px-6 rounded-full bg-[#1D72E8] text-white text-[16px] font-bold hover:bg-[#0B57D0] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send invite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
