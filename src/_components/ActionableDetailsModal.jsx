"use client";

import { useState } from "react";
import moment from "moment";

export default function ActionableDetailsModal({
  task,
  onClose,
  onAddSubtask,
}) {
  const [value, setValue] = useState("");

  if (!task) return null;

  const submit = () => {
    if (!value.trim()) return;

    onAddSubtask(task.id, {
      text: value.trim(),
      addedBy: "Meezan",
      time: moment().format("hh:mm A"),
      createdAt: new Date().toISOString(),
    });

    setValue("");
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-[600px] max-h-[600px] rounded-[20px] p-[24px] flex flex-col gap-[16px] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-[22px] font-[600]">{task.text}</h2>
          <button onClick={onClose} className="text-[18px]">✕</button>
        </div>

        {/* Meta */}
        {/* {task.addedBy && task.time && (
          <div className="text-[14px] text-[#666]">
            {task.addedBy} | {task.time.toLowerCase()} IST
          </div>
        )} */}

        {/* Subtasks */}
        <div className="flex flex-col gap-[10px] mt-[10px]">
          <h4 className="text-[18px] font-[600]">Subtasks</h4>

          {task.subtasks?.length > 0 ? (
            task.subtasks.map((s) => (
              <div
                key={s.id}
                className={`text-[16px] ${
                  s.completed ? "line-through text-[#999]" : ""
                }`}
              >
                • {s.text}
                <div className="text-[12px] text-[#777]">
                  {s.addedBy} | {moment(s.createdAt).format("hh:mm a")} IST
                </div>
              </div>
            ))
          ) : (
            <div className="text-[14px] text-[#999]">
              No subtasks yet
            </div>
          )}
        </div>

        {/* Add Subtask */}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 60))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add subtask"
          className="border px-[12px] py-[10px] rounded-[10px] text-[16px]"
        />
      </div>
    </div>
  );
}
