"use client";

import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "@/store/actionable/actionableUiSlice";
import { useState } from "react";
import moment from "moment";
import { changeDueDateTime } from "@/store/actionable/actionableThunks";
import Calendar from "./UI/Calendar";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function DatepickerModal({ selectedTask }) {
  const dispatch = useDispatch();
  const { modal } = useSelector((state) => state.actionableUi);

  const isOpen = modal.type === "MOVE";
  if (!isOpen) return null; // Parse existing due date

  const initialDate = selectedTask?.dueDate
    ? moment(selectedTask.dueDate, "DD MMM YYYY").toDate()
    : new Date(); // LOCAL STATE

  const [viewDate, setViewDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [hoveredDate, setHoveredDate] = useState(null);

  if (!isOpen) return null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const changeMonth = (offset) => {
    setViewDate(new Date(year, month + offset, 1));
  };
  const today = moment().startOf("day").toDate();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => dispatch(closeModal())}
    >
            
      <div
        className="w-[480px] rounded-[28px] bg-white p-[30px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
                {/* Header */}
                
        <div className="flex items-center justify-between mb-5">
                    <h2 className="text-2xl font-bold">Move</h2>
                    
          <button
            onClick={() => dispatch(closeModal())}
            className="text-3xl text-gray-400 cursor-pointer"
          >
                        ×           
          </button>
                  
        </div>
                
        <Calendar value={selectedDate} onChange={(d) => setSelectedDate(d)} />
                {/* Footer */}
                
        <div className="mt-8 flex justify-between">
                    
          <button
            onClick={() => dispatch(closeModal())}
            className="rounded-full text-[20px] bg-[#999999] px-6 py-2 text-white w-[120px] cursor-pointer"
          >
                        Cancel           
          </button>
                    
          <button
            onClick={() => {
              if (!selectedDate) return;

              const dueDate = moment(selectedDate).format("YYYY-MM-DD");

              const dueTime = moment(selectedTask.dueTime, "hh:mm A").format(
                "HH:mm",
              );

              dispatch(
                changeDueDateTime({
                  actionableId: selectedTask.actionableId,
                  dueDate,
                  dueTime,
                }),
              );

              dispatch(closeModal());
            }}
            className="rounded-full text-[20px] bg-gradient-to-r from-[#5597ED] to-[#00449C] w-[120px] px-[16px] py-[8px] text-white cursor-pointer"
          >
                        Move           
          </button>
                  
        </div>
              
      </div>
          
    </div>
  );
}
