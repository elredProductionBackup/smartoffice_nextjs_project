"use client";

import { useDispatch, useSelector } from "react-redux";
import { closeTopEventsModal } from "@/store/events/eventsUiSlice";

import MasterChecklistModal from "./MasterChecklistModal";
import ChecklistFormModal from "./ChecklistFormModal";
import { useEffect, useState } from "react";
import PointSystemModal from "./PointSystemModal";
import { saveMasterConfig } from "@/store/events/eventsThunks";
import { setChecklistMaster, setPointsMaster } from "@/store/events/eventsSlice";

export default function EventsPopups() {
  const [pointSystem, setPointSystem] = useState(null);
  const dispatch = useDispatch();
  const modalStack = useSelector(
    (state) => state.eventsUi.modalStack
  );
  const checklistMaster = useSelector((state) => state.events.checklistMaster);

  const handleSubmit = async (data, mode, index) => {
    const current = [...checklistMaster];

    if (mode === "add") current.push(data);
    if (mode === "edit") current[index] = data;

    dispatch(setChecklistMaster(current));

    const res = await dispatch(saveMasterConfig());

    if (saveMasterConfig.fulfilled.match(res)) {
      dispatch(closeTopEventsModal());
    }
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
