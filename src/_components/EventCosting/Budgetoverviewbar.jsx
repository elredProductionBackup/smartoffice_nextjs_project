import { ChevronDown, Edit2 } from "lucide-react";

export function BudgetOverviewBar({
  totalBudget,
  totalActualSpent,
  isOverBudget,
  onEditBudget,
  onOpenDistribution,
}) {
  const utilizedPct =
    totalBudget > 0
      ? (totalActualSpent / totalBudget) * 100
      : 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <p className="text-xs text-gray-500 mb-1">Budget</p>
        <p className="text-2xl font-semibold text-gray-900">
          ₹{totalBudget.toLocaleString("en-IN")}
        </p>
      </div>

      <div className="flex-1 min-w-[200px] bg-blue-50 rounded-xl px-5 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-700">
            Event Budget Utilized
          </span>

          <span
            className={`text-lg font-semibold ${
              isOverBudget ? "text-red-600" : "text-blue-600"
            }`}
          >
            {utilizedPct.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
          <div
            className={`h-1.5 rounded-full transition-all ${
              isOverBudget ? "bg-red-500" : "bg-blue-600"
            }`}
            style={{
              width: `${Math.min(utilizedPct, 100)}%`,
            }}
          />
        </div>

        <p className="text-xs text-gray-500">
          ₹{totalActualSpent.toLocaleString("en-IN")} of ₹
          {totalBudget.toLocaleString("en-IN")}
        </p>
      </div>

      <div className="flex gap-2.5 flex-shrink-0">
        <button
          onClick={onEditBudget}
          className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Edit Budget
        </button>

        <button
          onClick={onOpenDistribution}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Budget Distribution
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}