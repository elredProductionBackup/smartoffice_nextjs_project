import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];
export function PieChartPanel({
  title,
  subtitle,
  data,
  emptyLabel = "No data yet",
}) {
  const chartData = data.filter((d) => d.value > 0);
  const hasData = chartData.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h4 className="text-sm font-semibold text-gray-900">
        {title}
      </h4>

      <p className="text-xs text-gray-500 mb-3">
        {subtitle}
      </p>

      {hasData ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
              >
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) =>
                  `₹${value.toLocaleString("en-IN")}`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-sm text-gray-400">
          {emptyLabel}
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        {chartData.map((d, i) => (
          <div
            key={d.name}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    COLORS[i % COLORS.length],
                }}
              />

              <span className="text-gray-600 truncate">
                {d.name}
              </span>
            </div>

            <span className="text-gray-800 font-medium flex-shrink-0 ml-2">
              ₹{d.value.toLocaleString("en-IN")}
              {d.percentage
                ? ` (${d.percentage}%)`
                : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}