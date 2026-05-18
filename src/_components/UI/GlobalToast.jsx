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
        className={`
          absolute top-[130px] right-[50px] flex items-center gap-[12px]
          min-w-[500px] max-w-[500px] max-w-[95%]
          p-[12px] rounded-[12px]
          text-[#F3F3F3]
          bg-[#3A3A3C]
          pointer-events-auto
          ${stateClass}
        `}
      >
        {/* TEXT */}
        <div className="text-[#F12632] grid place-items-center ml-[4px]">
          <span className="lucide--file-x"></span>
        </div>
        <div className="flex-1 flex flex-col gap-[4px]">
          <div className="text-[16px] font-[500] text-[#F12632]">
            {toast.message?.title}
          </div>
          <div className="text-[12px]">
            {toast.message?.descrip}
          </div>
        </div>

        <button
          onClick={() => dispatch(clearAllToasts())}
          className="absolute top-[12px] right-[12px] cursor-pointer"
        >
          <span className="akar-icons--cross regular"></span>
        </button>
      </div>
    </div>
  );
}