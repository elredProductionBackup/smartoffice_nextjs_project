'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MdCurrencyRupee } from 'react-icons/md';
import { FiArrowRight, FiCalendar, FiTrendingUp, FiSend } from 'react-icons/fi';
import { HiOutlineLightBulb } from 'react-icons/hi';
import RequestEvent from '@/_components/UI/RequestEvent';

const UPCOMING_EVENTS = [
  { id: 1, name: 'Leadership Training Workshop', date: 'June 15, 2026',   budget: '₹12,00,000', status: 'Planned' },
  { id: 2, name: 'Technical Skills Bootcamp',    date: 'July 20, 2026',   budget: '₹20,00,000', status: 'Planned' },
  { id: 3, name: 'Soft Skills Development',      date: 'August 10, 2026', budget: '₹9,60,000',  status: 'Planned' },
];

const PortfolioOfficerPage = () => {
  const [showRequestEvent, setShowRequestEvent] = useState(false);

  return (
    <div className="p-6">
      {showRequestEvent && <RequestEvent onClose={() => setShowRequestEvent(false)} />}

      {/* ── Top Banner ── */}
      <div className="flex justify-between mb-6">

        {/* Left: name + role */}
        <div>
          <h1 className="text-[32px] font-bold text-[#1a1a2e] leading-tight">Rahul Sharma</h1>
          <p className="text-[15px] text-[#888] mt-1">Learning Portfolio Officer · FY 2026</p>
        </div>

        {/* Right: Vision Board card */}
        <div
          className="rounded-[18px] px-7 py-5 w-[340px] flex flex-col gap-3"
          style={{ background: 'linear-gradient(135deg, #3b63e8, #2445cc)' }}
        >
          <div className="flex items-center gap-2">
            <HiOutlineLightBulb className="text-white text-[20px]" />
            <span className="text-white text-[16px] font-bold">Vision Board</span>
          </div>
          <p className="text-white/80 text-[13px] leading-[1.6]">
            Have a learning initiative in mind? Submit an event request to your admin for review and approval.
          </p>
          <button
            onClick={() => setShowRequestEvent(true)}
            className="flex items-center justify-center gap-2 bg-white text-[#2445cc] text-[14px] font-semibold px-5 py-2.5 rounded-full cursor-pointer border-none hover:opacity-90 transition-opacity w-full"
          >
            <FiSend className="text-[14px]" />
            Request an Event
          </button>
        </div>

      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Total Budget */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-6 shadow-[0px_1px_4px_0px_#0000000d]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-[42px] h-[42px] rounded-[10px] bg-[#eff6ff] flex items-center justify-center">
              <MdCurrencyRupee className="text-[22px] text-[#2563eb]" />
            </div>
            <span className="text-[18px] font-semibold text-[#2563eb]">Total Budget</span>
          </div>
          <div className="text-[32px] font-bold text-[#1a1a2e] leading-tight mb-3">
            ₹1,00,00,000
          </div>
          <div className="flex items-center gap-1.5 text-[#16a34a] text-[13px] font-medium">
            <FiTrendingUp className="text-[15px]" />
            <span>73.6% allocated (₹73,60,000)</span>
          </div>
        </div>

        {/* Events Planned */}
        <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-6 shadow-[0px_1px_4px_0px_#0000000d]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-[42px] h-[42px] rounded-[10px] bg-[#f5f3ff] flex items-center justify-center">
              <FiCalendar className="text-[20px] text-[#7c3aed]" />
            </div>
            <span className="text-[18px] font-semibold text-[#6b7280]">Events Planned</span>
          </div>
          <div className="text-[32px] font-bold text-[#1a1a2e] leading-tight mb-3">4</div>
          <div className="text-[13px] text-[#888]">in 2026</div>
        </div>

      </div>

      {/* ── Upcoming Events ── */}
      <div className="mt-6 bg-white border border-[#e5e7eb] rounded-[16px] p-6 shadow-[0px_1px_4px_0px_#0000000d]">

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[24px] font-bold text-[#1a1a2e]">Upcoming Events</h2>
          <Link href="/dashboard/portfolio-officer/events" className="flex items-center gap-2 bg-[#2563eb] text-white text-[14px] font-semibold px-5 py-2.5 rounded-full cursor-pointer hover:bg-[#1d4ed8] transition-colors no-underline">
            View All Events
            <FiArrowRight className="text-[15px]" />
          </Link>
        </div>

        {/* Event rows */}
        <div className="flex flex-col divide-y divide-[#f1f5f9]">
          {UPCOMING_EVENTS.map((event) => (
            <div key={event.id} className="flex items-center justify-between py-4">
              <div>
                <div className="text-[18px] font-bold text-[#1a1a2e] mb-1">{event.name}</div>
                <div className="flex items-center gap-4 text-[13px] text-[#6b7280]">
                  <span className="flex items-center gap-1.5">
                    <FiCalendar className="text-[#2563eb] text-[13px]" />
                    <span className="text-[#2563eb]">{event.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MdCurrencyRupee className="text-[14px]" />
                    {event.budget}
                  </span>
                </div>
              </div>
              <span className="text-[13px] font-medium px-3 py-1 rounded-full bg-[#f1f5f9] text-[#64748b]">
                {event.status}
              </span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};

export default PortfolioOfficerPage;
