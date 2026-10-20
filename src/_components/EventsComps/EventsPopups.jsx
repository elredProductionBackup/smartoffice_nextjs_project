"use client";

import { useDispatch, useSelector } from "react-redux";
import { closeTopEventsModal } from "@/store/events/eventsUiSlice";

import MasterChecklistModal from "./MasterChecklistModal";
import ChecklistFormModal from "./ChecklistFormModal";
// import { useEffect, useState } from "react";
import { useState } from "react";
import SuccessPopup from "@/_components/ConfirmationPopups/SuccessPopup";
import PointSystemModal from "./PointSystemModal";
import { saveMasterConfig } from "@/store/events/eventsThunks";
import { setChecklistMaster } from "@/store/events/eventsSlice";
import { addToast } from "@/store/toastSlice";

// Other pages share the modal stack, so only render the types handled here
const HANDLED_TYPES = ["MASTER_CHECKLIST", "CHECKLIST_FORM", "POINT_SYSTEM"];

export default function EventsPopups() {
  // const [pointSystem, setPointSystem] = useState(null);
  const dispatch = useDispatch();
  const modalStack = useSelector(
    (state) => state.eventsUi.modalStack
  );
  const checklistMaster = useSelector((state) => state.events.checklistMaster);
  const [success, setSuccess] = useState(null); // { title, message } after a save

  const handleSubmit = async (data, mode, index) => {
    const current = [...checklistMaster];

    if (mode === "add") current.push(data);
    // Keep _id/status so editing the difficulty doesn't wipe the saved status
    if (mode === "edit") current[index] = { ...current[index], ...data };

    dispatch(setChecklistMaster(current));

    const res = await dispatch(saveMasterConfig());

    if (saveMasterConfig.fulfilled.match(res)) {
      dispatch(closeTopEventsModal());
      setSuccess({
        title: mode === "add" ? "Item added" : "Item updated",
        message: `"${data.label}" has been ${mode === "add" ? "added to" : "updated in"} the master checklist.`,
      });
    } else {
      dispatch(setChecklistMaster(checklistMaster)); // roll back the unsaved change
      dispatch(
        addToast({
          message: {
            title: mode === "add" ? "Couldn't add item" : "Couldn't update item",
            descrip: res.payload || "Please try again.",
          },
          type: "error",
        })
      );
    }
  };



  // Sits above the master checklist modal (z-index 100+)
  const successPopup = (
    <SuccessPopup
      isOpen={!!success}
      title={success?.title}
      message={success?.message}
      onClose={() => setSuccess(null)}
      zIndex={1000}
    />
  );

  if (!modalStack.length) return successPopup;

  return (
    <>
      {successPopup}
      {modalStack.map((modal, index) => {
        if (!HANDLED_TYPES.includes(modal.type)) return null;

        const isTop = index === modalStack.length - 1;

        return (
          <div
            key={index}
            className={`fixed inset-0 flex items-center justify-center ${
              isTop ? "bg-black/50" : "bg-black/30"
            }`}
            style={{ zIndex: 100 + index * 10 }}
            onClick={() => dispatch(closeTopEventsModal())}
          >
            <div
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              {modal.type === "MASTER_CHECKLIST" && (
                <MasterChecklistModal onClose={()=>dispatch(closeTopEventsModal())}/>
              )}

              {modal.type === "CHECKLIST_FORM" && (
                <ChecklistFormModal {...modal.payload} onSubmit={handleSubmit} onClose={()=>dispatch(closeTopEventsModal())}/>
              )}
              {modal.type === "POINT_SYSTEM" && (
                <PointSystemModal
                  onClose={() => dispatch(closeTopEventsModal())}
                />
            )}

            </div>
          </div>
        );
      })}
    </>
  );
}
