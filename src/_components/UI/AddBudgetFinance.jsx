'use client';

import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useSelector } from 'react-redux';

export default function AddBudgetFinance({ onClose }) {
  const { budgetTypes } = useSelector((state) => state.budget);

  const [form, setForm] = useState({
    portfolio: '',
    totalBudget: '',
  });

  const isValid = form.portfolio && form.totalBudget;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!isValid) return;
    // TODO: wire up to API
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[16px] w-full max-w-[600px] mx-4 p-8 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[24px] font-bold text-[#1a1a1a]">Add New Budget</h2>
          <button
            onClick={onClose}
            className="text-[#999] hover:text-[#333] transition-colors cursor-pointer"
          >
            <FiX className="text-[22px]" />
          </button>
        </div>

        {/* Portfolio */}
        <div className="mb-5">
          <label className="block text-[14px] font-semibold text-[#333] mb-2">
            Portfolio <span className="text-red-500">*</span>
          </label>
          <select
            value={form.portfolio}
            onChange={(e) => handleChange('portfolio', e.target.value)}
            className="w-full border border-[#d1d5db] rounded-[8px] px-4 h-[50px] text-[14px] text-[#333] bg-white outline-none focus:border-[#2563eb] transition-colors cursor-pointer"
          >
            <option value="" disabled>Select portfolio</option>
            {budgetTypes.map((bt) => (
              <option key={bt.budgetTypeId} value={bt.budgetTypeId}>
                {bt.budgetType}
              </option>
            ))}
          </select>
        </div>

        {/* Total Budget */}
        <div className="mb-8">
          <label className="block text-[14px] font-semibold text-[#333] mb-2">
            Total Budget <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center border border-[#d1d5db] rounded-[8px] h-[50px] px-4 focus-within:border-[#2563eb] transition-colors">
            <span className="text-[#555] text-[16px] mr-2">₹</span>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={form.totalBudget}
              onChange={(e) => handleChange('totalBudget', e.target.value)}
              className="flex-1 outline-none text-[14px] text-[#333] bg-transparent"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`flex-1 h-[50px] rounded-[8px] text-[15px] font-semibold transition-colors ${
              isValid
                ? 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] cursor-pointer'
                : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
            }`}
          >
            Add Budget
          </button>
          <button
            onClick={onClose}
            className="px-8 h-[50px] rounded-[8px] border border-[#d1d5db] text-[15px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
