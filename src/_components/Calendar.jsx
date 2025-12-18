"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupView, setPopupView] = useState("month"); // FIX: month first
  const popupRef = useRef(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const days = generateCalendarDays(year, month);

  // Outside click close
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopupOpen(false);
        setPopupView("month");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const changeMonth = (delta) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const onMonthSelect = (m) => {
    setCurrentDate(new Date(year, m, 1));
    setPopupOpen(false);
    setPopupView("month");
  };

  const onYearSelect = (y) => {
    setCurrentDate(new Date(y, month, 1));
    setPopupView("month"); // return to month view
  };

  return (
    <div
      className="relative bg-white rounded-xl border border-[#e6eaf0]"
      style={{ width: 900, height: 700 }}
    >
      {/* HEADER */}
      <div className="flex items-center gap-4 px-6 py-4 border-b">
        <button
          onClick={() => {
            setPopupOpen(!popupOpen);
            setPopupView("month");
          }}
          className="w-[180px] text-left text-xl font-semibold hover:underline"
        >
          {MONTHS[month]} {year}
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-1 rounded hover:bg-gray-100"
          >
            <FiChevronLeft size={18} />
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="p-1 rounded hover:bg-gray-100"
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* POPUP */}
      {popupOpen && (
        <div
          ref={popupRef}
          className="absolute top-16 left-6 z-20 bg-white border rounded-lg shadow-lg p-4 w-[260px]"
        >
          {/* HEADER INSIDE POPUP */}
          {/* POPUP HEADER */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCurrentDate(new Date(year - 1, month, 1))}
              className="p-1 rounded hover:bg-gray-100"
            >
              <FiChevronLeft size={16} />
            </button>

            <button
              onClick={() => setPopupView("year")}
              className="font-semibold hover:underline"
            >
              {year}
            </button>

            <button
              onClick={() => setCurrentDate(new Date(year + 1, month, 1))}
              className="p-1 rounded hover:bg-gray-100"
            >
              <FiChevronRight size={16} />
            </button>
          </div>

          {/* MONTH VIEW */}
          {popupView === "month" && (
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => onMonthSelect(i)}
                  className={`p-2 text-sm rounded ${
                    i === month ? "bg-blue-600 text-white" : "hover:bg-blue-50"
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* YEAR VIEW */}
          {popupView === "year" && (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => {
                const y = year - 6 + i;
                return (
                  <button
                    key={y}
                    onClick={() => onYearSelect(y)}
                    className={`p-2 text-sm rounded ${
                      y === year ? "bg-blue-600 text-white" : "hover:bg-blue-50"
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WEEK HEADER */}
      <div className="grid grid-cols-7 bg-[#eaf1ff] border-b">
        {DAYS.map((d) => (
          <div key={d} className="py-3 text-center text-xs font-semibold">
            {d}
          </div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 grid-rows-5 h-[calc(700px-112px)]">
        {days.map((day, idx) => {
          const isToday =
            day.isCurrentMonth &&
            day.date === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

          return (
            <div key={idx} className="border p-3">
              {isToday ? (
                <div className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-[#2f6fed] text-white text-sm">
                  {day.date}
                </div>
              ) : (
                <div className="text-center">
                  <span
                    className={`text-base font-medium ${
                      day.isCurrentMonth ? "text-black" : "text-gray-400"
                    }`}
                  >
                    {day.date}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD TASK */}
      <button className="absolute bottom-8 right-10 flex items-center gap-2 bg-[#2f6fed] text-white px-4 py-2 rounded-full shadow">
        <FiPlus size={16} />
        Add task
      </button>
    </div>
  );
}

/* DATE LOGIC */

function generateCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ date: daysInPrevMonth - i, isCurrentMonth: false });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: i, isCurrentMonth: true });
  }

  while (days.length < 35) {
    days.push({
      date: days.length + 1 - (firstDay + daysInMonth),
      isCurrentMonth: false,
    });
  }

  return days;
}
