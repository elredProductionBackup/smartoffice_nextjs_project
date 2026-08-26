"use client";

import React, { useEffect, useState } from 'react';
import { FiCalendar, FiMapPin } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { getEventsList } from '@/services/events.service';
import { fetchBudgetTypes } from '@/store/events/budgetChecklist/budgetThunks';

const getOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

const formatEventDate = (startDateTime, endDateTime) => {
  const start = moment(startDateTime);
  const end = moment(endDateTime);
  if (!start.isValid()) return '—';

  if (!end.isValid() || start.isSame(end, 'day')) {
    return `${getOrdinal(start.date())} ${start.format('MMMM, YYYY')}`;
  }
  if (start.isSame(end, 'month')) {
    return `${getOrdinal(start.date())} - ${getOrdinal(end.date())} ${start.format('MMMM, YYYY')}`;
  }
  return `${getOrdinal(start.date())} ${start.format('MMM')} - ${getOrdinal(end.date())} ${end.format('MMM, YYYY')}`;
};

const EventCard = ({ eventId, title, date, location, portfolio, onClick }) => {
  return (
    <div
      onClick={() => onClick(eventId)}
      className="group relative bg-[#f3f7fd] border border-[#e2e8f2] rounded-[10px] p-6 h-[162px] w-[400px] cursor-pointer hover:shadow-md hover:border-[#c5d5f0] transition-all duration-200"
    >
      <h3 className="text-[#333333] font-bold text-[20px] leading-[136%] mb-2 pr-6">{title}</h3>

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
          {/* Per-event budget amount requires getBudgetEventReportCategory, not yet implemented */}
          <span className="text-[#1b64df] font-bold text-[16px]">—</span>
        </div>
      </div>
    </div>
  );
};

const TopEvents = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { budgetTypes } = useSelector((state) => state.budget);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchBudgetTypes());
  }, [dispatch]);

  useEffect(() => {
    const networkClusterCode = localStorage.getItem('networkClusterCode');

    getEventsList({ networkClusterCode, start: 1, offset: 3, filterBy: 'all' })
      .then((res) => {
        setEvents(res.data?.result || []);
      })
      .catch((error) => {
        console.error('Failed to fetch upcoming events:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCardClick = (eventId) => {
    router.push(`/dashboard/events/${eventId}`);
  };

  const portfolioNameFor = (budgetTypeId) => {
    const name = budgetTypes.find((b) => b.budgetTypeId === budgetTypeId)?.budgetType;
    return name ? `${name} Portfolio` : '—';
  };

  return (
    <div className="mt-8 pb-4">
      <h2 className="text-[24px] leading-[136%] font-bold text-[#333333] mb-4 font-nunito">Top Upcoming Events</h2>

      {!loading && events.length === 0 && (
        <p className="text-gray-500 font-nunito italic">No upcoming events to display.</p>
      )}

      {events.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {events.map((event) => (
            <EventCard
              key={event.eventId}
              eventId={event.eventId}
              title={event.eventName}
              date={formatEventDate(event.startDateTime, event.endDateTime)}
              location={event.eventLocation || '—'}
              portfolio={portfolioNameFor(event.eventType?.budgetTypeId)}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TopEvents;
