import React, { useState } from "react";
import { FiPlus, FiX, FiChevronDown, FiUpload, FiBell } from "react-icons/fi";

// ---------- helpers ----------
const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const fmtAmt = (n) => (n ? `₹${parseFloat(n).toLocaleString("en-IN")}` : "Total");

const CATEGORIES = [
  "Venue Rental",
  "Food & Beverages",
  "Accommodation Charges",
  "Printing & Stationary",
  "Training Expenses",
  "Resource Cost",
  "Event Management",
  "Reimbursement of Event Expenditure (Misc)",
];

const makeSubItem = (description, attendees, unitCost) => ({
  id: uid("sub"),
  description,
  attendees,
  unitCost,
  amount: attendees && unitCost ? attendees * unitCost : "",
});

// ---------- dummy data ----------
const INITIAL_EXPENSES = [
  {
    id: uid("exp"),
    category: "Venue Rental",
    description: "Banquet hall booking for annual conference",
    vendorName: "Taj Convention Centre",
    date: "2026-07-10",
    totalAmount: "180000",
    remark: "Includes setup & teardown",
    approvalStatus: "Approved",
    subItems: [makeSubItem("Day 1 Hall Rent", 1, 90000), makeSubItem("Day 2 Hall Rent", 1, 90000)],
  },
  {
    id: uid("exp"),
    category: "Food & Beverages",
    description: "Catering for 75 attendees across 2 days",
    vendorName: "Spice Route Caterers",
    date: "2026-07-10",
    totalAmount: "157500",
    remark: "Veg + Non-veg buffet",
    approvalStatus: "Pending",
    subItems: [makeSubItem("Day 1 Lunch", 75, 1200), makeSubItem("Day 2 Lunch", 75, 900)],
  },
  {
    id: uid("exp"),
    category: "Printing & Stationary",
    description: "Badges, banners and delegate kits",
    vendorName: "PrintHub Solutions",
    date: "2026-07-05",
    totalAmount: "22000",
    remark: "",
    approvalStatus: "Rejected",
    subItems: [makeSubItem("Delegate Kits", 75, 250), makeSubItem("Banners", 4, 1125)],
  },
];

// ---------- reusable bits ----------
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white";
const numCls = "px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

const STATUS_STYLES = {
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

export default function ExpenseItems() {
  const [expenseItems, setExpenseItems] = useState(INITIAL_EXPENSES);
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleAddExpense = () => {
    if (!selectedCategory) return;
    setExpenseItems((items) => [
      ...items,
      {
        id: uid("exp"),
        category: selectedCategory,
        description: "",
        vendorName: "",
        date: "",
        totalAmount: "",
        remark: "",
        approvalStatus: "Pending",
        subItems: [makeSubItem("", "", "")],
      },
    ]);
    setSelectedCategory("");
  };

  const handleRemoveExpense = (expenseId) => setExpenseItems((items) => items.filter((e) => e.id !== expenseId));

  const handleExpenseChange = (expenseId, field, value) =>
    setExpenseItems((items) => items.map((e) => (e.id === expenseId ? { ...e, [field]: value } : e)));

  const handleAddSubItem = (expenseId) =>
    setExpenseItems((items) =>
      items.map((e) => (e.id === expenseId ? { ...e, subItems: [...e.subItems, makeSubItem("", "", "")] } : e))
    );

  const handleRemoveSubItem = (expenseId, subItemId) =>
    setExpenseItems((items) =>
      items.map((e) => (e.id !== expenseId ? e : { ...e, subItems: e.subItems.filter((si) => si.id !== subItemId) }))
    );

  const handleSubItemChange = (expenseId, subItemId, field, value) =>
    setExpenseItems((items) =>
      items.map((e) => {
        if (e.id !== expenseId) return e;
        return {
          ...e,
          subItems: e.subItems.map((si) => {
            if (si.id !== subItemId) return si;
            const updated = { ...si, [field]: value };
            const a = Number(updated.attendees) || 0;
            const c = Number(updated.unitCost) || 0;
            updated.amount = a && c ? a * c : "";
            return updated;
          }),
        };
      })
    );

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 bg-white py-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Expense Items</h3>

      <div className="flex items-center gap-3 mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Expense Category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={handleAddExpense}
          disabled={!selectedCategory}
          className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiPlus className="w-4 h-4" />
          Add new item
        </button>
      </div>

      <div className="space-y-4">
        {expenseItems.map((expense) => (
          <div key={expense.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">{expense.category}</h3>
              <button onClick={() => handleRemoveExpense(expense.id)} className="text-red-500 hover:text-red-700 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Row 1: Description + Upload */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              <div className="lg:col-span-3">
                <Field label="Description">
                  <input
                    type="text"
                    value={expense.description}
                    onChange={(e) => handleExpenseChange(expense.id, "description", e.target.value)}
                    placeholder="Enter description"
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Upload Proforma/Final bill">
                <button className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center gap-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                  Upload file
                  <FiUpload className="w-4 h-4" />
                </button>
              </Field>
            </div>

            {/* Row 2: Vendor Name + Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Vendor Name">
                <input
                  type="text"
                  value={expense.vendorName}
                  onChange={(e) => handleExpenseChange(expense.id, "vendorName", e.target.value)}
                  placeholder="Enter vendor name"
                  className={inputCls}
                />
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  value={expense.date}
                  onChange={(e) => handleExpenseChange(expense.id, "date", e.target.value)}
                  className={`${inputCls} text-gray-600`}
                />
              </Field>
            </div>

            {/* Row 3: Total Amount + Remark */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <Field label="Total Amount">
                <input
                  type="text"
                  value={expense.totalAmount}
                  onChange={(e) => handleExpenseChange(expense.id, "totalAmount", e.target.value)}
                  placeholder="Enter Value"
                  className={inputCls}
                />
              </Field>
              <Field label="Remark">
                <input
                  type="text"
                  value={expense.remark}
                  onChange={(e) => handleExpenseChange(expense.id, "remark", e.target.value)}
                  placeholder="Enter Remark"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Sub-items */}
            <div className="space-y-2 mb-3">
              {expense.subItems.map((subItem) => (
                <div key={subItem.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemoveSubItem(expense.id, subItem.id)}
                    disabled={expense.subItems.length === 1}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={subItem.description}
                    onChange={(e) => handleSubItemChange(expense.id, subItem.id, "description", e.target.value)}
                    placeholder="Description (e.g., Day 1 Lunch)"
                    className={`flex-1 ${inputCls}`}
                  />
                  <input
                    type="number"
                    min="0"
                    value={subItem.attendees}
                    onChange={(e) => handleSubItemChange(expense.id, subItem.id, "attendees", e.target.value)}
                    placeholder="Qty"
                    className={`w-24 ${numCls}`}
                  />
                  <input
                    type="number"
                    min="0"
                    value={subItem.unitCost}
                    onChange={(e) => handleSubItemChange(expense.id, subItem.id, "unitCost", e.target.value)}
                    placeholder="Amt"
                    className={`w-28 ${numCls}`}
                  />
                  <div className="w-28 px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium text-right">
                    {fmtAmt(subItem.amount)}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleAddSubItem(expense.id)}
              className="w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors mb-5"
            >
              + Add sub-item (e.g., Day 1, Day 2)
            </button>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Approved status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[expense.approvalStatus]}`}>
                  {expense.approvalStatus}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-blue-600 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  <FiBell className="w-4 h-4" />
                  Send Reminder
                  <FiChevronDown className="w-3.5 h-3.5" />
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Send for approval
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}