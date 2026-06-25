import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

export const DEFAULT_EVENT_BUDGET_CATEGORIES = [
  { key: 'printing', name: 'Printing & Stationary', value: 2, color: '#3b82f6' },
  { key: 'venue', name: 'Venue Rental', value: 45, color: '#885df1' },
  { key: 'accommodation', name: 'Accommodation Charges', value: 20, color: '#ec4899' },
  { key: 'food', name: 'Food & Beverages', value: 15, color: '#f59e0b' },
  { key: 'resource', name: 'Resource Cost', value: 8, color: '#14b8a6' },
  { key: 'management', name: 'Event Management', value: 7, color: '#06b6d4' },
  {
    key: 'reimbursement',
    name: 'Reimbursement of Event Expenditure (Misc)',
    value: 2,
    color: '#6366f1',
  },
  { key: 'training', name: 'Training Expenses', value: 1, color: '#84cc16' },
];

function formatIndianCurrency(amount) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export default function EventBudgetPopup({
  isOpen,
  onClose,
  onSave,
  totalBudget,
  categories = DEFAULT_EVENT_BUDGET_CATEGORIES,
  mode = 'distribution',
}) {
  const [localCategories, setLocalCategories] = useState([]);
  const [localTotalBudget, setLocalTotalBudget] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalCategories(categories);
      setLocalTotalBudget(totalBudget ? String(totalBudget) : '');
    }
  }, [isOpen, categories, totalBudget]);

  if (!isOpen) return null;

  const handleTotalBudgetChange = (value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setLocalTotalBudget(value);
    }
  };

  const handlePercentChange = (key, value) => {
    setLocalCategories((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, value: value === '' ? '' : Number(value) } : item
      )
    );
  };

  const handleSave = () => {
    if (mode === 'edit') {
      const amount = Number(localTotalBudget);
      if (!amount || amount <= 0) return;
      onSave?.(amount);
    } else {
      onSave?.(localCategories);
    }
    onClose?.();
  };

  const parsedTotalBudget = Number(localTotalBudget) || Number(totalBudget) || 0;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm font-nunito p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-[560px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8ECEF] shrink-0">
          <h2 className="text-[20px] font-bold text-[#2B7FFF]">
            {mode === 'edit'
              ? 'Edit Budget'
              : `Budget: ${formatIndianCurrency(parsedTotalBudget)}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:bg-gray-100 hover:text-[#33] transition-colors border-0 bg-transparent cursor-pointer outline-none"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {mode === 'edit' ? (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <label className="block text-[15px] font-semibold text-[#333333] mb-3">
              Enter budget amount
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Enter amount"
              value={localTotalBudget}
              onChange={(e) => handleTotalBudgetChange(e.target.value)}
              className="w-full h-[52px] px-4 rounded-xl bg-[#F5F7FA] border border-[#DDDDDD] outline-none focus:border-[#2B7FFF] text-[18px] font-semibold text-[#333333] placeholder:text-[#CCCCCC]"
            />
            {parsedTotalBudget > 0 && (
              <p className="mt-3 text-[14px] font-medium text-[#777777]">
                Budget:{' '}
                <span className="text-[#2B7FFF] font-bold">
                  {formatIndianCurrency(parsedTotalBudget)}
                </span>
              </p>
            )}
          </div>
        ) : (
        /* Scrollable list */
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          {localCategories.map((item, index) => {
            const percent = Number(item.value) || 0;
            const amount = (parsedTotalBudget * percent) / 100;

            return (
              <div
                key={item.key}
                className="bg-[#F5F7FA] rounded-xl px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[15px] font-semibold text-[#333333] leading-snug flex-1 min-w-0">
                    {index + 1}. {item.name}
                  </span>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[18px] font-bold text-[#2B7FFF] leading-tight">
                      {formatIndianCurrency(amount)}
                    </span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.value}
                        readOnly
                        className="w-[48px] h-[28px] text-center border border-[#DDDDDD] rounded-[4px] bg-[#F5F7FA] text-[13px] font-medium text-[#777777] outline-none cursor-default select-none"
                      />
                      <span className="text-[13px] font-medium text-[#777777]">
                        % of budget
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Footer */}
        {/* <div className="flex items-center justify-between gap-4 px-6 py-5 border-t border-[#E8ECEF] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 max-w-[200px] h-[44px] rounded-full border border-[#E2E8F0] bg-white text-[#333333] text-[15px] font-semibold cursor-pointer hover:bg-gray-50 transition-colors outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 max-w-[220px] h-[44px] rounded-full bg-[#2B7FFF] text-white text-[15px] font-semibold cursor-pointer hover:bg-[#1a6fe6] transition-colors border-0 outline-none"
          >
            {mode === 'edit' ? 'Save & Send for Approval' : 'Save Distribution'}
          </button>
        </div> */}
      </div>
    </div>
  );
}
