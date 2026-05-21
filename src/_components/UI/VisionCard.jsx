import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { MdCurrencyRupee } from 'react-icons/md';

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
}) => {
  return (
    <div
      className={`${bgClass} border ${borderClass} rounded-[20px] p-6 shadow-[0px_1px_3px_0px_#0000001A,0px_0px_4px_-1px_#8B878733]`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-[42px] h-[42px] rounded-xl ${iconBgClass} text-white flex items-center justify-center`}
        >
          {icon}
        </div>
        <span className="text-[#4b5563] font-medium text-lg">{title}</span>
      </div>
      <div
        className={`text-[32px] font-bold ${textColorClass} mb-1 leading-none`}
      >
        {amount}
      </div>
      <div className="text-[#777777] text-[14px]">{subtext}</div>
    </div>
  );
};

const VisionCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cardsData.map((card) => (
        <SingleVisionCard key={card.id} {...card} />
      ))}
    </div>
  );
};

export default VisionCards;
