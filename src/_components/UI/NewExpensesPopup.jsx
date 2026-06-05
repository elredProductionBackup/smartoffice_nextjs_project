'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiUpload, FiChevronDown } from 'react-icons/fi';
import CustomDatePicker from './CustomDatePicker';

const EVENTS = [
  'Figma Config',
  'Webflow Advanced Workshop',
  'UX Research & Testing Summit',
  'Design Systems Workshop',
  'Product Thinking Bootcamp',
];

const PORTFOLIOS = [
  'Design Team Portfolio',
  'Development Portfolio',
  'Marketing Portfolio',
  'Operations Portfolio',
];

/* ── Reusable Custom Select Dropdown (matches IncomeTypeDropdown style) ── */
function CustomSelectDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isPlaceholder = !value;

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-[14px] bg-white text-[15px] cursor-pointer outline-none text-left focus:border-[#1A73E8] transition-colors"
        style={{ color: isPlaceholder ? '#94a3b8' : '#1e293b' }}
      >
        <span>{value || placeholder}</span>
        <FiChevronDown
          className="ml-2 shrink-0 text-slate-500 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 w-full bg-white rounded-[14px] z-[9999] overflow-y-auto p-2"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.13)', maxHeight: '280px' }}
        >
          {placeholder && (
            <button
              type="button"
              onMouseDown={() => { onChange(''); setOpen(false); }}
              className={[
                'block w-full text-left px-4 py-2.5 cursor-pointer border-none rounded-lg transition-colors duration-150',
                "font-['Nunito_Sans'] font-medium text-[16px] leading-[136%] tracking-[0%] text-slate-400",
                !value ? 'bg-indigo-50' : 'bg-transparent hover:bg-slate-50',
              ].join(' ')}
            >
              {placeholder}
            </button>
          )}
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onMouseDown={() => { onChange(opt); setOpen(false); }}
                className={[
                  'block w-full text-left px-4 py-2.5 cursor-pointer border-none rounded-lg transition-colors duration-150',
                  "font-['Nunito_Sans'] font-medium text-[16px] leading-[136%] tracking-[0%] text-[#333333]",
                  isSelected ? 'bg-indigo-50' : 'bg-transparent hover:bg-slate-50',
                ].join(' ')}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NewExpensesPopup({ onClose, onSave }) {
  const [description, setDescription] = useState('');
  const [expenseType, setExpenseType] = useState('General'); // 'General' or 'Event Related'
  const [event, setEvent] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [date, setDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paid, setPaid] = useState('');
  const [balance, setBalance] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [fileName, setFileName] = useState('');

  const fileInputRef = useRef(null);

  const handleTotalAmountChange = (val) => {
    setTotalAmount(val);
    const totNum = parseFloat(val) || 0;
    const paidNum = parseFloat(paid) || 0;
    setBalance((totNum - paidNum).toFixed(2));
  };

  const handlePaidChange = (val) => {
    setPaid(val);
    const totNum = parseFloat(totalAmount) || 0;
    const paidNum = parseFloat(val) || 0;
    setBalance((totNum - paidNum).toFixed(2));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleSave = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const payload = {
      description,
      expenseType,
      event,
      portfolio,
      date,
      totalAmount: parseFloat(totalAmount) || 0,
      paid: parseFloat(paid) || 0,
      balance: parseFloat(balance) || 0,
      vendorName,
      fileName,
    };

    if (onSave) {
      onSave(payload);
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] backdrop-blur-sm bg-slate-900/40"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="fixed z-[9999] flex flex-col bg-white rounded-3xl w-[600px] max-h-[85vh] font-sans overflow-hidden"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-[#F1F3F5] shrink-0">
          <h2 className="text-[22px] font-bold text-[#1F1F1F]">Add New Expense</h2>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 cursor-pointer border-none transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Container - scrollbar hidden */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* Expense Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#333]">Expense Description</label>
            <input
              type="text"
              placeholder="e.g., Office supplies purchase"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-[14px] px-4 py-3 text-[15px] text-slate-800 bg-white outline-none focus:border-[#1A73E8] transition-colors"
            />
          </div>

          {/* Expense Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#333]">Expense Type</label>
            <div className="flex items-center gap-6 mt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-[15px] font-semibold text-[#333]">
                <input
                  type="radio"
                  name="expenseType"
                  value="General"
                  checked={expenseType === 'General'}
                  onChange={() => setExpenseType('General')}
                  className="hidden"
                />
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  expenseType === 'General' ? 'border-[#0F9D58]' : 'border-gray-400'
                }`}>
                  {expenseType === 'General' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0F9D58]" />
                  )}
                </span>
                General
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-[15px] font-semibold text-[#333]">
                <input
                  type="radio"
                  name="expenseType"
                  value="Event Related"
                  checked={expenseType === 'Event Related'}
                  onChange={() => setExpenseType('Event Related')}
                  className="hidden"
                />
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  expenseType === 'Event Related' ? 'border-[#0F9D58]' : 'border-gray-400'
                }`}>
                  {expenseType === 'Event Related' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0F9D58]" />
                  )}
                </span>
                Event Related
              </label>
            </div>
          </div>

          {/* Event (Optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#333]">Event (Optional)</label>
            <CustomSelectDropdown
              value={event}
              onChange={setEvent}
              options={EVENTS}
              placeholder="Select Event"
            />
          </div>

          {/* Portfolio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#333]">Portfolio</label>
            <CustomSelectDropdown
              value={portfolio}
              onChange={setPortfolio}
              options={PORTFOLIOS}
              placeholder="Select Portfolio"
            />
          </div>

          {/* Expense Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#333]">Expense Date</label>
            <CustomDatePicker value={date} onChange={setDate} />
          </div>

          {/* Total Amount, Paid, Balance */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-[#333]">Total Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => handleTotalAmountChange(e.target.value)}
                className="w-full border border-gray-300 rounded-[14px] px-4 py-3 text-[15px] text-slate-800 bg-white outline-none focus:border-[#1A73E8] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-[#333]">Paid</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paid}
                onChange={(e) => handlePaidChange(e.target.value)}
                className="w-full border border-gray-300 rounded-[14px] px-4 py-3 text-[15px] text-slate-800 bg-white outline-none focus:border-[#1A73E8] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold text-[#333]">Balance</label>
              <input
                type="text"
                readOnly
                placeholder="0.00"
                value={balance}
                className="w-full border border-gray-200 rounded-[14px] px-4 py-3 text-[15px] text-slate-500 bg-gray-50 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Vendor Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#333]">Vendor Name</label>
            <input
              type="text"
              placeholder="e.g., Office Depot Inc."
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full border border-gray-300 rounded-[14px] px-4 py-3 text-[15px] text-slate-800 bg-white outline-none focus:border-[#1A73E8] transition-colors"
            />
          </div>

          {/* Upload Bill */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#333]">Upload Bill</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#C8D3E3] rounded-[14px] px-4 py-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <FiUpload className="w-5 h-5 text-slate-500" />
              <span className="text-[14px] font-medium text-slate-700">
                {fileName ? `Selected: ${fileName}` : 'Click to upload or drag and drop'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-2 shrink-0">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 bg-[#1A73E8] hover:bg-[#1557B0] text-white py-3.5 px-6 rounded-[14px] font-bold text-center text-[16px] border-none cursor-pointer transition-colors"
            >
              Save Expense
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-[100px] bg-white border border-[#E2E8F0] hover:bg-gray-50 text-[#333] py-3.5 px-4 rounded-[14px] font-semibold text-center text-[16px] cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
