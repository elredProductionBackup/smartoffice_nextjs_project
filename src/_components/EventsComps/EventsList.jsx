 "use client";

import Image from "next/image";
import ProgressCircle from "./ProgressCircle";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedEvent } from "@/store/events/eventsSlice";

const TASK_ORDER = ["hard", "medium", "easy"];

const TASK_COLORS = {
  hard: "red",
  medium: "yellow",
  easy: "green",
};

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
  router.push(`/dashboard/events/${event.id}`);
};

  return (
    <div className="flex-1 flex flex-col overflow-auto px-[30px] relative">
      {/* TABLE HEADER */}
      <div
        className={`bg-[#F2F7FF] sticky top-0
        grid grid-cols-[140px_1fr] gap-[22px]
        text-[18px] font-[700] text-[#333333]
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
        <div className="flex flex-col gap-[30px] mt-[10px] animate-pulse">
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
          <div key={group.month} className="mb-[20px]">
            <p className="text-[16px] font-[700] pb-[10px] flex items-center gap-[22px]">
              <span className="w-[140px]">{group.month}</span>
              <span className="flex-1 h-[1px] bg-[#D4DFF1]" />
            </p>

            <div className="flex flex-col gap-[20px]">
              {group.items.map((event) => (
                <div
                  key={event.id}
                  onClick={() => goToEvent(event)}
                  className="cursor-pointer grid grid-cols-[140px_1fr] gap-[22px] last:[&_.event-border]:border-b-0"
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
                      {event.eventImage ? (
                        <Image
                          src={event.eventImage}
                          alt={event.name}
                          width={400}
                          height={400}
                          className="h-[50px] w-[50px] object-cover rounded-full border border-[#CCCCCC] bg-[#ccc]"
                        />
                      ) : (
                        <div className="h-[50px] w-[50px] rounded-full bg-[#ccc]" />
                      )}
                      <span className="text-[20px] font-[600]">
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
                      <div className="flex justify-center gap-[20px]">
                        {TASK_ORDER.map((task) => {
                          const localSummary = eventTaskSummaries[event.id]?.[task];
                          const taskData = localSummary || event.tasks?.[task] || {
                            completed: 0,
                            total: 0,
                          };

                          return (
                            <ProgressCircle
                              key={task}
                              value={`${taskData.completed}/${taskData.total}`}
                              color={TASK_COLORS[task]}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
