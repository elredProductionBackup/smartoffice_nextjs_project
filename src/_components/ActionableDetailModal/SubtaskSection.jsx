import { useState } from "react";
import SubtaskItem from "./SubtaskItem";

export default function SubtaskSection({
  task,
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}) {
  const [showInput, setShowInput] = useState(false);
  const [value, setValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const commitAdd = () => {
    if (!value.trim()) return setShowInput(false);
    onAddSubtask(task.actionableId, value.trim());
    setValue("");
    setShowInput(false);
  };

  const commitEdit = (subtaskId) => {
    if (!editingValue.trim()) return setEditingId(null);
    onUpdateSubtask(task.actionableId, subtaskId, editingValue.trim());
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-[12px] pt-[20px]">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-[10px] text-[20px] text-[#333333]">
           <span className="uppercase font-[700]">Subtask</span> <span className="text-[14px] font-[500]">(Max. 10 subtask can be added)</span>
        </span>
        <button
          disabled={task.subTask?.length >= 10}
          onClick={() => setShowInput(true)}
          className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-white text-[24px] cursor-pointer
               ${
                 (task.subTask?.length || 0) >= 10
                   ? "cursor-not-allowed"
                   : "bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)]"
               }`}
        >
          +
        </button>
      </div>

      {showInput && (
              <div className="flex items-center gap-[10px]">
              {/* Disabled checkbox */}
              <div className="h-[30px] flex items-center" >
                <div
                onClick={() => onToggleSubtask(task?.actionableId, subtask)}
                  className={`h-[18px] w-[18px] rounded-[4px] border-[2px] flex items-center justify-center cursor-pointer border-[#999999] bg-transparent`}
                >
                </div>
              </div>

              {/* Borderless input */}
              <input
                autoFocus
                value={value}
                placeholder="Add a new subtask"
                onChange={(e) => setValue(e.target.value)}
                onBlur={commitAdd} 
                 onKeyDown={(e) => e.key === "Enter" && commitAdd()}
                className="flex-1 outline-none text-[16px] font-[600] mr-[90px]"
              />
            </div>
      )}

      {task.subTask?.map((s) => (
        <SubtaskItem
          key={s.clientId || s._id} 
          subtask={s}
          taskId={task.actionableId}
          editingId={editingId}
          editingValue={editingValue}
          setEditingId={setEditingId}
          setEditingValue={setEditingValue}
          onToggle={onToggleSubtask}
          onDelete={onDeleteSubtask}
          onCommitEdit={commitEdit}
        />
      ))}
    </div>
  );
}
