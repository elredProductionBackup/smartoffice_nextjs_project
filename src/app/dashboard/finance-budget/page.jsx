'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiPlus, FiChevronRight } from 'react-icons/fi';
import { getBudgetReportCategory, getBudgetEventReportCategory } from '@/services/finance.service';
import { getExpenses } from '@/services/expense.service';
import { formatCompactAmount } from '@/utils/currency';
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

const formatRupees = (value) => `₹${formatCompactAmount(value)}`;

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const FinanceBudgetPage = () => {
  const router   = useRouter();
  const [expanded, setExpanded]         = useState(null);
  const [showAddBudget, setShowAddBudget]   = useState(false);
  const [categories, setCategories]     = useState([]);
  const [loadingReport, setLoadingReport] = useState(true);
  const [totals, setTotals] = useState({ assigned: 0, used: 0, remaining: 0 });
  const [eventReportByType, setEventReportByType] = useState({});
  const [loadingEventReport, setLoadingEventReport] = useState({});
  const [generalExpenses, setGeneralExpenses] = useState(null);
  const [loadingGeneralExpenses, setLoadingGeneralExpenses] = useState(false);

  // getBudgetReportCategory is now the source of truth for the category list
  // itself — it returns portfolioName, totalEventCount and remainingAmount
  // per category, plus the page-level totalAssigned/totalUsed/totalRemaining
  // — so it drives the rows directly instead of budgetTypes from getBudgetType.
  const fetchReport = () => {
    getBudgetReportCategory(1, 100)
      .then((response) => {
        const rows = Array.isArray(response?.result) ? response.result : [];
        setCategories(rows);
        setTotals({
          assigned: Number(response?.totalAssigned) || 0,
          used: Number(response?.totalUsed) || 0,
          remaining: Number(response?.totalRemaining) || 0,
        });
      })
      .catch((error) => {
        console.error('Failed to fetch budget report by category:', error);
      })
      .finally(() => {
        setLoadingReport(false);
      });
  };

  // addEditBudget is an upsert keyed by budgetTypeId (no separate budget-record
  // id in its payload), so a repeat submission for the same portfolio replaces
  // its amount on the backend rather than adding to it. Re-fetch the report
  // afterward instead of tracking the new amount locally.
  const handleAddBudget = () => {
    fetchReport();
  };

  const { assigned: totalAssigned, used: totalUsed, remaining: totalRemaining } = totals;

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

  // General expenses aren't filterable by budgetTypeId server-side (only
  // type/eventId/approvedStatus), so fetch the full "general" list once and
  // split it by budgetTypeDetails.budgetTypeId per portfolio client-side.
  const fetchGeneralExpenses = () => {
    if (generalExpenses || loadingGeneralExpenses) return;

    setLoadingGeneralExpenses(true);
    getExpenses({ start: 1, offset: 100, type: 'general' })
      .then((response) => {
        const rows = Array.isArray(response?.result) ? response.result : [];
        setGeneralExpenses(rows);
      })
      .catch((error) => {
        console.error('Failed to fetch general expenses:', error);
        setGeneralExpenses([]);
      })
      .finally(() => {
        setLoadingGeneralExpenses(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const toggle = (id) => {
    setExpanded((prev) => (prev === id ? null : id));
    fetchEventReport(id);
    fetchGeneralExpenses();
  };

  return (
    <div className="p-6">
      {showAddBudget && (
        <AddBudgetFinance
          portfolios={categories}
          onClose={() => setShowAddBudget(false)}
          onAdd={handleAddBudget}
        />
      )}

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
      {loadingReport ? (
        <div className="text-center py-16 text-slate-400 text-[15px]">Loading...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((item) => {
            const s        = CATEGORY_STYLES[item.portfolioName] || DEFAULT_STYLE;
            const isOpen   = expanded === item.budgetTypeId;
            const assigned = Number(item.budgetAmount) || 0;
            const used     = Number(item.totalExpense) || 0;
            const remaining = Number(item.remainingAmount) || 0;

            const eventRows = eventReportByType[item.budgetTypeId] || [];
            const isLoadingEventReport = loadingEventReport[item.budgetTypeId];
            const portfolioTotalBudget  = eventRows.reduce((sum, r) => sum + (Number(r.eventBudget) || 0), 0);
            const portfolioTotalUsed    = eventRows.reduce((sum, r) => sum + (Number(r.eventExpenseAmount) || 0), 0);
            const portfolioTotalRemaining = portfolioTotalBudget - portfolioTotalUsed;

            const categoryGeneralExpenses = (generalExpenses || []).filter(
              (e) => e.budgetTypeDetails?.budgetTypeId === item.budgetTypeId
            );
            const generalTotal = categoryGeneralExpenses.reduce((sum, e) => sum + (Number(e.total) || 0), 0);

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
                      {item.portfolioName}
                    </div>
                    <div className="text-[13px] text-slate-400 mt-0.5">
                      {item.totalEventCount} event{item.totalEventCount === 1 ? '' : 's'}
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
                      {loadingGeneralExpenses ? (
                        <div className="text-center py-6 text-slate-400 text-[13px]">
                          Loading general expenses...
                        </div>
                      ) : categoryGeneralExpenses.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-[13px]">
                          No general expenses in this category
                        </div>
                      ) : (
                        categoryGeneralExpenses.map((expense) => (
                          <div
                            key={expense.expenseId}
                            className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_1.5fr] gap-4 px-5 py-4 border-b border-slate-100 items-center"
                          >
                            <div className="text-[13px] font-medium text-slate-800">{expense.desc}</div>
                            <div className="text-[13px] text-slate-600">{formatDate(expense.createdAt)}</div>
                            <div className="text-[13px] font-semibold" style={{ color: s.text }}>
                              {formatRupees(expense.total)}
                            </div>
                            <div className="text-[12px] text-slate-400">
                              {expense.attachment?.length > 0 ? 'Attached' : '-'}
                            </div>
                            <div className="text-[13px] text-slate-600">{expense.vendorName || '-'}</div>
                            <div className="text-[12px] text-slate-400">{expense.remark || '-'}</div>
                          </div>
                        ))
                      )}

                      {/* Total */}
                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_1.5fr] gap-4 px-5 py-3 bg-slate-50 items-center">
                        <div className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Total</div>
                        <div />
                        <div className="text-[13px] font-bold" style={{ color: s.text }}>{formatRupees(generalTotal)}</div>
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
