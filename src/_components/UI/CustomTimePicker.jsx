'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FiChevronUp, FiChevronDown, FiCheck } from 'react-icons/fi';

const STEP_MINUTES = 15;

function buildSlots() {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += STEP_MINUTES) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

const SLOTS = buildSlots();

function stepValue(value, direction) {
  const idx = SLOTS.indexOf(value);
  if (idx === -1) return SLOTS[0];
  const next = (idx + direction + SLOTS.length) % SLOTS.length;
  return SLOTS[next];
}

export default function CustomTimePicker({ value, onChange, compact = false }) {
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

  const handleStep = (e, direction) => {
    e.stopPropagation();
    onChange(stepValue(value || SLOTS[0], direction));
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
        <span>{value || '--:--'}</span>
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
          className={`absolute top-[calc(100%+6px)] left-0 w-full bg-white rounded-xl z-9999 overflow-y-auto ${
            compact ? 'max-h-[160px] py-1' : 'max-h-[220px] py-1.5'
          }`}
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          {SLOTS.map((slot) => {
            const isSel = slot === value;
            return (
              <button
                key={slot}
                type="button"
                ref={isSel ? selectedRef : null}
                onMouseDown={() => {
                  onChange(slot);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 cursor-pointer border-none outline-none text-left transition-colors duration-150 ${
                  compact ? 'py-1.5 text-[12px]' : 'py-2 text-[13px]'
                } ${isSel ? 'bg-[#eff6ff] text-[#2563eb] font-semibold' : 'text-slate-700 bg-transparent hover:bg-slate-50'}`}
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
