"use client";

import React, { useEffect, useState } from 'react';
import { FiCalendar, FiMapPin, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { getFeaturedEvents, removeFeaturedEvent } from '@/services/finance.service';
import { fetchBudgetTypes } from '@/store/events/budgetChecklist/budgetThunks';
import { formatCompactAmount } from '@/utils/currency';

const locationLabel = (eventLocation) => {
  if (!eventLocation) return '—';
  return typeof eventLocation === 'string' ? eventLocation : eventLocation.location || '—';
};

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

const formatBudget = (value) => {
  const amount = Number(value);
  if (value == null || Number.isNaN(amount)) return '—';
  return `₹${formatCompactAmount(amount)}`;
};

const EventCard = ({ eventId, title, date, location, portfolio, budget, onClick, onRemove }) => {
  return (
    <div
      onClick={() => onClick(eventId)}
      className="group relative bg-[#f3f7fd] border border-[#e2e8f2] rounded-[10px] p-4 md:p-6 min-h-[162px] w-full md:w-[400px] min-w-0 cursor-pointer hover:shadow-md hover:border-[#c5d5f0] transition-all duration-200"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(eventId, title);
        }}
        title="Remove from Top Upcoming Events"
        className="absolute top-3 right-3 w-8 h-8 md:w-6 md:h-6 rounded-full bg-white border border-[#e2e8f2] text-[#777777] flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-[#e11d48] hover:border-[#e11d48] transition-all duration-150 cursor-pointer"
      >
        <FiX className="text-[14px]" />
      </button>

      <h3 className="text-[#333333] font-bold text-[18px] md:text-[20px] leading-[136%] mb-2 pr-8 md:pr-6 truncate" title={title}>{title}</h3>

      <div className='flex flex-col gap-1.5'>
        <div className="flex items-center gap-2 text-[#777777] text-[14px] md:text-[15px]">
          <FiCalendar className="text-[18px] shrink-0" />
          <span>{date}</span>
        </div>

        <div className="flex items-center gap-2 text-[#777777] text-[14px] md:text-[15px]">
          <FiMapPin className="text-[18px] shrink-0" />
          <span>{location}</span>
        </div>

        <hr className="border-[#e2e8f2]" />

        <div className="flex justify-between items-center gap-3">
          <span className="text-[#666666] text-[14px] min-w-0">{portfolio}</span>
          <span className="text-[#1b64df] font-bold text-[16px] shrink-0">{budget}</span>
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
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchBudgetTypes());
  }, [dispatch]);

  useEffect(() => {
    getFeaturedEvents(1, 10)
      .then((res) => {
        const result = Array.isArray(res?.result) ? res.result : [];
        const sorted = [...result].sort(
          (a, b) => moment(a.startDateTime).valueOf() - moment(b.startDateTime).valueOf()
        );
        setEvents(sorted);
      })
      .catch((error) => {
        console.error('Failed to fetch upcoming events:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCardClick = (eventId) => {
    router.push(`/dashboard/events/${eventId}?from=finance`);
  };

  const handleRemove = (eventId, title) => {
    setConfirmTarget({ eventId, title });
  };

  const confirmRemove = () => {
    const eventId = confirmTarget?.eventId;
    setConfirmTarget(null);
    if (!eventId) return;

    const removed = events.find((e) => e.eventId === eventId);
    setEvents((prev) => prev.filter((e) => e.eventId !== eventId));

    removeFeaturedEvent(eventId).catch((error) => {
      console.error('Failed to unfeature event', eventId, error);
      if (removed) setEvents((prev) => [...prev, removed]);
    });
  };

  const portfolioNameFor = (budgetTypeId) => {
    const name = budgetTypes.find((b) => b.budgetTypeId === budgetTypeId)?.budgetType;
    return name ? `${name} Portfolio` : '—';
  };

  return (
    <div className="mt-6 md:mt-8 pb-4">
      <h2 className="text-[20px] md:text-[24px] leading-[136%] font-bold text-[#333333] mb-4 font-nunito">Top Upcoming Events</h2>

      {!loading && events.length === 0 && (
        <p className="text-gray-500 font-nunito italic">No upcoming events to display.</p>
      )}

      {events.length > 0 && (
        <div className="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-6">
          {events.map((event) => (
            <EventCard
              key={event.eventId}
              eventId={event.eventId}
              title={event.eventName}
              date={formatEventDate(event.startDateTime, event.endDateTime)}
              location={locationLabel(event.eventLocation)}
              portfolio={portfolioNameFor(event.eventType?.budgetTypeId)}
              budget={formatBudget(event.eventbudget)}
              onClick={handleCardClick}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {confirmTarget && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmTarget(null)}
        >
          <div
            className="bg-white rounded-[16px] w-full max-w-[380px] shadow-xl p-5 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-bold text-[#1a1a2e] mb-1.5">Remove from Top Upcoming Events?</h3>
            <p className="text-[13px] text-[#666] mb-5">
              <span className="font-semibold text-[#1a1a2e]">{confirmTarget.title}</span> will no longer be featured
              here. You can feature it again anytime from its portfolio page.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-5 h-[38px] rounded-[8px] border border-[#d1d5db] text-[13px] font-semibold text-[#333] hover:bg-[#f9fafb] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="px-5 h-[38px] rounded-[8px] bg-[#e11d48] text-white text-[13px] font-semibold hover:bg-[#be123c] cursor-pointer transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopEvents;
