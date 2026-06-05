'use client';
import React, { useState } from 'react';
import { FiEdit2, FiChevronDown, FiX, FiUpload } from 'react-icons/fi';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import AddBudgets from './AddBudgets';
import EventBudgetPopup, {
  DEFAULT_EVENT_BUDGET_CATEGORIES,
} from './EventBudgetPopup';

const PORTFOLIO_BUDGET = 1200000;
const EVENT_BUDGET_UTILIZED = 200000;
const UTILIZATION_PERCENT = 20.0;

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  name,
  value,
  payload,
}) => {
  const radius = outerRadius + 36;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const labelColor = payload?.color || '#555';

  return (
    <text
      x={x}
      y={y}
      fill={labelColor}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-nunito font-semibold text-[10px]"
    >
      {`${name}: ${value}%`}
    </text>
  );
};

function formatIndianCurrency(amount) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

const EXPENSE_INPUT_CLASS =
  'h-[44px] w-full rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] px-3 text-[14px] text-[#666666] outline-none focus:border-[#5597ED] font-nunito';
const EXPENSE_LABEL_CLASS = 'text-[14px] font-medium text-[#111827] mb-1 font-nunito';

// ─── Reusable Expense Section (Venue Rental style card) ───────────────────────
const ExpenseSection = ({ title, onRemove, approvalStatus = 'Pending' }) => {
  const [narrative, setNarrative] = useState('');
  const [cost, setCost] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');
  const [balancePayment, setBalancePayment] = useState('');
  const [subItems, setSubItems] = useState([
    { id: 1, description: '', attendees: '', amount: '' },
  ]);

  const addSubItem = () => {
    setSubItems((prev) => [
      ...prev,
      { id: Date.now(), description: '', attendees: '', amount: '' },
    ]);
  };

  const removeSubItem = (id) => {
    setSubItems((prev) =>
      prev.length > 1 ? prev.filter((item) => item.id !== id) : prev
    );
  };

  const updateSubItem = (id, field, value) => {
    setSubItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const uploadId = `upload-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="w-full rounded-[12px] border border-[#E8ECEF] bg-white p-6 mb-6 font-nunito shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <h2 className="text-[20px] font-bold text-[#1e3a8a] leading-tight">{title}</h2>
        <button
          type="button"
          onClick={onRemove}
          className="text-[#EF4444] hover:text-[#DC2626] bg-transparent border-0 p-1 cursor-pointer outline-none shrink-0"
          aria-label={`Remove ${title}`}
        >
          <FiX className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Row 1: Narrative + Upload */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex flex-col flex-1 min-w-0">
          <label className={EXPENSE_LABEL_CLASS}>Narrative</label>
          <input
            type="text"
            placeholder="Enter narration"
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            className={EXPENSE_INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col lg:w-[280px] shrink-0">
          <label className={EXPENSE_LABEL_CLASS}>Upload Proforma/Final bill</label>
          <label
            htmlFor={uploadId}
            className={`${EXPENSE_INPUT_CLASS} flex items-center justify-center gap-2 cursor-pointer hover:bg-[#dfe3e8] transition-colors`}
          >
            <span className="text-[14px] font-medium text-[#666666]">Upload file</span>
            <FiUpload className="w-[18px] h-[18px] text-[#666666]" />
            <input id={uploadId} type="file" className="hidden" />
          </label>
        </div>
      </div>

      {/* Row 2: Cost, Advance, Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="flex flex-col">
          <label className={EXPENSE_LABEL_CLASS}>Cost</label>
          <input
            type="text"
            placeholder="Enter Value"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className={EXPENSE_INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col">
          <label className={EXPENSE_LABEL_CLASS}>Advance payment</label>
          <input
            type="text"
            placeholder="Enter Value"
            value={advancePayment}
            onChange={(e) => setAdvancePayment(e.target.value)}
            className={EXPENSE_INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col">
          <label className={EXPENSE_LABEL_CLASS}>Balance payment</label>
          <input
            type="text"
            placeholder="Enter Value"
            value={balancePayment}
            onChange={(e) => setBalancePayment(e.target.value)}
            className={EXPENSE_INPUT_CLASS}
          />
        </div>
      </div>

      {/* Sub-items */}
      <div className="flex flex-col gap-3 mb-4">
        {subItems.map((sub) => (
          <div key={sub.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => removeSubItem(sub.id)}
              className="w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-[#666666] bg-transparent border-0 p-0 cursor-pointer shrink-0 outline-none"
              aria-label="Remove sub-item"
            >
              <FiX className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder="Description (e.g., Day 1 Lunch)"
              value={sub.description}
              onChange={(e) => updateSubItem(sub.id, 'description', e.target.value)}
              className={`${EXPENSE_INPUT_CLASS} flex-[2] min-w-0`}
            />
            <input
              type="text"
              placeholder="No. of Attendees"
              value={sub.attendees}
              onChange={(e) => updateSubItem(sub.id, 'attendees', e.target.value)}
              className={`${EXPENSE_INPUT_CLASS} flex-1 min-w-[120px]`}
            />
            <input
              type="text"
              placeholder="Amount"
              value={sub.amount}
              onChange={(e) => updateSubItem(sub.id, 'amount', e.target.value)}
              className={`${EXPENSE_INPUT_CLASS} flex-1 min-w-[100px]`}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addSubItem}
          className="w-full h-[44px] rounded-[8px] border-2 border-dashed border-[#C5CCD6] bg-transparent text-[14px] font-medium text-[#666666] flex items-center justify-center gap-1 cursor-pointer hover:border-[#5597ED] hover:text-[#5597ED] transition-colors outline-none"
        >
          + Add sub-item (e.g., Day 1, Day 2)
        </button>
      </div>

      {/* Footer: status + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#F1F5F9]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[15px] font-semibold text-[#515161]">Approved status:</span>
          <span className="inline-flex items-center px-3 py-0.5 rounded-md text-[13px] font-semibold bg-[#FEF7E0] text-[#B06000]">
            {approvalStatus}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="h-[40px] px-5 rounded-full border-2 border-[#2B7FFF] bg-white text-[#2B7FFF] text-[14px] font-semibold cursor-pointer hover:bg-[#F2F7FF] transition-colors outline-none whitespace-nowrap"
          >
            Send Reminder
          </button>
          <button
            type="button"
            className="h-[40px] px-5 rounded-full bg-[#2B7FFF] text-white text-[14px] font-semibold cursor-pointer hover:bg-[#1a6fe6] transition-colors border-0 outline-none whitespace-nowrap"
          >
            Send for approval
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const Eventcosting = () => {
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isEventBudgetOpen, setIsEventBudgetOpen] = useState(false);
  const [budgetDistribution, setBudgetDistribution] = useState(
    DEFAULT_EVENT_BUDGET_CATEGORIES
  );

  const handleBudgetSave = (data) => {
    console.log('Budget saved:', data);
  };

  const handleEventBudgetSave = (categories) => {
    setBudgetDistribution(categories);
  };

  const [expenseSections, setExpenseSections] = useState([
    { id: 1, title: 'Catering Services' },
    { id: 2, title: 'Recce costing' },
  ]);

  const removeExpenseSection = (id) => {
    setExpenseSections((prev) => prev.filter((section) => section.id !== id));
  };

  return (
    <div className="flex flex-col w-full min-w-0">

      {/* ================ Portfolio budget & distribution ============================== */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 mb-[60px] font-nunito">
        {/* Left – Portfolio Budget */}
        <div className="flex flex-col">
          <p className="text-[14px] font-medium text-[#777777] mb-1">Portfolio Budget</p>
          <h1 className="text-[32px] font-bold text-[#333333] mb-5 leading-tight">
            {formatIndianCurrency(PORTFOLIO_BUDGET)}
          </h1>

          <div className="bg-[#F2F7FF] rounded-2xl px-5 py-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] font-medium text-[#333333]">
                Event Budget Utilized
              </span>
              <span className="text-[14px] font-bold text-[#2B7FFF]">
                {UTILIZATION_PERCENT.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-[#2B7FFF] transition-all duration-300"
                style={{ width: `${UTILIZATION_PERCENT}%` }}
              />
            </div>
            <p className="text-[12px] font-medium text-[#777777]">
              {formatIndianCurrency(EVENT_BUDGET_UTILIZED)} of{' '}
              {formatIndianCurrency(PORTFOLIO_BUDGET)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsBudgetOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-[44px] px-5 rounded-full border-2 border-[#2B7FFF] bg-white text-[#2B7FFF] text-[15px] font-semibold cursor-pointer hover:bg-[#F2F7FF] transition-colors outline-none"
            >
              <FiEdit2 className="w-4 h-4" />
              Edit Budget
            </button>
            <button
              type="button"
              onClick={() => setIsEventBudgetOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-[44px] px-5 rounded-full bg-[#2B7FFF] text-white text-[15px] font-semibold cursor-pointer hover:bg-[#1a6fe6] transition-colors border-0 outline-none"
            >
              Event Budget
            </button>
          </div>
        </div>

        {/* Right – Event Budget Distribution */}
        <div className="flex flex-col">
          <p className="text-[14px] font-medium text-[#777777] mb-4">
            Event Budget Distribution
          </p>

          <div className="w-full h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={90}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                  labelLine
                  label={renderCustomLabel}
                >
                  {budgetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '13px',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 mt-2">
            {budgetDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[12px] font-medium text-[#333333] truncate">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================ Expenses Header ============================================ */}
      <div className="w-full flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2 cursor-pointer">
          <span className="text-[24px] font-[600] text-[#333333]">Expenses</span>
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L7 7L13 1" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 h-[1px] bg-[#EEEEEE]" />
      </div>

      {/* ================ Expense Sections ============================================ */}
      <div className="w-full flex flex-col gap-4">
        {expenseSections.map((section) => (
          <ExpenseSection
            key={section.id}
            title={section.title}
            onRemove={() => removeExpenseSection(section.id)}
          />
        ))}
      </div>

      <AddBudgets
        isOpen={isBudgetOpen}
        onClose={() => setIsBudgetOpen(false)}
        onSave={handleBudgetSave}
      />

      <EventBudgetPopup
        isOpen={isEventBudgetOpen}
        onClose={() => setIsEventBudgetOpen(false)}
        onSave={handleEventBudgetSave}
        totalBudget={PORTFOLIO_BUDGET}
        categories={budgetDistribution}
      />
    </div>
  );
};

export default Eventcosting;
