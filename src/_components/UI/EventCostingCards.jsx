'use client';
import React, { useState } from 'react';
import { FiX, FiUpload } from 'react-icons/fi';

const EXPENSE_INPUT_CLASS =
  'h-[44px] w-full rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] px-3 text-[14px] text-[#666666] outline-none focus:border-[#5597ED] font-nunito';
const EXPENSE_LABEL_CLASS = 'text-[14px] font-medium text-[#111827] mb-1 font-nunito';

const EventCostingCard = ({ title, onRemove, approvalStatus = 'Pending' }) => {
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
    <div className="group w-full rounded-[12px] border border-[#E8ECEF] bg-white p-6 mb-6 font-nunito shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <h2 className="text-[20px] font-bold text-[#1e3a8a] leading-tight">{title}</h2>
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[#EF4444] hover:text-[#DC2626] bg-transparent border-0 p-1 cursor-pointer outline-none shrink-0"
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

export default EventCostingCard;
