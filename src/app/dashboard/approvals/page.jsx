"use client";

import React, { useMemo, useState } from 'react';
import { FiClock, FiCheckCircle, FiXCircle, FiFileText, FiChevronRight, FiPaperclip } from 'react-icons/fi';
import moment from 'moment';

// TODO: replace with approvals API response
const MOCK_APPROVALS = [
  { id: '1', request: 'Lanyards And Badges', type: 'Expense', date: '2026-09-23', amount: 15000, relatedEvent: 'Annual Leadership Forum', billUrl: '#', status: 'pending', isNew: true },
  { id: '2', request: 'Supplies', type: 'Expense', date: '2026-09-22', amount: 10000, relatedEvent: 'Learning Event', billUrl: '#', status: 'pending', isNew: true },
  { id: '3', request: 'Foods And Beverages', type: 'Expense', date: '2026-09-22', amount: 25000, relatedEvent: 'Forum Event', billUrl: '#', status: 'pending' },
  { id: '4', request: 'Photography Services', type: 'Expense', date: '2026-09-21', amount: 18000, relatedEvent: 'SPF Annual Gathering', billUrl: null, status: 'pending' },
  { id: '5', request: 'Venue Booking', type: 'Expense', date: '2026-09-20', amount: 120000, relatedEvent: 'Annual Leadership Forum', billUrl: '#', status: 'approved' },
  { id: '6', request: 'Speakers Professional Charges', type: 'Expense', date: '2026-09-19', amount: 50000, relatedEvent: 'Learning Event', billUrl: '#', status: 'approved' },
  { id: '7', request: 'Audio Visual Setup', type: 'Expense', date: '2026-09-18', amount: 30000, relatedEvent: 'Forum Event', billUrl: null, status: 'approved' },
  { id: '8', request: 'Printing And Stationery', type: 'Expense', date: '2026-09-17', amount: 8000, relatedEvent: 'SPF Annual Gathering', billUrl: '#', status: 'approved' },
  { id: '9', request: 'Decor And Florals', type: 'Expense', date: '2026-09-16', amount: 22000, relatedEvent: 'Annual Leadership Forum', billUrl: '#', status: 'approved' },
  { id: '10', request: 'Travel Reimbursement', type: 'Expense', date: '2026-09-15', amount: 14000, relatedEvent: 'Learning Event', billUrl: '#', status: 'approved' },
  { id: '11', request: 'Gifts And Mementos', type: 'Expense', date: '2026-09-14', amount: 12000, relatedEvent: 'Forum Event', billUrl: null, status: 'approved' },
  { id: '12', request: 'Hotel Accommodation', type: 'Expense', date: '2026-09-13', amount: 65000, relatedEvent: 'SPF Annual Gathering', billUrl: '#', status: 'approved' },
  { id: '13', request: 'Entertainment', type: 'Expense', date: '2026-09-12', amount: 40000, relatedEvent: 'Forum Event', billUrl: '#', status: 'rejected' },
  { id: '14', request: 'Transport', type: 'Expense', date: '2026-09-11', amount: 9000, relatedEvent: 'Learning Event', billUrl: null, status: 'rejected' },
];

const STATUS_BADGE = {
  pending: { label: 'Pending Approval', Icon: FiClock, className: 'bg-[#fef3c7] border-[#fcd34d] text-[#92400e]' },
  approved: { label: 'Approved', Icon: FiCheckCircle, className: 'bg-[#dcfce7] border-[#86efac] text-[#166534]' },
  rejected: { label: 'Rejected', Icon: FiXCircle, className: 'bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]' },
};

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const COLUMNS = ['Request', 'Type', 'Date', 'Amount', 'Bill', 'Related Event', 'Status', 'Action'];

const formatAmount = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

