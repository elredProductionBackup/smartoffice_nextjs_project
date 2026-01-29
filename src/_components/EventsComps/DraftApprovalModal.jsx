"use client";

import { useDispatch, useSelector } from "react-redux";
import { closeEventFormModal } from "@/store/events/eventsUiSlice";

const DraftApprovalModal = ({ onConfirmCreate, onSendForApproval }) => {
  const dispatch = useDispatch();
  const { type } = useSelector((s) => s.eventsUi.eventFormModal);

  if (type !== "APPROVAL") return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={()=> dispatch(closeEventFormModal())}>
      <div
        className="w-[480px] bg-white rounded-[30px] px-[40px] py-[40px] text-center relative flex flex-col gap-[12px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TITLE */}
        <h2 className="text-[#333] text-[24px] font-[700]">
          Do you want to send this event draft for approval?
        </h2>

        <p className="text-[#666] text-[20px] font-[500] mb-[24px]">
          You can send it for approval.
        </p>

        {/* ACTION BUTTONS */}
        <div className="flex justify-center gap-[30px]">
          <button
            onClick={() => {
              dispatch(closeEventFormModal());
            }}
            className="px-[16px] py-[8px] whitespace-nowrap rounded-[100px] bg-[#999999] text-white cursor-pointer text-[20px] font-[500]"
          >
            No, create event
          </button>

          <button
            onClick={() => {
              dispatch(closeEventFormModal());
              onSendForApproval();
            }}
            className="px-[16px] py-[8px] whitespace-nowrap rounded-[100px] text-white transition
              bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] text-[20px] font-[500] cursor-pointer"
          >
            Send for approval
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftApprovalModal;
