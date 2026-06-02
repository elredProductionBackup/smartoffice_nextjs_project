'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function CustomDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const initialDate = value ? parseDateStr(value) : new Date();
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());

  useEffect(() => {
    if (value) {
      const d = parseDateStr(value);
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
    }
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = getCalendarDays(viewYear, viewMonth);
  const selectedDate = value ? parseDateStr(value) : null;

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-[0.84rem] text-slate-800 cursor-pointer outline-none text-left h-[38px]"
      >
        <span>{value || 'Select date'}</span>
        <FiCalendar className="text-slate-400 shrink-0 ml-2" />
      </button>

      {/* Popover Calendar Panel */}
      {open && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 w-[336px] bg-white rounded-[24px] z-[9999] p-5 font-sans"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[20px] font-bold text-[#0e1834] leading-[136%] font-['Nunito_Sans']">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 cursor-pointer bg-transparent border-none text-slate-400 hover:text-slate-600 outline-none transition-colors duration-150"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 cursor-pointer bg-transparent border-none text-slate-600 hover:text-slate-800 outline-none transition-colors duration-150"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-y-2 text-center mb-3">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <span key={idx} className="text-[14px] font-medium text-slate-400 font-['Nunito_Sans']">
                {day}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {days.map((item, idx) => {
              if (item.isNextMonth) {
                return <div key={idx} className="w-9 h-9" />;
              }

              const isSel = selectedDate &&
                selectedDate.getDate() === item.day &&
                selectedDate.getMonth() === item.month &&
                selectedDate.getFullYear() === item.year;

              return (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={() => {
                    const chosenDate = new Date(item.year, item.month, item.day);
                    onChange(formatDateStr(chosenDate));
                    setOpen(false);
                  }}
                  className={[
                    'w-9 h-9 flex items-center justify-center text-[15px] font-medium font-["Nunito_Sans"] cursor-pointer border-none rounded-lg mx-auto transition-colors duration-150 outline-none',
                    item.isCurrentMonth
                      ? (isSel ? 'bg-[#0B57D0] text-white font-semibold' : 'text-slate-800 bg-transparent hover:bg-slate-50')
                      : 'text-slate-300 bg-transparent hover:bg-slate-50'
                  ].join(' ')}
                >
                  {item.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const parseDateStr = (str) => {
  if (!str) return new Date();
  const [dd, mm, yyyy] = str.split('-');
  return new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
};

const formatDateStr = (date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${date.getFullYear()}`;
};

const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  // Previous month padding days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrevMonth - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
      isPrevMonth: true
    });
  }

  // Current month days
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    cells.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true
    });
  }

  // Next month padding days dynamically matching 35 or 42 cells grid
  const totalCells = (firstDay + daysInCurrentMonth) <= 35 ? 35 : 42;
  const remaining = totalCells - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
      isNextMonth: true
    });
  }

  return cells;
};
