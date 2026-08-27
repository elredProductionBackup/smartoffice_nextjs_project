'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiPlus, FiChevronRight } from 'react-icons/fi';
import { fetchBudgetTypes } from '@/store/events/budgetChecklist/budgetThunks';
import { getBudgetReportCategory, getBudgetEventReportCategory } from '@/services/finance.service';
import AddBudgetFinance from '@/_components/UI/AddBudgetFinance';

const CATEGORY_STYLES = {
  'Learning':             { text: '#2563eb', bg: '#eff6ff', border: '#dbeafe' },
  'Forum':                { text: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe' },
  'Spouse Partner Forum': { text: '#be185d', bg: '#fdf2f8', border: '#fce7f3' },
  'Engagement':           { text: '#db2777', bg: '#fff0f6', border: '#fce7f3' },
  'Membership':           { text: '#b45309', bg: '#fffbeb', border: '#fef3c7' },
  'Spouse/Partner':       { text: '#059669', bg: '#f0fdf4', border: '#d1fae5' },
  'Retreat':              { text: '#0891b2', bg: '#ecfeff', border: '#cffafe' },
  'Governance':           { text: '#0e7490', bg: '#f0fdfa', border: '#ccfbf1' },
  'Administration':       { text: '#374151', bg: '#f9fafb', border: '#f3f4f6' },
};

const DEFAULT_STYLE = { text: '#374151', bg: '#f9fafb', border: '#f3f4f6' };

const formatRupees = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const GENERAL_EXPENSES = [
  { id: 1, description: 'Office Supplies',    date: '3 Apr 2026',  amount: '₹8,500',  bill: 'INV-1042', vendor: 'Staples India', remark: 'Stationery for Q1'       },
  { id: 2, description: 'Courier & Postage',  date: '11 Apr 2026', amount: '₹2,300',  bill: 'INV-1058', vendor: 'BlueDart',      remark: 'Documents dispatch'       },
  { id: 3, description: 'Printing & Signage', date: '2 May 2026',  amount: '₹14,750', bill: 'INV-1091', vendor: 'PrintZone',     remark: 'Banners for annual meet'  },
  { id: 4, description: 'Staff Refreshments', date: '18 May 2026', amount: '₹6,200',  bill: 'INV-1104', vendor: 'Café Blend',    remark: 'Monthly team lunch'       },
];

const FinanceBudgetPage = () => {
  const router   = useRouter();
  const dispatch = useDispatch();
  const { budgetTypes, loadingTypes } = useSelector((state) => state.budget);
  const [expanded, setExpanded]         = useState(null);
  const [showAddBudget, setShowAddBudget]   = useState(false);
  const [reportByType, setReportByType] = useState({});
  const [eventReportByType, setEventReportByType] = useState({});
  const [loadingEventReport, setLoadingEventReport] = useState({});

  const fetchReport = () => {
    getBudgetReportCategory(1, 100)
      .then((response) => {
        const rows = Array.isArray(response?.result) ? response.result : [];
        const byType = {};
        rows.forEach((row) => {
          byType[row.budgetTypeId] = row;
        });
        setReportByType(byType);
      })
      .catch((error) => {
        console.error('Failed to fetch budget report by category:', error);
      });
  };

  // addEditBudget is an upsert keyed by budgetTypeId (no separate budget-record
  // id in its payload), so a repeat submission for the same portfolio replaces
  // its amount on the backend rather than adding to it. Re-fetch the report
  // afterward instead of tracking the new amount locally.
  const handleAddBudget = () => {
    fetchReport();
  };

  const totalAssigned = Object.values(reportByType).reduce((sum, r) => sum + (Number(r.budgetAmount) || 0), 0);
  const totalUsed = Object.values(reportByType).reduce((sum, r) => sum + (Number(r.totalExpense) || 0), 0);
  const totalRemaining = totalAssigned - totalUsed;

  const fetchEventReport = (id) => {
    if (eventReportByType[id] || loadingEventReport[id]) return;

    setLoadingEventReport((prev) => ({ ...prev, [id]: true }));
    getBudgetEventReportCategory(id)
      .then((response) => {
        const rows = Array.isArray(response?.result) ? response.result : [];

        // Backend response can repeat the same event (its attendee-count
        // lookup isn't always grouped back down to one row per event) —
        // dedupe by eventId so both the table and the Portfolio Total sum
        // don't double-count it.
        const seen = new Set();
        const dedupedRows = rows.filter((row) => {
          if (seen.has(row.eventId)) return false;
          seen.add(row.eventId);
          return true;
        });

        setEventReportByType((prev) => ({ ...prev, [id]: dedupedRows }));
      })
      .catch((error) => {
        console.error('Failed to fetch budget event report for', id, error);
        setEventReportByType((prev) => ({ ...prev, [id]: [] }));
      })
      .finally(() => {
        setLoadingEventReport((prev) => ({ ...prev, [id]: false }));
      });
  };

  useEffect(() => {
    dispatch(fetchBudgetTypes());
    fetchReport();
  }, [dispatch]);

  // Eagerly fetch every portfolio's event report on load so the collapsed
  // "N events" badge always matches what the expanded table would show,
  // instead of relying on a separate (and inconsistent) events source.
  useEffect(() => {
    budgetTypes.forEach((item) => {
      fetchEventReport(item.budgetTypeId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetTypes]);

  const toggle = (id) => {
    setExpanded((prev) => (prev === id ? null : id));
    fetchEventReport(id);
  };

  return (
    <div className="p-6">
      {showAddBudget && <AddBudgetFinance onClose={() => setShowAddBudget(false)} onAdd={handleAddBudget} />}

      {/* ── Header Banner ── */}
      <div
        className="rounded-[20px] px-7 py-6 mb-6"
        style={{ background: 'linear-gradient(135deg, #3b63e8, #2445cc)' }}
      >
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white text-[14px] font-medium px-5 py-2.5 rounded-full cursor-pointer border-none"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <FiArrowLeft />
            Back to Vision Board
          </button>

          <button
            onClick={() => setShowAddBudget(true)}
            className="flex items-center gap-2 bg-white text-[#2445cc] text-[15px] font-semibold px-5 py-2.5 rounded-full cursor-pointer border-none hover:opacity-90 transition-opacity"
          >
            <FiPlus />
            Add Budget
          </button>
        </div>

        <div className="flex items-end justify-between">
          <h1 className="text-white text-[34px] font-bold m-0 leading-none">
            Budget Management
          </h1>

          <div className="flex gap-3">
            {/* Dynamic Total Assigned */}
            <div
              className="rounded-[14px] px-7 py-4 text-center min-w-[160px]"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <div className="text-white/75 text-[13px] font-medium mb-1.5">Total Assigned</div>
              <div className="text-white text-[22px] font-bold leading-none">{formatRupees(totalAssigned)}</div>
            </div>
            <div
              className="rounded-[14px] px-7 py-4 text-center min-w-[160px]"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <div className="text-white/75 text-[13px] font-medium mb-1.5">Total Used</div>
              <div className="text-white text-[22px] font-bold leading-none">{formatRupees(totalUsed)}</div>
            </div>
            <div
              className="rounded-[14px] px-7 py-4 text-center min-w-[160px]"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <div className="text-white/75 text-[13px] font-medium mb-1.5">Total Remaining</div>
              <div className="text-white text-[22px] font-bold leading-none">{formatRupees(totalRemaining)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Rows ── */}
      {loadingTypes ? (
        <div className="text-center py-16 text-slate-400 text-[15px]">Loading...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {budgetTypes.map((item) => {
            const s        = CATEGORY_STYLES[item.budgetType] || DEFAULT_STYLE;
            const isOpen   = expanded === item.budgetTypeId;
            const report   = reportByType[item.budgetTypeId];
            const assigned = Number(report?.budgetAmount) || 0;
            const used     = Number(report?.totalExpense) || 0;
            const remaining = assigned - used;

            const eventRows = eventReportByType[item.budgetTypeId] || [];
            const isLoadingEventReport = loadingEventReport[item.budgetTypeId];
            const portfolioTotalBudget  = eventRows.reduce((sum, r) => sum + (Number(r.eventBudget) || 0), 0);
            const portfolioTotalUsed    = eventRows.reduce((sum, r) => sum + (Number(r.eventExpenseAmount) || 0), 0);
            const portfolioTotalRemaining = portfolioTotalBudget - portfolioTotalUsed;

            return (
              <div
                key={item.budgetTypeId}
                className="rounded-[16px] overflow-hidden"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                {/* Header row */}
                <div
                  className="flex items-center px-6 py-5 cursor-pointer"
                  onClick={() => toggle(item.budgetTypeId)}
                >
                  <FiChevronRight
                    className="shrink-0 mr-4 text-[18px] transition-transform duration-200"
                    style={{ color: s.text, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-[18px] font-semibold" style={{ color: s.text }}>
                      {item.budgetType}
                    </div>
                    <div className="text-[13px] text-slate-400 mt-0.5">
                      {isLoadingEventReport ? 'Loading…' : `${eventRows.length} events`}
                    </div>
                  </div>

                  <div className="flex gap-14 items-center">
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Assigned Budget
                      </div>
                      <div className="text-[20px] font-bold" style={{ color: s.text }}>
                        {formatRupees(assigned)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Used
                      </div>
                      <div className="text-[20px] font-bold text-[#6366f1]">{formatRupees(used)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Remaining
                      </div>
                      <div className="text-[20px] font-bold text-[#059669]">{formatRupees(remaining)}</div>
                    </div>
                  </div>
                </div>

                {/* Expanded section */}
                {isOpen && (
                  <div className="border-t bg-white pb-5" style={{ borderColor: s.border }}>

                    {/* ── EVENT RELATED ── */}
                    <div className="px-6 pt-4 pb-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Event Related</div>
                    </div>

                    {/* Event table header */}
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-slate-100">
                      {['Event Name', 'Date', 'Assigned Budget', 'Used Budget', 'Remaining', 'Status'].map((col) => (
                        <div key={col} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                          {col}
                        </div>
                      ))}
                    </div>

                    {isLoadingEventReport ? (
                      <div className="text-center py-6 text-slate-400 text-[13px]">
                        Loading events...
                      </div>
                    ) : eventRows.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-[13px]">
                        No events in this category
                      </div>
                    ) : (
                      <>
                        {eventRows.map((event) => {
                          const eventAssigned = Number(event.eventBudget) || 0;
                          const eventUsed     = Number(event.eventExpenseAmount) || 0;
                          const eventRemaining = eventAssigned - eventUsed;
                          const overBudget = eventUsed > eventAssigned;

                          return (
                            <div
                              key={event.eventId}
                              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-slate-100 items-center"
                            >
                              <div>
                                <div className="text-[14px] font-semibold text-slate-800">{event.eventName}</div>
                                {event.eventLocation?.location && (
                                  <div className="text-[12px] text-slate-400 mt-0.5">{event.eventLocation.location}</div>
                                )}
                              </div>
                              <div className="text-[14px] text-slate-600">{formatDate(event.startDateTime)}</div>
                              <div className="text-[14px] font-semibold" style={{ color: s.text }}>{formatRupees(eventAssigned)}</div>
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
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-slate-200 items-center bg-slate-50">
                          <div className="text-[14px] font-bold text-slate-700 col-span-2">Portfolio Total</div>
                          <div className="text-[14px] font-bold" style={{ color: s.text }}>{formatRupees(portfolioTotalBudget)}</div>
                          <div className="text-[14px] font-bold text-[#6366f1]">{formatRupees(portfolioTotalUsed)}</div>
                          <div className="text-[14px] font-bold text-[#059669]">{formatRupees(portfolioTotalRemaining)}</div>
                          <div />
                        </div>
                      </>
                    )}

                    {/* ── GENERAL ── */}
                    <div className="flex items-center gap-4 px-6 pt-5 pb-1">
                      <div className="flex-1 border-t border-slate-200" />
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">General</div>
                      <div className="flex-1 border-t border-slate-200" />
                    </div>

                    {/* General table — rounded bordered card */}
                    <div className="mx-6 border border-slate-200 rounded-[12px] overflow-hidden">

                      {/* Header */}
                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_1.5fr] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200">
                        {['Description', 'Date', 'Amount (₹)', 'Bill', 'Vendor', 'Remark'].map((col) => (
                          <div key={col} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            {col}
                          </div>
                        ))}
                      </div>

                      {/* Rows */}
                      {GENERAL_EXPENSES.map((row) => (
                        <div
                          key={row.id}
                          className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_1.5fr] gap-4 px-5 py-4 border-b border-slate-100 items-center"
                        >
                          <div className="text-[13px] font-medium text-slate-800">{row.description}</div>
                          <div className="text-[13px] text-slate-600">{row.date}</div>
                          <div className="text-[13px] font-semibold" style={{ color: s.text }}>{row.amount}</div>
                          <div className="text-[12px] text-slate-400">{row.bill}</div>
                          <div className="text-[13px] text-slate-600">{row.vendor}</div>
                          <div className="text-[12px] text-slate-400">{row.remark}</div>
                        </div>
                      ))}

                      {/* Total */}
                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_1.5fr] gap-4 px-5 py-3 bg-slate-50 items-center">
                        <div className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Total</div>
                        <div />
                        <div className="text-[13px] font-bold" style={{ color: s.text }}>₹31,750</div>
                        <div /><div /><div />
                      </div>

                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FinanceBudgetPage;
