// 'use client';
// import React, { useState, useRef, useEffect } from 'react';
// import { useSearchParams } from 'next/navigation';
// import { FiEdit2, FiChevronDown, FiPlus } from 'react-icons/fi';
// import {
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   ResponsiveContainer,
// } from 'recharts';
// import EventBudgetPopup, {
//   DEFAULT_EVENT_BUDGET_CATEGORIES,
// } from './EventBudgetPopup';
// import EventCostingCard from './UI/EventCostingCards';
// import { createBudgetPieChartTooltip } from './UI/BudgetPieChartTooltip';
// import { useExpenseRecordsStore } from '@/store/useExpenseRecordsStore';
// import { useFinanceStore } from '@/store/useFinanceStore';
// import { deleteExpense } from '@/services/expense.service';
// import { useBudgetTypeStore } from '@/store/useBudgetTypeStore';

// const DEFAULT_PORTFOLIO_BUDGET = 1200000;
// const EVENT_BUDGET_UTILIZED = 200000;

// function formatIndianCurrency(amount) {
//   return `₹${amount.toLocaleString('en-IN')}`;
// }

// const DEFAULT_EXPENSE_CATEGORIES = [
//   'Venue Rental',
//   'Food & Beverages',
//   'Accommodation Charges',
//   'Printing & Stationary',
//   'Training Expenses',
//   'Resource Cost',
//   'Event Management',
//   'Reimbursement of Event Expenditure (Misc)',
// ];

// const CATEGORY_COLORS = [
//   '#3b82f6', '#885df1', '#ec4899', '#f59e0b', '#14b8a6',
//   '#06b6d4', '#6366f1', '#84cc16', '#f97316', '#a855f7',
//   '#10b981', '#ef4444', '#0ea5e9', '#d946ef',
// ];

// /** Read category names from the matching portfolio saved by BudgetChecklist */
// function getLearningCategoryNames(portfolioName = 'Learning', budgetTypesList = []) {
//   // 1. Try resolving from the backend budgetTypes list
//   const matchedType = budgetTypesList.find((b) => {
//     const bId = String(b.budgetTypeId || b._id || b.id || '').toLowerCase().trim();
//     const bName = String(b.budgetType || b.name || b.title || b.label || '').toLowerCase().trim();
//     const target = String(portfolioName).toLowerCase().trim();
//     return bId === target || bName === target;
//   });

//   const apiCategories = matchedType?.categories ?? matchedType?.budgetCategory ?? [];
//   if (apiCategories && apiCategories.length > 0) {
//     return apiCategories.map((c) => c.budgetCategory ?? c.name ?? '');
//   }

//   // 2. Fallback to localStorage
//   try {
//     const saved = localStorage.getItem('smartoffice_portfolio_budgets');
//     if (!saved) return DEFAULT_EXPENSE_CATEGORIES;
//     const portfolios = JSON.parse(saved);
//     const matched = portfolios.find((p) => 
//       p.name?.toLowerCase() === portfolioName.toLowerCase() || 
//       p.id?.toLowerCase() === portfolioName.toLowerCase()
//     );
//     if (!matched || !matched.categories || matched.categories.length === 0)
//       return DEFAULT_EXPENSE_CATEGORIES;
//     return matched.categories.map((c) => c.name);
//   } catch {
//     return DEFAULT_EXPENSE_CATEGORIES;
//   }
// }

// /**
//  * Read full category objects {key, name, value, color} from the matching
//  * portfolio so the EventBudgetPopup shows the same items with their percentages.
//  */
// function getLearningBudgetCategories(portfolioName = 'Learning', budgetTypesList = []) {
//   // 1. Try resolving from the backend budgetTypes list
//   const matchedType = budgetTypesList.find((b) => {
//     const bId = String(b.budgetTypeId || b._id || b.id || '').toLowerCase().trim();
//     const bName = String(b.budgetType || b.name || b.title || b.label || '').toLowerCase().trim();
//     const target = String(portfolioName).toLowerCase().trim();
//     return bId === target || bName === target;
//   });

//   const apiCategories = matchedType?.categories ?? matchedType?.budgetCategory ?? [];
//   if (apiCategories && apiCategories.length > 0) {
//     return apiCategories.map((cat, idx) => ({
//       key: (cat.budgetCategory ?? cat.name ?? '').toLowerCase().replace(/\s+/g, '_') + '_' + idx,
//       name: cat.budgetCategory ?? cat.name ?? '',
//       value: Number(cat.percentage) || 0,
//       color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
//     }));
//   }

