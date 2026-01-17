// "use client";

// import Image from "next/image";
// import ProgressCircle from "./ProgressCircle";

// // import Image from "next/image";

// const EVENTS = [
//   {
//     month: "December, 2025",
//     items: [
//       {
//         date: "22nd - 24th",
//         name: "Figma Config",
//         attendees: 102,
//         location: "Hyderabad",
//         image: "/images/event1.png",
//       },
//       {
//         date: "26th",
//         name: "Webflow Advanced Workshop",
//         attendees: 75,
//         location: "Mumbai",
//         image: "/images/event2.png",
//       },
//       {
//         date: "28th",
//         name: "Figma Design Sprint",
//         attendees: 207,
//         location: "Delhi",
//         image: "/images/event3.png",
//       },
//       {
//         date: "31st",
//         name: "Sketch UI/UX Fundamentals",
//         attendees: 123,
//         location: "Pune",
//         image: "/images/event4.png",
//       },
//     ],
//   },
//   {
//     month: "January, 2026",
//     items: [
//       {
//         date: "2nd - 4th",
//         name: "InVision Prototyping Techniques",
//         attendees: 102,
//         location: "Hyderabad",
//         image: "/images/event5.png",
//       },
//       {
//         date: "16th",
//         name: "Canva for Business Branding",
//         attendees: 48,
//         location: "Pune",
//         image: "/images/event6.png",
//       },
//       {
//         date: "26th",
//         name: "UX Research and Testing",
//         attendees: 59,
//         location: "Mumbai",
//         image: "/images/event7.png",
//       },
//     ],
//   },
// ];

// export default function UpcomingEvents() {
//   const hasEvents = EVENTS.some(group => group.items.length > 0);

//   return (
//     <div className="flex-1 flex flex-col overflow-auto px-[30px] relative">
//       {/* Table Header (ALWAYS visible) */}
//       <div className="bg-[#F2F7FF] sticky top-[0px]
//         grid grid-cols-[140px_1.5fr_100px_150px_250px]
//         gap-[85px] text-[18px] font-[700] text-[#333333]
//         pb-[20px] z-[10]"
//       >
//         <div>Date</div>
//         <div>Event name</div>
//         <div className="text-center">Attendees</div>
//         <div className="text-center">Location</div>
//         <div className="text-center">Task completed</div>
//       </div>

//       {/* EMPTY STATE */}
//       {!hasEvents && (
//         <div className=" flex-1 flex flex-col items-center justify-center px-[30px] text-center">
//           <div className="h-[80px] w-[80px] rounded-full bg-[#D3E3FD] grid place-items-center mb-[30px]">
//             <Image
//               src="/logo/no-events.svg"
//               alt="No events"
//               width={46}
//               height={46}
//             />
//           </div>

//           <div className="mb-3 text-2xl font-semibold text-[#333333]">
//             No events yet
//           </div>

//           <div className="text-base font-normal text-[#666666]">
//             Looks like you haven’t added any events yet
//           </div>
//         </div>
//       )}

//       {/* EVENTS LIST */}
//       {hasEvents && EVENTS.map((group) => (
//         <div key={group.month} className="mb-[20px]">
//           {/* Month */}
//           <p className="text-[16px] font-[700] text-[#333] pb-[10px] flex items-center gap-[22px]">
//             <span className="whitespace-nowrap w-[140px]">
//               {group.month}
//             </span>
//             <span className="flex-1 h-[1px] bg-[#D4DFF1]" />
//           </p>

//           {/* Rows */}
//           <div className="flex flex-col rounded-[12px] overflow-hidden pt-[6px] gap-[20px]">
//             {group.items.map((event, index) => (
//               <div
//                 key={index}
//                 className="grid grid-cols-[140px_1fr] gap-[22px] items-start
//                   last:[&_.event-border]:border-b-0"
//               >
//                 <div className="text-[16px] text-[#333] font-[600] text-center pt-[10px]">
//                   {event.date}
//                 </div>

