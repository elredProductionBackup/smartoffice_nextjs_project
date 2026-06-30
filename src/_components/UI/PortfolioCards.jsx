"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBudgetTypes } from '@/store/events/budgetChecklist/budgetThunks';

const portfolioData = [
  { id: 1, title: 'Learning', budget: 8500, expense: 7200, color: '#3a7cf5' },
  { id: 2, title: 'Forum', budget: 12000, expense: 11500, color: '#885df1' },
  { id: 3, title: 'Family', budget: 5000, expense: 4800, color: '#ec4899' },
  { id: 4, title: 'Spouse Partner', budget: 3500, expense: 3200, color: '#11b981' },
  { id: 5, title: 'Engagement', budget: 12000, expense: 11500, color: '#f59e0b' },
  { id: 6, title: 'Governance', budget: 12000, expense: 11500, color: '#5cbbf6' },
  { id: 7, title: 'Membership', budget: 12000, expense: 11500, color: '#f6a65c' },
  { id: 8, title: 'GLC', budget: 12000, expense: 11500, color: '#f65c5f' },
  { id: 9, title: 'Administration', budget: 12000, expense: 11500, color: '#f65cf1' },
];

const PortfolioCard = ({ title, budget, expense, color }) => {
  const percentage = ((expense / budget) * 100).toFixed(1);

  const data = [
    { name: 'Expense', value: expense },
    { name: 'Remaining', value: budget - expense },
  ];

  return (
    <Link href="/dashboard/Learning_portfolio" className="border border-gray-100 h-[380px] w-[230px] rounded-[10px] p-5 shadow-[0px_0px_6px_0px_#00000012] bg-white flex flex-col items-center shrink-0 cursor-pointer hover:shadow-md transition-shadow duration-200 no-underline">
      <h3 className="text-[#333333] font-bold text-[20px] leading-[136%] text-center w-full flex  justify-center mb-4 min-h-[58px]">{title}</h3>

      <div className="w-[153px] h-[153px] mb-4 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={51}
              outerRadius={76}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
              cornerRadius={0}
            >
              <Cell key="cell-0" fill={color} />
              <Cell key="cell-1" fill="#e9ecef" />
            </Pie>
            <Tooltip
              formatter={(value) => `₹${value.toLocaleString()}`}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center text-[16px] text-[#666666] mb-2 space-y-1 font-regular leading-[136%] w-full">
        <div>Budget: ₹{budget.toLocaleString()}</div>
        <div>Expense: ₹{expense.toLocaleString()}</div>
      </div>

      <div className="text-[16px] leading-[136%] font-bold mt-1" style={{ color }}>
        {percentage}% Utilized
      </div>
    </Link>
  );
};

const PortfolioCards = () => {
  const dispatch = useDispatch();
  const { budgetTypes } = useSelector((state) => state.budget);

  useEffect(() => {
    dispatch(fetchBudgetTypes());
  }, [dispatch]);

  const cards = portfolioData.map((item, i) => ({
    ...item,
    title: budgetTypes[i]?.budgetType ?? item.title,
  }));

  return (
    <div className="mt-8">
      <h2 className="text-[24px] leading-[136%] font-bold text-[#333333] mb-4 font-nunito">Portfolio Overview</h2>
      <div
        className="flex flex-row overflow-x-auto gap-5 pb-4 scrollbar-none"
        style={{
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {cards.map((item) => (
          <PortfolioCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
};

export default PortfolioCards;
