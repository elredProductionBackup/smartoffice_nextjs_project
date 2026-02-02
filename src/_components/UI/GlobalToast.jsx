"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  mountToast,
  hideToast,
  removeToast,
  clearAllToasts,
} from "@/store/toastSlice";
import { useEffect } from "react";
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
        dispatch(clearAllToasts());
    }, [pathname]);

     if (!toast) return null;

  const stateClass = toast.hiding
    ? "opacity-0 -translate-y-6 transition-all duration-200"
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
        className={`
          absolute top-[130px] right-[50px] flex items-start gap-4
          min-w-[500px] max-w-[500px] max-w-[95%]
          px-6 py-4 rounded-xl
          text-white shadow-2xl
          bg-[#2b2b2e]
          pointer-events-auto
          ${stateClass}
        `}
      >
        {/* TEXT */}
        <div className="flex-1">
          <div className="text-[18px] font-semibold text-red-400">
            {toast.message?.title}
          </div>
          <div className="text-[14px] text-white/80 mt-1">
            {toast.message?.descrip}
          </div>
        </div>

        <button
          onClick={() => dispatch(clearAllToasts())}
          className="absolute top-3 right-3 text-white/60 hover:text-white text-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
}