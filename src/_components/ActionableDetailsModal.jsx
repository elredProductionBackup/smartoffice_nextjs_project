"use client";

import ModalHeader from "./ActionableDetailModal/ModalHeader";
import SubtaskSection from "./ActionableDetailModal/SubtaskSection";
import NotesSection from "./ActionableDetailModal/NotesSection";
import CommentsSection from "./ActionableDetailModal/CommentsSection";
import FooterActions from "./ActionableDetailModal/FooterActions";
import CollaboratorSection from "./ActionableDetailModal/CollaboratorSection";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createComment, removeComment } from "@/store/actionable/actionableThunks";
import Image from "next/image";

export default function ActionableDetailsModal({
  task, onClose, onSave, onAddSubtask,
  onToggleSubtask, onUpdateSubtask,
  onDeleteSubtask,
}) {
  if (!task) return null;

  const dispatch = useDispatch();

  const [draft, setDraft] = useState({
    title: task.title,
    collaborators: task.collaborators || [],
    notes: task.notes || "",
    // comments: task.comments || [],
  });

useEffect(() => {
  setDraft({
    title: task.title,
    collaborators: task.collaborators || [],
    notes: task.notes || "",
    // comments: task.comments || [],
  });
}, [task.actionableId]);


  const actionable = useSelector((state) =>
    state.actionable.items.find((i) => i.actionableId === task.actionableId)
  );

  if (!actionable) return null;

  const handleSave = () => {
    onSave(task.actionableId, {
      title: draft.title,
      notes: draft.notes,
      collaborators: draft.collaborators,
    });

    onClose();
  };

  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.userType?.toLowerCase() === "admin";

  const canEditOrDelete = isAdmin;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-[600px] max-h-[90vh] rounded-[20px] px-[20px] flex flex-col gap-[20px] overflow-y-auto"
      >
        <ModalHeader
          title={draft.title}
          addedBy={actionable.createdBy}
          onClose={onClose}
          onUpdateTitle={(title) =>
            setDraft((prev) => ({
              ...prev,
              title,
            }))
          }
          canEditOrDelete={canEditOrDelete}
        />

        {/* Link to Event (Disabled) */}
         <div className="flex flex-col gap-[12px] opacity-50 px-[20px]">
           <span className="text-[20px] text-[#333333] font-[700] uppercase">
             Link to event
           </span>
           <div className="flex border-[1.4px] border-[#CCCCCC] rounded-[4px] p-[8px] cursor-not-allowed">
             <div className="flex items-center gap-[6px] border-1 border-[#B1B1B1] p-[4px] text-[14px] rounded-[100px]">
               <Image src={'/image/figma-config.webp'} alt="Events" height={24} width={24} className="min-h-[24px] max-h-[24px] shrink-0 min-w-[24px] bg-[#CCCCCC] rounded-full object-cover"/>
               Figma Config <span className="akar-icons--cross small-cross mr-[10px]"></span></div>
           </div>
         </div>

        <SubtaskSection
          task={actionable}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onUpdateSubtask={onUpdateSubtask}
          onDeleteSubtask={onDeleteSubtask}
          canEditOrDelete={canEditOrDelete}
        />
        <CollaboratorSection 
          task={actionable}
          collaborators={draft.collaborators}
          onChange={(collaborators) =>
            setDraft({ ...draft, collaborators })
          }
          canEditOrDelete={canEditOrDelete}
          />
        <NotesSection
          value={draft.notes}
          onChange={(notes) =>
            setDraft((prev) => ({
              ...prev,
              notes,
            }))
          }
          canEditOrDelete={canEditOrDelete}
        />
        <CommentsSection
          comments={actionable.comments}
          onAdd={(value,user) => {
            const tempId = `temp-comment-${Date.now()}`;

            dispatch(
              createComment({
                tempId,
                actionableId: actionable.actionableId,
                comment: value,
                user:user
              })
            );
          }}
          onDelete={(id) =>
            dispatch(
              removeComment({
                actionableId: actionable.actionableId,
                commentId: id,
              })
            )
          }
          canEditOrDelete={canEditOrDelete}
        />
        {canEditOrDelete && <FooterActions onClose={onClose} onSave={handleSave}/>}
      </div>
    </div>
  );
}
