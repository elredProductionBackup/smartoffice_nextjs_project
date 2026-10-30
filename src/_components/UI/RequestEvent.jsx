'use client';

import { useEffect, useRef, useState } from 'react';
import { FiX, FiChevronDown, FiCheck, FiSend } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBudgetTypes } from '@/store/events/budgetChecklist/budgetThunks';
import CustomDatePicker from './CustomDatePicker';

export default function RequestEvent({ onClose }) {
  const dispatch = useDispatch();
  const { budgetTypes } = useSelector((state) => state.budget);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Default portfolio to Learning once budgetTypes load
  const [form, setForm] = useState({
    eventName: '',
    portfolio: '',
    proposedDate: '',
    estimatedBudget: '',
    description: '',
    learningObjectives: '',
    expectedOutcome: '',
  });

  useEffect(() => {
    dispatch(fetchBudgetTypes());
  }, [dispatch]);

  // Default to Learning once budgetTypes load (derived, so no extra render)
  const defaultPortfolio = budgetTypes.find((bt) => bt.budgetType === 'Learning')?.budgetTypeId || '';
  const portfolio = form.portfolio || defaultPortfolio;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = budgetTypes.find((bt) => bt.budgetTypeId === portfolio)?.budgetType;
  const isValid = form.eventName && portfolio && form.proposedDate;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!isValid) return;
    // TODO: wire to API
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] w-full max-w-[620px] shadow-xl flex flex-col max-h-[90dvh] md:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 md:px-7 md:pt-6 pb-4 border-b border-[#f1f5f9]">
          <div>
            <h2 className="text-[20px] md:text-[22px] font-bold text-[#1a1a2e] leading-tight">Propose an Event</h2>
            <p className="text-[13px] text-[#888] mt-0.5">Outline your event — it goes to admin for sign-off</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[#999] hover:text-[#333] transition-colors cursor-pointer p-2 -mr-2 -mt-1 md:p-0 md:mr-0 md:mt-1">
            <FiX className="text-[20px]" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-5" style={{ scrollbarWidth: 'none' }}>

          {/* Row 1: Event Name + Portfolio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1.5">
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                name="eventName"
                type="text"
                placeholder="e.g., Leadership Summit 2026"
                value={form.eventName}
                onChange={handleChange}
                className="w-full border border-[#d1d5db] rounded-[8px] h-[42px] px-3 text-[16px] md:text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af]"
              />
            </div>

            {/* Portfolio dropdown */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1.5">
                Portfolio <span className="text-red-500">*</span>
              </label>
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((p) => !p)}
                  className={`w-full flex items-center justify-between h-[42px] px-3 rounded-[8px] border text-[13px] bg-white transition-colors cursor-pointer ${
                    dropdownOpen ? 'border-[#2563eb] ring-1 ring-[#2563eb]/30' : 'border-[#d1d5db] hover:border-[#9ca3af]'
                  }`}
                >
                  <span className={selectedLabel ? 'text-[#111]' : 'text-[#9ca3af]'}>
                    {selectedLabel || 'Select portfolio'}
                  </span>
                  <FiChevronDown
                    className={`text-[#6b7280] text-[16px] mr-1 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg py-1.5 px-1.5 max-h-[220px] overflow-y-auto">
                    {budgetTypes.map((bt) => {
                      const isSelected = portfolio === bt.budgetTypeId;
                      return (
                        <button
                          key={bt.budgetTypeId}
                          type="button"
                          onClick={() => { setForm((p) => ({ ...p, portfolio: bt.budgetTypeId })); setDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] text-left transition-colors cursor-pointer rounded-[7px] ${
                            isSelected ? 'bg-[#eff6ff] text-[#2563eb] font-medium' : 'text-[#111] hover:bg-[#f9fafb]'
                          }`}
                        >
                          {bt.budgetType}
                          {isSelected && <FiCheck className="text-[#2563eb] text-[13px]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Proposed Date + Estimated Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1.5">
                Proposed Date <span className="text-red-500">*</span>
              </label>
              <CustomDatePicker
                value={form.proposedDate}
                onChange={(dateStr) => setForm((p) => ({ ...p, proposedDate: dateStr }))}
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1.5">
                Estimated Budget (₹)
              </label>
              <input
                name="estimatedBudget"
                type="number"
                min="0"
                placeholder="e.g., 500000"
                value={form.estimatedBudget}
                onChange={handleChange}
                className="w-full border border-[#d1d5db] rounded-[8px] h-[42px] px-3 text-[16px] md:text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af]"
              />
            </div>
          </div>

          {/* Event Description */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Event Description</label>
            <textarea
              name="description"
              placeholder="Briefly describe the event, format, and expected audience..."
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-[#d1d5db] rounded-[8px] px-3 py-2.5 text-[16px] md:text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af] resize-none"
            />
          </div>

          {/* Learning Objectives */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Learning Objectives</label>
            <textarea
              name="learningObjectives"
              placeholder="What skills or knowledge will participants gain?"
              value={form.learningObjectives}
              onChange={handleChange}
              rows={3}
              className="w-full border border-[#d1d5db] rounded-[8px] px-3 py-2.5 text-[16px] md:text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af] resize-none"
            />
          </div>

          {/* Expected Outcome */}
          <div className="mb-2">
            <label className="block text-[13px] font-semibold text-[#333] mb-1.5">Expected Outcome / Impact</label>
            <textarea
              name="expectedOutcome"
              placeholder="How will this event benefit the organisation?"
              value={form.expectedOutcome}
              onChange={handleChange}
              rows={3}
              className="w-full border border-[#d1d5db] rounded-[8px] px-3 py-2.5 text-[16px] md:text-[13px] text-[#111] outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#9ca3af] resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between px-5 md:px-7 py-4 border-t border-[#f1f5f9]">
          <span className="text-[12px] text-[#9ca3af]">
            Fields marked <span className="text-red-500">*</span> are required
          </span>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 h-[40px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid}
              className={`flex items-center gap-2 h-[40px] px-5 rounded-[8px] text-[13px] font-semibold transition-colors ${
                isValid
                  ? 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] cursor-pointer'
                  : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
              }`}
            >
              <FiSend className="text-[13px]" />
              Submit Proposal
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