//   // 2. Fallback to localStorage
//   try {
//     const saved = localStorage.getItem('smartoffice_portfolio_budgets');
//     if (!saved) return DEFAULT_EVENT_BUDGET_CATEGORIES;
//     const portfolios = JSON.parse(saved);
//     const matched = portfolios.find((p) => 
//       p.name?.toLowerCase() === portfolioName.toLowerCase() || 
//       p.id?.toLowerCase() === portfolioName.toLowerCase()
//     );
//     if (!matched || !matched.categories || matched.categories.length === 0)
//       return DEFAULT_EVENT_BUDGET_CATEGORIES;
//     return matched.categories.map((cat, idx) => ({
//       key: cat.name.toLowerCase().replace(/\s+/g, '_') + '_' + idx,
//       name: cat.name,
//       value: cat.percentage,
//       color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
//     }));
//   } catch {
//     return DEFAULT_EVENT_BUDGET_CATEGORIES;
//   }
// }

// // ─── Main Component ──────────────────────────────────────────────────────────
// const Eventcosting = ({ eventName = '-', portfolio = '-' }) => {
//   const [isBudgetOpen, setIsBudgetOpen] = useState(false);
//   const [isEventBudgetOpen, setIsEventBudgetOpen] = useState(false);
//   const [portfolioBudget, setPortfolioBudget] = useState(DEFAULT_PORTFOLIO_BUDGET);
//   const [budgetDistribution, setBudgetDistribution] = useState(
//     DEFAULT_EVENT_BUDGET_CATEGORIES
//   );

//   const { budgetTypes, fetchBudgetTypes } = useBudgetTypeStore();

//   useEffect(() => {
//     fetchBudgetTypes();
//   }, [fetchBudgetTypes]);

//   // Sync budgetDistribution from BudgetChecklist's learning portfolio
//   useEffect(() => {
//     setBudgetDistribution(getLearningBudgetCategories(portfolio, budgetTypes));

//     const handleStorage = (e) => {
//       if (e.key === 'smartoffice_portfolio_budgets' || e.key === null) {
//         setBudgetDistribution(getLearningBudgetCategories(portfolio, budgetTypes));
//       }
//     };
//     window.addEventListener('storage', handleStorage);
//     return () => window.removeEventListener('storage', handleStorage);
//   }, [portfolio, budgetTypes]);

//   const addExpenseFromEventCosting = useExpenseRecordsStore(
//     (state) => state.addExpenseFromEventCosting
//   );
//   const hydrateExpenseRecords = useExpenseRecordsStore(
//     (state) => state.hydrateFromStorage
//   );
//   const addFinanceItem = useFinanceStore((state) => state.addExpenseFromForm);
//   const hydrateFinance = useFinanceStore((state) => state.hydrateFromStorage);

//   useEffect(() => {
//     hydrateExpenseRecords();
//     hydrateFinance();
//   }, [hydrateExpenseRecords, hydrateFinance]);

//   const utilizationPercent =
//     portfolioBudget > 0 ? (EVENT_BUDGET_UTILIZED / portfolioBudget) * 100 : 0;

//   const handleBudgetSave = (amount) => {
//     setPortfolioBudget(amount);
//   };

//   const handleEventBudgetSave = (categories) => {
//     setBudgetDistribution(categories);
//   };

//   const handleSendExpenseForApproval = (expenseData) => {
//     addExpenseFromEventCosting({
//       ...expenseData,
//       eventName,
//       portfolio,
//     });

//     addFinanceItem({
//       description: expenseData.description?.trim() || expenseData.narrative?.trim() || expenseData.category,
//       expenseType: 'Event Related',
//       event: eventName,
//       portfolio,
//       date: expenseData.date,
//       totalAmount: expenseData.totalAmount,
//       paid: expenseData.paid,
//       balance: expenseData.balance,
//       vendorName: expenseData.vendorName,
//       fileName: expenseData.billFileName,
//       remark: expenseData.remark,
//     });

//     // Patch the matching section's initialData with the real backend budgetExpenseId
//     // so that if the user deletes immediately after submitting, the correct ID is used
//     if (expenseData.budgetExpenseId) {
//       setExpenseSections((prev) =>
//         prev.map((section) =>
//           section.title === expenseData.category
//             ? {
//                 ...section,
//                 initialData: {
//                   ...(section.initialData || {}),
//                   budgetExpenseId: expenseData.budgetExpenseId,
//                 },
//               }
//             : section
//         )
//       );
//     }
//   };

