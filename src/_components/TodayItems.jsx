import { useState } from "react";
import ActionItem from "./ActionItem";

export default function TodayItems({ items, adding, onAdd }) {
  const [value, setValue] = useState("");

  const submit = () => {
    onAdd(value);
    setValue("");
  };

  const autoResize = (e) => {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col gap-[20px] w-[100%]">
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
            className="bg-transparent outline-none resize-none text-[20px] w-[65%]"
          />
        </div>
      )}

      {items.map((item) => (
        <ActionItem key={item.id} {...item} />
      ))}
    </div>
  );
}
