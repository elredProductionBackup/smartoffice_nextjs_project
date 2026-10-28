"use client";

import { useEffect } from "react";
import { ROLES, STATUS } from "./constants";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// Read-only profile popup, laid out like the Members details modal
export default function UserDetailsModal({ user, isMe, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const status = STATUS[user.status];
  const roleLabels = user.roles.map((r) => ROLES[r].label);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center font-nunito p-4" onClick={onClose}>
      <div
        className="bg-white w-[650px] max-w-full max-h-[90vh] rounded-[20px] p-[40px] relative flex flex-col gap-[28px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute h-[24px] w-[24px] bg-[#EEEEEE] rounded-full right-[40px] top-[40px] grid place-items-center cursor-pointer"
        >
          <span className="akar-icons--cross small-cross"></span>
        </button>

        {/* Header */}
        <div className="flex flex-col gap-[20px] items-start">
          <div
            className={`w-[100px] h-[100px] rounded-full grid place-items-center text-white text-[38px] font-semibold ${
              user.status === "deactivated" ? "opacity-50" : ""
            }`}
            style={{ backgroundColor: user.color }}
          >
            {getInitials(user.name)}
          </div>

          <div className="w-full flex flex-col items-start gap-[6px]">
            <div className="w-full flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-3 text-[32px] text-[#333333] font-semibold">
                {user.name}
                {isMe && (
                  <span className="px-2 py-0.5 rounded-md bg-[#E3EDFD] text-[#0B57D0] text-[14px] font-bold">You</span>
                )}
              </h2>
              {user.whatsapp && (
                <a
                  href={`https://wa.me/${user.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Chat on WhatsApp"
                  className="cursor-pointer"
                >
                  <span className="logos--whatsapp-icon"></span>
                </a>
              )}
            </div>
            <p className="text-[20px] text-[#666666] font-medium">{roleLabels.join(" | ")}</p>
            <span className="flex items-center gap-[8px] text-[16px] text-[#666666] font-semibold">
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-[40px] text-base text-[#333333]">
          <div className="flex flex-col gap-[12px] min-w-0">
            <span className="text-[20px] font-bold uppercase">Email</span>
            <a
              href={`mailto:${user.email}`}
              className="flex gap-[8px] text-[#666666] text-[16px] font-semibold break-all hover:underline"
            >
              <span className="h-[24px] w-[24px] shrink-0 rounded-full bg-[#E6EBF2] grid place-items-center">
                <span className="oui--email small-icon"></span>
              </span>
              {user.email}
            </a>
          </div>

          <div className="flex flex-col gap-[12px]">
            <span className="text-[20px] font-bold uppercase">WhatsApp</span>
            <span className="flex gap-[8px] text-[#666666] text-[16px] font-semibold">
              <span className="h-[24px] w-[24px] rounded-full bg-[#E6EBF2] grid place-items-center">
                <span className="proicons--call small-icons"></span>
              </span>
              {user.whatsapp || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-[12px]">
            <span className="text-[20px] font-bold uppercase">Roles</span>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((r) => (
                <span key={r} className={`px-3 py-1 rounded-full text-[14px] font-bold ${ROLES[r].className}`}>
                  {ROLES[r].label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[12px]">
            <span className="text-[20px] font-bold uppercase">Open Approvals</span>
            <span className="text-[16px] font-semibold text-[#666666]">
              {user.openApprovals > 0 ? `${user.openApprovals} waiting` : "None"}
            </span>
          </div>

          {user.roles.includes("portfolio") && (
            <div className="col-span-2 flex flex-col gap-[12px]">
              <span className="text-[20px] font-bold uppercase">Portfolios</span>
              {user.portfolios.length ? (
                <div className="flex flex-wrap gap-2">
                  {user.portfolios.map((p) => (
                    <span key={p} className={`px-3 py-1 rounded-full text-[14px] font-bold ${ROLES.portfolio.className}`}>
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[16px] font-semibold text-[#666666]">—</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
