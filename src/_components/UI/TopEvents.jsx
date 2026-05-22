"use client";

import React from 'react';
import { FiCalendar, FiMapPin } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

const eventsData = [
  {
    id: 1,
    title: "Summer Leadership Workshop",
    date: "6/15/2026",
    location: "Mountain Resort",
    portfolio: "Learning Portfolio",
    amount: "₹18,500"
  },
  {
    id: 2,
    title: "Spring Networking Event",
    date: "6/15/2026",
    location: "Grand Hotel Ballroom",
    portfolio: "Learning Portfolio",
    amount: "₹11,500"
  },
  {
    id: 3,
    title: "Annual Company Retreat",
    date: "6/15/2026",
    location: "Grand Hotel Ballroom",
    portfolio: "Networking Portfolio",
    amount: "₹12,000"
  }
];

const EventCard = ({ id, title, date, location, portfolio, amount, onClick }) => {
  return (
    <div
      onClick={() => onClick(id)}
      className="bg-[#f3f7fd] border border-[#e2e8f2] rounded-[10px] p-6 h-[162px] w-[400px] cursor-pointer hover:shadow-md hover:border-[#c5d5f0] transition-all duration-200"
    >
      <h3 className="text-[#333333] font-bold text-[20px] leading-[136%] mb-2">{title}</h3>

      <div className='flex flex-col gap-1.5'>
        <div className="flex items-center gap-2 text-[#777777] text-[15px] ">
          <FiCalendar className="text-[18px]" />
          <span>{date}</span>
        </div>

        <div className="flex items-center gap-2 text-[#777777] text-[15px] ">
          <FiMapPin className="text-[18px]" />
          <span>{location}</span>
        </div>

        <hr className="border-[#e2e8f2]" />

        <div className="flex justify-between items-center">
          <span className="text-[#666666] text-[14px]">{portfolio}</span>
          <span className="text-[#1b64df] font-bold text-[16px]">{amount}</span>
        </div>
      </div>
    </div>
  );
};

const TopEvents = () => {
  const router = useRouter();

  const handleCardClick = (id) => {
    router.push(`/dashboard/upcoming_event_details?id=${id}`);
  };

  return (
    <div className="mt-8">
      <h2 className="text-[24px] leading-[136%] font-bold text-[#333333] mb-4 font-nunito">Top Upcoming Events</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {eventsData.map((event) => (
          <EventCard key={event.id} {...event} onClick={handleCardClick} />
        ))}
      </div>
    </div>
  );
};

export default TopEvents;
