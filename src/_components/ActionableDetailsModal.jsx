"use client";

import ModalHeader from "./ActionableDetailModal/ModalHeader";
import SubtaskSection from "./ActionableDetailModal/SubtaskSection";
import NotesSection from "./ActionableDetailModal/NotesSection";
import CommentsSection from "./ActionableDetailModal/CommentsSection";
import FooterActions from "./ActionableDetailModal/FooterActions";
import CollaboratorSection from "./ActionableDetailModal/CollaboratorSection";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createComment, fetchComments, removeComment } from "@/store/actionable/actionableThunks";
import Image from "next/image";
import AttachmentSection from "./ActionableDetailModal/AttachmentSection";

export default function ActionableDetailsModal({
  task, onClose, onSave, onAddSubtask,
  onToggleSubtask, onUpdateSubtask,
  onDeleteSubtask, onAddComment,
  onDeleteComment, hideLinkEvent,
  canEdit, onAddAttachment, onUpdateAttachment,
  onDeleteAttachment
}) {
  if (!task) return null;

  const scrollRef = useRef(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const dispatch = useDispatch();

  const [draft, setDraft] = useState({
    title: task.title,
    collaborators: task.collaborators || [],
    notes: task.notes || "",
  });

const commentsState = useSelector(
  (state) =>
    state.actionable.comments.byActionableId[task.actionableId]
) || {
  list: task.comments || [],
  page: 1,
  total: task.comments?.length || 0,
  hasMore: false,
  loading: false,
};


useEffect(() => {
  setDraft({
    title: task.title,
    collaborators: task.collaborators || [],
    notes: task.notes || "",
  });
}, [task.actionableId]);


  const reduxActionable = useSelector((state) =>
    state.actionable.items.find((i) => i.actionableId === task.actionableId)
  );

  const actionable = reduxActionable || task;

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

  const canEditOrDelete = canEdit !== undefined ? canEdit : isAdmin;

  // --- Initial fetch ---
  useEffect(() => {
    if (!actionable || task.isLocal) return;
    if (commentsState.page === 0) {
      dispatch(fetchComments({
        actionableId: actionable.actionableId,
        page: 1,
        limit: 10,
      }));
    }
  }, [actionable?.actionableId, task.isLocal]);

  // --- Infinite Scroll ---
  const isFetchingRef = useRef(false);
  const commentsStateRef = useRef(commentsState);

  useEffect(() => {
    commentsStateRef.current = commentsState;
  }, [commentsState]);
useEffect(() => {
  const scrollEl = scrollRef.current;
  if (!scrollEl || !showAllComments || task.isLocal) return;

  const handleScroll = () => {
    const state = commentsStateRef.current;
    const offset = 10;
    const maxPage = Math.ceil(state.total / offset); 

    if (isFetchingRef.current || state.loading || state.page >= maxPage) return;

    const scrollTop = scrollEl.scrollTop;
    const scrollHeight = scrollEl.scrollHeight;
    const clientHeight = scrollEl.clientHeight;

    if (scrollHeight - scrollTop - clientHeight < 50) {
      isFetchingRef.current = true;

      const nextPage = state.page + 1;

      dispatch(fetchComments({
        actionableId: actionable.actionableId,
        page: nextPage,
        limit: offset,
      })).finally(() => {
        isFetchingRef.current = false;
      });
    }
  };

  scrollEl.addEventListener("scroll", handleScroll);
  handleScroll();

  return () => scrollEl.removeEventListener("scroll", handleScroll);
}, [showAllComments, actionable?.actionableId, task.isLocal]);



  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center font-nunito"
      onClick={onClose}
    >
      <div className="bg-white w-[600px] rounded-[20px] flex flex-col items-center pr-[8px]">
        <div
          onClick={(e) => e.stopPropagation()}
           ref={scrollRef}
          id="custom-scroll"
          className="relative w-[100%] max-h-[90vh] rounded-[20px] pl-[20px] pr-[7px] flex flex-col gap-[20px] overflow-y-auto"
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

        {/* Link to Event (Disabled for local tasks) */}
         {!hideLinkEvent && (
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
         )}

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
        <AttachmentSection
          task={actionable}
          onAddSubtask={onAddAttachment}
          onToggleSubtask={onToggleSubtask}
          onUpdateSubtask={onUpdateAttachment}
          onDeleteSubtask={onDeleteAttachment}
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
            comments={commentsState.list}
            total={commentsState.total}
            loading={commentsState.loading}
            hasMore={commentsState.hasMore}
            // loadMoreRef={loadMoreRef}
            showAll={showAllComments}
            setShowAll={setShowAllComments}
            canEditOrDelete={canEditOrDelete}
            onAdd={(value, user) => {
              if (onAddComment) {
                onAddComment(actionable.actionableId, value);
              } else {
                const tempId = `temp-comment-${Date.now()}`;
                dispatch(createComment({
                  tempId,
                  actionableId: actionable.actionableId,
                  comment: value,
                  user,
                }));
              }
            }}
            onDelete={(id) => {
              if (onDeleteComment) {
                onDeleteComment(actionable.actionableId, id);
              } else {
                dispatch(removeComment({
                  actionableId: actionable.actionableId,
                  commentId: id,
                }));
              }
            }}
          />


        {canEditOrDelete && <FooterActions onClose={onClose} onSave={handleSave}/>}
      </div>
      </div>
    </div>
  );
}

