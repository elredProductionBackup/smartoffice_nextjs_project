import React, { useState } from "react";

const DIFFICULTY_OPTIONS = [
  { key: "hard", label: "Very difficult", color: "bg-red-500" },
  { key: "medium", label: "Mildly difficult", color: "bg-yellow-400" },
  { key: "easy", label: "Easy to do", color: "bg-green-500" },
];

function AddTask({ onClose, onAdd }) {
  const [label, setLabel] = useState("");
  const [difficulty, setDifficulty] = useState("hard"); // default: Very difficult

  const isInvalid = !label.trim() || !difficulty;

  const handleAdd = () => {
    if (isInvalid) return;
    onAdd({ label: label.trim(), difficulty });
    onClose();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onMouseDown={onClose}
    >
      {/* Card – stop propagation so clicks inside don't close */}
      <div
        className="bg-white rounded-[18px] shadow-2xl p-[40px] flex flex-col gap-[20px] w-[520px]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h3 className="text-[24px] font-[700] text-[#222]">Add new item</h3>

        {/* Name input */}
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Enter the task"
          className="border border-[#CCCCCC] rounded-[8px] px-[20px] py-[10px] text-[16px] outline-none focus:border-[#5597ED] transition-colors"
        />

        {/* Difficulty section */}
        <div className="flex flex-col gap-[14px]">
          <p className="text-[18px] font-[700] text-[#222]">
            Choose difficulty level
          </p>

          {DIFFICULTY_OPTIONS.map((d) => {
            const active = difficulty === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setDifficulty(d.key)}
                className="flex items-center justify-between cursor-pointer w-full"
              >
                {/* Left: radio + label */}
                <div className="flex items-center gap-[12px]">
                  {/* Custom radio circle */}
                  <div
                    className={`min-h-[20px] min-w-[20px] rounded-full flex items-center justify-center transition-all ${active
                        ? "border-[6px] border-[#147BFF]"
                        : "border-[2px] border-[#999999]"
                      }`}
                  />
                  <span className="text-[20px] font-[500] text-[#333]">
                    {d.label}
                  </span>
                </div>

                {/* Right: color pill */}
                <span className={`h-[12px] w-[50px] rounded-full ${d.color}`} />
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-[80px] mt-[10px]">
          <button
            onClick={onClose}
            className="rounded-full text-[20px] bg-[#999999] px-6 py-2 text-white w-[120px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={isInvalid}
            className={`rounded-full text-[20px] w-[120px] px-[16px] py-[8px] text-white transition bg-gradient-to-r from-[#5597ED] to-[#00449C] ${isInvalid ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddTask;