//   const [expenseSections, setExpenseSections] = useState([]);
//   const expenses = useExpenseRecordsStore((state) => state.expenses);
//   const searchParams = useSearchParams();
//   const expenseId = searchParams.get('expenseId');
//   const processedExpenseIdRef = useRef(null);

//   useEffect(() => {
//     if (expenseId && expenses.length > 0 && processedExpenseIdRef.current !== expenseId) {
//       const matchedExpense = expenses.find((e) => String(e.id) === String(expenseId));
//       if (matchedExpense) {
//         processedExpenseIdRef.current = expenseId;
//         const title = matchedExpense.category || 'Event Related';
//         setExpenseSections((prev) => {
//           const exists = prev.some((section) => section.title === title || String(section.id) === String(matchedExpense.id));
//           if (exists) return prev;
//           return [
//             ...prev,
//             {
//               id: matchedExpense.id,
//               title,
//               initialData: {
//                 ...matchedExpense,
//                 isSubmitted: true
//               }
//             }
//           ];
//         });
//       }
//     }
//   }, [expenseId, expenses]);

//   const [selectedCategory, setSelectedCategory] = useState('');
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef(null);
//   const dropdownMenuRef = useRef(null);

//   // Dynamic expense categories sourced from BudgetChecklist (learning portfolio)
//   const [expenseCategories, setExpenseCategories] = useState(DEFAULT_EXPENSE_CATEGORIES);

//   useEffect(() => {
//     // Load on mount
//     setExpenseCategories(getLearningCategoryNames(portfolio, budgetTypes));

//     // Update whenever BudgetChecklist writes to localStorage
//     const handleStorage = (e) => {
//       if (e.key === 'smartoffice_portfolio_budgets' || e.key === null) {
//         setExpenseCategories(getLearningCategoryNames(portfolio, budgetTypes));
//       }
//     };
//     window.addEventListener('storage', handleStorage);
//     return () => window.removeEventListener('storage', handleStorage);
//   }, [portfolio, budgetTypes]);

//   useEffect(() => {
//     const handler = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, []);

//   useEffect(() => {
//     if (dropdownOpen) {
//       const timer = setTimeout(() => {
//         dropdownMenuRef.current?.scrollIntoView({
//           behavior: 'smooth',
//           block: 'nearest',
//         });
//       }, 100);
//       return () => clearTimeout(timer);
//     }
//   }, [dropdownOpen]);

//   const handleAddNewSection = () => {
//     if (!selectedCategory) return;
//     const newSection = {
//       id: Date.now(),
//       title: selectedCategory,
//     };
//     setExpenseSections((prev) => [...prev, newSection]);
//     setSelectedCategory('');
//   };

//   const removeExpenseSection = async (id, budgetExpenseId) => {
//     // Only call the delete API if we have a budgetExpenseId
//     if (budgetExpenseId) {
//       try {
//         await deleteExpense(budgetExpenseId);
//       } catch (err) {
//         const message = err?.response?.data?.message || '';
//         const isInvalidId = message.toLowerCase().includes('invalid') ||
//                             err?.response?.status === 400 ||
//                             err?.response?.status === 404;

//         if (isInvalidId) {
//           // Expense doesn't exist on backend (e.g. local-only record) — remove from UI anyway
//           console.warn('Expense not found on backend, removing locally:', budgetExpenseId);
//         } else {
//           // Real server/network error — keep card in UI and alert
//           console.error('Failed to delete expense:', err);
//           alert(err?.response?.data?.message || 'Failed to delete expense. Please try again.');
//           return;
//         }
//       }
//     }
//     setExpenseSections((prev) => prev.filter((section) => section.id !== id));
//   };

//   return (
//     <div className={`flex flex-col w-full min-w-0 ${dropdownOpen ? 'pb-[280px]' : ''}`}>

//       {/* ================ Portfolio budget & distribution ============================== */}
//       <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 mb-[60px] font-nunito">
//         {/* Left – Portfolio Budget */}
//         <div className="flex flex-col">
//           <p className="text-[14px] font-medium text-[#777777] mb-1">Budget</p>
//           <h1 className="text-[32px] font-bold text-[#333333] mb-5 leading-tight">
//             {formatIndianCurrency(portfolioBudget)}
//           </h1>

