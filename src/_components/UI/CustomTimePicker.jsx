'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FiChevronUp, FiChevronDown, FiCheck } from 'react-icons/fi';

const STEP_MINUTES = 15;

// value/onChange use this same 12-hour "hh:mm AM/PM" string — it's what
// gets sent to the backend, not a 24-hour value converted for display.
function to12Hour(h, m) {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function buildSlots() {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += STEP_MINUTES) {
      slots.push(to12Hour(h, m));
    }
  }
  return slots;
}

const SLOTS = buildSlots();

// Minutes since midnight for a slot string, e.g. "01:30 PM" -> 810.
export function slotToMinutes(slot) {
  const idx = SLOTS.indexOf(slot);
  return idx === -1 ? -1 : idx * STEP_MINUTES;
}

// Steps to the next enabled slot; slots before minMinutes are skipped.
function stepValue(value, direction, minMinutes) {
  const enabled = SLOTS.filter((_, i) => i * STEP_MINUTES >= minMinutes);
  if (enabled.length === 0) return value;
  const idx = enabled.indexOf(value);
  if (idx === -1) return enabled[0];
  const next = (idx + direction + enabled.length) % enabled.length;
  return enabled[next];
}

// minMinutes: slots earlier than this (minutes since midnight) are disabled.
export default function CustomTimePicker({ value, onChange, compact = false, openUp = false, minMinutes = 0 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listRef = useRef(null);
  const selectedRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  // With no value selected, open the list scrolled to the first enabled slot.
  const firstEnabledIdx = Math.ceil(minMinutes / STEP_MINUTES);
  const hasSelection = SLOTS.includes(value);

  const handleStep = (e, direction) => {
    e.stopPropagation();
    onChange(stepValue(value, direction, minMinutes));
  };

  return (
    <div ref={ref} className="relative w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className={`w-full flex items-center justify-between border border-gray-300 rounded-lg bg-white text-slate-800 cursor-pointer outline-none text-left ${
          compact ? 'px-3 py-1.5 text-[0.78rem] h-[34px]' : 'px-3 py-2 text-[0.84rem] h-[38px]'
        }`}
      >
        <span>{value || '--:-- --'}</span>
        <div className="flex flex-col shrink-0 ml-2 -my-2 border-l border-gray-200 pl-2">
          <button
            type="button"
            onClick={(e) => handleStep(e, 1)}
            className="p-0 leading-none cursor-pointer bg-transparent border-none text-slate-400 hover:text-slate-700 outline-none"
          >
            <FiChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => handleStep(e, -1)}
            className="p-0 leading-none cursor-pointer bg-transparent border-none text-slate-400 hover:text-slate-700 outline-none"
          >
            <FiChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {open && (
        <div
          ref={listRef}
          className={
            openUp
              ? `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] bg-white rounded-xl z-[10010] overflow-y-auto ${
                  compact ? 'max-h-[220px] py-1' : 'max-h-[280px] py-1.5'
                }`
              : `absolute top-[calc(100%+6px)] left-0 w-full bg-white rounded-xl z-9999 overflow-y-auto ${
                  compact ? 'max-h-[160px] py-1' : 'max-h-[220px] py-1.5'
                }`
          }
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          {SLOTS.map((slot, i) => {
            const isSel = slot === value;
            const isDisabled = i * STEP_MINUTES < minMinutes;
            return (
              <button
                key={slot}
                type="button"
                disabled={isDisabled}
                ref={isSel || (!hasSelection && i === firstEnabledIdx) ? selectedRef : null}
                onMouseDown={() => {
                  if (isDisabled) return;
                  onChange(slot);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 border-none outline-none text-left transition-colors duration-150 ${
                  compact ? 'py-1.5 text-[12px]' : 'py-2 text-[13px]'
                } ${
                  isDisabled
                    ? 'text-slate-300 bg-transparent cursor-not-allowed'
                    : isSel
                    ? 'bg-[#eff6ff] text-[#2563eb] font-semibold cursor-pointer'
                    : 'text-slate-700 bg-transparent hover:bg-slate-50 cursor-pointer'
                }`}
              >
                {slot}
                {isSel && <FiCheck className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
