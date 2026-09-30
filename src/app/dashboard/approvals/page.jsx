"use client";

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiClock, FiCheckCircle, FiXCircle, FiFileText, FiChevronRight, FiInbox } from 'react-icons/fi';
import moment from 'moment';
import ReviewApprovalModal from './ReviewApprovalModal';

// TODO: replace with approvals API response
const MOCK_APPROVALS = [
  { id: '1', request: 'Lanyards And Badges', type: 'Expense', date: '2026-09-23', amount: 15000, relatedEvent: 'Annual Leadership Forum', billUrl: '#', vendor: 'Mayur Printers', status: 'pending', isNew: true },
  { id: '2', request: 'Supplies', type: 'Expense', date: '2026-09-22', amount: 10000, relatedEvent: 'Learning Event', billUrl: '#', vendor: 'Genx Agencies', status: 'pending', isNew: true },
  { id: '3', request: 'Foods And Beverages', type: 'Expense', date: '2026-09-22', amount: 25000, relatedEvent: 'Forum Event', billUrl: '#', vendor: 'Royal Caterers', status: 'pending' },
  { id: '4', request: 'Photography Services', type: 'Expense', date: '2026-09-21', amount: 18000, relatedEvent: 'SPF Annual Gathering', billUrl: null, vendor: 'Lens Studio', status: 'pending' },
  { id: '5', request: 'Venue Booking', type: 'Expense', date: '2026-09-20', amount: 120000, relatedEvent: 'Annual Leadership Forum', billUrl: '#', vendor: 'Taj Lands End', status: 'approved' },
  { id: '6', request: 'Speakers Professional Charges', type: 'Expense', date: '2026-09-19', amount: 50000, relatedEvent: 'Learning Event', billUrl: '#', vendor: 'Dr Anil Lamba', status: 'approved' },
  { id: '7', request: 'Audio Visual Setup', type: 'Expense', date: '2026-09-18', amount: 30000, relatedEvent: 'Forum Event', billUrl: null, vendor: 'SoundWave AV', status: 'approved' },
  { id: '8', request: 'Printing And Stationery', type: 'Expense', date: '2026-09-17', amount: 8000, relatedEvent: 'SPF Annual Gathering', billUrl: '#', vendor: 'Mayur Printers', status: 'approved' },
  { id: '9', request: 'Decor And Florals', type: 'Expense', date: '2026-09-16', amount: 22000, relatedEvent: 'Annual Leadership Forum', billUrl: '#', vendor: 'Bloom Decor', status: 'approved' },
  { id: '10', request: 'Travel Reimbursement', type: 'Expense', date: '2026-09-15', amount: 14000, relatedEvent: 'Learning Event', billUrl: '#', vendor: 'Admin', status: 'approved' },
  { id: '11', request: 'Gifts And Mementos', type: 'Expense', date: '2026-09-14', amount: 12000, relatedEvent: 'Forum Event', billUrl: null, vendor: 'Gift Studio', status: 'approved' },
  { id: '12', request: 'Hotel Accommodation', type: 'Expense', date: '2026-09-13', amount: 65000, relatedEvent: 'SPF Annual Gathering', billUrl: '#', vendor: 'Taj Lands End', status: 'approved' },
  { id: '13', request: 'Entertainment', type: 'Expense', date: '2026-09-12', amount: 40000, relatedEvent: 'Forum Event', billUrl: '#', vendor: 'Star Events', status: 'rejected' },
  { id: '14', request: 'Transport', type: 'Expense', date: '2026-09-11', amount: 9000, relatedEvent: 'Learning Event', billUrl: null, vendor: 'City Cabs', status: 'rejected' },
];

// Timeline mirrors the approval flow; the final entry depends on the current status.
const buildTimeline = (a) => {
  const items = [
    { label: `Expense submitted by ${a.submittedBy}`, date: a.date },
    { label: 'Sent for Finance Officer approval', date: a.date },
    { label: 'Viewed by Finance Officer', date: null },
  ];
  if (a.status === 'approved') items.push({ label: 'Approved by Finance Officer', date: a.decidedAt ?? null });
  if (a.status === 'rejected') items.push({ label: 'Rejected by Finance Officer', date: a.decidedAt ?? null });
  return items;
};

// Fields the review popup needs that aren't in the row list above.
const withDetails = (a) => ({
  submittedBy: 'Admin',
  paymentStatus: 'Pending',
  description: a.request,
  remark: `${a.request} required for ${a.relatedEvent}.`,
  ...a,
});

const INITIAL_APPROVALS = MOCK_APPROVALS.map(withDetails);

