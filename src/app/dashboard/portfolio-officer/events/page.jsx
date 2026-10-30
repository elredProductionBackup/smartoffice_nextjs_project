'use client';

import { useState } from 'react';
import { MdCurrencyRupee } from 'react-icons/md';
import { FiCalendar, FiSend } from 'react-icons/fi';
import { HiOutlineLightBulb } from 'react-icons/hi';
import RequestEvent from '@/_components/UI/RequestEvent';

const STATUS_STYLES = {
  'Planned':     { text: '#64748b', bg: '#f1f5f9' },
  'In Progress': { text: '#3b63e8', bg: '#e8eefe' },
  'Completed':   { text: '#059669', bg: '#f0fdf4' },
};

const EVENTS = [
  { id: 1, name: 'Leadership Training Workshop', date: 'Jun 15, 2026', category: 'Leadership Development',  budget: '₹12,00,000', status: 'Planned'     },
  { id: 2, name: 'Technical Skills Bootcamp',    date: 'Jul 20, 2026', category: 'Technical Training',      budget: '₹20,00,000', status: 'Planned'     },
  { id: 3, name: 'Soft Skills Development',      date: 'Aug 10, 2026', category: 'Professional Development',budget: '₹9,60,000',  status: 'Planned'     },
  { id: 4, name: 'Annual Learning Conference',   date: 'Sep 25, 2026', category: 'Conference',              budget: '₹32,00,000', status: 'Planned'     },
];

const COLUMNS = ['Event Name', 'Date', 'Category', 'Budget', 'Status'];

const PortfolioEventsPage = () => {
  const [showRequestEvent, setShowRequestEvent] = useState(false);

  return (
    <div className="pt-4 pb-24 md:p-6">
      {showRequestEvent && <RequestEvent onClose={() => setShowRequestEvent(false)} />}

      {/* ── Top Banner ── */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:gap-0 mb-5 md:mb-6">
        <div>
          <h1 className="font-heading text-[26px] md:text-[32px] font-bold text-[#1a1a2e] leading-tight">Rahul Sharma</h1>
          <p className="text-[15px] text-[#888] mt-1">Learning Portfolio Officer · FY 2026</p>
        </div>
        <div
          className="rounded-[18px] px-5 py-4 md:px-7 md:py-5 w-full md:w-[340px] flex flex-col gap-3"
          style={{ background: 'linear-gradient(135deg, #3b63e8, #2445cc)' }}
        >
          <div className="flex items-center gap-2">
            <HiOutlineLightBulb className="text-white text-[20px]" />
            <span className="text-white text-[16px] font-bold">Vision Board</span>
          </div>
          <p className="text-white/80 text-[13px] leading-[1.6]">
            Turn your learning ideas into events. Draft a proposal and get it on the calendar.
          </p>
          <button
            type="button"
            onClick={() => setShowRequestEvent(true)}
            className="flex items-center justify-center gap-2 bg-white text-[#2445cc] text-[14px] font-semibold px-5 py-2.5 rounded-full cursor-pointer border-none hover:opacity-90 transition-opacity w-full">
            <FiSend className="text-[14px]" />
            Propose an Event
          </button>
        </div>
      </div>

      {/* ── Section Heading ── */}
      <div className="mb-4">
        <h2 className="text-[20px] md:text-[24px] font-bold text-[#1a1a2e]">Events</h2>
        <p className="text-[14px] text-[#888] mt-0.5">Manage all learning events and initiatives</p>
      </div>

      {/* ── Events Table ── */}
      <div className="bg-white border border-[#e5e7eb] rounded-[16px] overflow-hidden shadow-[0px_1px_4px_0px_#0000000d]">

        <div className="overflow-x-auto">
        <div className="min-w-[640px] md:min-w-0">
        {/* Table header */}
        <div className="grid grid-cols-[2.5fr_1.2fr_1.8fr_1.2fr_1fr] px-6 py-4 border-b border-[#f1f5f9]">
          {COLUMNS.map((col) => (
            <div key={col} className="text-[12px] font-semibold text-[#94a3b8] uppercase tracking-widest">
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#f1f5f9]">
          {EVENTS.map((event) => {
            const s = STATUS_STYLES[event.status] || STATUS_STYLES['Planned'];
            return (
              <div
                key={event.id}
                className="grid grid-cols-[2.5fr_1.2fr_1.8fr_1.2fr_1fr] px-6 py-5 items-center hover:bg-[#fafafa] transition-colors"
              >
                {/* Event Name */}
                <div className="text-[15px] font-bold text-[#1a1a2e]">{event.name}</div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-[14px] text-[#2563eb]">
                  <FiCalendar className="text-[13px] shrink-0" />
                  {event.date}
                </div>

                {/* Category */}
                <div className="text-[14px] text-[#4b5563]">{event.category}</div>

                {/* Budget */}
                <div className="flex items-center gap-0.5 text-[14px] text-[#4b5563]">
                  <MdCurrencyRupee className="text-[15px] shrink-0" />
                  {event.budget}
                </div>

                {/* Status */}
                <div>
                  <span
                    className="text-[12px] font-medium px-3 py-1 rounded-full"
                    style={{ color: s.text, background: s.bg }}
                  >
                    {event.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        </div>
        </div>

      </div>
    </div>
  );
};

export default PortfolioEventsPage;
