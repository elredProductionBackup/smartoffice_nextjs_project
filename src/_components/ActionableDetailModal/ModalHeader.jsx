"use client";
import { useEffect, useRef, useState } from "react";

export default function ModalHeader({
  title,
  addedBy,
  onClose,
  onUpdateTitle,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const textareaRef = useRef(null);

  useEffect(() => {
    setValue(title);
  }, [title]);

useEffect(() => {
  if (isEditing && textareaRef.current) {
    const el = textareaRef.current;

    el.focus();

    const length = el.value.length;
    el.setSelectionRange(length, length);

    autoResize();

    el.scrollTop = el.scrollHeight;
  }
}, [isEditing]);


  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 88) + "px";
  };

  const save = () => {
    if (value.trim()) {
      onUpdateTitle(value.trim());
    } else {
      setValue(title);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setValue(title);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-[20px] pt-[40px] pb-[20px] sticky top-[0px] bg-white z-[2]">
      <div className="flex justify-between items-start">
        {/* TITLE */}
        {!isEditing ? (
          <h2 className="text-[32px] font-[700] leading-[44px] text-[#333] mr-[36px]">
            {title}
          </h2>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            onChange={(e) => {
              setValue(e.target.value);
              autoResize();
            }}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") cancel();
            }}
            className="
              text-[32px] font-[700] leading-[44px] text-[#333]
              border-none outline-none bg-transparent w-full
              resize-none overflow-hidden max-h-[88px] mr-[36px]
            "
          />
        )}

        {/* ACTIONS */}
        <div className="absolute right-[0px] top-[40px] flex flex-col gap-[40px]">
          <button
            onClick={onClose}
            className="h-[24px] min-w-[24px] rounded-full grid place-items-center bg-[#eee] text-[#999999]"
          >
            <span className="akar-icons--cross small-cross" />
          </button>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-[#666] cursor-pointer"
            >
              <span className="iconamoon--edit-light" />
            </button>
          )}
        </div>
      </div>

      {/* ADDED BY */}
      <div className="flex items-center gap-[10px]">
        <div className="w-[32px] h-[32px] rounded-full bg-[#ccc]" />
        <span className="font-[600]">{addedBy}</span>
      </div>
    </div>
  );
}
