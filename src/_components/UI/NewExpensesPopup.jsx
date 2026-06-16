'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FiX, FiUpload, FiChevronDown, FiLoader } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import CustomDatePicker from './CustomDatePicker';
import { addEditExpense } from '@/services/expense.service';
import { useBudgetTypeStore } from '@/store/useBudgetTypeStore';
import { fetchEvents } from '@/store/events/eventsThunks';
import { UPCOMING_EVENTS, PAST_EVENTS, DRAFT_EVENTS } from '@/assets/helpers/sampleEvents';

const EVENTS = [
  'Figma Config',
  'Webflow Advanced Workshop',
  'UX Research & Testing Summit',
  'Design Systems Workshop',
  'Product Thinking Bootcamp',
];

/* ── Reusable Custom Select Dropdown (matches IncomeTypeDropdown style) ── */
function CustomSelectDropdown({ value, onChange, options, placeholder, loading = false, disabled = false }) {
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
  const selectedOption = options.find(opt => (typeof opt === 'object' ? opt.value === value : opt === value));
  const displayLabel = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : (value || placeholder);

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-[14px] bg-white text-[15px] cursor-pointer outline-none text-left focus:border-[#1A73E8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ color: isPlaceholder ? '#94a3b8' : '#1e293b' }}
      >
        <span>{loading ? 'Loading...' : displayLabel}</span>
        {loading ? (
          <FiLoader className="ml-2 shrink-0 text-slate-400 animate-spin" />
        ) : (
          <FiChevronDown
            className="ml-2 shrink-0 text-slate-500 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        )}
      </button>

      {/* Dropdown panel */}
      {open && !loading && (
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
            const label = typeof opt === 'object' ? opt.label : opt;
            const val   = typeof opt === 'object' ? opt.value : opt;
            const isSelected = val === value;
            return (
              <button
                key={val}
                type="button"
                onMouseDown={() => { onChange(val); setOpen(false); }}
                className={[
                  'block w-full text-left px-4 py-2.5 cursor-pointer border-none rounded-lg transition-colors duration-150',
                  "font-['Nunito_Sans'] font-medium text-[16px] leading-[136%] tracking-[0%] text-[#333333]",
                  isSelected ? 'bg-indigo-50' : 'bg-transparent hover:bg-slate-50',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NewExpensesPopup({ onClose, onSave, initialData }) {
  const dispatch = useDispatch();
  const rawEvents = useSelector((state) => state.events.rawEvents);

  const [description, setDescription] = useState(initialData?.description ?? '');
  const [expenseType, setExpenseType] = useState(initialData?.type ?? 'General'); // 'General' or 'Event Related'
  const [event, setEvent] = useState(initialData?.event && initialData.event !== '-' ? initialData.event : '');
  const [portfolio, setPortfolio] = useState(initialData?.portfolio && initialData.portfolio !== '-' ? initialData.portfolio : '');
  const [date, setDate] = useState(initialData?.date ?? '');
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount ?? '');
  const [paid, setPaid] = useState(initialData?.paid ?? '');
  const [balance, setBalance] = useState(initialData?.balance ?? '');
  const [vendorName, setVendorName] = useState(initialData?.vendor && initialData.vendor !== '-' ? initialData.vendor : '');
  const [fileName, setFileName] = useState(initialData?.bill && initialData.bill !== '-' ? initialData.bill : '');
  const [remark, setRemark] = useState(initialData?.remark ?? '');
  const [selectedFile, setSelectedFile] = useState(null);

  // Budget Type Store State
  const {
    budgetTypes: budgetTypesList,
    loading: budgetTypeLoading,
    error: budgetTypeError,
    fetchBudgetTypes,
  } = useBudgetTypeStore();

  const [budgetTypeId, setBudgetTypeId] = useState(initialData?.budgetTypeId ?? '');

  const fileInputRef = useRef(null);

  // Fetch Budget Types on Mount
  useEffect(() => {
    fetchBudgetTypes();
  }, [fetchBudgetTypes]);

  // Fetch Events from Redux for mapping Event names to Event IDs
  useEffect(() => {
    dispatch(fetchEvents({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Event ID lookup map
  const eventMap = useMemo(() => {
    const map = {};
    
    // 1. Static mock events
    [UPCOMING_EVENTS, PAST_EVENTS, DRAFT_EVENTS].forEach((list) => {
      list.forEach((group) => {
        group.items?.forEach((item) => {
          if (item.name) {
            map[item.name.toLowerCase().trim()] = item.id;
          }
        });
      });
    });

    // 2. Dynamic events from API
    if (Array.isArray(rawEvents)) {
      rawEvents.forEach((evt) => {
        if (evt.eventName) {
          map[evt.eventName.toLowerCase().trim()] = evt.eventId;
        }
      });
    }

    return map;
  }, [rawEvents]);

  // Sync budgetTypeId if initialData has portfolio name but no budgetTypeId
  useEffect(() => {
    if (budgetTypesList.length > 0) {
      if (!budgetTypeId && portfolio) {
        // Find matching budget type by name
        const matched = budgetTypesList.find(b => {
          const name = b.name ?? b.title ?? b.budgetType ?? b.label ?? '';
          return name.toLowerCase() === portfolio.toLowerCase() ||
                 name.toLowerCase().includes(portfolio.toLowerCase()) ||
                 portfolio.toLowerCase().includes(name.toLowerCase());
        });
        if (matched) {
          setBudgetTypeId(matched.budgetTypeId ?? matched._id ?? matched.id ?? '');
        }
      } else if (budgetTypeId && !portfolio) {
        // Sync portfolio name if we only have budgetTypeId
        const matched = budgetTypesList.find(b => (b.budgetTypeId === budgetTypeId || b._id === budgetTypeId || b.id === budgetTypeId));
        if (matched) {
          const name = matched.name ?? matched.title ?? matched.budgetType ?? matched.label ?? '';
          setPortfolio(name);
        }
      }
    }
  }, [budgetTypesList, budgetTypeId, portfolio]);

  // Map budget types to dropdown options for Portfolio
  const portfolioOptions = budgetTypesList.map((item) => ({
    label: item.name ?? item.title ?? item.budgetType ?? item.label ?? 'Unknown Budget Type',
    value: item.budgetTypeId ?? item._id ?? item.id ?? '',
  }));

  // Handle Portfolio selection changes, which sets both the budgetTypeId and the portfolio string
  const handlePortfolioChange = (selectedId) => {
    setBudgetTypeId(selectedId);
    const matched = budgetTypesList.find(b => (b.budgetTypeId === selectedId || b._id === selectedId || b.id === selectedId));
    if (matched) {
      const name = matched.name ?? matched.title ?? matched.budgetType ?? matched.label ?? '';
      setPortfolio(name);
    } else {
      setPortfolio('');
    }
  };

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
      const file = e.target.files[0];
      setFileName(file.name);
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      setSelectedFile(file);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const currentDate = initialData?.date ?? new Date().toISOString().split("T")[0];

    // Enforce validations as requested
    if (!description || description.trim().length < 2) {
      alert("Description must be at least 2 characters.");
      return;
    }

    const isEventType = expenseType === 'Event Related';
    const typeValue = isEventType ? 'event' : 'general';

    let selectedEventId = '';
    if (isEventType) {
      if (!event) {
        alert("Please select an Event for event-related expenses.");
        return;
      }
      selectedEventId = eventMap[event.toLowerCase().trim()] || '';
      if (!selectedEventId) {
        alert("Please select a valid Event.");
        return;
      }
    }

    if (!budgetTypeId) {
      alert("Please select a valid Budget Type (Portfolio).");
      return;
    }

    const total = parseFloat(totalAmount);
    if (isNaN(total) || total < 0) {
      alert("Total amount must be a float value greater than or equal to 0.00.");
      return;
    }

    if (remark && remark.trim().length < 2) {
      alert("Remark must be at least 2 characters if provided.");
      return;
    }

    if (vendorName && vendorName.trim().length < 2) {
      alert("Vendor name must be at least 2 characters if provided.");
      return;
    }

    const apiPayload = {
      description,
      expenseType: typeValue, // Backend schema accepts 'general' / 'event'
      eventId: selectedEventId,
      portfolioId: budgetTypeId,
      event,
      portfolio,
      budgetTypeId,
      totalAmount: total,
      remark,
      vendorName,
      expenseId: initialData?.id || '',
      file: selectedFile ?? undefined,
    };

    try {
      await addEditExpense(apiPayload);
    } catch (err) {
      console.error('addEditExpense failed:', err);
      alert(err?.response?.data?.message || "Failed to save expense. Please try again.");
      return;
    }

    const localPayload = {
      description,
      expenseType,
      event,
      portfolio,
      budgetTypeId,
      date: currentDate,
      totalAmount: total,
      remark,
      vendorName,
      fileName,
      file: selectedFile,
    };

    if (initialData?.id) {
      localPayload.id = initialData.id;
    }

    if (onSave) {
      onSave(localPayload);
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
          <h2 className="text-[22px] font-bold text-[#1F1F1F]">
            {initialData ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 cursor-pointer border-none transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Container */}
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
          {expenseType === 'Event Related' && (
            <div className="flex flex-col gap-1.5 animate-fadeIn">
              <label className="text-[14px] font-bold text-[#333]">Event</label>
              <CustomSelectDropdown
                value={event}
                onChange={setEvent}
                options={EVENTS}
                placeholder="Select Event"
              />
            </div>
          )}

          {/* Portfolio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#333]">Portfolio</label>
            {budgetTypeError ? (
              <p className="text-[13px] text-red-500 font-semibold">{budgetTypeError}</p>
            ) : (
              <CustomSelectDropdown
                value={budgetTypeId}
                onChange={handlePortfolioChange}
                options={portfolioOptions}
                placeholder="Select Portfolio"
                loading={budgetTypeLoading}
                disabled={budgetTypeLoading}
              />
            )}
          </div>

          {/* Total Amount */}
          <div className="grid grid-cols-1 gap-3">
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
          </div>

          {/* Remark Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#333]">Remark</label>
            <textarea
              placeholder="Add comments or notes"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full resize-none border border-gray-300 rounded-[14px] px-4 py-3 text-[15px] text-slate-800 bg-white outline-none focus:border-[#1A73E8] transition-colors"
            />
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
