import React from 'react';
import VisionCards from '@/_components/UI/VisionCard';
import PortfolioCards from '@/_components/UI/PortfolioCards';
import TopEvents from '@/_components/UI/TopEvents';

const FinancePage = () => {
  return (
    <div className="pt-4 pb-24 md:p-6 md:min-h-screen h-auto bg-white">
      <div className="mb-5 md:mb-6">
        <h2 className="font-heading text-[26px] md:text-[32px] leading-[136%] font-bold text-[#333333] mb-1">Vision Board</h2>
        <p className="text-[#777777] text-[16px] font-nunito font-medium text-[15px] md:text-[18px] leading-[136%]">Annual overview and portfolio management</p>
      </div>

      <VisionCards />
      <PortfolioCards />
      <TopEvents />
    </div>
  );
};

export default FinancePage;