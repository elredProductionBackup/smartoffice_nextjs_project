'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FiEdit2, FiChevronDown, FiPlus } from 'react-icons/fi';
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
import EventCostingCard from './UI/EventCostingCards';

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



const EXPENSE_CATEGORIES = [
  'Venue Rental',
  'Food & Beverages',
  'Accommodation Charges',
  'Printing & Stationary',
  'Training Expenses',
  'Resource Cost',
  'Event Management',
  'Reimbursement of Event Expenditure (Misc)',
];

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

  const [expenseSections, setExpenseSections] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (dropdownOpen) {
      const timer = setTimeout(() => {
        dropdownMenuRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dropdownOpen]);

  const handleAddNewSection = () => {
    if (!selectedCategory) return;
    const newSection = {
      id: Date.now(),
      title: selectedCategory,
    };
    setExpenseSections((prev) => [...prev, newSection]);
    setSelectedCategory('');
  };

  const removeExpenseSection = (id) => {
    setExpenseSections((prev) => prev.filter((section) => section.id !== id));
  };

  return (
    <div className={`flex flex-col w-full min-w-0 ${dropdownOpen ? 'pb-[280px]' : ''}`}>

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
      <div className="w-full flex items-center gap-4 mb-6">
        <div className="flex-1 h-[1px] bg-[#EEEEEE]" />
      </div>

      {/* ================ Add Expense Category Input Row ============================= */}
      <div className="w-full flex items-center gap-3 mb-8 font-nunito">
        <div ref={dropdownRef} className="flex-1 relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className={`w-full flex items-center justify-between px-4 h-[48px] border rounded-[14px] bg-white text-[15px] cursor-pointer outline-none text-left transition-colors ${
              dropdownOpen ? 'border-[#2B7FFF]' : 'border-[#E2E8F0]'
            }`}
            style={{ color: !selectedCategory ? '#777777' : '#333333' }}
          >
            <span>{selectedCategory || 'Select Expense Category'}</span>
            <FiChevronDown
              className="ml-2 shrink-0 text-slate-500 transition-transform duration-200"
              style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {dropdownOpen && (
            <div
              ref={dropdownMenuRef}
              className="absolute top-[calc(100%+6px)] left-0 w-full bg-white rounded-[14px] z-[9999] overflow-y-auto p-2 border border-[#E2E8F0]"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1)', maxHeight: '280px' }}
            >
              <button
                type="button"
                onMouseDown={() => {
                  setSelectedCategory('');
                  setDropdownOpen(false);
                }}
                className={`block w-full text-left px-4 py-2.5 cursor-pointer border-none rounded-lg transition-colors duration-150 font-nunito font-semibold text-[14px] ${
                  !selectedCategory
                    ? 'bg-[#F2F7FF] text-[#2B7FFF]'
                    : 'bg-transparent text-[#777777] hover:bg-slate-50'
                }`}
              >
                Select Expense Category
              </button>
              {EXPENSE_CATEGORIES.map((opt) => {
                const isSelected = opt === selectedCategory;
                return (
                  <button
                    key={opt}
                    type="button"
                    onMouseDown={() => {
                      setSelectedCategory(opt);
                      setDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2.5 cursor-pointer border-none rounded-lg transition-colors duration-150 font-nunito font-semibold text-[14px] ${
                      isSelected
                        ? 'bg-[#F2F7FF] text-[#2B7FFF]'
                        : 'bg-transparent text-[#333333] hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddNewSection}
          className="inline-flex items-center justify-center gap-2 h-[48px] px-5 border border-[#E2E8F0] rounded-[14px] bg-white text-[#777777] hover:bg-slate-50 transition-colors font-nunito font-semibold text-[14px] whitespace-nowrap outline-none cursor-pointer"
        >
          <FiPlus className="w-4 h-4 text-[#777777]" />
          Add new item
        </button>
      </div>

      {/* ================ Expense Sections ============================================ */}
      <div className="w-full flex flex-col gap-4">
        {expenseSections.map((section) => (
          <EventCostingCard
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
