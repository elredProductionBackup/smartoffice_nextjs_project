'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiPlus, FiChevronRight } from 'react-icons/fi';
import { fetchBudgetTypes } from '@/store/events/budgetChecklist/budgetThunks';

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

const FinanceBudgetPage = () => {
  const router   = useRouter();
  const dispatch = useDispatch();
  const { budgetTypes, loadingTypes } = useSelector((state) => state.budget);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    dispatch(fetchBudgetTypes());
  }, [dispatch]);

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="p-6">

      {/* ── Header Banner ── */}
      <div
        className="rounded-[20px] px-7 py-6 mb-6"
        style={{ background: 'linear-gradient(135deg, #3b63e8, #2445cc)' }}
      >
        {/* Top row */}
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
            className="flex items-center gap-2 bg-white text-[#2445cc] text-[15px] font-semibold px-5 py-2.5 rounded-full cursor-pointer border-none hover:opacity-90 transition-opacity"
          >
            <FiPlus />
            Add Budget
          </button>
        </div>

        {/* Bottom row */}
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
            const s      = CATEGORY_STYLES[item.budgetType] || DEFAULT_STYLE;
            const isOpen = expanded === item.budgetTypeId;

            return (
              <div
                key={item.budgetTypeId}
                className="rounded-[16px] overflow-hidden"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                {/* Row */}
                <div
                  className="flex items-center px-6 py-5 cursor-pointer"
                  onClick={() => toggle(item.budgetTypeId)}
                >
                  {/* Arrow */}
                  <FiChevronRight
                    className="shrink-0 mr-4 text-[18px] transition-transform duration-200"
                    style={{
                      color: s.text,
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  />

                  {/* Name + subtitle */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[18px] font-semibold" style={{ color: s.text }}>
                      {item.budgetType}
                    </div>
                    <div className="text-[13px] text-slate-400 mt-0.5">
                      {item.categoriesCount ?? 0} events
                    </div>
                  </div>

                  {/* Financial columns */}
                  <div className="flex gap-14 items-center">
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Assigned Budget
                      </div>
                      <div className="text-[20px] font-bold" style={{ color: s.text }}>
                        ₹0
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Used
                      </div>
                      <div className="text-[20px] font-bold text-[#6366f1]">
                        ₹0
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Remaining
                      </div>
                      <div className="text-[20px] font-bold text-[#059669]">
                        ₹0
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded content — empty until further defined */}
                {isOpen && (
                  <div className="border-t px-6 py-4" style={{ borderColor: s.border }} />
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
