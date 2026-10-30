"use client";

import { useState } from "react";

export default function ChecklistFormModal({ mode, item, index, onSubmit, onClose }) {
  const [label, setLabel] = useState(item?.label || "");
  const [difficulty, setDifficulty] = useState(
    item?.difficulty || ""
  );

  const handleSubmit = () => {
    if (!label.trim() || !difficulty) return;
    onSubmit(
      { label: label.trim(), difficulty },
      mode,
      index
    );
  };
  
  // Values the edit started from (derived from props instead of copied into state by an effect)
  const original =
    mode === "edit" && item
      ? { label: item.label || "", difficulty: item.difficulty || "" }
      : { label: "", difficulty: "" };

  const isChanged =
  label.trim() !== original.label.trim() ||
  difficulty !== original.difficulty;

  const isFormInvalid =
  !difficulty || !label.trim() || (mode === "edit" && !isChanged);

  return (
    <div className="w-[calc(100vw-32px)] max-w-[520px] max-h-[90dvh] md:max-h-none overflow-y-auto bg-white rounded-[14px] shadow-xl p-6 md:p-[40px] flex flex-col gap-4 md:gap-[20px]">
        <h3 className="text-[20px] md:text-[24px] font-[700]">
            {mode === "add" ? "Add new item" : "Update item"}
        </h3>

        <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter name"
            className="border border-[#CCCCCC] rounded-[8px] px-4 md:px-[20px] py-[10px] outline-none"
        />

    <div className="flex flex-col gap-[14px]">
    <p className="text-[16px] md:text-[18px] font-[700]">
        Choose difficulty level
    </p>

    {[
        { key: "hard", label: "Very difficult", color: "bg-red-500" },
        { key: "medium", label: "Mildly difficult", color: "bg-yellow-400" },
        { key: "easy", label: "Easy to do", color: "bg-green-500" },
    ].map((d) => {
        const active = difficulty === d.key;

        return (
        <button
            key={d.key}
            type="button"
            onClick={() => setDifficulty(d.key)}
            className={`flex items-center justify-between gap-3 min-h-[36px] md:min-h-0 cursor-pointer`}
        >
            {/* LEFT */}
            <div className="flex items-center gap-[12px]">
            {/* Custom Radio */}
            <div
                className={`min-h-[20px] min-w-[20px] rounded-full ${active ? `border-[6px]`:'border-[2px]'} flex items-center justify-center
                ${
                    active
                    ? "border-[#147BFF]"
                    : "border-[#999999]"
                }
                `}
            >
            </div>

            <span className="text-[17px] md:text-[20px] font-[500] text-left">
                {d.label}
            </span>
            </div>

            <span
            className={`h-[12px] w-[50px] shrink-0 rounded-full ${d.color}`}
            />
        </button>
        );
    })}
    </div>

      <div className="flex justify-center gap-4 md:gap-[80px] mt-[10px]">
        <button onClick={onClose} className="rounded-full text-[20px] bg-[#999999] px-6 py-2 text-white w-[120px] cursor-pointer" >Cancel</button>
        <button
            onClick={handleSubmit}
            disabled={isFormInvalid}
            className={`rounded-full text-[20px] w-[120px] px-[16px] py-[8px] text-white transition bg-gradient-to-r from-[#5597ED] to-[#00449C] 
              ${isFormInvalid ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
          {mode === "add" ? "Add" : "Save"}
        </button>
      </div>
    </div>
  );
}
