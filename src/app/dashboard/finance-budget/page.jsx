'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiPlus, FiChevronRight } from 'react-icons/fi';
import { fetchBudgetTypes } from '@/store/events/budgetChecklist/budgetThunks';
import { getEventsList } from '@/services/events.service';
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

const HEADER_STATS = [
  { label: 'Total Assigned', amount: '₹1,67,75,000' },
  { label: 'Total Used',     amount: '₹1,55,74,183' },
  { label: 'Total Remaining',amount: '₹12,00,817'   },
];

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const FinanceBudgetPage = () => {
  const router   = useRouter();
  const dispatch = useDispatch();
  const { budgetTypes, loadingTypes } = useSelector((state) => state.budget);
  const [expanded, setExpanded]         = useState(null);
  const [eventsByType, setEventsByType]   = useState({});
  const [showAddBudget, setShowAddBudget]   = useState(false);
  const [assignedBudgets, setAssignedBudgets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('smartoffice_assigned_budgets') || '{}');
    } catch {
      return {};
    }
  });

  const handleAddBudget = (portfolioId, amount) => {
    setAssignedBudgets((prev) => {
      const updated = { ...prev, [portfolioId]: (prev[portfolioId] || 0) + amount };
      localStorage.setItem('smartoffice_assigned_budgets', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    dispatch(fetchBudgetTypes());
  }, [dispatch]);

  useEffect(() => {
    const networkClusterCode = localStorage.getItem('networkClusterCode');
    getEventsList({ networkClusterCode, start: 1, offset: 500, filterBy: 'all' })
      .then((res) => {
        const events = res.data?.result || [];
        const grouped = {};
        events.forEach((event) => {
          const typeId = event.eventType?.budgetTypeId;
          if (typeId) {
            if (!grouped[typeId]) grouped[typeId] = [];
            grouped[typeId].push(event);
          }
        });
        setEventsByType(grouped);
      })
      .catch(() => {});
  }, []);

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

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
            {HEADER_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[14px] px-7 py-4 text-center min-w-[160px]"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <div className="text-white/75 text-[13px] font-medium mb-1.5">{stat.label}</div>
                <div className="text-white text-[22px] font-bold leading-none">{stat.amount}</div>
              </div>
            ))}
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
            const typeEvents = eventsByType[item.budgetTypeId] || [];

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
                      {typeEvents.length} events
                    </div>
                  </div>

                  <div className="flex gap-14 items-center">
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Assigned Budget
                      </div>
                      <div className="text-[20px] font-bold" style={{ color: s.text }}>
                        {assignedBudgets[item.budgetTypeId]
                          ? `₹${assignedBudgets[item.budgetTypeId].toLocaleString('en-IN')}`
                          : '₹0'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Used
                      </div>
                      <div className="text-[20px] font-bold text-[#6366f1]">₹0</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Remaining
                      </div>
                      <div className="text-[20px] font-bold text-[#059669]">₹0</div>
                    </div>
                  </div>
                </div>

                {/* Expanded events table */}
                {isOpen && (
                  <div className="border-t bg-white" style={{ borderColor: s.border }}>
                    {/* Table header */}
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-slate-100">
                      {['Event Name', 'Date', 'Assigned Budget', 'Used Budget', 'Remaining', 'Status'].map((col) => (
                        <div key={col} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                          {col}
                        </div>
                      ))}
                    </div>

                    {typeEvents.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-[13px]">
                        No events in this category
                      </div>
                    ) : (
                      <>
                        {typeEvents.map((event) => (
                          <div
                            key={event.eventId}
                            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-slate-100 items-center"
                          >
                            <div>
                              <div className="text-[14px] font-semibold text-slate-800">{event.eventName}</div>
                              {event.eventLocation && (
                                <div className="text-[12px] text-slate-400 mt-0.5">{event.eventLocation}</div>
                              )}
                            </div>
                            <div className="text-[14px] text-slate-600">{formatDate(event.startDateTime)}</div>
                            <div className="text-[14px] font-semibold" style={{ color: s.text }}>₹0</div>
                            <div className="text-[14px] font-semibold text-[#6366f1]">₹0</div>
                            <div className="text-[14px] font-semibold text-[#059669]">₹0</div>
                            <div>
                              <span className={`text-[12px] font-medium px-3 py-1 rounded-full border ${
                                event.isDraft
                                  ? 'text-amber-600 bg-amber-50 border-amber-200'
                                  : 'text-green-600 bg-green-50 border-green-200'
                              }`}>
                                {event.isDraft ? 'Draft' : 'On Track'}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Portfolio Total */}
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center">
                          <div className="text-[14px] font-bold text-slate-700 col-span-2">Portfolio Total</div>
                          <div className="text-[14px] font-bold" style={{ color: s.text }}>₹0</div>
                          <div className="text-[14px] font-bold text-[#6366f1]">₹0</div>
                          <div className="text-[14px] font-bold text-[#059669]">₹0</div>
                          <div />
                        </div>
                      </>
                    )}
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
