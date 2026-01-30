"use client";

import { useOutsideClick } from "@/hooks/useOutsideClick";
import { useRef, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Calendar({
  value = new Date(), onChange, mode = "inline",onClose=()=>{},
  position = "relative",right = false, minDate, maxDate,
}) {
  const calendarRef = useRef(null);
  const [viewDate, setViewDate] = useState(value);
  const [selectedDate, setSelectedDate] = useState(value);
  const [viewMode, setViewMode] = useState("date");
    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();

    useOutsideClick(
      calendarRef,
      () => {
        if (mode !== "inline") onClose?.();
      },
    );



  /* ==========================
     DATE LIMITS
  ========================== */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const effectiveMinDate = minDate
    ? new Date(new Date(minDate).setHours(0, 0, 0, 0))
    : today;

  /* ==========================
     DATE INFO
  ========================== */
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  /* ==========================
     NAVIGATION
  ========================== */
  const changeMonth = (offset) => {
    const next = new Date(year, month + offset, 1);
    if (next >= new Date(effectiveMinDate.getFullYear(), effectiveMinDate.getMonth(), 1)) {
      setViewDate(next);
    }
  };

  const changeYear = (offset) => {
    const next = new Date(year + offset, month, 1);
    if (next.getFullYear() >= effectiveMinDate.getFullYear()) {
      setViewDate(next);
    }
  };

  /* ==========================
     HELPERS
  ========================== */
  const isPastDate = (date) => date < effectiveMinDate;

  const isPastMonth = (y, m) =>
    new Date(y, m + 1, 0) < effectiveMinDate;

  const isPastYear = (y) =>
    new Date(y, 11, 31) < effectiveMinDate;

  const selectDate = (date) => {
    if (isPastDate(date)) return;
    setSelectedDate(date);
    onChange?.(date);
  };

  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  const startYear = Math.floor(year / 12) * 12;

const containerClass =
  mode === "popup"
    ? `absolute z-50 top-[calc(100%+20px)] ${right ? "right-0" : ""}`
    : mode === "fullscreen"
    ? "fixed inset-0 z-[999] flex items-center justify-center bg-black/40"
    : "relative";

  const canGoPrevMonth =
  new Date(year, month - 1, 1) >=
  new Date(effectiveMinDate.getFullYear(), effectiveMinDate.getMonth(), 1);

    const canGoPrevYear = year - 1 >= effectiveMinDate.getFullYear();
      

  return (
    <div className={`${containerClass}`}>
      {mode === "popup" && (
        <div className={`absolute top-[-8px] ${right?'right-8':'left-8'} h-4 w-4 rotate-45 bg-white border-l-2 border-t-2 border-[#F3F4F6]`} />
      )}

      <div className={`${mode === "popup"?'w-[350px] border-[2.5px]  px-[14px]':'w-[100%]  px-9'} bg-white rounded-2xl border-[1.27px] border-[#F3F4F6] py-6 ${mode === "fullscreen"?'max-w-[416px]':''}`}
        ref={calendarRef}
        onClick={(e) => e.stopPropagation()}>
        {/*  HEADER  */}
        <div className="flex items-center justify-between mb-6 text-2xl">
            {viewMode !== "date" && (
                <button onClick={() => {
                        if (viewMode === "month") changeYear(-1);
                        if (viewMode === "year")
                        setViewDate(new Date(year - 12, month, 1));
                    }} disabled={!canGoPrevYear}
                    className={`p-1  ${
                        !canGoPrevYear ? "opacity-50 cursor-not-allowed":'cursor-pointer'
                    }`} > <IoIosArrowBack /> 
                </button>
            )}

            <div className="flex items-center justify-between w-[100%] gap-3">
                <div className={`cursor-pointer text-xl font-semibold select-none ${viewMode !== 'date' && 'flex-1 grid place-items-center'}`}
                onClick={() => {
                    if (mode === "inline") return;
                    if (viewMode === "date") setViewMode("month");
                    else if (viewMode === "month") setViewMode("year");
                    else setViewMode("date");
                    }}>
                    {viewMode === "date" && `${FULL_MONTHS[month]} ${year}`}
                    {viewMode === "month" && year}
                    {viewMode === "year" && `${startYear} - ${startYear + 11}`}
                </div>

                {/* DATE VIEW INLINE ARROWS */}
                {viewMode === "date" && (
                <div className="flex items-center gap-6">
                    <button onClick={() => changeMonth(-1)} disabled={!canGoPrevMonth}
                        className={`cursor-pointer ${!canGoPrevMonth && "opacity-50 cursor-not-allowed"}`}>
                        <IoIosArrowBack />
                    </button>

                    <button onClick={() => changeMonth(1)} className="cursor-pointer">
                    <IoIosArrowForward />
                    </button>
                </div>
                )}
            </div>

            {viewMode !== "date" && (
                <button
                onClick={() => {
                    if (viewMode === "month") changeYear(1);
                    if (viewMode === "year")
                    setViewDate(new Date(year + 12, month, 1));
                }} className="p-1 cursor-pointer " >
                <IoIosArrowForward />
                </button>
            )}
        </div>


        {/*  DATE VIEW  */}
        {viewMode === "date" && (
          <>
            <div className="grid grid-cols-7 text-center mb-4 text-gray-500 font-semibold">
              {DAYS.map((d, idx) => (
                <div key={idx}>{d}</div>
                ))}

            </div>

            <div className="grid grid-cols-7 gap-y-2 text-center">
              {[...Array(firstDay)].map((_, i) => (
                <div key={i} className="text-gray-300 grid place-items-center">
                  {prevMonthDays - firstDay + i + 1}
                </div>
              ))}

             {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(year, month, day);

                const isSelected =
                    value &&
                    value.toDateString() === dateObj.toDateString();

                const isDisabled =
                    isPastDate(dateObj) && !isSelected;

                return (
                    <button key={day} disabled={isDisabled}
                    onClick={() => {
                        if (isDisabled) return;
                        onChange?.(dateObj);
                    }} className={`mx-auto h-11 w-11 rounded-lg
                        ${
                        isSelected
                            ? "bg-blue-700 text-white"
                            : isDisabled
                            ? "text-gray-300 cursor-not-allowed"
                            : "hover:bg-blue-100 cursor-pointer"
                        }`}
                    >{day}</button>);
                })}
            </div>
          </>
        )}

       {viewMode === "month" && (
        <div className="grid grid-cols-3 gap-4">
            {months.map((m, idx) => {
            const disabled = isPastMonth(year, idx);

            const isSelected = viewYear === year && viewMonth === idx;


            return (
                <button key={m} disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    setViewDate(new Date(year, idx, 1));
                    setViewMode("date");
                }} className={`rounded-lg py-3 cursor-pointer 
                    ${
                    disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : isSelected
                        ? "bg-blue-700 text-white"
                        : "hover:bg-blue-100"
                    }`}
                >{m}</button>
            );
            })}
        </div>
        )}

        {/* ================= YEAR VIEW ================= */}
        {viewMode === "year" && (
            <div className="grid grid-cols-3 gap-4">
                {[...Array(12)].map((_, i) => {
                const y = startYear + i;
                const disabled = isPastYear(y);
                const isSelected = y === viewYear;


                return (
                    <button key={y} disabled={disabled}
                    onClick={() => {
                        if (disabled) return;
                        setViewDate(new Date(y, month, 1));
                        setViewMode("month");
                    }} className={`rounded-lg py-3 cursor-pointer 
                        ${
                        disabled
                            ? "text-gray-300 cursor-not-allowed"
                            : isSelected
                            ? "bg-blue-700 text-white"
                            : "hover:bg-blue-100"
                        }`}
                    >{y}</button>);
                })}
            </div>
            )}
      </div>
    </div>
  );
}
