"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import { FiPieChart } from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { EVENTS_DETAIL_DATA } from "@/_data/eventsDetailData";

// ─── Custom Legend Label rendered outside the chart ───────────────────────────
const RADIAN = Math.PI / 180;

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  name,
  value,
  index,
}) => {
  const radius = outerRadius + 36;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#555"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fontFamily="Nunito Sans, sans-serif"
    >
      {`${name}: ${value}%`}
    </text>
  );
};

// ─── Main detail content (needs searchParams) ─────────────────────────────────
function EventDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = parseInt(searchParams.get("id") || "1", 10);

  const event = EVENTS_DETAIL_DATA.find((e) => e.id === id) || EVENTS_DETAIL_DATA[0];

  const remaining = event.totalBudget - event.actualExpense;
  const utilization = ((event.actualExpense / event.totalBudget) * 100).toFixed(1);

  const formatCurrency = (val) =>
    `₹ ${val.toLocaleString("en-IN")}`;

  return (
    <div className="p-6 min-h-screen bg-white font-nunito">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-[#333333] hover:opacity-75 transition-opacity bg-transparent border-0 p-0 outline-none cursor-pointer flex items-center justify-center"
            >
              <FaArrowLeft size={28} />
            </button>
            <h1 className="font-nunito font-bold text-[32px] leading-[136%] text-[#333333] tracking-normal">
              {event.title}
            </h1>
          </div>
          <p className="font-nunito font-medium text-[18px] leading-[136%] text-[#777777] tracking-normal pl-11">
            {event.portfolio}
          </p>
        </div>

        {/* View Breakdown button */}
        <button className="flex items-center gap-2 border border-[#333333] rounded-full px-5 py-2 text-[#333333] font-semibold text-[15px] hover:bg-gray-50 transition-colors cursor-pointer bg-white outline-none">
          <FiPieChart size={18} />
          <span>View breakdown</span>
        </button>
      </div>

      {/* ── Two-column card layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* LEFT – Budget Summary */}
        <div className="bg-white border border-[#E2E8F2] rounded-[16px] p-6">
          <h2 className="font-nunito font-bold text-[20px] text-[#333333] mb-5">
            Budget Summary
          </h2>

          {/* Colored summary rows */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Total Budget */}
            <div className="flex items-center justify-between bg-[#D3E3FD] rounded-[8px] px-4 py-3">
              <span className="text-[#333333] font-medium text-[15px]">Total Budget</span>
              <span className="text-[#0B57D0] font-bold text-[16px]">
                {formatCurrency(event.totalBudget)}
              </span>
            </div>

            {/* Actual Expense */}
            <div className="flex items-center justify-between bg-[#D1FAE5] rounded-[8px] px-4 py-3">
              <span className="text-[#333333] font-medium text-[15px]">Actual Expense</span>
              <span className="text-[#059669] font-bold text-[16px]">
                {formatCurrency(event.actualExpense)}
              </span>
            </div>

            {/* Remaining */}
            <div className="flex items-center justify-between bg-[#EDE9FE] rounded-[8px] px-4 py-3">
              <span className="text-[#333333] font-medium text-[15px]">Remaining</span>
              <span className="text-[#7C3AED] font-bold text-[16px]">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          {/* Info rows */}
          <div className="flex flex-col divide-y divide-[#F1F5F9]">
            <div className="flex items-center justify-between py-3">
              <span className="text-[#777777] text-[14px]">Utilization</span>
              <span className="text-[#333333] font-bold text-[15px]">{utilization}%</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[#777777] text-[14px]">Date</span>
              <span className="text-[#333333] font-medium text-[15px]">{event.date}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[#777777] text-[14px]">Location</span>
              <span className="text-[#333333] font-bold text-[15px]">{event.location}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[#777777] text-[14px]">Attendees</span>
              <span className="text-[#333333] font-bold text-[15px]">{event.attendees}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[#777777] text-[14px]">Format</span>
              <span className="text-[#333333] font-bold text-[15px]">{event.format}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[#777777] text-[14px]">Theme</span>
              <span className="text-[#333333] font-bold text-[15px]">{event.theme}</span>
            </div>
          </div>
        </div>

        {/* RIGHT – Budget Distribution */}
        <div className="bg-white border border-[#E2E8F2] rounded-[16px] p-6">
          <h2 className="font-nunito font-bold text-[20px] text-[#333333] mb-4">
            Budget Distribution
          </h2>

          {/* Donut Chart */}
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={event.budgetDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                  stroke="none"
                  labelLine={true}
                  label={renderCustomLabel}
                >
                  {event.budgetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "13px",
                    fontFamily: "Nunito Sans, sans-serif",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Budget totals below chart */}
          <div className="flex items-center justify-center gap-12 mt-2 pt-4 border-t border-[#E2E8F2]">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#777777] text-[13px]">Total Budget</span>
              <span className="text-[#333333] font-bold text-[16px]">
                {formatCurrency(event.totalBudget)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#777777] text-[13px]">Remaining</span>
              <span className="text-[#333333] font-bold text-[16px]">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notes ── */}
      <div className="bg-white px-1">
        <h3 className="font-nunito font-bold text-[18px] text-[#333333] mb-2">Notes</h3>
        <p className="text-[#777777] font-medium text-[15px] leading-[160%]">
          {event.notes}
        </p>
      </div>
    </div>
  );
}

// ─── Page wrapper with Suspense for useSearchParams ───────────────────────────
export default function UpcomingEventDetails() {
  return (
    <Suspense fallback={<div className="p-6 text-[#777777]">Loading...</div>}>
      <EventDetailContent />
    </Suspense>
  );
}