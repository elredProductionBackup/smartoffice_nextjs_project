import { useState } from "react";
import { Trash2, Upload, FileText, Check, X } from "lucide-react";
import { fmt } from "./utils";

export function ExpenseItemCard({ expense, onRemove, onSubItemChange, onSave }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const cardTotal = expense.subItems.reduce(
    (sum, si) =>
      sum + (parseFloat(si.attendees) || 0) * (parseFloat(si.unitCost) || 0),
    0
  );

  const handleSave = async () => {
    if (!onSave || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      await onSave(expense.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900">{expense.category}</h4>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">₹{fmt(cardTotal)}</span>
          <button
            onClick={() => onRemove(expense.id)}
            className="text-gray-300 hover:text-red-500 transition-colors"
            title="Remove category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lines */}
      <div className="divide-y divide-gray-100">
        {expense.subItems.map((si) => {
          const amount =
            (parseFloat(si.attendees) || 0) * (parseFloat(si.unitCost) || 0);
          return (
            <div key={si.id} className="p-4 grid grid-cols-12 gap-3 items-end">
              {/* Item name (the split — its identity, so read-only) */}
              <div className="col-span-12 md:col-span-3">
                <label className="block text-[11px] text-gray-500 mb-1">Item</label>
                <div
                  className="text-sm px-2 py-1.5 text-gray-800 font-medium truncate"
                  title={si.description || si.splitName}
                >
                  {si.description || si.splitName || "—"}
                </div>
              </div>

              {/* Vendor */}
              <div className="col-span-6 md:col-span-3">
                <label className="block text-[11px] text-gray-500 mb-1">Vendor</label>
                <input
                  type="text"
                  value={si.vendorName || ""}
                  onChange={(e) =>
                    onSubItemChange(expense.id, si.id, "vendorName", e.target.value)
                  }
                  placeholder="Vendor name"
                  className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Qty */}
              <div className="col-span-3 md:col-span-1">
                <label className="block text-[11px] text-gray-500 mb-1">Qty</label>
                <input
                  type="number"
                  min="0"
                  value={si.attendees ?? ""}
                  onChange={(e) =>
                    onSubItemChange(expense.id, si.id, "attendees", e.target.value)
                  }
                  placeholder="0"
                  className="w-full text-sm text-right px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Rate */}
              <div className="col-span-3 md:col-span-2">
                <label className="block text-[11px] text-gray-500 mb-1">Rate</label>
                <input
                  type="number"
                  min="0"
                  value={si.unitCost ?? ""}
                  onChange={(e) =>
                    onSubItemChange(expense.id, si.id, "unitCost", e.target.value)
                  }
                  placeholder="0"
                  className="w-full text-sm text-right px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Amount (computed) */}
              <div className="col-span-6 md:col-span-2">
                <label className="block text-[11px] text-gray-500 mb-1">Amount</label>
                <div className="w-full text-sm text-right px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                  ₹{fmt(amount)}
                </div>
              </div>

              {/* Receipt */}
              <div className="col-span-6 md:col-span-1 flex items-center gap-1 md:justify-end">
                <label
                  className={`cursor-pointer inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                    si.billUploaded
                      ? "border-green-300 text-green-700 bg-green-50"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                  title={si.billUploaded ? "Replace receipt" : "Upload receipt"}
                >
                  {si.billUploaded ? (
                    <FileText className="w-3.5 h-3.5" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {si.billUploaded ? "Bill" : "Upload"}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onSubItemChange(expense.id, si.id, "attachment", file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {si.billUploaded && (
                  <button
                    onClick={() => onSubItemChange(expense.id, si.id, "attachment", "")}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove receipt"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save CTA */}
      <div className="flex items-center justify-end px-4 py-3 bg-gray-50 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saved && !saving && <Check className="w-4 h-4" />}
          {saving ? "Saving…" : saved ? "Saved" : "Save Expense"}
        </button>
      </div>
    </div>
  );
}