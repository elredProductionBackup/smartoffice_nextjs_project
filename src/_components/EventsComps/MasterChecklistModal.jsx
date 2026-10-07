"use client";

import { useDispatch, useSelector } from "react-redux";
import { openEventsModal } from "@/store/events/eventsUiSlice";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { fetchMasterConfig, saveMasterConfig } from "@/store/events/eventsThunks";
import { setChecklistMaster } from "@/store/events/eventsSlice";

const difficultyColor = {
  hard: "bg-red-500",
  medium: "bg-yellow-400",
  easy: "bg-green-500",
};

export default function MasterChecklistModal({ onClose }) {
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(fetchMasterConfig());
  }, [dispatch]);

  const checklist = useSelector((state) => state.events.checklistMaster);
  const masterLoading = useSelector((state) => state.events.masterLoading);

  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const openAdd = () => {
    dispatch(
    openEventsModal({
      type: "CHECKLIST_FORM",
      payload: {
        mode: "add",
      },
    })
  );
};


const openEdit = (item, index) => {
  dispatch(
    openEventsModal({
      type: "CHECKLIST_FORM",
      payload: {
        mode: "edit",
        item,
        index,
      },
    })
  );
};

// The whole list is saved together, so delete = save the list without that item
const handleDelete = async () => {
  if (deleteIndex === null) return;

  const previous = checklist;
  setDeleting(true);
  dispatch(setChecklistMaster(checklist.filter((_, i) => i !== deleteIndex)));

  const res = await dispatch(saveMasterConfig());
  if (!saveMasterConfig.fulfilled.match(res)) {
    dispatch(setChecklistMaster(previous)); // roll back on failure
  }

  setDeleting(false);
  setDeleteIndex(null);
};

  return (
    <div className="w-[600px] flex flex-col bg-white rounded-[14px] shadow-xl px-[40px]  relative flex flex-col gap-[24px] h-[637px] max-h-[90vh] overflow-y-auto">
       <div className="pt-[40px] flex items-center justify-between w-[100%] sticky top-[0px] bg-[white]">
         <h3 className="text-[32px] font-[700] text-[#333]">Master Checklist</h3>

         <button
           onClick={onClose}
           className="absolute right-[0px] top-[40px] h-[24px] w-[24px] rounded-full bg-[#EEEEEE] flex items-center justify-center text-[#999999] cursor-pointer"
         >
           <span className="akar-icons--cross small-cross"></span>
         </button>
       </div>

      {/* EMPTY STATE */}
      {!masterLoading && !checklist.length && (
        <div className="flex flex-col flex-1 items-center justify-center gap-[20px]">
          <div className="bg-[#D3E3FD] h-[60px] w-[60px] rounded-full grid place-items-center">
            <Image src={`/logo/no-checklist.svg`} alt="No Checklist" height={36} width={36}/>
          </div>
          <p className="text-[20px] text-[#333] font-[600]">
            No master checklist created
          </p>
          <button
            onClick={openAdd}
            className="py-[8px] px-[20px] text-[20px] rounded-full bg-gradient-to-r from-[#5597ED] to-[#00449C] text-white cursor-pointer "
          >
            Add new
          </button>
        </div>
      )}

      {/* Loading */}
     {masterLoading && (
          <div className="flex-1 grid place-items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            {/* <p className="text-[18px] font-[500] text-[#555]">Loading checklist...</p> */}
          </div>
        )
      }

      {/* LIST */}
      {!masterLoading && !!checklist.length && (
        <>
          <div className="flex flex-col gap-[20px] flex-1">
            {checklist.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center gap-[16px]"
              >
                <span className="text-[20px] font-[500] flex-1 min-w-0 break-words">
                  {item.label}
                </span>
                <div className="flex items-center gap-[12px] shrink-0">
                  <span
                    className={`h-[12px] w-[50px] rounded-full ${difficultyColor[item.difficulty]}`}
                  />
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => openEdit(item, index)}
                    className="h-[32px] w-[32px] rounded-full grid place-items-center text-[#0B57D0] hover:bg-[#D3E3FD] transition-colors cursor-pointer"
                  >
                    <FiEdit2 className="text-[16px]" />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => setDeleteIndex(index)}
                    className="h-[32px] w-[32px] rounded-full grid place-items-center text-[#E53935] hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <FiTrash2 className="text-[16px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[white] w-[100%] sticky bottom-[0px] pt-[10px] pb-[40px]">
          <button
            onClick={openAdd}
            className="self-start py-[8px] px-[20px] text-[20px] rounded-full bg-gradient-to-r from-[#5597ED] to-[#00449C] text-white cursor-pointer "
          >
            + Add new
          </button>
          </div>
        </>
      )}

      {/* DELETE CONFIRM */}
      {deleteIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !deleting && setDeleteIndex(null)}
        >
          <div
            className="w-[480px] rounded-[28px] bg-white pt-[70px] pb-[40px] shadow-xl flex flex-col items-center gap-[45px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[24px] font-[700] px-[60px] text-center">
              Are you sure you want to delete &quot;{checklist[deleteIndex]?.label}&quot;?
            </div>
            <div className="flex gap-[80px]">
              <button
                onClick={() => setDeleteIndex(null)}
                disabled={deleting}
                className="rounded-full text-[20px] bg-[#999999] px-6 py-2 text-white w-[120px] cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full text-[20px] bg-gradient-to-r from-[#5597ED] to-[#00449C] w-[120px] px-[16px] py-[8px] text-white cursor-pointer disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
