// AttachmentSection.jsx
import { useState } from "react";
import AttachmentItem from "./AttachmentItem";

export default function AttachmentSection({
  task,
  onAddAttachment,
  onToggleAttachment,
  onUpdateAttachment,
  onDeleteAttachment,
  canEditOrDelete,
}) {
  const [showInput, setShowInput] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingUrl, setEditingUrl] = useState("");

  const commitAdd = () => {
    if (!attachmentUrl.trim()) return setShowInput(false);

    onAddAttachment(task.actionableId, attachmentUrl.trim());

    setAttachmentUrl("");
    setShowInput(false);
  };

  const commitEdit = (attachmentId) => {
    if (!editingUrl.trim()) return setEditingId(null);

    onUpdateAttachment(
      task.actionableId,
      attachmentId,
      editingUrl.trim()
    );

    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-[12px] pt-[20px] px-[20px]">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-[10px] text-[20px] text-[#333333]">
          <span className="uppercase font-[700]">Attachments</span>

          <span className="text-[14px] font-[500]">
            {/* (Max. 10 attachments can be added) */}
          </span>
        </span>

        {canEditOrDelete && (
          <button
            disabled={task.attachments?.length >= 10 || showInput}
            onClick={() => setShowInput(true)}
            className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-white text-[24px]
              ${
                (task.attachments?.length || 0) >= 10
                  ? "cursor-not-allowed bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] opacity-50"
                  : "bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer"
              }`}
          >
            +
          </button>
        )}
      </div>

      {showInput && (
        <div className="flex items-center gap-[10px]">
          {/* Disabled checkbox */}
          <div className="h-[30px] w-[18px] flex items-center">
            <span className="meteor-icons--link"></span>
            {/* <div className="h-[18px] w-[18px] rounded-[4px] border-[2px] border-[#999999]" /> */}
          </div>

          {/* URL input */}
          <input
            autoFocus
            type="url"
            value={attachmentUrl}
            placeholder="Add a new link"
            onChange={(e) => setAttachmentUrl(e.target.value)}
            onBlur={commitAdd}
            onKeyDown={(e) => e.key === "Enter" && commitAdd()}
            className="flex-1 outline-none text-[16px] font-[600] mr-[90px]"
          />
        </div>
      )}

      {task.attachments?.map((attachment) => (
        <AttachmentItem
          key={attachment.clientId || attachment._id}
          attachment={attachment}
          taskId={task.actionableId}
          editingId={editingId}
          editingUrl={editingUrl}
          setEditingId={setEditingId}
          setEditingUrl={setEditingUrl}
          onToggle={onToggleAttachment}
          onDelete={onDeleteAttachment}
          onCommitEdit={commitEdit}
          canEditOrDelete={canEditOrDelete}
        />
      ))}
    </div>
  );
}