import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

export function ExpenseItemCard({ expense, onRemove, onFieldChange, onSubItemChange }) {
  const cardTotal = expense.subItems.reduce((sum, si) => sum + (parseFloat(si.amount) || 0), 0);
  const [reminderType, setReminderType] = useState("");
  const [approvalStatus, setApprovalStatus] = useState(
    expense.approvalStatus
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-base font-bold text-gray-900">{expense.category}</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-900">₹{cardTotal.toLocaleString("en-IN")}</span>
          </div>
          <button onClick={() => onRemove(expense.id)} className="text-red-400 hover:text-red-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Card-level fields */}
      <div className="px-6 pt-4 pb-2 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label className="block text-xs text-gray-500 mb-1.5">Description</label>
          <input
            type="text"
            value={expense.description}
            onChange={(e) => onFieldChange(expense.id, "description", e.target.value)}
            placeholder="Enter description"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Date</label>
          <input
            type="date"
            value={expense.date}
            onChange={(e) => onFieldChange(expense.id, "date", e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-600"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Remark</label>
          <input
            type="text"
            value={expense.remark}
            onChange={(e) => onFieldChange(expense.id, "remark", e.target.value)}
            placeholder="Enter Remark"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Sub-items */}
      <div className="px-6 pb-4 space-y-3 mt-3">
        {expense.subItems.map((subItem) => (
          <div key={subItem.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            {/* Description + vendor + upload */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <input
                  type="text"
                  value={subItem.description}
                  onChange={(e) => onSubItemChange(expense.id, subItem.id, "description", e.target.value)}
                  placeholder="e.g., Day 1 Lunch"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={subItem.vendorName}
                  onChange={(e) => onSubItemChange(expense.id, subItem.id, "vendorName", e.target.value)}
                  placeholder="Enter vendor name"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Upload Proforma/Final bill</label>
                <button className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                  Upload file
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Qty + Amt + Total */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Qty</label>
                <input
                  type="number"
                  min="0"
                  value={subItem.attendees}
                  onChange={(e) => onSubItemChange(expense.id, subItem.id, "attendees", e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Amt</label>
                <input
                  type="number"
                  min="0"
                  value={subItem.unitCost}
                  onChange={(e) => onSubItemChange(expense.id, subItem.id, "unitCost", e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Total</label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 text-right">
                  ₹{subItem.amount ? parseFloat(subItem.amount).toLocaleString("en-IN") : "0"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
{/* Footer */}
<div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
  {/* Approval Status */}
  <div className="flex items-center gap-3">
    <span className="text-sm text-gray-700">
      Approved status:
    </span>

    <select
      value={approvalStatus}
      onChange={(e) => setApprovalStatus(e.target.value)}
      className={`px-3 py-1 rounded-full text-xs font-medium border outline-none ${
        approvalStatus === "Approved"
          ? "bg-green-100 text-green-700 border-green-200"
          : approvalStatus === "Rejected"
          ? "bg-red-100 text-red-700 border-red-200"
          : "bg-yellow-100 text-yellow-700 border-yellow-200"
      }`}
    >
      <option value="Pending">Pending</option>
      <option value="Approved">Approved</option>
      <option value="Rejected">Rejected</option>
    </select>
  </div>

  <div className="flex items-center gap-2">
    {/* Reminder Dropdown */}
    <div className="relative">
      <select
        value={reminderType}
        onChange={(e) => setReminderType(e.target.value)}
        className="appearance-none flex items-center gap-2 px-4 py-2 border border-gray-300 text-blue-600 rounded-lg hover:bg-gray-50 transition-colors text-sm pr-8"
      >
        <option value="">Send Reminder</option>
        <option value="whatsapp">WhatsApp</option>
        <option value="email">Email</option>
      </select>

      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
    </div>

    {/* CTA after selection */}
    {reminderType && (
      <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
        Send via{" "}
        {reminderType === "whatsapp"
          ? "WhatsApp"
          : "Email"}

        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    )}

    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
      Send for approval
    </button>
  </div>
</div>
    </div>
  );
}