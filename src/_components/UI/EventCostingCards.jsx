'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiUpload, FiBell, FiChevronDown, FiChevronLeft, FiChevronRight, FiCalendar, FiCheckCircle, FiSend } from 'react-icons/fi';

const EXPENSE_INPUT_CLASS =
  'h-[44px] w-full rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] px-3 text-[14px] text-[#666666] outline-none focus:border-[#5597ED] font-nunito';
const EXPENSE_LABEL_CLASS = 'text-[14px] font-medium text-[#111827] mb-1 font-nunito';

const EventCostingCard = ({
  title,
  onRemove,
  onSendForApproval,
  eventName,
  portfolio,
  approvalStatus = 'Pending',
  initialData = null,
}) => {
  const [description, setDescription] = useState(initialData?.description ?? initialData?.narrative ?? '');
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount ?? initialData?.cost ?? '');
  const [remark, setRemark] = useState(initialData?.remark ?? '');

  const [vendorName, setVendorName] = useState(initialData?.vendorName ?? initialData?.vendor ?? '');
  const [billFileName, setBillFileName] = useState(initialData?.billFileName ?? initialData?.bill ?? '');
  const [selectedDate, setSelectedDate] = useState(
    initialData?.date ? new Date(initialData.date) : null
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showReminderDropdown, setShowReminderDropdown] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [reminderChannel, setReminderChannel] = useState(null); // null | 'whatsapp' | 'email' | 'both'
  const [isSubmitted, setIsSubmitted] = useState(initialData?.isSubmitted || false);
  
  const calendarRef = useRef(null);
  const reminderRef = useRef(null);
  const calendarDropdownRef = useRef(null);
  const reminderDropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
      if (reminderRef.current && !reminderRef.current.contains(e.target)) {
        setShowReminderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showReminderDropdown) {
      setTimeout(() => {
        reminderDropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showReminderDropdown]);

  useEffect(() => {
    if (showCalendar) {
      setTimeout(() => {
        calendarDropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showCalendar]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startPadding = firstDay.getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    return days;
  };

  const calendarDays = getCalendarDays();

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

  // Reset isSubmitted when any input fields change, but only if they differ from initialData
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const initialDescription = initialData?.description ?? initialData?.narrative ?? '';
    const initialTotalAmount = String(initialData?.totalAmount ?? initialData?.cost ?? '');
    const initialRemark = initialData?.remark ?? '';
    const initialVendor = initialData?.vendorName ?? initialData?.vendor ?? '';
    const initialBill = initialData?.billFileName ?? initialData?.bill ?? '';
    const initialDateStr = initialData?.date ? new Date(initialData.date).toDateString() : '';
    const currentDateStr = selectedDate ? selectedDate.toDateString() : '';

    const hasChanged =
      description !== initialDescription ||
      String(totalAmount) !== initialTotalAmount ||
      remark !== initialRemark ||
      vendorName !== initialVendor ||
      billFileName !== initialBill ||
      currentDateStr !== initialDateStr;

    if (hasChanged) {
      setIsSubmitted(false);
    }
  }, [description, totalAmount, remark, vendorName, billFileName, selectedDate, initialData]);

  const uploadId = `upload-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const resetForm = () => {
    setDescription('');
    setTotalAmount('');
    setRemark('');
    setVendorName('');
    setBillFileName('');
    setSelectedDate(null);
    setShowCalendar(false);
    setShowReminderDropdown(false);
    setSubItems([{ id: Date.now(), description: '', attendees: '', amount: '' }]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsSubmitted(false);
  };

  const handleSendForApproval = () => {
    if (isSubmitted) return;
    onSendForApproval?.({
      description,
      category: title,
      eventName,
      portfolio,
      date: selectedDate,
      totalAmount,
      remark,
      vendorName,
      billFileName,
      approvalStatus,
    });
    setIsSubmitted(true);
    setShowSuccessPopup(true);
  };

  const handleBillUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setBillFileName(file.name);
  };

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

      {/* Row 1: Description + Upload */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex flex-col flex-1 min-w-0">
          <label className={EXPENSE_LABEL_CLASS}>Description</label>
          <input
            type="text"
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={EXPENSE_INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col lg:w-[280px] shrink-0">
          <label className={EXPENSE_LABEL_CLASS}>Upload Proforma/Final bill</label>
          <label
            htmlFor={uploadId}
            className={`${EXPENSE_INPUT_CLASS} flex items-center justify-center gap-2 cursor-pointer hover:bg-[#dfe3e8] transition-colors`}
          >
            <span className="text-[14px] font-medium text-[#666666]">
              {billFileName || 'Upload file'}
            </span>
            <FiUpload className="w-[18px] h-[18px] text-[#666666]" />
            <input ref={fileInputRef} id={uploadId} type="file" className="hidden" onChange={handleBillUpload} />
          </label>
        </div>
      </div>

      {/* Row: Vendor Name + Date Picker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col">
          <label className={EXPENSE_LABEL_CLASS}>Vendor Name</label>
          <input
            type="text"
            placeholder="Enter vendor name"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            className={EXPENSE_INPUT_CLASS}
          />
        </div>
        
        <div className="flex flex-col relative" ref={calendarRef}>
          <label className={EXPENSE_LABEL_CLASS}>Date</label>
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className={`${EXPENSE_INPUT_CLASS} flex items-center justify-between px-3 cursor-pointer text-left`}
          >
            <span className={selectedDate ? 'text-[#111827]' : 'text-[#666666]'}>
              {selectedDate ? selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Select date'}
            </span>
            <FiCalendar className="w-[18px] h-[18px] text-[#666666]" />
          </button>
          
          {showCalendar && (
            <div ref={calendarDropdownRef} className="absolute top-[calc(100%+6px)] left-0 w-[280px] bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#E8ECEF] p-4 z-20 font-nunito">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors border-0 cursor-pointer outline-none bg-transparent"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-semibold text-[14px] text-[#111827]">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors border-0 cursor-pointer outline-none bg-transparent"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Week Days */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <span key={day} className="text-[12px] font-semibold text-gray-400">
                    {day}
                  </span>
                ))}
              </div>
              
              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarDays.map((dayObj, idx) => {
                  const isSelected = selectedDate && 
                    dayObj.date.getDate() === selectedDate.getDate() &&
                    dayObj.date.getMonth() === selectedDate.getMonth() &&
                    dayObj.date.getFullYear() === selectedDate.getFullYear();
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dayObj.date);
                        setShowCalendar(false);
                      }}
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-[13px] transition-colors cursor-pointer border-0 outline-none
                        ${isSelected
                          ? 'bg-[#2B7FFF] text-white hover:bg-[#2B7FFF] hover:text-white font-semibold'
                          : !dayObj.isCurrentMonth
                          ? 'text-gray-300 bg-transparent hover:bg-[#F9FAFB]'
                          : 'text-[#111827] bg-transparent hover:bg-[#F2F7FF] hover:text-[#2B7FFF]'
                        }`}
                    >
                      {dayObj.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Total Amount + Remark */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col">
          <label className={EXPENSE_LABEL_CLASS}>Total Amount</label>
          <input
            type="text"
            placeholder="Enter Value"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className={EXPENSE_INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col">
          <label className={EXPENSE_LABEL_CLASS}>Remark</label>
          <input
            type="text"
            placeholder="Enter Remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
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
          <div className="relative" ref={reminderRef}>
            <button
              type="button"
              onClick={() => setShowReminderDropdown(!showReminderDropdown)}
              className="h-[40px] px-4 rounded-[10px] border border-[#2B7FFF] bg-white text-[#2B7FFF] text-[14px] font-medium cursor-pointer hover:bg-[#F2F7FF] transition-colors outline-none whitespace-nowrap flex items-center gap-2"
            >
              <FiBell className="w-4 h-4" />
              <span>
                {reminderChannel === 'both'
                  ? 'Send Reminder via WhatsApp and Email'
                  : reminderChannel === 'whatsapp'
                  ? 'Send Reminder via WhatsApp'
                  : reminderChannel === 'email'
                  ? 'Send Reminder via Email'
                  : 'Send Reminder'}
              </span>
              <FiChevronDown className={`w-4 h-4 transition-transform ${showReminderDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showReminderDropdown && (
              <div ref={reminderDropdownRef} className="absolute right-0 mt-2 w-[180px] bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#E8ECEF] py-2 z-30 font-nunito">
                <button
                  type="button"
                  onClick={() => { setReminderChannel('whatsapp'); setShowReminderDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-[14px] text-[#333333] hover:bg-[#F2F7FF] hover:text-[#2B7FFF] transition-colors border-0 cursor-pointer bg-transparent outline-none"
                >
                  Via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => { setReminderChannel('email'); setShowReminderDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-[14px] text-[#333333] hover:bg-[#F2F7FF] hover:text-[#2B7FFF] transition-colors border-0 cursor-pointer bg-transparent outline-none"
                >
                  Via Email
                </button>
                <button
                  type="button"
                  onClick={() => { setReminderChannel('both'); setShowReminderDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-[14px] text-[#333333] hover:bg-[#F2F7FF] hover:text-[#2B7FFF] transition-colors border-0 cursor-pointer bg-transparent outline-none"
                >
                  Both
                </button>
              </div>
            )}
          </div>

          {reminderChannel && (
            <button
              type="button"
              className="h-[40px] w-[40px] rounded-md bg-[#2B7FFF] text-white flex items-center justify-center cursor-pointer hover:bg-[#1a6fe6] transition-colors border-0 outline-none shrink-0"
              title="Send reminder"
            >
              <FiSend className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSendForApproval}
            disabled={isSubmitted}
            className={`h-[40px] px-5 rounded-full text-white text-[14px] font-semibold transition-colors border-0 outline-none whitespace-nowrap ${
              isSubmitted
                ? 'bg-[#10B981] cursor-not-allowed'
                : 'bg-[#2B7FFF] cursor-pointer hover:bg-[#1a6fe6]'
            }`}
          >
            {isSubmitted ? 'Sent' : 'Send for approval'}
          </button>
        </div>
      </div>

      {showSuccessPopup && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm font-nunito p-4"
          onClick={() => setShowSuccessPopup(false)}
        >
          <div
            className="bg-white rounded-[20px] w-full max-w-[420px] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center px-6 py-8">
              <div className="w-14 h-14 rounded-full bg-[#E6F4EA] flex items-center justify-center mb-4">
                <FiCheckCircle className="w-7 h-7 text-[#0F9D58]" />
              </div>
              <h3 className="text-[20px] font-bold text-[#333333] mb-2">
                Added to Expense Records
              </h3>
              <p className="text-[14px] font-medium text-[#777777] leading-relaxed mb-6">
                Your expense has been successfully added to the expense record table.
              </p>
              <button
                type="button"
                onClick={() => setShowSuccessPopup(false)}
                className="w-full max-w-[200px] h-[44px] rounded-full bg-[#2B7FFF] text-white text-[15px] font-semibold cursor-pointer hover:bg-[#1a6fe6] transition-colors border-0 outline-none"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCostingCard;
