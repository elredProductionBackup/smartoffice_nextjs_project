'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MdCurrencyRupee } from 'react-icons/md';
import { FiArrowRight, FiCalendar, FiTrendingUp, FiSend, FiCheckSquare } from 'react-icons/fi';
import { HiOutlineLightBulb } from 'react-icons/hi';
import RequestEvent from '@/_components/UI/RequestEvent';
import DashboardActionableList from '@/_components/DashboardActionableList';
import TitleTooltipHover from '@/_components/UI/TitleTooltipHover';
import { getBudgetReportCategory, getBudgetEventReportCategory } from '@/services/finance.service';
import { formatCompactAmount } from '@/utils/currency';

// This page belongs to the Learning portfolio officer
const PORTFOLIO_NAME = 'Learning';
const PORTFOLIO_COLOR = '#2563eb';

const formatRupees = (value) => `₹${formatCompactAmount(value)}`;
const formatExactRupees = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// TODO: replace with actionables API response
const DUMMY_ACTIONABLES = [
  { actionableId: 'a1', title: 'please advise status of Bangalore hotel', createdBy: { name: 'Nandini Handa' }, dueTime: '4:10 PM', dueDate: '2026-09-23' },
  { actionableId: 'a2', title: 'Coordinate with Uttam for lanyards and badges design', createdBy: { name: 'Nandini Handa' }, dueTime: '10:21 AM', dueDate: '2026-09-23' },
  { actionableId: 'a3', title: 'Send modules and key takeaways to EAs', createdBy: { name: 'Nandini Handa' }, dueTime: '10:21 AM', dueDate: '2026-09-23' },
  { actionableId: 'a4', title: 'Native discussion with SG and team', createdBy: { name: 'Nandini Handa' }, dueTime: '10:18 AM', dueDate: '2026-09-23' },
  { actionableId: 'a5', title: 'Smart networks demo with YPO at 4 pm', dueDate: '2026-09-23' },
];

const UPCOMING_EVENTS = [
  { id: 1, name: 'Leadership Training Workshop', date: 'June 15, 2026',   budget: '₹12,00,000', status: 'Planned' },
  { id: 2, name: 'Technical Skills Bootcamp',    date: 'July 20, 2026',   budget: '₹20,00,000', status: 'Planned' },
  { id: 3, name: 'Soft Skills Development',      date: 'August 10, 2026', budget: '₹9,60,000',  status: 'Planned' },
];

