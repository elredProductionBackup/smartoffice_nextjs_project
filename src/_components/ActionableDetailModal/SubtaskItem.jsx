import { BsCheck } from "react-icons/bs";

export default function SubtaskItem({
  subtask,
  taskId,
  editingId,
  editingValue,
  setEditingId,
  setEditingValue,
  onToggle,
  onDelete,
  onCommitEdit,
}) {
  return (
    <div className="flex items-center gap-[10px]">
      {/* Checkbox */}
      <div className="h-[30px] flex items-center" >
        <div
          onClick={() => onToggle(taskId, subtask.id)}
          className={`h-[18px] w-[18px] rounded-[4px] border-[2px] flex items-center justify-center cursor-pointer transition-colors
                     ${subtask.completed
              ? "bg-[#E72D38] border-[#E72D38]"
              : "border-[#999999] bg-transparent"
            }
                   `}
        >
          {subtask.completed && <BsCheck size={18} color="#fff" />}
        </div>
      </div>

      {/* TEXT / EDIT INPUT */}
      {editingId === subtask.id ? (
        <input
          autoFocus
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={() => onCommitEdit(subtask.id)}
          onKeyDown={(e) => e.key === "Enter" && onCommitEdit(subtask.id)}
          className="flex-1 bg-transparent outline-none text-[16px] font-[600] mr-[22px]"
        />
      ) : (
        <span
          className={`flex-1 text-[16px] font-[600] line-clamp-1 mr-[22px] ${subtask.completed ? "line-through " : ""
            }`}
        >
          {subtask.text}
        </span>
      )}

      {/* ACTION ICONS */}
      <div className="flex gap-[10px] ">
        {/* Edit */}
        <button
          onClick={() => {
            setEditingId(subtask.id);
            setEditingValue(subtask.text);
          }}
          className="text-[#666666] cursor-pointer"
        >
          <span className="iconamoon--edit-light"></span>
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(taskId, subtask.id)}
          className="text-[#666666] cursor-pointer"
        >
          <span className="fluent--delete-16-regular"></span>
        </button>
      </div>

    </div>
  );
}