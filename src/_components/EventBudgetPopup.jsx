'use client';

import React from 'react';
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
}) {
  if (!isOpen) return null;

  const handleSave = () => {
    onSave?.(categories);
    onClose?.();
  };

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
            Budget: {formatIndianCurrency(totalBudget)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:bg-gray-100 hover:text-[#333] transition-colors border-0 bg-transparent cursor-pointer outline-none"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          {categories.map((item, index) => {
            const percent = Number(item.value) || 0;
            const amount = (totalBudget * percent) / 100;

            return (
              <div
                key={item.key}
                className="bg-[#F5F7FA] rounded-xl px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[15px] font-semibold text-[#333333] leading-snug flex-1 min-w-0">
                    {index + 1}. {item.name}
                  </span>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[18px] font-bold text-[#2B7FFF] leading-tight">
                      {formatIndianCurrency(amount)}
                    </span>
                    <span className="text-[14px] font-medium text-[#777777] mt-1">
                      {percent} % of budget
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-t border-[#E8ECEF] shrink-0">
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
            Save Distribution
          </button>
        </div>
      </div>
    </div>
  );
}
