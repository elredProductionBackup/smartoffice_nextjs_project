'use client';

import { useEffect, useRef, useState } from 'react';
import { FiX, FiChevronDown, FiCheck } from 'react-icons/fi';
import { useSelector } from 'react-redux';

export default function AddBudgetFinance({ onClose }) {
  const { budgetTypes } = useSelector((state) => state.budget);

  const [form, setForm] = useState({ portfolio: '', totalBudget: '' });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isValid = form.portfolio && form.totalBudget;

  const selectedLabel = budgetTypes.find((bt) => bt.budgetTypeId === form.portfolio)?.budgetType;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <button onClick={onClose} className="text-[#999] hover:text-[#333] transition-colors cursor-pointer">
            <FiX className="text-[22px]" />
          </button>
        </div>

        {/* Portfolio */}
        <div className="mb-5">
          <label className="block text-[14px] font-semibold text-[#333] mb-2">
            Portfolio <span className="text-red-500">*</span>
          </label>

          <div ref={dropdownRef} className="relative">
            {/* Trigger */}
            <button
              type="button"
              onClick={() => setDropdownOpen((p) => !p)}
              className={`w-full flex items-center justify-between h-[50px] px-4 rounded-[8px] border text-[14px] bg-white transition-colors cursor-pointer ${
                dropdownOpen ? 'border-[#2563eb] ring-1 ring-[#2563eb]/30' : 'border-[#d1d5db] hover:border-[#9ca3af]'
              }`}
            >
              <span className={selectedLabel ? 'text-[#111]' : 'text-[#9ca3af]'}>
                {selectedLabel || 'Select portfolio'}
              </span>
              <FiChevronDown
                className={`text-[#6b7280] text-[18px] mr-1 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown list */}
            {dropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1 max-h-[240px] overflow-y-auto">
                {budgetTypes.map((bt) => {
                  const isSelected = form.portfolio === bt.budgetTypeId;
                  return (
                    <button
                      key={bt.budgetTypeId}
                      type="button"
                      onClick={() => {
                        setForm((p) => ({ ...p, portfolio: bt.budgetTypeId }));
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-[14px] text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#eff6ff] text-[#2563eb] font-medium'
                          : 'text-[#111] hover:bg-[#f9fafb]'
                      }`}
                    >
                      {bt.budgetType}
                      {isSelected && <FiCheck className="text-[#2563eb] text-[15px]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Total Budget */}
        <div className="mb-8">
          <label className="block text-[14px] font-semibold text-[#333] mb-2">
            Total Budget <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center border border-[#d1d5db] rounded-[8px] h-[50px] px-4 focus-within:border-[#2563eb] focus-within:ring-1 focus-within:ring-[#2563eb]/30 transition-colors">
            <span className="text-[#9ca3af] text-[15px] mr-2">₹</span>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={form.totalBudget}
              onChange={(e) => setForm((p) => ({ ...p, totalBudget: e.target.value }))}
              className="flex-1 outline-none text-[14px] text-[#111] bg-transparent placeholder:text-[#9ca3af]"
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
