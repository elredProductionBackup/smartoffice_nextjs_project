'use client';
import React, { useState } from 'react';
import { FiEdit2, FiChevronDown } from 'react-icons/fi';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import AddBudgets from './AddBudgets';

const PORTFOLIO_BUDGET = 1200000;
const EVENT_BUDGET_UTILIZED = 200000;
const UTILIZATION_PERCENT = 20.0;

const EVENT_BUDGET_DISTRIBUTION = [
  { name: 'Venue Rental', value: 45, color: '#885df1' },
  { name: 'Accommodation Charges', value: 20, color: '#ec4899' },
  { name: 'Food & Beverages', value: 15, color: '#f59e0b' },
  { name: 'Resource Cost', value: 8, color: '#14b8a6' },
  { name: 'Event Management', value: 7, color: '#06b6d4' },
  { name: 'Printing & Stationary', value: 2, color: '#3b82f6' },
  { name: 'Reimbursement of Event Expenditure (Misc)', value: 2, color: '#6366f1' },
  { name: 'Training Expenses', value: 1, color: '#84cc16' },
];

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

// ─── Reusable Expense Section ───────────────────────────────────────────────
const ExpenseSection = ({ title }) => {
  const [items, setItems] = useState([
    { id: 1, narrative: '', estimatedCost: '', advancePayment: '', balancePayment: '', billFile: null },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), narrative: '', estimatedCost: '', advancePayment: '', balancePayment: '', billFile: null },
    ]);
  };

  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleFileChange = (id, file) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, billFile: file } : item)));
  };

  return (
    <div
      className="w-full rounded-[16px] mb-6 p-[30px] "
      style={{ backgroundColor: '#f8f8ff' }}
    >
      {/* Section title */}
      <h2 className="text-[24px] font-[700] text-[#333333] mb-5">{title}</h2>

      {items.map((item) => (
        <div key={item.id} className="mb-6">
          <div className='  flex flex-row justify-between'>
            <div className=' w-[80%]'>
                                    {/* Row 1: Narrative + Upload + Send for approval */}
          <div className="flex items-end gap-4 mb-4 ">
            {/* Narrative */}
            <div className="flex flex-col flex-1">
              <label className="text-[14px] font-[400] text-[#111827] mb-1">Narrative</label>
              <input
                type="text"
                placeholder="Enter narration"
                value={item.narrative}
                onChange={(e) => updateItem(item.id, 'narrative', e.target.value)}
                className="h-[44px] rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] px-3 text-[14px] text-[#666666] outline-none focus:border-[#5597ED]"
              />
            </div>

            {/* Upload bills */}
            <div className="flex flex-col">
              <label className="text-[14px] font-[400] text-[#111827] mb-1">Upload bills</label>
              <label
                htmlFor={`upload-${item.id}`}
                className="h-[44px] w-[180px] flex items-center justify-center gap-2 rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] cursor-pointer text-[14px] font-[500] text-[#666666] hover:bg-gray-50"
              >
                <span>Upload file</span>
                <img src="/image/upload_file.svg" alt="upload" width={18} height={18} />
                <input
                  id={`upload-${item.id}`}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileChange(item.id, e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {/* Row 2: Estimated cost, Advance payment, Balance payment */}
          <div className="flex gap-4 mb-4 ">
            <div className="flex flex-col flex-1">
              <label className="text-[14px] font-[400] text-[#111827] mb-1">Estimated cost</label>
              <input
                type="text"
                placeholder="Enter Value"
                value={item.estimatedCost}
                onChange={(e) => updateItem(item.id, 'estimatedCost', e.target.value)}
                className="h-[49px] min-w-[260px] rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] px-3 text-[14px] text-[#666666] outline-none focus:border-[#5597ED]"
              />
            </div>
            <div className="flex flex-col flex-1">
              <label className="text-[14px] font-[500] text-[#111827] mb-1">Advance payment</label>
              <input
                type="text"
                placeholder="Enter Value"
                value={item.advancePayment}
                onChange={(e) => updateItem(item.id, 'advancePayment', e.target.value)}
                className="h-[49px] min-w-[260px] rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] px-3 text-[14px] text-[#666666] outline-none focus:border-[#5597ED]"
              />
            </div>
            <div className="flex flex-col flex-1">
              <label className="text-[14px] font-[500] text-[#111827] mb-1">Balance payment</label>
              <input
                type="text"
                placeholder="Enter Value"
                value={item.balancePayment}
                onChange={(e) => updateItem(item.id, 'balancePayment', e.target.value)}
                className="h-[49px] min-w-[260px] rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] px-3 text-[14px] text-[#666666] outline-none focus:border-[#5597ED]"
              />
            </div>
          </div>
            </div>

                      {/* Send for approval */}
            <button
              className="h-[40px] w-[200px] rounded-full mt-6 text-white text-[20px] font-[500] cursor-pointer shrink-0"
              style={{ background: 'linear-gradient(95.15deg, #5597ED 3.84%, #00449C 96.38%)' }}
            >
              Save Details
            </button>
          </div>

          {/* Approved status */}
          <div className="text-[20px] font-[600] text-[#515161]">
            Approved status:
          </div>
        </div>
      ))}

      {/* Add new item button */}
      <button
        onClick={addItem}
        className="mt-2 h-[40px] w-[180px]  rounded-full border border-[#666666] text-[20px] font-[500] text-[#666666] flex items-center justify-center gap-1 cursor-pointer"
      >
        <span className="text-[25px] mr-[6px] leading-none">+</span> Add new item
      </button>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const Eventcosting = () => {
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);

  const handleBudgetSave = (data) => {
    console.log('Budget saved:', data);
    // You can add more logic here to handle the saved budget data
  };

  return (
    <div className='flex flex-col'>

      {/* ================ Portfolio budget & distribution ============================== */}
      <div className="w-full max-w-[1210px] grid grid-cols-1 lg:grid-cols-2 gap-8 mb-[60px] font-nunito">
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
              className="inline-flex items-center justify-center gap-2 h-[44px] px-5 rounded-full bg-[#2B7FFF] text-white text-[15px] font-semibold cursor-pointer hover:bg-[#1a6fe6] transition-colors border-0 outline-none"
            >
              Event Budget
              <FiChevronDown className="w-4 h-4" />
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
                  data={EVENT_BUDGET_DISTRIBUTION}
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
                  {EVENT_BUDGET_DISTRIBUTION.map((entry, index) => (
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
            {EVENT_BUDGET_DISTRIBUTION.map((item) => (
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
      <div className="w-[1210px] flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2 cursor-pointer">
          <span className="text-[24px] font-[600] text-[#333333]">Expenses</span>
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L7 7L13 1" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 h-[1px] bg-[#EEEEEE]" />
      </div>

      {/* ================ Expense Sections ============================================ */}
      <div className="w-[1210px] flex flex-col gap-4">
        <ExpenseSection title="Catering Services" />
        <ExpenseSection title="Recce costing" />
      </div>

      <AddBudgets 
        isOpen={isBudgetOpen} 
        onClose={() => setIsBudgetOpen(false)} 
        onSave={handleBudgetSave}
      />
    </div>
  );
};

export default Eventcosting;
