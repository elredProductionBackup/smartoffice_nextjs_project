// "use client";

// import { useState } from "react";
// import moment from "moment";
// import { BsCheck } from "react-icons/bs";

// export default function ActionableDetailsModal({
//   task,
//   onClose,
//   onAddSubtask,
//   onToggleSubtask,
//   onUpdateSubtask,
//   onDeleteSubtask
// }) {
//   const [showSubtaskInput, setShowSubtaskInput] = useState(false);
//   const [subtaskValue, setSubtaskValue] = useState("");
//   const [editingSubtaskId, setEditingSubtaskId] = useState(null);
//   const [editingValue, setEditingValue] = useState("");


//   if (!task) return null;

// const commitSubtask = () => {
//   const value = subtaskValue.trim();

//   if (!value) {
//     setShowSubtaskInput(false);
//     return;
//   }

//   if ((task.subtasks?.length || 0) >= 10) {
//     setShowSubtaskInput(false);
//     return;
//   }

//   onAddSubtask(task.id, value);

//   setSubtaskValue("");
//   setShowSubtaskInput(false);
// };

// const commitEdit = (taskId, subtaskId) => {
//   const value = editingValue.trim();

//   if (!value) {
//     setEditingSubtaskId(null);
//     return;
//   }

//   onUpdateSubtask(taskId, subtaskId, value);

//   setEditingSubtaskId(null);
//   setEditingValue("");
// };




//   return (
//     <div
//       className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
//       onClick={onClose}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         className="relative bg-white w-[600px] max-h-[90vh] rounded-[20px] px-[40px] flex flex-col gap-[20px] overflow-y-auto"
//       >
//         <div className="sticky top-[0] w-[100%] pt-[40px] pb-[20px]  flex flex-col gap-[20px] bg-[#FFFFFF] z-[5]">
//           {/* Header */}
//           <div className="flex justify-between items-start">
//             <h2 className="text-[32px] font-[700] leading-[44px] text-[#333333] mr-[36px]">
//               {task.text}
//             </h2>
//             <div className="absolute right-[0px] top-[40px] flex flex-col gap-[40px]">
//               <button onClick={onClose} className="h-[24px] min-w-[24px] rounded-full grid place-items-center bg-[#eee] text-[#999999] cursor-pointer"><span className="akar-icons--cross small-cross"></span></button>
//               <button className="text-[#666666] cursor-pointer">
//                 <span className="iconamoon--edit-light"></span>
//               </button>
//             </div>
//           </div>

//           {/* Created By */}
//           <div className="flex items-center gap-[10px]">
//             <div className="w-[32px] h-[32px] rounded-full bg-[#CCCCCC]" />
//             <span className="text-[#333333] font-[600]">
//               {task.addedBy}
//             </span>
//           </div>

//         </div>

//         {/* Link to Event (Disabled) */}
//         <div className="flex flex-col gap-[12px] opacity-50 pt-[20px]">
//           <span className="text-[20px] text-[#333333] font-[700] uppercase">
//             Link to event
//           </span>
//           <div className="flex border-[1.4px] border-[#CCCCCC] rounded-[4px] p-[8px] cursor-not-allowed">
//             <div className="flex items-center gap-[6px] border-1 border-[#B1B1B1] p-[4px] text-[14px] rounded-[100px]">
//               <span className="h-[24px] w-[24px] bg-[#CCCCCC] rounded-full"></span> Figma Config <span className="akar-icons--cross small-cross mr-[10px]"></span></div>
//           </div>
//         </div>

//       {/* Subtasks */}
//       <div className="flex flex-col gap-[12px] pt-[20px]">
//         {/* Header */}
//         <div className="flex justify-between items-center ">
//           <span className="flex items-center gap-[10px] text-[20px] text-[#333333]">
//             <span className="uppercase font-[700]">Subtask</span> <span className="text-[14px] font-[500]">(Max. 10 subtask can be added)</span>
//           </span>

