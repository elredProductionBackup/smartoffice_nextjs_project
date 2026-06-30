"use client";

import React, { useState, useEffect } from 'react';
import { FiCalendar, FiMapPin, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

const initialEventsData = [
  {
    id: 1,
    date: "12th - 14th",
    month: "August, 2026",
    image: "/image/figma-config.webp",
    name: "Figma Config",
    title: "Figma Config",
    portfolio: "Learning Portfolio",
    budget: "₹8,500",
    amount: "₹8,500",
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
    title: "Summer Leadership Workshop",
    portfolio: "Learning Portfolio",
    budget: "₹18,500",
    amount: "₹18,500",
    expenses: "₹15,000",
    location: "Mountain Resort",
    attendees: 50,
    isFeatured: true,
  },
  {
    id: 3,
    date: "26th",
    month: "August, 2026",
    image: "/image/spring-networking.png",
    name: "Spring Networking Event",
    title: "Spring Networking Event",
    portfolio: "Learning Portfolio",
    budget: "₹21,500",
    amount: "₹11,500",
    expenses: "₹18,000",
    location: "Grand Hotel Ballroom",
    attendees: 75,
    isFeatured: true,
  },
  {
    id: 4,
    date: "30th",
    month: "August, 2026",
    image: "/image/company-retreat.png",
    name: "Annual Company Retreat",
    title: "Annual Company Retreat",
    portfolio: "Networking Portfolio",
    budget: "₹12,000",
    amount: "₹12,000",
    expenses: "₹4,500",
    location: "Grand Hotel Ballroom",
    attendees: 80,
    isFeatured: false,
  }
];

const EventCard = ({ id, name, title, date, month, location, portfolio, budget, amount, onClick, onDelete }) => {
  const displayTitle = title || name;
  const displayAmount = amount || budget;
  const displayDate = month ? `${date} ${month}` : date;

  return (
    <div
      onClick={() => onClick(id)}
      className="group relative bg-[#f3f7fd] border border-[#e2e8f2] rounded-[10px] p-6 h-[162px] w-[400px] cursor-pointer hover:shadow-md hover:border-[#c5d5f0] transition-all duration-200"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
        className="absolute top-3 right-3 text-[#777777] hover:text-[#e11d48] opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-[#e2e8f2] rounded-full"
      >
        <FiX className="text-[18px]" />
      </button>

      <h3 className="text-[#333333] font-bold text-[20px] leading-[136%] mb-2 pr-6">{displayTitle}</h3>

      <div className='flex flex-col gap-1.5'>
        <div className="flex items-center gap-2 text-[#777777] text-[15px] ">
          <FiCalendar className="text-[18px]" />
          <span>{displayDate}</span>
        </div>

        <div className="flex items-center gap-2 text-[#777777] text-[15px] ">
          <FiMapPin className="text-[18px]" />
          <span>{location}</span>
        </div>

        <hr className="border-[#e2e8f2]" />

        <div className="flex justify-between items-center">
          <span className="text-[#666666] text-[14px]">{portfolio}</span>
          <span className="text-[#1b64df] font-bold text-[16px]">{displayAmount}</span>
        </div>
      </div>
    </div>
  );
};

const TopEvents = () => {
  const router = useRouter();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("smartoffice_events");
    if (stored) {
      try {
        setEvents(JSON.parse(stored));
      } catch (e) {
        setEvents(initialEventsData);
      }
    } else {
      setEvents(initialEventsData);
      localStorage.setItem("smartoffice_events", JSON.stringify(initialEventsData));
    }
  }, []);

  const handleCardClick = (id) => {
    router.push(`/dashboard/upcoming_event_details?id=${id}`);
  };

  const handleDelete = (id) => {
    const updated = events.map(event => {
      if (event.id === id) {
        return { ...event, isFeatured: false };
      }
      return event;
    });
    setEvents(updated);
    localStorage.setItem("smartoffice_events", JSON.stringify(updated));
  };

  // Only render cards that are marked as featured
  const featuredEvents = events.filter(event => event.isFeatured);

  return (
    <div className="mt-8 pb-4">
      <h2 className="text-[24px] leading-[136%] font-bold text-[#333333] mb-4 font-nunito">Top Upcoming Events</h2>

      {featuredEvents.length > 0 ? (
        <div className="flex flex-wrap gap-6">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} {...event} onClick={handleCardClick} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 font-nunito italic">No featured events to display.</p>
      )}
    </div>
  );
};

export default TopEvents;
