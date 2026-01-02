import { useState } from "react";
import ActionItem from "./ActionItem";
import EmptyState from "./EmptyState";

export default function TodayItems({ items, adding, onAdd, onToggle, onCancelAdding, onOpen }) {
  const MAX_CHARS = 60;
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim().slice(0, MAX_CHARS);

    if (!trimmed) {
      setValue("");
      onCancelAdding?.();
      return;
    }

    onAdd(trimmed);
    setValue("");
    onCancelAdding?.();
  };


  const autoResize = (e) => {
    const text = e.target.value.slice(0, MAX_CHARS);
    setValue(text);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };


  return (
    <div className="flex flex-col gap-[20px] w-full">
      {/* Show input only when adding */}
      {adding && (
        <div className="flex gap-[14px] border-b border-[#D4DFF1] pb-[20px]">
          <div className="h-[18px] w-[18px] rounded-[4px] border-2 border-[#666] mt-[6px]" />

          <input
            autoFocus
            rows={1}
            value={value}
            onChange={autoResize}
            onBlur={submit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Add an action item"
            className="bg-transparent outline-none resize-none text-[20px] w-[55%]"
          />
        </div>
      )}
      {/* Show tasks if exist */}
      {items.length > 0 ? (
        items.map((item) => (
        <ActionItem
          key={item.actionableId}
          item={item}
          onCheck={() => onToggle(item.actionableId)}
          onOpen={() => onOpen(item)}
          today
        />
        ))
      ) : (
        !adding && <EmptyState />
      )}

    </div>
  );
}