const PortfolioOfficerPage = () => {
  const router = useRouter();
  const [showRequestEvent, setShowRequestEvent] = useState(false);
  const [portfolio, setPortfolio] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Same APIs as Finance Budget: find the Learning category in the report,
  // then load its events by budgetTypeId.
  useEffect(() => {
    getBudgetReportCategory(1, 100)
      .then((response) => {
        const rows = Array.isArray(response?.result) ? response.result : [];
        const learning = rows.find(
          (row) => row.portfolioName?.toLowerCase() === PORTFOLIO_NAME.toLowerCase()
        );
        setPortfolio(learning || null);
        if (!learning) return [];

        return getBudgetEventReportCategory(learning.budgetTypeId).then((res) => {
          const eventRows = Array.isArray(res?.result) ? res.result : [];
          // Backend can repeat an event — dedupe by eventId (same as Finance Budget)
          const seen = new Set();
          return eventRows.filter((row) => {
            if (seen.has(row.eventId)) return false;
            seen.add(row.eventId);
            return true;
          });
        });
      })
      .then((rows) => setEvents(rows || []))
      .catch((error) => console.error('Failed to fetch Learning budget report:', error))
      .finally(() => setLoading(false));
  }, []);

  const assigned = Number(portfolio?.budgetAmount) || 0;
  const used = Number(portfolio?.totalExpense) || 0;
  const remaining = Number(portfolio?.remainingAmount) || 0;
  const usedPct = assigned > 0 ? (used / assigned) * 100 : 0;
  const eventCount = portfolio?.totalEventCount ?? events.length;

  const totalEventBudget = events.reduce((sum, r) => sum + (Number(r.eventBudget) || 0), 0);
  const totalEventUsed = events.reduce((sum, r) => sum + (Number(r.eventExpenseAmount) || 0), 0);

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

      {/* ── Actionables & Approvals ── */}
      <div className="flex flex-col gap-5 mb-5">
        <DashboardActionableList data={DUMMY_ACTIONABLES} />

        {/* TODO: replace with approvals API response */}
        <div className="flex flex-col rounded-2xl bg-[#F2F7FF] px-6 py-6 min-h-[300px]">
          <h3 className="text-[20px] font-[700] text-[#333] mb-[20px]">Approvals</h3>
          <div className="flex-1 flex flex-col gap-[10px] items-center justify-center">
            <div className="h-[60px] w-[60px] bg-[#D3E3FD] rounded-full mb-[10px] grid place-items-center">
              <FiCheckSquare className="text-[24px] text-[#0B57D0]" />
            </div>
            <div className="text-[20px] font-[600] text-[#333333] text-center">
              No approvals found
            </div>
            <p className="text-[14px] text-[#666666]">You don&apos;t have any approvals right now</p>
          </div>
        </div>
      </div>

      {/* ── Total Budget ── */}
      <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-6 shadow-[0px_1px_4px_0px_#0000000d] overflow-hidden">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-[10px] bg-[#eff6ff] flex items-center justify-center">
              <MdCurrencyRupee className="text-[22px] text-[#2563eb]" />
            </div>
            <span className="text-[18px] font-semibold text-[#2563eb]">Total Budget</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5f3ff] text-[#7c3aed]">
            <FiCalendar className="text-[16px]" />
            <span className="text-[14px] font-semibold">
              {loading ? '—' : eventCount} event{eventCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <TitleTooltipHover title={formatExactRupees(assigned)}>
          <div className="text-[32px] font-bold text-[#1a1a2e] leading-tight mb-3">
            {loading ? '—' : formatExactRupees(assigned)}
          </div>
        </TitleTooltipHover>

        {!loading && (
          <div className="flex items-center gap-4 text-[13px] font-medium">
            <span className="flex items-center gap-1.5 text-[#6366f1]">
              <FiTrendingUp className="text-[15px]" />
              {usedPct.toFixed(1)}% used ({formatRupees(used)})
            </span>
            <span className="text-[#059669]">{formatRupees(remaining)} remaining</span>
          </div>
        )}

        {/* ── Learning events (same table as Finance Budget) ── */}
        <div className="-mx-6 -mb-6 mt-6 border-t border-slate-100">
        <div className="px-6 pt-4 pb-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{PORTFOLIO_NAME} Events</div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-slate-100">
          {['Event Name', 'Date', 'Assigned Budget', 'Used Budget', 'Remaining', 'Status'].map((col) => (
            <div key={col} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {col}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-6 text-slate-400 text-[13px]">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-[13px]">No events in this category</div>
        ) : (
          <>
            {events.map((event) => {
              const eventAssigned = Number(event.eventBudget) || 0;
              const eventUsed = Number(event.eventExpenseAmount) || 0;
              const eventRemaining = eventAssigned - eventUsed;
              const overBudget = eventUsed > eventAssigned;

              return (
                <div
                  key={event.eventId}
                  onClick={() => router.push(`/dashboard/events/${event.eventId}?from=portfolio-officer`)}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-slate-100 items-center cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <div className="text-[14px] font-semibold text-slate-800">{event.eventName}</div>
                    {event.eventLocation?.location && (
                      <div className="text-[12px] text-slate-400 mt-0.5">{event.eventLocation.location}</div>
                    )}
                  </div>
                  <div className="text-[14px] text-slate-600">{formatDate(event.startDateTime)}</div>
                  <div className="text-[14px] font-semibold" style={{ color: PORTFOLIO_COLOR }}>{formatRupees(eventAssigned)}</div>
                  <div className="text-[14px] font-semibold text-[#6366f1]">{formatRupees(eventUsed)}</div>
                  <div className="text-[14px] font-semibold text-[#059669]">{formatRupees(eventRemaining)}</div>
                  <div>
                    <span className={`text-[12px] font-medium px-3 py-1 rounded-full border ${
                      overBudget
                        ? 'text-red-600 bg-red-50 border-red-200'
                        : 'text-green-600 bg-green-50 border-green-200'
                    }`}>
                      {overBudget ? 'Over Budget' : 'On Track'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Portfolio Total */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center bg-slate-50">
              <div className="text-[14px] font-bold text-slate-700 col-span-2">Portfolio Total</div>
              <div className="text-[14px] font-bold" style={{ color: PORTFOLIO_COLOR }}>{formatRupees(totalEventBudget)}</div>
              <div className="text-[14px] font-bold text-[#6366f1]">{formatRupees(totalEventUsed)}</div>
              <div className="text-[14px] font-bold text-[#059669]">{formatRupees(totalEventBudget - totalEventUsed)}</div>
              <div />
            </div>
          </>
        )}
        </div>
      </div>

      {/* ── Upcoming Events ── */}
      <div className="mt-6 bg-white border border-[#e5e7eb] rounded-[16px] p-6 shadow-[0px_1px_4px_0px_#0000000d]">

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[24px] font-bold text-[#1a1a2e]">Upcoming Events</h2>
          <Link
            href={
              portfolio?.budgetTypeId
                ? `/dashboard/portfolio/${portfolio.budgetTypeId}?from=portfolio-officer`
                : '/dashboard/portfolio-officer/events'
            }
            className="flex items-center gap-2 bg-[#2563eb] text-white text-[14px] font-semibold px-5 py-2.5 rounded-full cursor-pointer hover:bg-[#1d4ed8] transition-colors no-underline">
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
