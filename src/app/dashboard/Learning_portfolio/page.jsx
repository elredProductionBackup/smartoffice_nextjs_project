"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaStar, FaRegStar } from "react-icons/fa6";
import { FiPieChart } from "react-icons/fi";

const eventsData = [
  {
    id: 1,
    date: "12th - 14th",
    month: "August, 2026",
    image: "/image/figma-config.webp",
    name: "Figma Config",
    portfolio: "Learning Portfolio",
    budget: "₹8,500",
    expenses: "₹8,200",
    location: "Hyderabad",
    attendees: 102,
    isFeatured: false,
  },
  {
    id: 2,
    date: "22nd",
    month: "August, 2026",
    image: "/image/summer-workshop.png",
    name: "Summer Leadership Workshop",
    portfolio: "Learning Portfolio",
    budget: "₹18,500",
    expenses: "₹15,000",
    location: "Mumbai",
    attendees: 50,
    isFeatured: true,
  },
  {
    id: 3,
    date: "26th",
    month: "August, 2026",
    image: "/image/spring-networking.png",
    name: "Spring Networking Event",
    portfolio: "Learning Portfolio",
    budget: "₹11,500",
    expenses: "₹5,000",
    location: "Delhi",
    attendees: 75,
    isFeatured: true,
  },
  {
    id: 4,
    date: "30th",
    month: "August, 2026",
    image: "/image/company-retreat.png",
    name: "Annual Company Retreat",
    portfolio: "Learning Portfolio",
    budget: "₹12,000",
    expenses: "₹4,500",
    location: "Mumbai",
    attendees: 80,
    isFeatured: false,
  }
];

const LearningPortfolio = () => {
    const router = useRouter();

    return (
        <div className="p-6 min-h-screen bg-white">
            {/* Header section with back arrow */}
            <div className="flex flex-col gap-1 mb-6">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push("/dashboard/finance")}
                        className="text-[#333333] hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer border-0 bg-transparent p-0 outline-none"
                    >
                        <FaArrowLeft size={32} />
                    </button>
                    <h1 className="font-nunito font-bold text-[32px] leading-[136%] text-[#333333] tracking-normal">
                        Learning Portfolio
                    </h1>
                </div>
                <p className="font-nunito font-medium text-[18px] leading-[136%] text-[#777777] tracking-normal pl-11">
                    All events in this portfolio
                </p>
            </div>

            <div className="event-div w-full min-h-full h-auto rounded-[20px] bg-[#F2F7FF] p-[30px] mb-2 overflow-x-auto">
                <div className="min-w-[950px]">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1.2fr_2.8fr_1fr_1fr_1.2fr_1fr_2fr] gap-4 pb-4 border-b border-[#D4DFF1] text-[#333333] text-[16px] font-bold font-nunito items-center">
                        <div>Date</div>
                        <div>Event name</div>
                        <div className="text-center">Budget</div>
                        <div className="text-center">Expenses</div>
                        <div className="text-center">Location</div>
                        <div className="text-center">Attendees</div>
                        <div className="text-center">Actions</div>
                    </div>

                    {/* Table Body */}
                    {eventsData.map((event, index) => (
                        <div key={event.id}>
                            {/* Month Group Header */}
                            {index === 0 && (
                                <div className="grid grid-cols-[1.2fr_2.8fr_1fr_1fr_1.2fr_1fr_2fr] gap-4 pt-5 pb-1">
                                    <div className="text-[16px] font-bold text-[#333333] font-nunito">
                                        {event.month}
                                    </div>
                                </div>
                            )}

                            {/* Event Row */}
                            <div className="grid grid-cols-[1.2fr_2.8fr_1fr_1fr_1.2fr_1fr_2fr] gap-4 py-5 border-b border-[#D4DFF1] last:border-b-0 items-center">
                                {/* Date */}
                                <div className="text-[#333333] font-semibold leading-[136%] text-center text-[16px] font-nunito">
                                    {event.date}
                                </div>

                                {/* Event Name */}
                                <div className="flex items-center gap-3.5">
                                    <div className="w-[50px] h-[50px] rounded-full overflow-hidden shrink-0 bg-gray-200">
                                        <img 
                                            src={event.image} 
                                            alt={event.name} 
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[#333333] font-semibold text-[18px] leading-[136%] font-nunito">
                                            {event.name}
                                        </span>
                                        <span className="text-[#666666] text-[12px] font-regular leading-[136%] font-nunito">
                                            {event.portfolio}
                                        </span>
                                    </div>
                                </div>

                                {/* Budget */}
                                <div className="text-[#0B57D0] font-bold text-[16px] font-nunito text-center">
                                    {event.budget}
                                </div>

                                {/* Expenses */}
                                <div className="text-[#43AE34] font-bold text-[16px] font-nunito text-center">
                                    {event.expenses}
                                </div>

                                {/* Location */}
                                <div className="text-[#333333] text-[16px] text-center font-medium font-nunito">
                                    {event.location}
                                </div>

                                {/* Attendees */}
                                <div className="text-[#333333] text-[16px] text-center font-medium font-nunito">
                                    {event.attendees}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-center gap-6">
                                    <button className="flex items-center gap-2 text-[#0B57D0] hover:opacity-80 transition-opacity font-bold text-[15px] font-nunito cursor-pointer bg-transparent border-0 p-0 outline-none">
                                        <FiPieChart className="text-[18px] stroke-[2.5]" />
                                        <span>Breakdown</span>
                                    </button>
                                    <button className={`flex items-center gap-1.5 font-bold text-[15px] font-nunito cursor-pointer bg-transparent border-0 p-0 outline-none transition-all duration-200 hover:opacity-85 ${event.isFeatured ? "text-[#F59E0B]" : "text-[#666666]"}`}>
                                        {event.isFeatured ? <FaStar className="text-[18px]" /> : <FaRegStar className="text-[18px]" />}
                                        <span>Feature</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LearningPortfolio;