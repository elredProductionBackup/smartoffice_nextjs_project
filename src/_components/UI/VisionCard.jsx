'use client';

import React, { useState } from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { MdCurrencyRupee } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import IncomePopup from './IncomePopup';

const cardsData = [
  {
    id: 1,
    bgClass: "bg-[#edfaef]",
    borderClass: "border-[#d2f3d7]",
    iconBgClass: "bg-[#56b64d]",
    textColorClass: "text-[#4ca543]",
    icon: <FiTrendingUp className="text-2xl" />,
    title: "Income",
    amount: "₹ 150,000",
    subtext: "Yearly Income 2026",
    clickable: true,
    hoverColor: '#22c55e55',
  },
  {
    id: 2,
    bgClass: "bg-[#eaf2ff]",
    borderClass: "border-[#cfdfff]",
    iconBgClass: "bg-[#1662dd]",
    textColorClass: "text-[#1b64df]",
    icon: <MdCurrencyRupee className="text-2xl" />,
    title: "Budget",
    amount: "₹ 100,000",
    subtext: "Allocated Budget 2026",
    clickable: true,
    hoverColor: '#1662dd55',
  },
  {
    id: 3,
    bgClass: "bg-[#f6effe]",
    borderClass: "border-[#ebd8fd]",
    iconBgClass: "bg-[#9125e1]",
    textColorClass: "text-[#8a1bdc]",
    icon: <FiTrendingDown className="text-2xl" />,
    title: "Expense",
    amount: "₹ 27,700",
    subtext: "Total Expenses 2026",
  },
];

const SingleVisionCard = ({
  bgClass,
  borderClass,
  iconBgClass,
  textColorClass,
  icon,
  title,
  amount,
  subtext,
  onClick,
  clickable,
  hoverColor,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => clickable && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={
        hovered && hoverColor
          ? { boxShadow: `0 0 0 2.5px ${hoverColor}, 0px 4px 16px 0px #0000001A`, transform: 'scale(1.02)' }
          : {}
      }
      className={`${bgClass} border ${borderClass} rounded-[20px] p-6 shadow-[0px_1px_3px_0px_#0000001A,0px_0px_4px_-1px_#8B878733] transition-all duration-200 ${
        clickable ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-[42px] h-[42px] rounded-xl ${iconBgClass} text-white flex items-center justify-center`}
        >
          {icon}
        </div>
        <span className="text-[#4b5563] font-medium text-lg">{title}</span>
      </div>
      <div className={`text-[32px] font-bold ${textColorClass} mb-1 leading-none`}>
        {amount}
      </div>
      <div className="text-[#777777] text-[14px]">{subtext}</div>
    </div>
  );
};

const VisionCards = () => {
  const [showIncomePopup, setShowIncomePopup] = useState(false);
  const router = useRouter();

  const totalAssigned = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('smartoffice_assigned_budgets') || '{}');
      return Object.values(stored).reduce((sum, v) => sum + v, 0);
    } catch { return 0; }
  })();

  const totalAssignedFormatted = totalAssigned
    ? `₹ ${totalAssigned.toLocaleString('en-IN')}`
    : '₹ 0';

  const totalIncome = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('smartoffice_income_sources') || '[]');
      return stored.reduce((sum, s) => sum + Number(s.amount), 0);
    } catch { return 0; }
  })();

  const totalIncomeFormatted = totalIncome
    ? `₹ ${totalIncome.toLocaleString('en-IN')}`
    : '₹ 0';

  const handleCardClick = (title) => {
    if (title === 'Income') setShowIncomePopup(true);
    if (title === 'Budget') router.push('/dashboard/finance-budget');
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cardsData.map((card) => (
          <SingleVisionCard
            key={card.id}
            {...card}
            amount={card.title === 'Budget' ? totalAssignedFormatted : card.title === 'Income' ? totalIncomeFormatted : card.amount}
            onClick={card.clickable ? () => handleCardClick(card.title) : undefined}
          />
        ))}
      </div>

      {showIncomePopup && (
        <IncomePopup onClose={() => setShowIncomePopup(false)} />
      )}
    </>
  );
};

export default VisionCards;