//           <div className="bg-[#F2F7FF] rounded-2xl px-5 py-4 mb-5">
//             <div className="flex items-center justify-between mb-3">
//               <span className="text-[14px] font-medium text-[#333333]">
//                 Event Budget Utilized
//               </span>
//               <span className="text-[14px] font-bold text-[#2B7FFF]">
//                 {utilizationPercent.toFixed(1)}%
//               </span>
//             </div>
//             <div className="w-full h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden mb-2">
//               <div
//                 className="h-full rounded-full bg-[#2B7FFF] transition-all duration-300"
//                 style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
//               />
//             </div>
//             <p className="text-[12px] font-medium text-[#777777]">
//               {formatIndianCurrency(EVENT_BUDGET_UTILIZED)} of{' '}
//               {formatIndianCurrency(portfolioBudget)}
//             </p>
//           </div>

//           <div className="flex flex-wrap items-center gap-3">
//             <button
//               type="button"
//               onClick={() => setIsBudgetOpen(true)}
//               className="inline-flex items-center justify-center gap-2 h-[44px] px-5 rounded-full border-2 border-[#2B7FFF] bg-white text-[#2B7FFF] text-[15px] font-semibold cursor-pointer hover:bg-[#F2F7FF] transition-colors outline-none"
//             >
//               <FiEdit2 className="w-4 h-4" />
//               Edit Budget
//             </button>
//             <button
//               type="button"
//               onClick={() => setIsEventBudgetOpen(true)}
//               className="inline-flex items-center justify-center gap-2 h-[44px] px-5 rounded-full bg-[#2B7FFF] text-white text-[15px] font-semibold cursor-pointer hover:bg-[#1a6fe6] transition-colors border-0 outline-none"
//             >
//               Event Budget
//             </button>
//           </div>
//         </div>

//         {/* Right – Event Budget Distribution */}
//         <div className="flex flex-col">
//           <p className="text-[14px] font-medium text-[#777777] mb-4">
//             Event Budget Distribution
//           </p>

//           <div className="w-full h-[280px] sm:h-[320px]">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={budgetDistribution}
//                   cx="50%"
//                   cy="50%"
//                   innerRadius={0}
//                   outerRadius={125}
//                   dataKey="value"
//                   stroke="#fff"
//                   strokeWidth={2}
//                   className='cursor-pointer'
//                 >
//                   {budgetDistribution.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip
//                   content={createBudgetPieChartTooltip(portfolioBudget)}
//                   contentStyle={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}
//                 />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 mt-2">
//             {budgetDistribution.map((item) => (
//               <div key={item.name} className="flex items-center gap-2 min-w-0">
//                 <span
//                   className="w-2.5 h-2.5 rounded-full shrink-0"
//                   style={{ backgroundColor: item.color }}
//                 />
//                 <span className="text-[12px] font-medium text-[#333333] truncate">
//                   {item.name}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ================ Expenses Header ============================================ */}
//       <div className="w-full flex items-center gap-4 mb-6">
//         <div className="flex-1 h-[1px] bg-[#EEEEEE]" />
//       </div>

//       {/* ================ Add Expense Category Input Row ============================= */}
//       <div className="w-full flex items-center gap-3 mb-8 font-nunito">
//         <div ref={dropdownRef} className="flex-1 relative">
//           <button
//             type="button"
//             onClick={() => setDropdownOpen((o) => !o)}
//             className={`w-full flex items-center justify-between px-4 h-[48px] border rounded-[14px] bg-white text-[15px] cursor-pointer outline-none text-left transition-colors ${
//               dropdownOpen ? 'border-[#2B7FFF]' : 'border-[#E2E8F0]'
//             }`}
//             style={{ color: !selectedCategory ? '#777777' : '#333333' }}
//           >
//             <span>{selectedCategory || 'Select Expense Category'}</span>
//             <FiChevronDown
//               className="ml-2 shrink-0 text-slate-500 transition-transform duration-200"
//               style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
//             />
//           </button>

