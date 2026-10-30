"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { FaArrowLeft, FaStar, FaRegStar } from "react-icons/fa6";
import moment from "moment";
import TitleTooltipHover from "@/_components/UI/TitleTooltipHover";
import { fetchBudgetTypes } from "@/store/events/budgetChecklist/budgetThunks";
import {
  getBudgetEventReportCategory,
  addFeaturedEvent,
  removeFeaturedEvent,
  getFeaturedEvents,
} from "@/services/finance.service";
import { formatCompactAmount } from "@/utils/currency";

const GRID_COLS = "1.2fr 2.8fr 1fr 1fr 1.2fr 1fr 2fr";

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

const formatEventDate = (startDateTime, endDateTime) => {
  const start = moment(startDateTime);
  const end = moment(endDateTime);
  if (!start.isValid()) return "-";
  if (!end.isValid() || start.isSame(end, "day")) {
    return getOrdinal(start.date());
  }
  if (start.isSame(end, "month")) {
    return `${getOrdinal(start.date())} - ${getOrdinal(end.date())}`;
  }
  return `${getOrdinal(start.date())} ${start.format("MMM")} - ${getOrdinal(end.date())} ${end.format("MMM")}`;
};

const formatRupees = (value) => `₹${formatCompactAmount(value)}`;

// Feature / Featured toggle (shared by the table row and the phone card)
const FeatureButton = ({ isPastEvent, isFeatured, onToggle }) => (
  <TitleTooltipHover title={isPastEvent ? "Past Events can't be featured" : ""}>
    <button
      type="button"
      disabled={isPastEvent}
      onClick={(e) => {
        e.stopPropagation();
        if (isPastEvent) return;
        onToggle();
      }}
      className={`flex items-center gap-1.5 font-bold text-[15px] font-nunito bg-transparent border-0 p-0 outline-none transition-all duration-200 ${
        isPastEvent
          ? "text-[#cccccc] cursor-not-allowed"
          : `cursor-pointer hover:opacity-85 ${isFeatured ? "text-[#F59E0B]" : "text-[#666666]"}`
      }`}
    >
      {isFeatured ? <FaStar className="text-[18px]" /> : <FaRegStar className="text-[18px]" />}
      <span>{isFeatured ? "Featured" : "Feature"}</span>
    </button>
  </TitleTooltipHover>
);

const PortfolioDetailPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const params = useParams();
  const budgetTypeId = params?.budgetTypeId;

  const { budgetTypes } = useSelector((state) => state.budget);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState({});

  useEffect(() => {
    dispatch(fetchBudgetTypes());
  }, [dispatch]);

  useEffect(() => {
    if (!budgetTypeId) return;

    const fetchEvents = () => {
      setLoading(true);
      getBudgetEventReportCategory(budgetTypeId)
        .then((response) => {
          const rows = Array.isArray(response?.result) ? response.result : [];

          // Backend response can repeat the same event (its attendee-count
          // lookup isn't always grouped back down to one row per event) —
          // dedupe by eventId.
          const seen = new Set();
          const deduped = rows.filter((row) => {
            if (seen.has(row.eventId)) return false;
            seen.add(row.eventId);
            return true;
          });

          const sorted = [...deduped].sort(
            (a, b) => moment(a.startDateTime).valueOf() - moment(b.startDateTime).valueOf()
          );
          setEvents(sorted);
        })
        .catch((error) => {
          console.error("Failed to fetch budget event report for", budgetTypeId, error);
          setEvents([]);
        })
        .finally(() => setLoading(false));
    };

    fetchEvents();
  }, [budgetTypeId]);

  // The star must reflect actual backend state on load — otherwise every
  // fresh visit to this page shows everything as unfeatured even though
  // getFeaturedEvents still lists it.
  useEffect(() => {
    getFeaturedEvents(1, 100)
      .then((response) => {
        const rows = Array.isArray(response?.result) ? response.result : [];
        setFeatured((prev) => {
          const next = { ...prev };
          rows.forEach((row) => {
            if (row.eventId) next[row.eventId] = true;
          });
          return next;
        });
      })
      .catch((error) => {
        console.error("Failed to fetch featured events", error);
      });
  }, []);

  const portfolioName = budgetTypes.find((t) => t.budgetTypeId === budgetTypeId)?.budgetType || "Portfolio";

  const toggleFeature = (eventId) => {
    const nextFeatured = !featured[eventId];
    setFeatured((prev) => ({ ...prev, [eventId]: nextFeatured }));

    const request = nextFeatured ? addFeaturedEvent(eventId) : removeFeaturedEvent(eventId);
    request.catch((error) => {
      console.error(`Failed to ${nextFeatured ? "feature" : "unfeature"} event`, eventId, error);
      setFeatured((prev) => ({ ...prev, [eventId]: !nextFeatured }));
    });
  };

  // Month headers: show a label above the first event of each month
  let lastMonthLabel = null;
  const rows = events.map((event) => {
    const monthLabel = moment(event.startDateTime).format("MMMM, YYYY");
    const showMonthHeader = monthLabel !== lastMonthLabel;
    lastMonthLabel = monthLabel;
    return {
      event,
      monthLabel,
      showMonthHeader,
      isFeatured: !!featured[event.eventId],
      isPastEvent: moment(event.startDateTime).isBefore(moment()),
    };
  });

  const emptyState = loading ? (
    <div className="text-center py-12 text-[#777777] font-nunito">Loading events…</div>
  ) : events.length === 0 ? (
    <div className="text-center py-12 text-[#777777] font-nunito">No events in this portfolio yet.</div>
  ) : null;

  return (
    <div className="pt-4 pb-24 md:p-6 md:min-h-screen bg-white">
      {/* Header section with back arrow */}
      <div className="flex flex-col gap-1 mb-5 md:mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              router.push(
                searchParams.get("from") === "portfolio-officer"
                  ? "/dashboard/portfolio-officer"
                  : "/dashboard/finance"
              )
            }
            aria-label="Back"
            className="text-[#333333] hover:opacity-80 transition-opacity flex items-center justify-center shrink-0 cursor-pointer border-0 bg-transparent p-0 outline-none"
          >
            <FaArrowLeft className="text-[24px] md:text-[32px]" />
          </button>
          <h1 className="font-heading font-bold text-[24px] md:text-[32px] leading-[136%] text-[#333333] tracking-normal">
            {portfolioName} Portfolio
          </h1>
        </div>
        <p className="font-nunito font-medium text-[15px] md:text-[18px] leading-[136%] text-[#777777] tracking-normal pl-9 md:pl-11">
          All events in this portfolio
        </p>
      </div>

      {/* Phones: one card per event */}
      <div className="md:hidden rounded-[16px] bg-[#F2F7FF] p-3">
        {emptyState ??
          rows.map(({ event, monthLabel, showMonthHeader, isFeatured, isPastEvent }) => (
            <React.Fragment key={event.eventId}>
              {showMonthHeader && (
                <div className="text-[15px] font-bold text-[#333333] font-nunito px-1 pt-2 pb-2">{monthLabel}</div>
              )}
              <div
                onClick={() => router.push(`/dashboard/events/${event.eventId}`)}
                className="bg-white rounded-[12px] p-3.5 mb-2.5 cursor-pointer active:bg-[#EBF3FF] font-nunito"
              >
                <div className="flex items-center gap-3">
                  <div className="w-[44px] h-[44px] rounded-full overflow-hidden shrink-0 bg-gray-200">
                    {event.eventImage && (
                      <Image
                        src={event.eventImage}
                        alt={event.eventName}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[#333333] font-semibold text-[16px] leading-[136%] truncate">
                      {event.eventName}
                    </span>
                    <span className="text-[#666666] text-[12px] leading-[136%] truncate">
                      {formatEventDate(event.startDateTime, event.endDateTime)} · {event.eventLocation?.location || "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#777777] font-semibold">Budget</div>
                    <div className="text-[#0B57D0] font-bold text-[15px]">{formatRupees(event.eventBudget)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#777777] font-semibold">Expenses</div>
                    <div className="text-[#43AE34] font-bold text-[15px]">{formatRupees(event.eventExpenseAmount)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#777777] font-semibold">Attendees</div>
                    <div className="text-[#333333] font-semibold text-[15px]">{event.NumberOfattendees ?? 0}</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#E8EEF8] flex items-center justify-between gap-3">
                  <FeatureButton
                    isPastEvent={isPastEvent}
                    isFeatured={isFeatured}
                    onToggle={() => toggleFeature(event.eventId)}
                  />
                  {isPastEvent && <span className="text-[12px] text-[#999999] text-right">Past Events can&apos;t be featured</span>}
                </div>
              </div>
            </React.Fragment>
          ))}
      </div>

      <div className="event-div hidden md:block w-full min-h-full h-auto rounded-[20px] bg-[#F2F7FF] p-[30px] mb-2 overflow-x-auto">
        <div className="min-w-[950px]">
          {/* Table Header */}
          <div
            className="grid gap-4 pb-4 border-b border-[#D4DFF1] text-[#333333] text-[16px] font-bold font-nunito items-center"
            style={{ gridTemplateColumns: GRID_COLS }}
          >
            <div className="text-left">Date</div>
            <div className="text-left">Event name</div>
            <div className="text-left">Budget</div>
            <div className="text-left">Expenses</div>
            <div className="text-left">Location</div>
            <div className="text-left">Attendees</div>
            <div className="text-left pl-6">Actions</div>
          </div>

          {/* Table Body */}
          {emptyState ??
            rows.map(({ event, monthLabel, showMonthHeader, isFeatured, isPastEvent }) => {
              return (
                <React.Fragment key={event.eventId}>
                  {showMonthHeader && (
                    <div className="grid gap-4 pt-5 pb-1" style={{ gridTemplateColumns: GRID_COLS }}>
                      <div className="text-[16px] font-bold text-[#333333] font-nunito text-left">{monthLabel}</div>
                    </div>
                  )}

                  {/* Event Row */}
                  <div
                    onClick={() => router.push(`/dashboard/events/${event.eventId}`)}
                    className="grid gap-4 py-5 border-b border-[#D4DFF1] last:border-b-0 items-center cursor-pointer hover:bg-[#EBF3FF] transition-colors duration-150 rounded-lg px-2"
                    style={{ gridTemplateColumns: GRID_COLS }}
                  >
                    {/* Date */}
                    <div className="text-[#333333] font-semibold leading-[136%] text-left text-[16px] font-nunito">
                      {formatEventDate(event.startDateTime, event.endDateTime)}
                    </div>

                    {/* Event Name */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-[50px] h-[50px] rounded-full overflow-hidden shrink-0 bg-gray-200">
                        {event.eventImage && (
                          <Image
                            src={event.eventImage}
                            alt={event.eventName}
                            width={50}
                            height={50}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#333333] font-semibold text-[18px] leading-[136%] font-nunito">
                          {event.eventName}
                        </span>
                        <span className="text-[#666666] text-[12px] font-regular leading-[136%] font-nunito">
                          {portfolioName} Portfolio
                        </span>
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="text-[#0B57D0] font-bold text-[16px] font-nunito text-left">
                      {formatRupees(event.eventBudget)}
                    </div>

                    {/* Expenses */}
                    <div className="text-[#43AE34] font-bold text-[16px] font-nunito text-left">
                      {formatRupees(event.eventExpenseAmount)}
                    </div>

                    {/* Location */}
                    <div className="text-[#333333] text-[16px] text-left font-medium font-nunito">
                      {event.eventLocation?.location || "-"}
                    </div>

                    {/* Attendees */}
                    <div className="text-[#333333] text-[16px] text-left font-medium font-nunito pl-4">
                      {event.NumberOfattendees ?? 0}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-start gap-6 pl-4">
                      <FeatureButton
                        isPastEvent={isPastEvent}
                        isFeatured={isFeatured}
                        onToggle={() => toggleFeature(event.eventId)}
                      />
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default PortfolioDetailPage;