//                 <div
//                   className="event-border grid grid-cols-[1fr_100px_150px_250px]
//                     gap-[85px] pb-[20px] border-b border-[#D4DFF1]"
//                 >
//                   <div className="flex items-center gap-[20px]">
//                     <div className="h-[50px] w-[50px] rounded-full bg-[#ccc]" />
//                     <span className="text-[20px] font-[600] text-[#333333]">
//                       {event.name}
//                     </span>
//                   </div>

//                   <div className="text-[18px] font-[500] text-[#333333] text-center grid place-items-center">
//                     {event.attendees}
//                   </div>

//                   <div className="text-[18px] font-[500] text-[#333333] text-center grid place-items-center">
//                     {event.location}
//                   </div>

//                   <div className="flex items-center justify-center gap-[20px]">
//                     <ProgressCircle value="2/3" color="red" />
//                     <ProgressCircle value="2/10" color="yellow" />
//                     <ProgressCircle value="5/8" color="green" />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }



"use client";

// import Image from "next/image";
import ProgressCircle from "./ProgressCircle";

const TASK_ORDER = ["hard", "medium", "easy"];

const TASK_COLORS = {
  hard: "red",
  medium: "yellow",
  easy: "green",
};

export default function EventsList({
  events,
  showTasks = true,
  isDraft = false,
}) {
  const hasEvents = events.some(group => group.items.length > 0);

  return (
    <div className="flex-1 flex flex-col overflow-auto px-[30px] relative">
      {/* TABLE HEADER */}
      <div
        className={`bg-[#F2F7FF] sticky top-0
        grid grid-cols-[140px_1fr] gap-[22px]
        gap-[22px] text-[18px] font-[700] text-[#333333]
        pb-[20px] z-[10]`}
      >
        <div>Date</div>
        <div className={`grid ${showTasks?`grid-cols-[1.5fr_100px_150px_250px]`:`grid-cols-[1.5fr_1fr_1fr]`}  gap-[85px]`}>
          <div>Event name</div>
          <div className="text-center">Attendees</div>
          <div className="text-center">Location</div>
          {showTasks && <div className="text-center">Task completed</div>}
        </div>
      </div>

      {/* EMPTY STATE */}
      {!hasEvents && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-semibold">No events yet</div>
          <div className="text-[#666]">
            Looks like you haven’t added any events yet
          </div>
        </div>
      )}

      {/* EVENTS */}
      {hasEvents &&
        events.map(group => (
          <div key={group.month} className="mb-[20px]">
            <p className="text-[16px] font-[700] pb-[10px] flex items-center gap-[22px]">
              <span className="w-[140px]">{group.month}</span>
              <span className="flex-1 h-[1px] bg-[#D4DFF1]" />
            </p>

            <div className="flex flex-col gap-[20px]">
              {group.items.map((event, index) => (
                <div
                  key={index}
                  className=" grid grid-cols-[140px_1fr] gap-[22px] last:[&_.event-border]:border-b-0"
                >
                  <div className="text-center pt-[10px] font-[600]">
                    {event.date}
                  </div>

                  <div
                    className={`event-border grid ${showTasks?`grid-cols-[1fr_100px_150px_250px]`:`grid-cols-[1.5fr_1fr_1fr]`}
                    gap-[85px] pb-[20px] border-b border-[#D4DFF1]`}
                  >
                    <div className="flex items-center gap-[20px]">
                      <div className="h-[50px] w-[50px] rounded-full bg-[#ccc]" />
                      <span className="text-[20px] font-[600]">
                        {event.name}
                      </span>
                    </div>

                    <div className="grid place-items-center text-[18px] font-[500]">
                      {event.attendees}
                    </div>

                    <div className="grid place-items-center text-[18px] font-[500]">
                      {event.location}
                    </div>

                    {/* TASKS */}
                    {showTasks && (
                      <div className="flex justify-center gap-[20px]">
                        {/* Draft → always 3 zeros */}
                        {isDraft &&
                          TASK_ORDER.map(task => (
                            <ProgressCircle
                              key={task}
                              value="0/0"
                              color={TASK_COLORS[task]}
                            />
                          ))}

                        {/* Non-draft → only available tasks */}
                        {!isDraft &&
                          TASK_ORDER.map(task => {
                            const taskData = event.tasks?.[task];
                            if (!taskData) return null;

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