//           <button
//             disabled={(task.subtasks?.length || 0) >= 10}
//             onClick={() => {
//               if ((task.subtasks?.length || 0) >= 10) return;
//               setShowSubtaskInput(true);
//               setSubtaskValue("");
//             }}
//             className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-white text-[24px] cursor-pointer
//               ${
//                 (task.subtasks?.length || 0) >= 10
//                   ? "cursor-not-allowed"
//                   : "bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)]"
//               }`}
//           >
//             +
//           </button>

//         </div>

//           {/* Add Subtask Row (TOP) */}
//           {showSubtaskInput && (
//             <div className="flex items-center gap-[10px]">
//               {/* Disabled checkbox */}
//               <div className="h-[30px] flex items-center" >
//                 <div
//                 onClick={() => onToggleSubtask(task.id, s.id)}
//                   className={`h-[18px] w-[18px] rounded-[4px] border-[2px] flex items-center justify-center cursor-pointer border-[#999999] bg-transparent`}
//                 >
//                 </div>
//               </div>

//               {/* Borderless input */}
//               <input
//                 autoFocus
//                 value={subtaskValue}
//                 placeholder="Add a new subtask"
//                 onChange={(e) => setSubtaskValue(e.target.value)}
//                 onBlur={commitSubtask} 
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     e.preventDefault(); 
//                     commitSubtask(); 
//                   }
//                 }}
//                 className="flex-1 outline-none text-[16px] font-[600] mr-[90px]"
//               />
//             </div>
//           )}


//           {/* Checklist */}
//           {task.subtasks?.map((s) => (
//             <div
//               key={s.id}
//               className="flex items-center gap-[10px]"
//             >
//               {/* Checkbox */}
//               <div className="h-[30px] flex items-center" >
//                 <div
//                 onClick={() => onToggleSubtask(task.id, s.id)}
//                   className={`h-[18px] w-[18px] rounded-[4px] border-[2px] flex items-center justify-center cursor-pointer transition-colors
//                     ${
//                       s.completed
//                         ? "bg-[#E72D38] border-[#E72D38]"
//                         : "border-[#999999] bg-transparent"
//                     }
//                   `}
//                 >
//                   {s.completed && <BsCheck size={18} color="#fff" />}
//                 </div>
//               </div>

//               {/* TEXT / EDIT INPUT */}
//               {editingSubtaskId === s.id ? (
//                 <input
//                   autoFocus
//                   value={editingValue}
//                   onChange={(e) => setEditingValue(e.target.value)}
//                   onBlur={() => commitEdit(task.id, s.id)}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") {
//                       e.preventDefault();
//                       commitEdit(task.id, s.id);
//                     }
//                     if (e.key === "Escape") {
//                       setEditingSubtaskId(null);
//                       setEditingValue("");
//                     }
//                   }}
//                   className="flex-1 bg-transparent outline-none text-[16px] font-[600] mr-[22px]"
//                 />
//               ) : (
//                 <span
//                   className={`flex-1 text-[16px] font-[600] line-clamp-1 mr-[22px] ${
//                     s.completed ? "line-through " : ""
//                   }`}
//                 >
//                   {s.text}
//                 </span>
//               )}

//               {/* ACTION ICONS */}
//               <div className="flex gap-[10px] ">
//                 {/* Edit */}
//                 <button
//                   onClick={() => {
//                     setEditingSubtaskId(s.id);
//                     setEditingValue(s.text);
//                   }}
//                   className="text-[#666666] cursor-pointer"
//                 >
//                   <span className="iconamoon--edit-light"></span>
//                 </button>

//                 {/* Delete */}
//                 <button
//                   onClick={() => onDeleteSubtask(task.id, s.id)}
//                   className="text-[#666666] cursor-pointer"
//                 >
//                   <span class="fluent--delete-16-regular"></span>
//                 </button>
//               </div>
//             </div>
//           ))}

//         </div>



//         {/* Collaborators */}
//         <div className="flex flex-col gap-[6px] pt-[20px]">
//           <span className="text-[20px] text-[#333333] font-[700] uppercase">
//             Collaborators
//           </span>
//           <div className="flex border-[1.4px] border-[#CCCCCC] rounded-[4px] p-[8px] min-h-[48px]"></div>
//         </div>