// Badge colours match StatusBadge on /dashboard/expense-records
const STATUS_BADGE = {
  pending: { label: 'Pending Approval', className: 'bg-[#FEF7E0] text-[#B06000]' },
  approved: { label: 'Approved', className: 'bg-[#E6F4EA] text-[#137333]' },
  rejected: { label: 'Rejected', className: 'bg-[#FEE2E2] text-[#B91C1C]' },
};

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const COLUMNS = ['Request', 'Type', 'Date', 'Amount', 'Bill', 'Related Event', 'Status', 'Action'];

const TABLE_COLUMNS =
  'minmax(190px,1.6fr) minmax(90px,0.8fr) minmax(112px,1fr) minmax(110px,1fr) minmax(110px,0.9fr) minmax(180px,1.4fr) minmax(140px,1.1fr) minmax(96px,0.8fr)';

const PAGE_SIZE = 10;

const formatAmount = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

// Colour themes from the Income / Budget / Expense cards (VisionCard)
const CARD_THEMES = {
  amber: { bg: 'bg-[#fff6e8]', border: 'border-[#fde7c2]', iconBg: 'bg-[#f59e0b]', text: 'text-[#d97706]' },
  green: { bg: 'bg-[#edfaef]', border: 'border-[#d2f3d7]', iconBg: 'bg-[#56b64d]', text: 'text-[#4ca543]' },
  red: { bg: 'bg-[#fdeeee]', border: 'border-[#fbd5d5]', iconBg: 'bg-[#dc2626]', text: 'text-[#dc2626]' },
  blue: { bg: 'bg-[#eaf2ff]', border: 'border-[#cfdfff]', iconBg: 'bg-[#1662dd]', text: 'text-[#1b64df]' },
};

