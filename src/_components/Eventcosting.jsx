'use client';
import React, { useState } from 'react';
import ExportAsExcelButton from './ExportAsExcelButton';
import AddBudgets from './AddBudgets';

// ─── Reusable Expense Section ───────────────────────────────────────────────
const ExpenseSection = ({ title }) => {
  const [items, setItems] = useState([
    { id: 1, narrative: '', estimatedCost: '', advancePayment: '', balancePayment: '', billFile: null },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), narrative: '', estimatedCost: '', advancePayment: '', balancePayment: '', billFile: null },
    ]);
  };

  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleFileChange = (id, file) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, billFile: file } : item)));
  };

  return (
    <div
      className="w-full rounded-[16px] mb-6 p-[30px] "
      style={{ backgroundColor: '#f8f8ff' }}
    >
      {/* Section title */}
      <h2 className="text-[24px] font-[700] text-[#333333] mb-5">{title}</h2>

      {items.map((item) => (
        <div key={item.id} className="mb-6">
          <div className='  flex flex-row justify-between'>
            <div className=' w-[80%]'>
                                    {/* Row 1: Narrative + Upload + Send for approval */}
          <div className="flex items-end gap-4 mb-4 ">
            {/* Narrative */}
            <div className="flex flex-col flex-1">
              <label className="text-[14px] font-[400] text-[#111827] mb-1">Narrative</label>
              <input
                type="text"
                placeholder="Enter narration"
                value={item.narrative}
                onChange={(e) => updateItem(item.id, 'narrative', e.target.value)}
                className="h-[44px] rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] px-3 text-[14px] text-[#666666] outline-none focus:border-[#5597ED]"
              />
            </div>

            {/* Upload bills */}
            <div className="flex flex-col">
              <label className="text-[14px] font-[400] text-[#111827] mb-1">Upload bills</label>
              <label
                htmlFor={`upload-${item.id}`}
                className="h-[44px] w-[180px] flex items-center justify-center gap-2 rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] cursor-pointer text-[14px] font-[500] text-[#666666] hover:bg-gray-50"
              >
                <span>Upload file</span>
                <img src="/image/upload_file.svg" alt="upload" width={18} height={18} />
                <input
                  id={`upload-${item.id}`}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileChange(item.id, e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {/* Row 2: Estimated cost, Advance payment, Balance payment */}
          <div className="flex gap-4 mb-4 ">
            <div className="flex flex-col flex-1">
              <label className="text-[14px] font-[400] text-[#111827] mb-1">Estimated cost</label>
              <input
                type="text"
                placeholder="Enter Value"
                value={item.estimatedCost}
                onChange={(e) => updateItem(item.id, 'estimatedCost', e.target.value)}
                className="h-[49px] min-w-[260px] rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] px-3 text-[14px] text-[#666666] outline-none focus:border-[#5597ED]"
              />
            </div>
            <div className="flex flex-col flex-1">
              <label className="text-[14px] font-[500] text-[#111827] mb-1">Advance payment</label>
              <input
                type="text"
                placeholder="Enter Value"
                value={item.advancePayment}
                onChange={(e) => updateItem(item.id, 'advancePayment', e.target.value)}
                className="h-[49px] min-w-[260px] rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] px-3 text-[14px] text-[#666666] outline-none focus:border-[#5597ED]"
              />
            </div>
            <div className="flex flex-col flex-1">
              <label className="text-[14px] font-[500] text-[#111827] mb-1">Balance payment</label>
              <input
                type="text"
                placeholder="Enter Value"
                value={item.balancePayment}
                onChange={(e) => updateItem(item.id, 'balancePayment', e.target.value)}
                className="h-[49px] min-w-[260px] rounded-[8px] border border-[#DDDDDD] bg-[#E5E7EB] px-3 text-[14px] text-[#666666] outline-none focus:border-[#5597ED]"
              />
            </div>
          </div>
            </div>

                      {/* Send for approval */}
            <button
              className="h-[40px] w-[200px] rounded-full mt-6 text-white text-[20px] font-[500] cursor-pointer shrink-0"
              style={{ background: 'linear-gradient(95.15deg, #5597ED 3.84%, #00449C 96.38%)' }}
            >
              Save Details
            </button>
          </div>

          {/* Approved status */}
          <div className="text-[20px] font-[600] text-[#515161]">
            Approved status:
          </div>
        </div>
      ))}

      {/* Add new item button */}
      <button
        onClick={addItem}
        className="mt-2 h-[40px] w-[180px]  rounded-full border border-[#666666] text-[20px] font-[500] text-[#666666] flex items-center justify-center gap-1 cursor-pointer"
      >
        <span className="text-[25px] mr-[6px] leading-none">+</span> Add new item
      </button>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const Eventcosting = () => {
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);

  const handleBudgetSave = (data) => {
    console.log('Budget saved:', data);
    // You can add more logic here to handle the saved budget data
  };

  return (
    <div className='flex flex-col'>

      {/* ================ Total cost and dropdown section ============================== */}
      <div className='w-[1210px] h-[50px] flex flex-row justify-between items-center mb-[60px]'>
        <div className='flex flex-row items-center gap-[40px]'>
          <div 
            onClick={() => setIsBudgetOpen(true)}
            className='dropdown border border-[#DDDDDD] flex flex-row justify-between items-center px-[20px] py-[10px] h-[48px] w-[250px] rounded-md cursor-pointer'
          >
            <p className='font-[600] text-[20px]'>Budget</p>
            <img src="/image/right-arrow.svg" width={6} height={12} />
          </div>
          <div className='totalcosting'>
            <h1 className='text-[32px] text-[#333333] font-[600]'>Total Budget : 12,00,000</h1>
          </div>
        </div>
        
        <ExportAsExcelButton onClick={() => console.log("Exporting...")} />
      </div>

      {/* ================ Expenses Header ============================================ */}
      <div className="w-[1210px] flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2 cursor-pointer">
          <span className="text-[24px] font-[600] text-[#333333]">Expenses</span>
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L7 7L13 1" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 h-[1px] bg-[#EEEEEE]" />
      </div>

      {/* ================ Expense Sections ============================================ */}
      <div className="w-[1210px] flex flex-col gap-4">
        <ExpenseSection title="Catering Services" />
        <ExpenseSection title="Recce costing" />
      </div>

      <AddBudgets 
        isOpen={isBudgetOpen} 
        onClose={() => setIsBudgetOpen(false)} 
        onSave={handleBudgetSave}
      />
    </div>
  );
};

export default Eventcosting;
