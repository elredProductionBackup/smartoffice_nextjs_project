import { useEffect, useRef } from "react";

export default function NotesSection({ value, onChange }) {
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "22px";
    el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <div className="flex flex-col gap-[12px] pt-[20px] px-[20px]">
      <span className="text-[20px] text-[#333333] font-[700] uppercase">
        Notes
      </span>

      <textarea
        ref={textareaRef}
        value={value}
        placeholder="Write your notes here"
        rows={1}
        className="
          border-transparent
          min-h-[22px]
          max-h-[88px]
          overflow-y-auto
          outline-none
          text-[16px]
          font-[600]
          resize-none
        "
        onChange={(e) => onChange(e.target.value)}
        onInput={adjustHeight}
      />
    </div>
  );
}
