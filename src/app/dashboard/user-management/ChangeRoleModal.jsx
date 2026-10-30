"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiCheck, FiX } from "react-icons/fi";
import { API_ROLES, ROLES } from "./constants";

// Mounted only while open, so it starts from the user's current roles each time.
// onSave({ roles, portfolioIds }) is async; the modal stays open until it resolves.
export default function ChangeRoleModal({ user, onClose, onSave }) {
  // Portfolios are the network's budget types: [{ budgetTypeId, budgetType }] (loaded by the page)
  const { budgetTypes, loadingTypes } = useSelector((state) => state.budget);
  const [roles, setRoles] = useState(user.roles);
  const [portfolios, setPortfolios] = useState(user.portfolioIds);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const isPortfolio = roles.includes("portfolio");
  const canSave = roles.length > 0 && (!isPortfolio || portfolios.length > 0);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      // Portfolios only apply to Portfolio Officers
      await onSave({ roles, portfolioIds: isPortfolio ? portfolios : [] });
      onClose();
    } catch (err) {
      console.error("Change role error:", err);
      setSaveError(err.message || "Couldn't save the roles. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-nunito p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="w-full max-w-[520px] max-h-[calc(100vh-32px)] bg-white rounded-[20px] shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-7 pt-6 pb-4 shrink-0">
          <div>
            <h3 className="text-[24px] font-semibold text-[#1E293B]">Change role</h3>
            <p className="text-[15px] text-[#64748B]">{user.name}</p>
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

        <div className="flex-1 min-h-0 overflow-y-auto px-7 pb-5">
          <span className="block text-[14px] font-semibold text-[#64748B] mb-2">Roles</span>
          <div className="space-y-2">
            {Object.entries(ROLES).filter(([key]) => API_ROLES[key]).map(([key, role]) => {
              const isOn = roles.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(roles, setRoles, key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition cursor-pointer ${
                    isOn ? "border-[#B6CFF5] bg-[#F5F9FF]" : "border-[#E2E8F0] hover:border-[#B6CFF5]"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[14px] font-bold ${role.className}`}>
                      {role.label}
                    </span>
                    <p className="text-[13px] text-[#64748B] mt-1">{role.description}</p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      isOn ? "bg-[#1D72E8] border-[#1D72E8] text-white" : "border-[#CBD5E1] bg-white"
                    }`}
                  >
                    {isOn && <FiCheck className="text-[13px]" />}
                  </span>
                </button>
              );
            })}
          </div>

          {isPortfolio && (
            <>
              <span className="block text-[14px] font-semibold text-[#64748B] mt-5 mb-2">Portfolios</span>
              <div className="flex flex-wrap gap-2">
                {loadingTypes && !budgetTypes?.length && (
                  <p className="text-[13px] text-[#94A3B8]">Loading portfolios...</p>
                )}
                {budgetTypes?.map((p) => {
                  const isOn = portfolios.includes(p.budgetTypeId);
                  return (
                    <button
                      key={p.budgetTypeId}
                      type="button"
                      onClick={() => toggle(portfolios, setPortfolios, p.budgetTypeId)}
                      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[14px] font-semibold transition cursor-pointer ${
                        isOn
                          ? "bg-[#E6F6EF] border-[#A7E3C4] text-[#0F766E]"
                          : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#A7E3C4]"
                      }`}
                    >
                      {isOn && <FiCheck className="text-[13px]" />}
                      <span className="capitalize">{p.budgetType}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-[#E2E8F0] shrink-0">
          <span className={`text-[13px] ${saveError ? "font-semibold text-[#DC2626]" : "text-[#B45309]"}`}>
            {saveError ||
              (roles.length === 0
                ? "Pick at least one role."
                : isPortfolio && portfolios.length === 0
                  ? "Pick at least one portfolio."
                  : "")}
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