//         {/* Notes */}
//         <div className="flex flex-col gap-[6px] pt-[20px]">
//           <span className="text-[20px] text-[#333333] font-[700] uppercase">
//             Notes
//           </span>
//           <textarea
//             placeholder="Write your notes here"
//             rows={1}
//             className="
//               border-transparent
//               min-h-[22px]
//               max-h-[88px]
//               overflow-y-auto
//               outline-none
//               text-[16px]
//               font-[600]
//               resize-none
//             "
//             onInput={(e) => {
//               const el = e.currentTarget;
//               el.style.height = "22px";              
//               el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
//             }}
//           />
//         </div>

//         {/* Comments */}
//         <div className="flex flex-col gap-[12px] pt-[20px]">
//           <span className="text-[20px] text-[#333333] font-[700] uppercase">
//             Comments
//           </span>

//           <div className="flex gap-[10px] items-center">
//             <div className="w-[32px] h-[32px] rounded-full bg-gray-300" />
//             <input
//               placeholder="Add your comment"
//               className="flex-1 border rounded-[20px] px-[14px] py-[10px] text-[14px]"
//             />
//             <button className="text-white py-[5px] px-[24px] rounded-[100px] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)]">
//               Post
//             </button>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="flex justify-center w-[100%] gap-[60px] pb-[44px] pt-[20px]">
//           <button
//             onClick={onClose}
//             className="w-[150px] py-[8px] rounded-[20px] bg-[#eee]"
//           >
//             Cancel
//           </button>
//           <button className="w-[150px] py-[8px] rounded-[20px] bg-[#eee] text-white bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)]">
//             Save
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import ModalHeader from "./ActionableDetailModal/ModalHeader";
import SubtaskSection from "./ActionableDetailModal/SubtaskSection";
import NotesSection from "./ActionableDetailModal/NotesSection";
import CommentsSection from "./ActionableDetailModal/CommentsSection";
import FooterActions from "./ActionableDetailModal/FooterActions";
import CollaboratorSection from "./ActionableDetailModal/CollaboratorSection";
import { useEffect, useState } from "react";

export default function ActionableDetailsModal({
  task,
  onClose,
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}) {
  if (!task) return null;
    const [draft, setDraft] = useState(task);

  useEffect(() => {
    setDraft(task);
  }, [task]);

  if (!draft) return null;

  const handleSave = () => {
    onSave(draft.id, draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-[600px] max-h-[90vh] rounded-[20px] px-[40px]  flex flex-col gap-[20px] overflow-y-auto"
      >
        <ModalHeader
          title={draft.title}
          addedBy={draft.createdBy?.name}
          onClose={onClose}
          onUpdateTitle={(text) =>
            setDraft({
              ...draft,
              text,
            })
          }
        />

        {/* Link to Event (Disabled) */}
         <div className="flex flex-col gap-[12px] opacity-50 ">
           <span className="text-[20px] text-[#333333] font-[700] uppercase">
             Link to event
           </span>
           <div className="flex border-[1.4px] border-[#CCCCCC] rounded-[4px] p-[8px] cursor-not-allowed">
             <div className="flex items-center gap-[6px] border-1 border-[#B1B1B1] p-[4px] text-[14px] rounded-[100px]">
               <span className="h-[24px] w-[24px] bg-[#CCCCCC] rounded-full"></span> Figma Config <span className="akar-icons--cross small-cross mr-[10px]"></span></div>
           </div>
         </div>

        <SubtaskSection
          task={task}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onUpdateSubtask={onUpdateSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
        <CollaboratorSection 
          collaborators={draft.collaborators}
          onChange={(collaborators) =>
            setDraft({ ...draft, collaborators })
          }/>
        <NotesSection />
        <CommentsSection
          comments={draft.comments}
          onAdd={(newComment) =>
            setDraft({
              ...draft,
              comments: [newComment, ...draft.comments],
            })
          }
          onDelete={(id) =>
            setDraft({
              ...draft,
              comments: draft.comments.filter((c) => c.id !== id),
            })
          }
        />

        <FooterActions onClose={onClose} onSave={handleSave}/>
      </div>
    </div>
  );
}
