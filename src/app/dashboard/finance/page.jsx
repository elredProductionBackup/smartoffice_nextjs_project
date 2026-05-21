import React from 'react';
import VisionCards from '@/_components/UI/VisionCard';
import PortfolioCards from '@/_components/UI/PortfolioCards';
import TopEvents from '@/_components/UI/TopEvents';

const FinancePage = () => {
  return (
    <div className="p-6 h-full bg-white">
      <div className="mb-6">
        <h2 className="text-[32px] leading-[136%] font-bold text-[#333333] mb-1 font-nunito">Vision Board</h2>
        <p className="text-[#777777] text-base font-nunito font-medium text-[18px] leading-[136%]">Annual overview and portfolio management</p>
      </div>

      <VisionCards />
      <PortfolioCards />
      <TopEvents />
    </div>
  );
};

export default FinancePage;