//           {dropdownOpen && (
//             <div
//               ref={dropdownMenuRef}
//               className="absolute top-[calc(100%+6px)] left-0 w-full bg-white rounded-[14px] z-[9999] overflow-y-auto p-2 border border-[#E2E8F0]"
//               style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1)', maxHeight: '280px' }}
//             >
//               <button
//                 type="button"
//                 onMouseDown={() => {
//                   setSelectedCategory('');
//                   setDropdownOpen(false);
//                 }}
//                 className={`block w-full text-left px-4 py-2.5 cursor-pointer border-none rounded-lg transition-colors duration-150 font-nunito font-semibold text-[14px] ${
//                   !selectedCategory
//                     ? 'bg-[#F2F7FF] text-[#2B7FFF]'
//                     : 'bg-transparent text-[#777777] hover:bg-slate-50'
//                 }`}
//               >
//                 Select Expense Category
//               </button>
//               {expenseCategories.map((opt) => {
//                 const isSelected = opt === selectedCategory;
//                 return (
//                   <button
//                     key={opt}
//                     type="button"
//                     onMouseDown={() => {
//                       setSelectedCategory(opt);
//                       setDropdownOpen(false);
//                     }}
//                     className={`block w-full text-left px-4 py-2.5 cursor-pointer border-none rounded-lg transition-colors duration-150 font-nunito font-semibold text-[14px] ${
//                       isSelected
//                         ? 'bg-[#F2F7FF] text-[#2B7FFF]'
//                         : 'bg-transparent text-[#333333] hover:bg-slate-50'
//                     }`}
//                   >
//                     {opt}
//                   </button>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//         <button
//           type="button"
//           onClick={handleAddNewSection}
//           className="inline-flex items-center justify-center gap-2 h-[48px] px-5 border border-[#E2E8F0] rounded-[14px] bg-white text-[#777777] hover:bg-slate-50 transition-colors font-nunito font-semibold text-[14px] whitespace-nowrap outline-none cursor-pointer"
//         >
//           <FiPlus className="w-4 h-4 text-[#777777]" />
//           Add new item
//         </button>
//       </div>

//       {/* ================ Expense Sections ============================================ */}
//       <div className="w-full flex flex-col gap-4">
//         {expenseSections.map((section) => (
//           <EventCostingCard
//             key={section.id}
//             title={section.title}
//             eventName={eventName}
//             portfolio={portfolio}
//             onRemove={(budgetExpenseId) => removeExpenseSection(section.id, budgetExpenseId)}
//             onSendForApproval={handleSendExpenseForApproval}
//             initialData={section.initialData}
//           />
//         ))}
//       </div>

//       <EventBudgetPopup
//         isOpen={isBudgetOpen}
//         onClose={() => setIsBudgetOpen(false)}
//         onSave={handleBudgetSave}
//         totalBudget={portfolioBudget}
//         mode="edit"
//       />

//       <EventBudgetPopup
//         isOpen={isEventBudgetOpen}
//         onClose={() => setIsEventBudgetOpen(false)}
//         onSave={handleEventBudgetSave}
//         totalBudget={portfolioBudget}
//         categories={budgetDistribution}
//         mode="distribution"
//       />
//     </div>
//   );
// };

// export default Eventcosting;

import React from 'react'
import BudgetBreakup from './UI/Budgetbreakup'
import ExpenseItems from './UI/Expenseitems'

const Eventcosting = () => {
  return (
    <>
      {/* Budget overview bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-500 mb-1">Budget</p>
          <p className="text-2xl font-semibold text-gray-900">₹20,00,000</p>
        </div>
        <div className="flex-1 min-w-[200px] bg-blue-50 rounded-xl px-5 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-700">Event Budget Utilized</span>
            <span className={`text-lg font-semibold ${false ? "text-red-600" : "text-blue-600"}`}>
              {2000000 > 0 ? ((1000000 / 2000000) * 100).toFixed(1) : "0.0"}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
            <div
              className={`h-1.5 rounded-full transition-all ${false ? "bg-red-500" : "bg-blue-600"}`}
              style={{ width: `${Math.min((1000000 / 2000000) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">₹{1000000} of ₹{2000000}</p>
        </div>
        <div className="flex gap-2.5 flex-shrink-0">
          <button
            onClick={() => console.log(true)}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
          >
            {/* <Edit2 className="w-3.5 h-3.5" /> */}
            Edit Budget
          </button>
          <button
            onClick={() => console.log(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Budget Distribution
            {/* <ChevronDown className="w-3.5 h-3.5" /> */}
          </button>
        </div>
      </div>
      <BudgetBreakup/>
      <ExpenseItems/>
    </>
  )
}

export default Eventcosting