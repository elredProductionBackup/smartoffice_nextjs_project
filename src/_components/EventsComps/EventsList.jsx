"use client";

import { Fragment } from "react";
import Image from "next/image";
import ProgressCircle from "./ProgressCircle";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedEvent } from "@/store/events/eventsSlice";
import { isValidImage } from "@/utils/functions";

const TASK_ORDER = ["hard", "medium", "easy"];

const TASK_COLORS = {
  hard: "red",
  medium: "yellow",
  easy: "green",
};

// Difficulty progress circles for one event (shared by the table row and the phone card)
function TaskCircles({ event, eventTaskSummaries, className }) {
  return (
    <div className={className}>
      {TASK_ORDER.map((task) => {
        const localSummary = eventTaskSummaries[event.id]?.[task];
        const taskData = localSummary || event.tasks?.[task] || {
          completed: 0,
          total: 0,
        };

        if (taskData.total === 0) return null;

        return (
          <ProgressCircle
            key={task}
            value={`${taskData.completed}/${taskData.total}`}
            color={TASK_COLORS[task]}
          />
        );
      })}
    </div>
  );
}

export default function EventsList({
  events = [],
  loading = false,
  error = null,
  showTasks = true,
  isDraft = false, 
}) {
  const dispatch = useDispatch();
  const { eventTaskSummaries } = useSelector((state) => state.events);
  const router = useRouter();
  const hasEvents = events.some((group) => group.items.length > 0);

  const goToEvent = (event) => {
    dispatch(setSelectedEvent(event));
    if(isDraft){
      router.push(`/dashboard/events/create?id=${event.id}`);
    } else{
      router.push(`/dashboard/events/${event.id}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto px-4 md:px-[30px] relative">
      {/* TABLE HEADER (tablet/desktop; phones get cards below) */}
      <div
        className={`bg-[#F2F7FF] sticky top-0 max-lg:min-w-[1100px]
        hidden md:grid grid-cols-[140px_1fr] gap-[22px]
        text-[18px] font-heading font-normal text-[#333333]
        pb-[20px] z-[10]`}
      >
        <div>Date</div>
        <div
          className={`grid ${
            showTasks
              ? "grid-cols-[1.5fr_100px_150px_250px]"
              : "grid-cols-[1.5fr_1fr_1fr]"
          } gap-[85px]`}
        >
          <div className="pl-[80px]">Event name</div>
          <div className="text-center">Attendees</div>
          <div className="text-center">Location</div>
          {showTasks && <div className="text-center">Task completed</div>}
        </div>
      </div>

      {/* SHIMMER LOADER */}
      {loading && (
        <div className="md:hidden flex flex-col gap-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-[16px] p-3 flex gap-3 items-center">
              <div className="h-[48px] w-[48px] shrink-0 rounded-full bg-[#D4DFF1]" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-[16px] w-3/4 bg-[#D4DFF1] rounded" />
                <div className="h-[12px] w-1/2 bg-[#D4DFF1] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && (
        <div className="hidden md:flex max-lg:min-w-[1100px] flex-col gap-[30px] mt-[10px] animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              {/* Month Line */}
              <div className="flex items-center gap-[22px] mb-[15px]">
                <div className="w-[140px] h-[16px] bg-[#D4DFF1] rounded" />
                <div className="flex-1 h-[1px] bg-[#D4DFF1]" />
              </div>

              {/* Row */}
              <div className="grid grid-cols-[140px_1fr] gap-[22px]">
                <div className="h-[50px] w-[140px] grid place-items-center">
                  <div className="h-[20px] w-[60px] bg-[#D4DFF1] rounded" />
                </div>
                <div
                  className={`grid ${
                    showTasks
                      ? "grid-cols-[1fr_100px_150px_250px]"
                      : "grid-cols-[1.5fr_1fr_1fr]"
                  } gap-[85px]`}
                >
                  {/* Event name */}
                  <div className="flex items-center gap-[20px]">
                    <div className="h-[50px] w-[50px] rounded-full bg-[#D4DFF1]" />
                    <div className="h-[18px] w-[180px] bg-[#D4DFF1] rounded" />
                  </div>

                  <div className="h-[18px] w-[40px] bg-[#D4DFF1] rounded m-auto" />
                  <div className="h-[18px] w-[80px] bg-[#D4DFF1] rounded m-auto" />

                  {showTasks && (
                    <div className="flex justify-center items-center gap-[20px]">
                      <div className="h-[40px] w-[40px] bg-[#D4DFF1] rounded-full" />
                      <div className="h-[40px] w-[40px] bg-[#D4DFF1] rounded-full" />
                      <div className="h-[40px] w-[40px] bg-[#D4DFF1] rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-semibold text-red-600">
            Failed to load events
          </div>
          <div className="text-[#666]">{error}</div>
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && !hasEvents && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-semibold">No events yet</div>
          <div className="text-[#666]">
            Looks like you haven’t added any events yet
          </div>
        </div>
      )}

      {/* EVENTS */}
      {!loading &&
        !error &&
        hasEvents &&
        events.map((group) => (
          <div key={group.month} className="mb-[20px] md:max-lg:min-w-[1100px]">
            <p className="text-[15px] md:text-[16px] font-[700] pb-[10px] flex items-center gap-3 md:gap-[22px]">
              <span className="shrink-0 md:w-[140px]">{group.month}</span>
              <span className="flex-1 h-[1px] bg-[#D4DFF1]" />
            </p>

            <div className="flex flex-col gap-3 md:gap-[20px]">
              {group.items.map((event) => (
                <Fragment key={event.id}>
                {/* Phone card */}
                <div
                  onClick={() => goToEvent(event)}
                  className="md:hidden cursor-pointer bg-white rounded-[16px] p-3 flex gap-3 items-start"
                >
                  {event?.eventImage ? (
                    <Image
                      src={
                        isValidImage(event?.eventImage)
                          ? event.eventImage
                          : "/logo/no-image.svg"
                      }
                      alt={event?.eventName || "event"}
                      width={96}
                      height={96}
                      className="h-[48px] w-[48px] shrink-0 object-cover rounded-full border border-[#CCCCCC] bg-[#ccc]"
                    />
                  ) : (
                    <div className="h-[48px] w-[48px] shrink-0 rounded-full bg-[#ccc]" />
                  )}

                  <div className="flex-1 min-w-0 flex flex-col gap-[6px]">
                    <span className="text-[17px] leading-[1.3] font-heading font-normal text-[#111] line-clamp-2 break-words">
                      {event.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#666666]">
                      <span className="font-[600] text-[#333333]">{event.date}</span>
                      <span>Attendees: <span className="font-[600] text-[#333333]">{event.attendees}</span></span>
                      {event.location && (
                        <span className="min-w-0 max-w-full truncate">{event.location}</span>
                      )}
                    </div>
                    {showTasks && (
                      <TaskCircles
                        event={event}
                        eventTaskSummaries={eventTaskSummaries}
                        className="flex gap-[10px] empty:hidden"
                      />
                    )}
                  </div>
                </div>

                {/* Table row (tablet/desktop) */}
                <div
                  onClick={() => goToEvent(event)}
                  className="cursor-pointer hidden md:grid grid-cols-[140px_1fr] gap-[22px] last:[&_.event-border]:border-b-0"
                >
                  <div className="text-center pt-[10px] font-[600]">
                    {event.date}
                  </div>

                  <div
                    className={`event-border grid ${
                      showTasks
                        ? "grid-cols-[1fr_100px_150px_250px]"
                        : "grid-cols-[1.5fr_1fr_1fr]"
                    } gap-[85px] pb-[20px] border-b border-[#D4DFF1]`}
                  >
                    <div className="flex items-center gap-[20px]">
                      {event?.eventImage ? (
                        <Image
                          src={
                            isValidImage(event?.eventImage)
                              ? event.eventImage
                              : "/logo/no-image.svg"
                          }
                          alt={event?.eventName || "event"}
                          width={400}
                          height={400}
                          className="h-[50px] min-w-[50px] max-w-[50px] object-cover rounded-full border border-[#CCCCCC] bg-[#ccc]"
                        />
                      ) : (
                        <div className="h-[50px] w-[50px] rounded-full bg-[#ccc]" />
                      )}
                      <span className="text-[20px] font-heading font-normal line-clamp-2">
                        {event.name}
                      </span>
                    </div>

                    <div className="grid place-items-center text-[18px] font-[500]">
                      {event.attendees}
                    </div>

                    <div className={`${showTasks && 'max-w-[150px]'} min-w-0 flex items-center justify-center text-[18px] font-[500]`}>
                      <span className="block w-full overflow-hidden whitespace-nowrap text-ellipsis text-center">
                        {event.location}
                      </span>
                    </div>

                    {showTasks && (
                      <TaskCircles
                        event={event}
                        eventTaskSummaries={eventTaskSummaries}
                        className="flex justify-center gap-[20px]"
                      />
                    )}
                  </div>
                </div>
                </Fragment>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
