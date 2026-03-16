'use client';
import React, { useState } from 'react';

const AddBudgets = ({ isOpen, onClose, onSave }) => {
  const [budgets, setBudgets] = useState({
    learning: '',
    engagement: '',
    social: '',
    venue: '',
    catering: '',
    staffing: '',
    marketing: '',
    travel: '',
  });

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBudgets((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = () => {
    onSave(budgets);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[20px] p-[30px] sm:p-[40px] w-[95%] max-w-[500px] shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[24px] font-[700] text-[#333333] mb-[20px] shrink-0">Enter budget</h2>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-col gap-6 py-2">
            {[
              { label: 'Learning', key: 'learning' },
              { label: 'Engagement', key: 'engagement' },
              { label: 'Social', key: 'social' },
              { label: 'Venue', key: 'venue' },
              { label: 'Catering', key: 'catering' },
              { label: 'Staffing', key: 'staffing' },
              { label: 'Marketing', key: 'marketing' },
              { label: 'Travel', key: 'travel' },
            ].map((field) => (
              <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[18px] sm:text-[20px] font-[500] text-[#333333]">{field.label}</label>
                <input
                  type="text"
                  placeholder="Enter amount"
                  value={budgets[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full sm:w-[250px] h-[48px] px-5 rounded-[12px] bg-[#F9F9F9] border border-[#EEEEEE] outline-none focus:border-[#5597ED] text-[18px] text-[#666666] placeholder:text-[#CCCCCC]"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between mt-8 sm:mt-12 px-2 shrink-0">
          <button
            onClick={onClose}
            className="w-[110px] sm:w-[120px] h-[43px] rounded-full bg-[#9CA3AF] text-white text-[20px] sm:text-[22px] font-[600] transition-opacity hover:opacity-90 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="w-[110px] sm:w-[120px] h-[43px] rounded-full text-white text-[20px] sm:text-[22px] font-[600] transition-opacity hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(95.15deg, #5597ED 3.84%, #00449C 96.38%)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBudgets;
