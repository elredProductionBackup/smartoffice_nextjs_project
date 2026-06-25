import { BsCheck } from "react-icons/bs";

export default function SubtaskItem({
  subtask, taskId, editingId, editingValue, setEditingId,
  setEditingValue, onToggle, onDelete, onCommitEdit, canEditOrDelete}) {
  return (
    <div className="flex items-center gap-[10px]">
      {/* Checkbox */}
      <div className={`h-[30px] flex items-center ${!canEditOrDelete && 'pointer-events-none'}`} >
        {subtask.isOptimistic ?<span className="loader"></span>:
        <div
          onClick={() => canEditOrDelete && onToggle(taskId, subtask)} 
          className={`h-[18px] w-[18px] rounded-[4px] border-[2px] flex items-center justify-center cursor-pointer transition-colors
                     ${subtask.isCompleted
              ? `${canEditOrDelete?`bg-[#E72D38] border-[#E72D38]`:`bg-[#999999] border-[#999999]`}`
              : "border-[#999999] bg-transparent"
            }
                   `}
        >
          {subtask.isCompleted && <BsCheck size={18} color="#fff" />}
        </div>}
      </div>

      {/* TEXT / EDIT INPUT */}
      {editingId === subtask._id ? (
        <input
          autoFocus
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={() => onCommitEdit(subtask._id)}
          onKeyDown={(e) => e.key === "Enter" && onCommitEdit(subtask._id)}
          className="flex-1 bg-transparent outline-none text-[16px] font-[600] mr-[22px]"
        />
      ) : (
        <span
          className={`flex-1 text-[16px] font-[600] line-clamp-1 mr-[22px] ${subtask.isCompleted ? "line-through " : ""
            }`}
        >
          {subtask.title}
        </span>
      )}

      {/* ACTION ICONS */}
        {canEditOrDelete &&
      <div className="flex gap-[10px] ">
          <button
            disabled={subtask?.isOptimistic}
            onClick={() => {
              setEditingId(subtask._id);
              setEditingValue(subtask.title);
            }}
            className="text-[#666666] cursor-pointer"
          >
            <span className="iconamoon--edit-light"></span>
          </button>

          <button
            disabled={subtask?.isOptimistic}
            onClick={() => onDelete(taskId, subtask._id)}
            className="text-[#666666] cursor-pointer"
          >
            <span className="fluent--delete-16-regular"></span>
          </button>
      </div>
        }

    </div>
  );
}