// Same card style as the summary cards on /dashboard/expense-records
const StatCard = ({ label, value, sublabel, Icon, theme }) => {
  const t = CARD_THEMES[theme];
  return (
    <div className={`${t.bg} border ${t.border} rounded-[20px] p-6 font-nunito shadow-[0px_1px_3px_0px_#0000001A,0px_0px_4px_-1px_#8B878733]`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-[42px] h-[42px] rounded-xl ${t.iconBg} text-white flex items-center justify-center shrink-0`}>
          <Icon className="text-2xl" />
        </div>
        <span className="text-[#4b5563] font-medium text-lg">{label}</span>
      </div>
      <div className={`text-[32px] font-bold ${t.text} mb-1 leading-none tabular-nums`}>{value}</div>
      <div className="text-[#777777] text-[14px]">{sublabel}</div>
    </div>
  );
};

const TAB_KEYS = TABS.map((t) => t.key);

const ApprovalsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab and page live in the URL (?tab=approved&page=2) so they survive a refresh.
  const urlTab = searchParams.get('tab');
  const activeTab = TAB_KEYS.includes(urlTab) ? urlTab : 'pending';
  const urlPage = Number(searchParams.get('page')) || 1;

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value == null) params.delete(key);
      else params.set(key, String(value));
    });
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const setCurrentPage = (page) => updateParams({ page: page > 1 ? page : null });
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [reviewId, setReviewId] = useState(null);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, all: approvals.length };
    approvals.forEach((a) => { c[a.status] += 1; });
    return c;
  }, [approvals]);

  const filtered = activeTab === 'all' ? approvals : approvals.filter((a) => a.status === activeTab);
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  // Clamped so an out-of-range ?page= (or a row leaving this tab) still shows a valid page.
  const currentPage = Math.min(Math.max(1, urlPage), totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleTabChange = (key) => updateParams({ tab: key, page: null });

  const reviewing = approvals.find((a) => a.id === reviewId);

  const handleReview = (approval) => setReviewId(approval.id);

  // TODO: call the approve/reject API; for now this only updates local state
  const updateStatus = (approval, status) => {
    const decidedAt = moment().format('YYYY-MM-DD');
    setApprovals((prev) =>
      prev.map((a) => (a.id === approval.id ? { ...a, status, decidedAt, isNew: false } : a))
    );
    setReviewId(null);
  };

  return (
    <div className="p-6 bg-white font-nunito">
      <div className="mb-6">
        <h2 className="text-[32px] leading-[136%] font-bold text-[#333333] mb-1">Approvals</h2>
        <p className="text-[#777777] font-medium text-[18px] leading-[136%]">Review and manage pending approvals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard label="Pending Approval" value={counts.pending} sublabel="Awaiting review" Icon={FiClock} theme="amber" />
        <StatCard label="Approved" value={counts.approved} sublabel="Approved requests" Icon={FiCheckCircle} theme="green" />
        <StatCard label="Rejected" value={counts.rejected} sublabel="Rejected requests" Icon={FiXCircle} theme="red" />
        <StatCard label="Total Requests" value={counts.all} sublabel="All time requests" Icon={FiFileText} theme="blue" />
      </div>

      {/* Approval requests table — same layout as the All Expenses table on /dashboard/expense-records */}
      <div className="rounded-[22px] bg-white overflow-hidden p-6 md:p-8 border border-[#EAEEF2] mb-[20px]">
        <div className="flex items-center gap-2.5">
          <h2 className="font-nunito font-bold text-[20px] text-[#1E293B]">Approval Requests</h2>
          <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#F1F5F9] text-[12px] font-bold text-[#64748B]">
            {counts.all}
          </span>
        </div>

        {/* Tabs — same underline style as the events page tabs (action-tabs / tab-item in globals.css) */}
        <div className="action-tabs flex items-center gap-[10px] relative text-[#666666] mt-5 mb-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`tab-item relative inline-flex items-center gap-2 px-[20px] py-[5px] cursor-pointer text-[20px] font-[700] transition ${
                  isActive ? 'bordered text-[#0B57D0]' : ''
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-bold ${
                    isActive ? 'bg-[#E8F0FE] text-[#0B57D0]' : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto pb-3 [scrollbar-width:thin] [scrollbar-color:#AEB9C8_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#AEB9C8] [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="min-w-[1100px]">
            {/* Header row */}
            <div
              className="grid gap-3 py-4 border-b border-[#EAEEF2] font-nunito font-bold text-[13px] text-[#64748B]"
              style={{ gridTemplateColumns: TABLE_COLUMNS }}
            >
              {COLUMNS.map((col) => (
                <div key={col} className={col === 'Request' ? 'pl-2' : ''}>{col}</div>
              ))}
            </div>

            {/* Body */}
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center">
                  <FiInbox className="w-6 h-6 text-[#94A3B8]" />
                </div>
                <span className="text-[15px] font-bold text-[#334155]">No requests to show</span>
                <span className="text-[13px] text-[#94A3B8] font-medium">New requests will appear here.</span>
              </div>
            ) : (
              rows.map((a) => {
                const badge = STATUS_BADGE[a.status];
                return (
                  <div
                    key={a.id}
                    className="grid gap-3 py-5 border-b border-[#EBEFF4] last:border-b-0 items-center font-nunito text-[14px] text-[#334155] transition-colors hover:bg-[#EEF4FF]"
                    style={{ gridTemplateColumns: TABLE_COLUMNS }}
                  >
                    <div className="flex items-center gap-2 pl-2 pr-2 min-w-0 font-bold text-[#0B57D0] capitalize" title={a.request}>
                      {a.isNew && <span className="w-2 h-2 rounded-full bg-[#2B7FFF] shrink-0" />}
                      <span className="truncate">{a.request}</span>
                    </div>
                    <div className="text-[#475569]">{a.type}</div>
                    <div className="text-[#64748B]">{moment(a.date).format('DD MMM YYYY')}</div>
                    <div className="font-bold text-[#0F172A] tabular-nums">{formatAmount(a.amount)}</div>
                    <div>
                      {a.billUrl ? (
                        <a
                          href={a.billUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#0B57D0] font-semibold text-[13px] hover:underline"
                        >
                          <FiFileText className="w-4 h-4 shrink-0" />
                          View Bill
                        </a>
                      ) : (
                        <span className="text-[#CBD5E1]">—</span>
                      )}
                    </div>
                    <div className="truncate text-[#475569]" title={a.relatedEvent}>{a.relatedEvent}</div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-semibold font-nunito whitespace-nowrap ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => handleReview(a)}
                        className="inline-flex items-center gap-1 bg-[#2B7FFF] hover:bg-[#1a6fe6] active:scale-[0.97] text-white font-nunito font-semibold text-[12px] px-3 py-1.5 rounded-md transition-all cursor-pointer border-0 outline-none whitespace-nowrap"
                      >
                        Review
                        <FiChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#F1F5F9] pt-6 mt-6 gap-4 font-nunito">
            <span className="text-[14px] text-[#777777] font-medium">
              Showing{' '}
              <span className="font-bold text-[#334155]">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(totalCount, currentPage * PAGE_SIZE)}
              </span>{' '}
              of <span className="font-bold text-[#334155]">{totalCount}</span> records
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[14px] font-semibold text-[#333333] bg-white hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-[13px] font-semibold text-[#64748B] px-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-[14px] font-semibold text-[#333333] bg-white hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {reviewing && (
        <ReviewApprovalModal
          approval={{ ...reviewing, timeline: buildTimeline(reviewing) }}
          onClose={() => setReviewId(null)}
          onApprove={(a) => updateStatus(a, 'approved')}
          onReject={(a) => updateStatus(a, 'rejected')}
        />
      )}
    </div>
  );
};

// useSearchParams needs a Suspense boundary in the App Router.
const ApprovalsPage = () => (
  <Suspense fallback={null}>
    <ApprovalsContent />
  </Suspense>
);

export default ApprovalsPage;
