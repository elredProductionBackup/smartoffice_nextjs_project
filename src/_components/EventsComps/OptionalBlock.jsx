"use client";

import { useEffect, useRef } from "react";
import { FiPlus, FiX } from "react-icons/fi";

// Card for an optional part of the create-event form; the X takes it off the form again
export const OptionalBlock = ({ title, required = false, onRemove, scrollOnMount = false, children }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (scrollOnMount) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [scrollOnMount]);

  return (
    <section ref={ref} className="mt-3 rounded-[18px] bg-white border border-[#E8EBF0] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 -mt-1.5 -mr-2 mb-3">
        <span className="text-[14px] font-[700] text-[#333333]">
          {title}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${title.toLowerCase()}`}
          title={`Remove ${title.toLowerCase()}`}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#8C95A5] cursor-pointer transition-colors hover:bg-[#F2F5F9] hover:text-[#E0242F]"
        >
          <FiX className="text-[18px]" />
        </button>
      </div>
      {children}
    </section>
  );
};

// Dashed "+ Label" chip that adds an optional block
export const AddBlockPill = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 h-[38px] pl-2.5 pr-3.5 rounded-full border border-dashed border-[#BCC3CD] bg-white text-[14px] font-medium text-[#4A5466] cursor-pointer transition-colors hover:border-[#0B57D0] hover:text-[#0B57D0] hover:bg-[#F2F7FF]"
  >
    <FiPlus className="text-[16px]" />
    {label}
  </button>
);
