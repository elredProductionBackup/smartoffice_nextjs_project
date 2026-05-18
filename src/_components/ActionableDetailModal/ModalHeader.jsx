"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import TitleTooltipHover from "@/_components/UI/TitleTooltipHover";
export default function ModalHeader({
  title,
  addedBy,
  onClose,
  onUpdateTitle,
  canEditOrDelete
}) {
  const titleRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const textareaRef = useRef(null);
  const MAX_CHARS = 1000;
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

  const lineHeight = 44; 
  const maxHeight = lineHeight * 4;

  el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
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

useEffect(() => {
  if (isEditing) return;

  const el = titleRef.current;
  if (!el) return;

  const checkLines = () => {
    const style = window.getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight);

    const lines = Math.round(el.scrollHeight / lineHeight);

    setIsOverflowing(lines > 4);
  };

  checkLines();

  const observer = new ResizeObserver(checkLines);
  observer.observe(el);

  return () => observer.disconnect();
}, [title, isEditing]);

  return (
    <div className="flex flex-col gap-[20px] pt-[40px] px-[20px] pb-[20px] sticky top-[0px] bg-white z-[10]">
      <div className="flex justify-between items-start">
        {/* TITLE */}
        {!isEditing ? (
          <TitleTooltipHover title={isOverflowing ? title : ""}>
            <h2
              ref={titleRef}
              className="text-[32px] font-[700] leading-[44px] text-[#333] mr-[36px] line-clamp-4 break-words"
            >
              {title}
            </h2>
          </TitleTooltipHover>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            maxLength={MAX_CHARS}
            onChange={(e) => {
              const text = e.target.value.slice(0, MAX_CHARS);
              setValue(text);
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
              resize-none overflow-hidden max-h-[176px] mr-[36px]
            "
          />
        )}

        {/* ACTIONS */}
        <div className="absolute right-[20px] top-[40px] flex flex-col gap-[40px]">
          <button
            onClick={onClose}
            className="h-[24px] min-w-[24px] rounded-full grid place-items-center bg-[#eee] text-[#999999] cursor-pointer"
          >
            <span className="akar-icons--cross small-cross" />
          </button>

          {!isEditing && canEditOrDelete && (
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
        <Image src={addedBy?.dpURL || `/logo/user-icon.svg`} alt="Created By Image" width={32} height={32} className="w-[32px] h-[32px] rounded-full bg-[#ccc]"/>
        <span className="font-[600] capitalize">{addedBy?.name}</span>
      </div>
    </div>
  );
}
