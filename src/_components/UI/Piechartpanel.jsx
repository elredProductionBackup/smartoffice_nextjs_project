import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// ---------- color map ----------
// Keyed by exact category name so both pie charts use the same color for
// the same category no matter which one it appears in.
const COLORS = {
  "Printing & Stationary": "#3B82F6",
  "Venue Rental": "#A855F7",
  "Accommodation Charges": "#EC4899",
  "Food & Beverages": "#F59E0B",
  "Resource Cost": "#10B981",
  "Event Management": "#06B6D4",
  "Reimbursement of Event Expenditure (Misc)": "#6366F1",
  "Training Expenses": "#84CC16",
};

const FALLBACK_COLORS = [
  "#3B82F6", "#A855F7", "#EC4899", "#F59E0B",
  "#10B981", "#06B6D4", "#6366F1", "#84CC16",
  "#EF4444", "#F97316", "#14B8A6", "#8B5CF6",
];

function getColor(name, index) {
  return COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-sm">
        <p className="font-semibold text-gray-900 mb-0.5">{d.name}</p>
        <p className="text-blue-600 font-medium">₹{d.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
        {d.payload.percentage && <p className="text-gray-500">{d.payload.percentage}% of budget</p>}
      </div>
    );
  }
  return null;
}

export function PieChartPanel({ title, subtitle, data, emptyLabel = "No data yet" }) {
  const filtered = data.filter((d) => d.value > 0);
  const total = filtered.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-semibold text-gray-800 mb-0.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mb-3">{subtitle}</p>}

      {filtered.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">{emptyLabel}</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={filtered} cx="50%" cy="50%" innerRadius={40} outerRadius={85} paddingAngle={2} dataKey="value" labelLine={false}>
              {filtered.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={getColor(entry.name, i)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      )}

      {/* Legend with values beside categories */}
      <div className="mt-3 space-y-1.5">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(item.name, i) }} />
              <span className="text-gray-600 truncate">{item.name}</span>
            </div>
            <span className={`font-semibold ml-3 flex-shrink-0 tabular-nums ${item.value === 0 ? "text-gray-300" : "text-gray-900"}`}>
              {item.value === 0 ? "—" : `₹${item.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            </span>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
          <span className="text-gray-500">Total</span>
          <span className="font-bold text-gray-900 tabular-nums">₹{total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
        </div>
      )}
    </div>
  );
}