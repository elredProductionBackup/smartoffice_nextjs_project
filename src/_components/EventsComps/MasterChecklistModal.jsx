"use client";

import { useDispatch, useSelector } from "react-redux";
import { openEventsModal } from "@/store/events/eventsUiSlice";
import Image from "next/image";
import { useEffect } from "react";
import { fetchMasterConfig } from "@/store/events/eventsThunks";

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

  return (
    <div className="w-[600px] flex flex-col bg-white rounded-[14px] shadow-xl p-[40px] relative flex flex-col gap-[24px] h-[637px] max-h-[90vh]">
       <div className="flex items-center justify-between">
         <h3 className="text-[32px] font-[700] text-[#333]">Master Checklist</h3>

         <button
           onClick={onClose}
           className="absolute right-[40px] top-[40px] h-[24px] w-[24px] rounded-full bg-[#EEEEEE] flex items-center justify-center text-[#999999] cursor-pointer"
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
            className="py-[8px] px-[20px] text-[20px] rounded-full bg-gradient-to-r from-[#5597ED] to-[#00449C] text-white cursor-pointer"
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
          <div className="flex flex-col gap-[20px]">
            {checklist.map((item, index) => (
              <div
                key={index}
                onClick={() => openEdit(item, index)}
                className="flex justify-between items-center cursor-pointer"
              >
                <span className="text-[20px] font-[500]">
                  {item.label}
                </span>
                <span
                  className={`h-[12px] w-[50px] rounded-full ${difficultyColor[item.difficulty]}`}
                />
              </div>
            ))}
          </div>

          <button
            onClick={openAdd}
            className="self-start py-[8px] px-[20px] text-[20px] rounded-full bg-gradient-to-r from-[#5597ED] to-[#00449C] text-white cursor-pointer"
          >
            + Add new
          </button>
        </>
      )}
    </div>
  );
}
