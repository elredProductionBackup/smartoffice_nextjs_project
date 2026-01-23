// "use client";

// import { useDatepicker } from "@/store/useDatepicker";
// // import { useDatepicker } from "@/store/useDatePicker";
// import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";

// const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

// export default function DatepickerModal() {
//   const {
//     isOpen,
//     selectedDate,
//     hoveredDate,
//     setDate,
//     setHoveredDate,
//     closeDatepicker,
//     onConfirm,
//   } = useDatepicker();
// const safeViewDate = viewDate || new Date();

// const year = safeViewDate.getFullYear();
// const month = safeViewDate.getMonth();


//   const firstDay = new Date(year, month, 1).getDay();
//   const daysInMonth = new Date(year, month + 1, 0).getDate();
//   const prevMonthDays = new Date(year, month, 0).getDate();

//   const changeMonth = (offset) => {
//     setDate(new Date(year, month + offset, 1));
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//       <div className="w-[480px] rounded-[28px] bg-white p-[30px] shadow-xl ">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-5">
//           <h2 className="text-2xl font-bold text-gray-900">Move</h2>
//           <button onClick={closeDatepicker} className="text-gray-400 text-3xl cursor-pointer">
//             ×
//           </button>
//         </div>

//         {/* Calendar Container */}
//         <div className="rounded-2xl border border-gray-200 py-6 px-9">
//           {/* Month Header */}
//           <div className="flex items-center justify-between mb-6">
//             <h3 className="text-xl font-semibold text-gray-900">
//               {new Date(year, month).toLocaleString("default", {
//                 month: "long",
//                 year: "numeric",
//               })}
//             </h3>

//             <div className="flex gap-8 text-gray-500 text-3xl mr-3">
//               <button onClick={() => changeMonth(-1)} className="cursor-pointer">
//                 <IoIosArrowBack size={25}/>
//               </button>
//               <button onClick={() => changeMonth(1)} className="cursor-pointer">
//                 <IoIosArrowForward size={25}/>
//               </button>
//             </div>
//           </div>

//           {/* Week Days */}
//           <div className="grid grid-cols-7 text-center text-[16px] font-semibold text-gray-500 mb-4">
//             {DAYS.map((d, idx) => (
//               <div key={idx}>{d}</div>
//             ))}
//           </div>

//           {/* Dates */}
//           <div className="grid grid-cols-7 gap-y-2 text-center">
//             {/* Previous month */}
//             {[...Array(firstDay)].map((_, i) => (
//               <div
//                 key={i}
//                 className="text-gray-300 text-base flex items-center justify-center"
//               >
//                 {prevMonthDays - firstDay + i + 1}
//               </div>
//             ))}

//             {/* Current month */}
//             {[...Array(daysInMonth)].map((_, i) => {
//               const day = i + 1;
//               const isSelected = selectedDate.getDate() === day;
//               const isHovered = hoveredDate === day;

//               return (
//                 <button
//                   key={day}
//                   onMouseEnter={() => setHoveredDate(day)}
//                   onMouseLeave={() => setHoveredDate(null)}
//                   onClick={() => setDate(new Date(year, month, day))}
//                   className={`
//                     mx-auto flex h-11 w-11 items-center justify-center
//                     rounded-lg text-base font-medium
//                     ${
//                       isSelected
//                         ? "bg-blue-700 text-white"
//                         : isHovered
//                         ? "bg-blue-100 text-gray-900"
//                         : "text-gray-900"
//                     }
//                   `}
//                 >
//                   {day}
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="mt-8 flex justify-between">
//           <button
//             onClick={closeDatepicker}
//             className="h-[43px] w-[120px] rounded-full bg-[#999999] text-[20px] font-medium text-white cursor-pointer"
//           >
//             Cancel
//           </button>

//           <button
//             onClick={() => {
//               onConfirm?.(selectedDate);
//               closeDatepicker();
//             }}
//             className="h-[43px] w-[120px] rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-[20px] font-medium text-white cursor-pointer"
//           >
//             Move
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

        /* Calendar */
        /* <div className="rounded-2xl border-[1.27px] border-[#F3F4F6] py-6 px-9">

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              {viewDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h3>

            <div className="flex gap-6 text-2xl">
              <button onClick={() => changeMonth(-1)} className="cursor-pointer">
                <IoIosArrowBack />
              </button>
              <button onClick={() => changeMonth(1)} className="cursor-pointer">
                <IoIosArrowForward />
              </button>
            </div>
          </div>

            <div className="grid grid-cols-7 text-center mb-4 font-semibold text-gray-500">
            {DAYS.map((d, idx) => (
                <div key={idx}>{d}</div>
            ))}
            </div>

          <div className="grid grid-cols-7 gap-y-2 text-center">

            {[...Array(firstDay)].map((_, i) => (
              <div key={i} className="text-gray-300 flex items-center justify-center">
                {prevMonthDays - firstDay + i + 1}
              </div>
            ))}

            {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(year, month, day);

                const isPastDate = dateObj < today;

                const isSelected =
                  selectedDate &&
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getFullYear() === year;

                return (
                  <button
                    key={day}
                    disabled={isPastDate}
                    onMouseEnter={() => !isPastDate && setHoveredDate(day)}
                    onMouseLeave={() => setHoveredDate(null)}
                    onClick={() => {
                      if (isPastDate) return;
                      setSelectedDate(dateObj);
                    }}
                    className={`mx-auto h-11 w-11 rounded-lg
                      ${
                        isPastDate
                          ? "text-gray-300 cursor-not-allowed"
                          : "cursor-pointer"
                      }
                      ${isSelected ? "bg-blue-700 text-white" : ""}
                      ${hoveredDate === day && !isPastDate ? "bg-blue-100" : ""}
                    `}
                  >
                    {day}
                  </button>
                );
              })}

          </div>
        </div> */

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
  if (!isOpen) return null;

  // Parse existing due date
  const initialDate = selectedTask?.dueDate
    ? moment(selectedTask.dueDate, "DD MMM YYYY").toDate()
    : new Date();

  // LOCAL STATE
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => dispatch(closeModal())}>
      <div className="w-[480px] rounded-[28px] bg-white p-[30px] shadow-xl" onClick={(e) => e.stopPropagation()}>

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


        <Calendar
          value={selectedDate}
          onChange={(d) => setSelectedDate(d)}
        />



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

              const dueTime = moment(
                selectedTask.dueTime,
                "hh:mm A"
              ).format("HH:mm");

              dispatch(
                changeDueDateTime({
                  actionableId: selectedTask.actionableId,
                  dueDate,
                  dueTime,
                })
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
