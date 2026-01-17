"use client";

import { useDispatch, useSelector } from "react-redux";
import { closeTopEventsModal } from "@/store/events/eventsUiSlice";

import MasterChecklistModal from "./MasterChecklistModal";
import ChecklistFormModal from "./ChecklistFormModal";
import { useState } from "react";

export default function EventsPopups() {
  const dispatch = useDispatch();
  const modalStack = useSelector(
    (state) => state.eventsUi.modalStack
  );
  const [checklist, setChecklist] = useState([]);
  
  const handleSubmit = (data, mode, index) => {
  if (mode === "add") {
    setChecklist((prev) => [...prev, data]);
  }

  if (mode === "edit") {
    setChecklist((prev) =>
      prev.map((item, i) =>
        i === index ? data : item
      )
    );
  }

  dispatch(closeTopEventsModal());
};


  if (!modalStack.length) return null;

  return (
    <>
      {modalStack.map((modal, index) => {
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
                <MasterChecklistModal checklist={checklist} onClose={()=>dispatch(closeTopEventsModal())}/>
              )}

              {modal.type === "CHECKLIST_FORM" && (
                <ChecklistFormModal {...modal.payload} onSubmit={handleSubmit} onClose={()=>dispatch(closeTopEventsModal())}/>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
