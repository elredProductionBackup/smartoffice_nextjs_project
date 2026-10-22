"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  mountToast,
  hideToast,
  removeToast,
  clearAllToasts,
} from "@/store/toastSlice";
import { useEffect } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

const TONES = {
  success: {
    icon: Check,
    card: "bg-gradient-to-r from-[#E3EDFD] to-[#F2F7FF] border-[#D3E3FD]",
    blob: "bg-[#1D72E8]/10",
    badge: "bg-gradient-to-br from-[#5597ED] to-[#00449C]",
  },
  error: {
    icon: AlertTriangle,
    card: "bg-gradient-to-r from-[#FDECEC] to-[#FFF7F7] border-[#F9CDCC]",
    blob: "bg-[#E10600]/10",
    badge: "bg-gradient-to-br from-[#F2504B] to-[#E10600]",
  },
};
import { usePathname } from "next/navigation";

export default function GlobalToast() {
    const dispatch = useDispatch();
    const toast = useSelector((state) => state.toast.toast);
    const pathname = usePathname();
    useEffect(() => {
    if (!toast) return;

    if (!toast.mounted) {
        const m = setTimeout(() => dispatch(mountToast()), 20);
        return () => clearTimeout(m);
    }
    }, [toast]);

    useEffect(() => {
      if (!toast || !toast.mounted) return;

      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 4000);

      return () => clearTimeout(timer);
    }, [toast?.mounted]);

    useEffect(() => {
        dispatch(clearAllToasts());
    }, [pathname]);

     if (!toast) return null;

  // Success (e.g. "Email copied") uses the brand blue; everything else is treated as an error
  const tone = toast.type === "success" ? TONES.success : TONES.error;
  const Icon = tone.icon;

  const stateClass = toast.hiding
    ? "opacity-0 -translate-y-2 transition-all duration-200"
    : toast.mounted
    ? "opacity-100 translate-y-0 transition-all duration-300"
    : "opacity-0 -translate-y-2";

  return (
    <div className="fixed inset-0 flex justify-center z-[9999] pointer-events-none">
      <div
        onTransitionEnd={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.propertyName === "opacity" && toast.hiding) {
            dispatch(removeToast());
          }
        }}
        role={toast.type === "success" ? "status" : "alert"}
        className={`
          absolute top-[130px] right-[50px] w-[360px] max-w-[calc(100%-32px)]
          flex items-center gap-4 overflow-hidden
          pl-4 pr-12 py-4 rounded-2xl border font-nunito
          shadow-[0_12px_32px_rgba(15,23,42,0.14)]
          pointer-events-auto
          ${tone.card}
          ${stateClass}
        `}
      >
        {/* Soft decorative blob behind the icon */}
        <span className={`pointer-events-none absolute -left-6 -bottom-8 w-24 h-24 rounded-full ${tone.blob}`} />

        <div className={`relative shrink-0 w-11 h-11 rounded-full grid place-items-center text-white shadow-md ${tone.badge}`}>
          <Icon size={22} strokeWidth={2.75} />
        </div>

        <div className="relative flex-1 min-w-0">
          <p className="text-[16px] font-bold leading-tight text-[#1E293B]">{toast.message?.title}</p>
          {toast.message?.descrip && (
            <p className="mt-1 text-[14px] leading-snug text-[#475569] break-words">{toast.message.descrip}</p>
          )}
        </div>

        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => dispatch(clearAllToasts())}
          className="absolute top-3 right-3 w-7 h-7 rounded-full grid place-items-center text-[#94A3B8] hover:text-[#475569] hover:bg-white/70 transition cursor-pointer"
        >
          <X size={16} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}