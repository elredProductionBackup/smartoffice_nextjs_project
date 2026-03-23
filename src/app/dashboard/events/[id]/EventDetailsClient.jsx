"use client";

import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
// import { UPCOMING_EVENTS, PAST_EVENTS, DRAFT_EVENTS } from "@/assets/helpers/sampleEvents";
import { EVENTS_DETAILS } from "@/assets/helpers/sampleEvents";
import ActionableTabs from "@/_components/ActionableTabs";
import { RegistrationToggle } from "@/_components/UI/RegistrationToggle";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaUploader from "@/_components/UI/MediaUploader";
import Attendees from "@/_components/EventsComps/Attendees";
import LogisticsContent from "@/_components/LogisticsContent";
import ChecklistContent from "@/_components/ChecklistContent";
import { useSelector } from "react-redux";
import moment from "moment";
import Eventcosting from "@/_components/Eventcosting";

export default function EventDetailsClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  const eventId = params?.id;
  const activeTab = searchParams.get("tab") || "attendees";
  const selectedEvent = useSelector((state) => state.events.selectedEvent);

  // Dummy 
  // const allEvents = [...UPCOMING_EVENTS, ...PAST_EVENTS, ...DRAFT_EVENTS]
  //   .flatMap(group => group.items);

  // const event = allEvents.find(e => e.id === eventId);

  const event = selectedEvent;
  const start = moment(event?.startDate).local();
  const end = moment(event?.endDate).local();


  const dateRange = `${start.format("ddd DD MMM YYYY")} - ${end.format("ddd DD MMM YYYY")}`;
  const timeRange = `${start.format("h:mm")} - ${end.format("h:mm A")}`;


  if (!event) return <div className="p-10 text-xl">Event not found</div>;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col gap-[20px] overflow-y-auto relative pb-[20px]">

      <div className="bg-white rounded-2xl pt-6 flex gap-[105px]">
        <div className="flex gap-[40px]">
          <div className="w-[250px] min-h-[320px] relative rounded-[20px] overflow-hidden">
            <Image src={event?.eventImage} alt="event" fill className="object-cover" />
          </div>

          <div className="flex-1 flex flex-col justify-between gap-[20px]">
            <div className="flex flex-col gap-[20px] items-start">
              <div className="text-[36px] font-semibold flex items-center gap-[20px]">
              <span className="maki--arrow rotate-180 inline-block cursor-pointer" onClick={()=>router.push('/dashboard/events')}></span> {event?.name}</div>
              <p className="text-[18px] leading-[27px] w-[70%]">
                Get ready for an incredible experience at ConFig, Figma's highly anticipated flagship yearly conference, happening on June 21-22
              </p>

              <div className="w-full flex flex-wrap justify-between font-medium text-[#333]">
                <div className="flex gap-[8px] items-center"><span className="material-symbols--location-on"></span>{event?.location}</div>
                <div className="flex gap-[8px] items-center"><span className="ic--round-date-range"></span>{dateRange}</div>
                <div className="flex gap-[8px] items-center"><span className="icon-park-outline--time"></span>{timeRange}</div>
              </div>
            </div>

            {event?.resource?.resourceName && 
              <div className="flex flex-col gap-[4px]">
                <div className="font-semibold text-[#999999]">Speaker</div>
                <div className="flex gap-[8px] items-center">
                  <div className="h-[32px]  w-[32px] bg-[#ccc] rounded-full"></div>
                  <p className="font-medium text-[20px] text-black">{event?.resource?.resourceName}</p>
                </div>
                <div className="text-[18px] leading-[24px] pt-[6px] w-[70%]">{event?.resource?.resourceDescription}</div>
              </div>
            }
          </div>
        </div>

        <div className="flex flex-col items-start justify-between">
          <button className="flex gap-[8px] whitespace-nowrap items-center bg-[#E40000] text-white font-medium px-[16px] py-[8px] rounded-[60px] cursor-pointer" >
            <span className="akar-icons--cross regular"></span>
            Close event
          </button>

          <div className="text-[#147BFF] font-bold underline pt-[12px]">
            Additional note
          </div>

          <RegistrationToggle
            value={registrationEnabled}
            onChange={()=>setRegistrationEnabled(!registrationEnabled)}
          />
        </div>
      </div>

      <div className="bg-white sticky z-10 top-0 pt-[20px]">
        <ActionableTabs tabs={EVENTS_DETAILS} defaultTab="attendees" />
      </div>

      <>
        {activeTab === "attendees" && 
          <div className="min-h-[calc(100dvh-180px)] bg-[#F2F7FF] rounded-[20px] overflow-y-auto">
            <Attendees eventId={eventId}/>
          </div>
        }
        {activeTab === "memberMedia" && (
          // <div className="">
            <MediaUploader title="Member Media" />
          // </div>
        )}
        {activeTab === "documents" && <MediaUploader title="Document Media" />}
        {activeTab === "logistics" &&
         <div className="min-h-[calc(100dvh-180px)] bg-[#f2f7ff] rounded-[20px] overflow-y-auto mb-10 p-4">
         <LogisticsContent/></div>}
        {activeTab === "checklist" &&
         <div className="min-h-[calc(100dvh-180px)] bg-[#f2f7ff] rounded-[20px] overflow-y-auto mb-10 p-4" >
         <ChecklistContent eventId={eventId}/></div>}
          {activeTab === "eventcosting" &&
         <div className="min-h-[calc(100dvh-180px)] overflow-y-auto mb-10 p-4" >
         <Eventcosting/></div>}
      </>

    </div>
  );
}
