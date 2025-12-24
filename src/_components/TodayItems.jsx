import { useState } from "react";
import ActionItem from "./ActionItem";
import EmptyState from "./EmptyState";

export default function TodayItems({ items, adding, onAdd, onToggle, onCancelAdding }) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim()) {
      setValue(""); // clear input
      onCancelAdding?.(); // notify parent to hide input
      return;
    }

    onAdd(value);
    setValue("");
    onCancelAdding?.(); // hide input after adding
  };

  const autoResize = (e) => {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col gap-[20px] w-full">
      {/* Show input only when adding */}
      {adding && (
        <div className="flex gap-[14px] border-b border-[#D4DFF1] pb-[20px]">
          <div className="h-[18px] w-[18px] rounded-[4px] border-2 border-[#666] mt-[6px]" />

          <textarea
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
            key={item.id}
            {...item}
            completed={false}
            onCheck={() => onToggle(item.id)}
            today
          />
        ))
      ) : (
        // Show empty state only if not adding
        !adding && <EmptyState />
      )}
    </div>
  );
}
