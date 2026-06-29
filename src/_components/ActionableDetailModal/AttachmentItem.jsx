// AttachmentItem.jsx
import { BsCheck } from "react-icons/bs";

export default function AttachmentItem({
  attachment,
  taskId,
  editingId,
  editingUrl,
  setEditingId,
  setEditingUrl,
  onToggle,
  onDelete,
  onCommitEdit,
  canEditOrDelete,
}) {
  return (
    <div className="flex items-center gap-[10px]">
      {/* Checkbox */}
      {/* <div
        className={`h-[30px] flex items-center ${
          !canEditOrDelete && "pointer-events-none"
        }`}
      >
        {attachment.isOptimistic ? (
          <span className="loader"></span>
        ) : (
          <div
            onClick={() =>
              canEditOrDelete && onToggle(taskId, attachment)
            }
            className={`h-[18px] w-[18px] rounded-[4px] border-[2px] flex items-center justify-center cursor-pointer transition-colors
              ${
                attachment.isCompleted
                  ? `${
                      canEditOrDelete
                        ? "bg-[#E72D38] border-[#E72D38]"
                        : "bg-[#999999] border-[#999999]"
                    }`
                  : "border-[#999999] bg-transparent"
              }`}
          >
            {attachment.isCompleted && (
              <BsCheck size={18} color="#fff" />
            )}
          </div>
        )}
      </div> */}

      {/* URL / EDIT INPUT */}
      {editingId === attachment._id ? (
        <input
          autoFocus
          type="url"
          value={editingUrl}
          onChange={(e) => setEditingUrl(e.target.value)}
          onBlur={() => onCommitEdit(attachment._id)}
          onKeyDown={(e) =>
            e.key === "Enter" && onCommitEdit(attachment._id)
          }
          className="flex-1 bg-transparent outline-none text-[16px] font-[600] mr-[22px]"
        />
      ) : (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 text-[16px] font-[600] line-clamp-1 mr-[22px] text-[#00449C] underline hover:opacity-80 ${
            attachment.isCompleted ? "line-through" : ""
          }`}
        >
          {attachment.url}
        </a>
      )}

      {/* ACTION ICONS */}
      {canEditOrDelete && (
        <div className="flex gap-[10px]">
          <button
            disabled={attachment?.isOptimistic}
            onClick={() => {
              setEditingId(attachment._id);
              setEditingUrl(attachment.url);
            }}
            className="text-[#666666] cursor-pointer"
          >
            <span className="iconamoon--edit-light"></span>
          </button>

          <button
            disabled={attachment?.isOptimistic}
            onClick={() => onDelete(taskId, attachment._id)}
            className="text-[#666666] cursor-pointer"
          >
            <span className="fluent--delete-16-regular"></span>
          </button>
        </div>
      )}
    </div>
  );
}