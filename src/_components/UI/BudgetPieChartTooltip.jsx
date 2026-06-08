'use client';

function formatIndianCurrency(amount) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export default function BudgetPieChartTooltip({ active, payload, totalBudget = 0 }) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const name = data.name;
  const percent = Number(data.value) || 0;
  const amount = (totalBudget * percent) / 100;

  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.12)] font-nunito min-w-[140px]">
      <p className="text-[14px] font-bold text-[#333333] leading-snug mb-1">{name}</p>
      <p className="text-[16px] font-semibold text-[#2B7FFF] leading-tight mb-1">
        {formatIndianCurrency(amount)}
      </p>
      <p className="text-[12px] font-medium text-[#777777] leading-tight">
        {percent}% of budget
      </p>
    </div>
  );
}

export function createBudgetPieChartTooltip(totalBudget) {
  return function BudgetPieChartTooltipWrapper(props) {
    return <BudgetPieChartTooltip {...props} totalBudget={totalBudget} />;
  };
}