const StatCard = ({ label, value, Icon, className, iconClassName }) => (
  <div className={`flex-1 min-w-[220px] rounded-[12px] border px-4 py-4 ${className}`}>
    <div className="flex items-start justify-between">
      <span className="text-[12px] font-medium uppercase tracking-wide">{label}</span>
      <Icon className={`text-[20px] ${iconClassName}`} />
    </div>
    <p className="text-[30px] font-bold leading-[1.2] mt-2">{value}</p>
  </div>
);

const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('pending');

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, all: MOCK_APPROVALS.length };
    MOCK_APPROVALS.forEach((a) => { c[a.status] += 1; });
    return c;
  }, []);

  const rows = activeTab === 'all' ? MOCK_APPROVALS : MOCK_APPROVALS.filter((a) => a.status === activeTab);

  const handleReview = (approval) => {
    // TODO: open review flow
    console.log('Review approval', approval.id);
  };

  return (
    <div className="p-6 bg-white font-nunito">
      <div className="mb-6">
        <h2 className="text-[32px] leading-[136%] font-bold text-[#333333] mb-1">Approvals</h2>
        <p className="text-[#777777] font-medium text-[18px] leading-[136%]">Review and manage pending approvals</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard label="Pending Approval" value={counts.pending} Icon={FiClock}
          className="bg-[#fefce8] border-[#fde68a] text-[#c2410c]" iconClassName="text-[#ea580c]" />
        <StatCard label="Approved" value={counts.approved} Icon={FiCheckCircle}
          className="bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]" iconClassName="text-[#10b981]" />
        <StatCard label="Rejected" value={counts.rejected} Icon={FiXCircle}
          className="bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]" iconClassName="text-[#ef4444]" />
        <StatCard label="Total Requests" value={counts.all} Icon={FiFileText}
          className="bg-[#eff6ff] border-[#bfdbfe] text-[#1d4ed8]" iconClassName="text-[#3b82f6]" />
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-[12px] overflow-hidden">
        <div className="flex gap-1 px-2 pt-2 border-b border-[#e5e7eb]">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium rounded-t-[8px] border border-b-0 -mb-px cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-white border-[#e5e7eb] text-[#2563eb]'
                    : 'bg-transparent border-transparent text-[#4b5563] hover:text-[#111827]'
                }`}
              >
                {tab.label}
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-[#dbeafe] text-[#2563eb]' : 'bg-[#f3f4f6] text-[#4b5563]'
                  }`}
                >
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f9fafb]">
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col} className="px-4 py-3 text-[12px] font-medium uppercase text-[#4b5563] whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-[#6b7280] italic">
                    No requests to display.
                  </td>
                </tr>
              )}
              {rows.map((a) => {
                const badge = STATUS_BADGE[a.status];
                return (
                  <tr key={a.id} className="border-t border-[#f1f5f9] hover:bg-[#f9fafb] transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[14px] font-semibold text-[#111827]">
                        {a.isNew && <span className="w-2 h-2 rounded-full bg-[#2563eb]" />}
                        {a.request}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[12px] font-medium text-[#374151] bg-[#f3f4f6] px-2 py-1 rounded-[6px]">{a.type}</span>
                    </td>
                    <td className="px-4 py-4 text-[14px] text-[#6b7280] whitespace-nowrap">{moment(a.date).format('DD MMM YYYY')}</td>
                    <td className="px-4 py-4 text-[14px] font-bold text-[#111827] whitespace-nowrap">{formatAmount(a.amount)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {a.billUrl ? (
                        <a
                          href={a.billUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563eb] hover:underline"
                        >
                          <FiPaperclip className="text-[14px]" />
                          View Bill
                        </a>
                      ) : (
                        <span className="text-[14px] text-[#9ca3af]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[14px] text-[#374151] whitespace-nowrap">{a.relatedEvent}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full border ${badge.className}`}>
                        <badge.Icon className="text-[13px]" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleReview(a)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563eb] bg-[#eff6ff] hover:bg-[#dbeafe] px-3 py-1.5 rounded-[6px] cursor-pointer transition-colors"
                      >
                        Review
                        <FiChevronRight className="text-[13px]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApprovalsPage;
