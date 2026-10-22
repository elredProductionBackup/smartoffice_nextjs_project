"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiCheck, FiX } from "react-icons/fi";
import { ROLES } from "./constants";
import { addNetworkClusterAdmin } from "@/services/auth.service";
import { fetchBudgetTypes } from "@/store/events/budgetChecklist/budgetThunks";

// Page role keys -> API role keys; Collaborator has no API role yet, so it isn't offered here
const API_ROLES = { admin: "admin", finance: "financeOfficer", portfolio: "portfolioOfficer" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The API needs a country code; numbers typed without one are treated as Indian (+91) for now.
// "98765 43210" / "098765 43210" / "919876543210" / "+91 98765 43210" -> "+919876543210"; a bare "+91" counts as empty
const toApiPhone = (value) => {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits || digits === "91") return "";
  if (raw.startsWith("+")) return `+${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+91${digits.replace(/^0+/, "")}`;
};

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
  const dispatch = useDispatch();
  // Portfolios are the network's budget types: [{ budgetTypeId, budgetType }]
  const { budgetTypes, loadingTypes } = useSelector((state) => state.budget);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("+91 ");
  const [roles, setRoles] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [emailTouched, setEmailTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    if (!budgetTypes?.length) dispatch(fetchBudgetTypes());
  }, [budgetTypes?.length, dispatch]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  // Who already covers each portfolio, e.g. "With Meezan, Aditi".
  // User portfolios may come back as ids, names or objects, so match on any of them
  const holdsPortfolio = (u, p) =>
    u.portfolios.some((x) =>
      [x, x?.budgetTypeId, x?.portfolioId, x?._id, x?.budgetType, x?.name].some(
        (v) => v && (v === p.budgetTypeId || v === p.budgetType)
      )
    );
  const officersFor = (p) =>
    users
      .filter((u) => u.status !== "deactivated" && u.roles.includes("portfolio") && holdsPortfolio(u, p))
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

  // A taken email is shown straight away; a badly formatted one waits until the field loses focus
  const showEmailError = !!emailError && (emailTouched || emailTaken);

  // First thing still stopping the invite, shown in the footer so the disabled button explains itself
  const blocker = !name.trim()
    ? "Enter their full name."
    : !trimmedEmail
      ? "Enter their work email."
      : emailError
        ? emailError
        : roles.length === 0
          ? "Pick at least one role."
          : isPortfolio && portfolios.length === 0
            ? "Pick at least one portfolio for the Portfolio Officer role."
            : "";
  const hasStarted = name.trim() || trimmedEmail || roles.length > 0;

  const canSend = !blocker;

  const handleSend = async () => {
    if (!canSend || sending) return;
    const phone = toApiPhone(whatsapp);
    const details = {
      fullName: name.trim().replace(/\s+/g, " "),
      email: trimmedEmail,
      ...(phone && { phone }),
      role: roles.map((r) => API_ROLES[r]),
      portfolioIds: isPortfolio ? portfolios : [],
    };

    setSending(true);
    setSendError("");
    try {
      const res = await addNetworkClusterAdmin([details]);
      if (!res?.data?.success) throw new Error(res?.data?.message || "Couldn't send the invite.");
      // result[0] says whether this created someone new (isNewAdmin) or updated an existing user
      onInvite({ ...details, ...res.data.result?.[0] });
      onClose();
    } catch (err) {
      console.error("Invite user error:", err);
      setSendError(err.message || "Couldn't send the invite. Please try again.");
    } finally {
      setSending(false);
    }
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
                className={`${inputClass} ${showEmailError ? "border-[#DC2626] focus:border-[#DC2626]" : ""}`}
              />
              {showEmailError && <p className="text-[13px] text-[#DC2626] mt-1">{emailError}</p>}
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
            {Object.entries(ROLES).filter(([key]) => API_ROLES[key]).map(([key, role]) => {
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
                {loadingTypes && !budgetTypes?.length && (
                  <p className={`${hintClass} col-span-3`}>Loading portfolios...</p>
                )}
                {budgetTypes?.map((p) => {
                  const isOn = portfolios.includes(p.budgetTypeId);
                  const officers = officersFor(p);
                  return (
                    <button
                      key={p.budgetTypeId}
                      type="button"
                      onClick={() => togglePortfolio(p.budgetTypeId)}
                      className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl border text-left transition cursor-pointer ${
                        isOn ? "border-[#2BA597] bg-[#ECF8F5]" : "border-[#E2E8F0] hover:border-[#B6CFF5]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-[16px] font-semibold text-[#1E293B] capitalize">{p.budgetType}</span>
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
          {sendError ? (
            <span role="alert" className="text-[15px] font-semibold text-[#DC2626]">{sendError}</span>
          ) : blocker && hasStarted ? (
            <span aria-live="polite" className="text-[15px] font-semibold text-[#B45309]">{blocker}</span>
          ) : (
            <span className="text-[15px] text-[#64748B]">They&apos;ll get an email invite to join Prive Network.</span>
          )}
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
              disabled={!canSend || sending}
              className="h-11 px-6 rounded-full bg-[#1D72E8] text-white text-[16px] font-bold hover:bg-[#0B57D0] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Sending..." : "Send invite"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
