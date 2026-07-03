'use client';

import { MdCurrencyRupee } from 'react-icons/md';
import { FiCalendar } from 'react-icons/fi';

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
  return (
    <div className="p-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[30px] font-bold text-[#1a1a2e] leading-tight">Events</h1>
          <p className="text-[15px] text-[#888] mt-1">Manage all learning events and initiatives</p>
        </div>
      </div>

      {/* ── Events Table ── */}
      <div className="bg-white border border-[#e5e7eb] rounded-[16px] overflow-hidden shadow-[0px_1px_4px_0px_#0000000d]">

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
  );
};

export default PortfolioEventsPage;
