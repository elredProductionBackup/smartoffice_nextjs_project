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
        className="bg-white w-[650px] max-w-full max-h-[90dvh] md:max-h-[90vh] rounded-[20px] p-6 md:p-[40px] relative flex flex-col gap-6 md:gap-[28px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute h-8 w-8 md:h-[24px] md:w-[24px] bg-[#EEEEEE] rounded-full right-5 top-5 md:right-[40px] md:top-[40px] grid place-items-center cursor-pointer"
        >
          <span className="akar-icons--cross small-cross"></span>
        </button>

        {/* Header */}
        <div className="flex flex-col gap-4 md:gap-[20px] items-start">
          <div
            className={`w-[80px] h-[80px] text-[30px] md:w-[100px] md:h-[100px] md:text-[38px] rounded-full grid place-items-center text-white font-semibold ${
              user.status === "deactivated" ? "opacity-50" : ""
            }`}
            style={{ backgroundColor: user.color }}
          >
            {getInitials(user.name)}
          </div>

          <div className="w-full flex flex-col items-start gap-[6px]">
            <div className="w-full flex items-center justify-between gap-4">
              <h2 className="flex flex-wrap md:flex-nowrap items-center gap-3 text-[24px] md:text-[32px] text-[#333333] font-semibold min-w-0 break-words">
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
            <p className="text-[16px] md:text-[20px] text-[#666666] font-medium">{roleLabels.join(" | ")}</p>
            <span className="flex items-center gap-[8px] text-[16px] text-[#666666] font-semibold">
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 md:gap-y-[40px] text-base text-[#333333]">
          <div className="flex flex-col gap-[12px] min-w-0">
            <span className="text-[18px] md:text-[20px] font-bold uppercase">Email</span>
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
            <span className="text-[18px] md:text-[20px] font-bold uppercase">WhatsApp</span>
            <span className="flex gap-[8px] text-[#666666] text-[16px] font-semibold">
              <span className="h-[24px] w-[24px] shrink-0 rounded-full bg-[#E6EBF2] grid place-items-center">
                <span className="proicons--call small-icons"></span>
              </span>
              {user.whatsapp || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-[12px]">
            <span className="text-[18px] md:text-[20px] font-bold uppercase">Roles</span>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((r) => (
                <span key={r} className={`px-3 py-1 rounded-full text-[14px] font-bold ${ROLES[r].className}`}>
                  {ROLES[r].label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[12px]">
            <span className="text-[18px] md:text-[20px] font-bold uppercase">Open Approvals</span>
            <span className="text-[16px] font-semibold text-[#666666]">
              {user.openApprovals > 0 ? `${user.openApprovals} waiting` : "None"}
            </span>
          </div>

          {user.roles.includes("portfolio") && (
            <div className="sm:col-span-2 flex flex-col gap-[12px]">
              <span className="text-[18px] md:text-[20px] font-bold uppercase">Portfolios</span>
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
