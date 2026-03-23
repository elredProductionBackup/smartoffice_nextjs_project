"use client";

import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
// import { UPCOMING_EVENTS, PAST_EVENTS, DRAFT_EVENTS } from "@/assets/helpers/sampleEvents";
import { EVENTS_DETAILS } from "@/assets/helpers/sampleEvents";
import ActionableTabs from "@/_components/ActionableTabs";
import { RegistrationToggle } from "@/_components/UI/RegistrationToggle";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MediaUploader from "@/_components/UI/MediaUploader";
import Attendees from "@/_components/EventsComps/Attendees";
import LogisticsContent from "@/_components/LogisticsContent";
import ChecklistContent from "@/_components/ChecklistContent";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import Eventcosting from "@/_components/Eventcosting";
import { closeAllEventsModals, openEventsModal } from "@/store/events/eventsUiSlice";
import { closeEventThunk, deleteDocument, deleteMembersMedia, fetchDocuments, fetchEventDetails, fetchMembersMedia, uploadDocument, uploadMemberMedia } from "@/store/events/eventsThunks";
import MemberDetailsModal from "@/_components/MemberDetailsModal";
import DeleteMediaConfirm from "@/_components/EventsComps/DeleteMediaConfirm";
import { useRef } from "react";
import { useCallback } from "react";
import useInfiniteScrollObserver from "@/hooks/useInfiniteScroll";

export default function EventDetailsClient() {
  // ================= ROUTER / PARAMS =================
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const eventId = params?.id;
  const activeTab = searchParams.get("tab") || "attendees";

  // ================= LOCAL STATE =================
  const [closing, setClosing] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  // ================= REFS =================
  const containerRef = useRef();

  // ================= REDUX STATE =================
  const {
    membersMediaMap,
    membersMediaFetched,
    membersMediaLoading,
    membersMediaPage,
    membersMediaTotal,

    documentsMap,
    documentsFetched,
    documentsLoading,
    documentsPage,
    documentsTotal,
  } = useSelector((state) => state.events);

  const modalStack = useSelector((state) => state.eventsUi.modalStack);

  const event = useSelector(
    (state) => state.events.eventDetailsMap[eventId]
  );

  const currentModal = modalStack[modalStack.length - 1];

  // ================= MEMBERS MEDIA =================
  const membersMediaList = membersMediaMap[eventId] || [];
  const membersMediaPageNumber = membersMediaPage?.[eventId] || 1;
  const membersMediaTotalCount = membersMediaTotal?.[eventId] || 0;
  const membersMediaLength = membersMediaList.length;

  const isMembersMediaFetched = membersMediaFetched[eventId];

  const hasMoreMembersMedia =
    membersMediaLength < membersMediaTotalCount;

  const loadMoreMembersMedia = useCallback(() => {
    if (activeTab !== "memberMedia") return;

    dispatch(
      fetchMembersMedia({
        eventId,
        page: membersMediaPageNumber + 1,
        limit: 20,
      })
    );
  }, [activeTab, eventId, membersMediaPageNumber]);

  const membersMediaRef = useInfiniteScrollObserver({
    hasMore: activeTab === "memberMedia" && hasMoreMembersMedia,
    loading: membersMediaLoading,
    onLoadMore: loadMoreMembersMedia,
  });

  // ================= DOCUMENTS =================
  const documentsList = documentsMap[eventId] || [];
  const documentsPageNumber = documentsPage?.[eventId] || 1;
  const documentsTotalCount = documentsTotal?.[eventId] || 0;
  const documentsLength = documentsList.length;

  const isDocumentsFetched = documentsFetched[eventId];

  const hasMoreDocuments =
    documentsLength < documentsTotalCount;

  const loadMoreDocuments = useCallback(() => {
    if (activeTab !== "documents") return;

    dispatch(
      fetchDocuments({
        eventId,
        page: documentsPageNumber + 1,
        limit: 20,
      })
    );
  }, [activeTab, eventId, documentsPageNumber]);

  const documentsRef = useInfiniteScrollObserver({
    hasMore: activeTab === "documents" && hasMoreDocuments,
    loading: documentsLoading,
    onLoadMore: loadMoreDocuments,
  });

  // ================= DATA FETCH =================
  useEffect(() => {
    if (activeTab === "memberMedia" && !isMembersMediaFetched) {
      dispatch(fetchMembersMedia({ eventId, page: 1, limit: 20 }));
    }

    if (activeTab === "documents" && !isDocumentsFetched) {
      dispatch(fetchDocuments({ eventId, page: 1, limit: 20 }));
    }
  }, [activeTab, eventId]);

  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventDetails({ eventId }));
    }
  }, [eventId]);

  // ================= DATE =================
  const start = moment(event?.startDateTime).local();
  const end = moment(event?.endDateTime).local();

  const dateRange = `${start.format("ddd DD MMM YYYY")} - ${end.format(
    "ddd DD MMM YYYY"
  )}`;

  const timeRange =
    start && end
      ? start.isSame(end, "minute")
        ? start.format("h:mm A")
        : `${start.format("h:mm")} - ${end.format("h:mm A")}`
      : "";

  // ================= ACTIONS =================
  const handleCloseEvent = async () => {
    try {
      setClosing(true);
      await dispatch(closeEventThunk({ eventId })).unwrap();
      router.push("/dashboard/events?tab=past");
    } catch (err) {
      console.error(err);
    } finally {
      dispatch(closeAllEventsModals());
      setClosing(false);
    }
  };

  // ================= LOADING =================
  if (!event) {
    return <div className="p-10 text-xl">Loading event...</div>;
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col gap-[20px] overflow-y-auto relative pb-[20px]"  ref={containerRef}>

      <div className="bg-white rounded-2xl pt-6 flex justify-between gap-[105px] w-full relative z-[15]">
        <div className="flex-1 flex gap-[40px]">
          <div className="w-[250px] min-h-[320px] relative rounded-[20px] overflow-hidden">
            <Image src={event?.eventImage} alt="event" fill className="object-cover" />
          </div>

          <div className="flex-1 flex flex-col justify-between gap-[20px]">
            <div className="flex flex-col gap-[20px] items-start">
              <div className="text-[36px] font-semibold flex items-center gap-[20px]">
                <span className="maki--arrow rotate-180 inline-block cursor-pointer"
                  onClick={() => {
                    const isPast = moment(event?.startDateTime).isBefore(moment());

                    if (isPast) {
                      router.push("/dashboard/events?tab=past");
                    } else {
                      router.push("/dashboard/events");
                    }
                  }}></span> {event?.eventName}</div>
              <p className="text-[18px] leading-[27px] w-[70%]">
                {event?.eventDescription}
              </p>

              <div className="w-full flex flex-wrap justify-between font-medium text-[#333]">
                <div className="flex gap-[8px] items-center"><span className="material-symbols--location-on"></span>{event?.eventLocation}</div>
                <div className="flex gap-[8px] items-center"><span className="ic--round-date-range"></span>{dateRange}</div>
                <div className="flex gap-[8px] items-center"><span className="icon-park-outline--time"></span>{timeRange}</div>
              </div>
            </div>

            {event?.resource?.resourceName &&
              <div className="flex flex-col gap-[4px]">
                <div className="font-semibold text-[#999999]">Speaker</div>
                <div className="flex gap-[8px] items-center">
                  {event?.resource?.uploadResourceImageUrl ?
                    <div className="h-[32px]  w-[32px]">
                      <Image src={event.resource.uploadResourceImageUrl} alt="speaker image" className="object-cover h-full rounded-full" width={500} height={500} />
                    </div>
                    :
                    <div className="h-[32px] w-[32px] bg-[#ccc] rounded-full grid place-items-center text-[18px]">{event?.resource?.resourceName?.split("")[0]}</div>
                  }
                  <p className="font-medium text-[20px] text-black">{event?.resource?.resourceName}</p>
                </div>
                <div className="text-[18px] leading-[24px] pt-[6px] w-[70%]">{event?.resource?.resourceDescription}</div>
              </div>
            }
          </div>
        </div>

        <div className="flex flex-col items-start justify-between">
          <button className="flex gap-[8px] whitespace-nowrap items-center bg-[#E40000] text-white font-medium px-[16px] py-[8px] rounded-[60px] cursor-pointer"
            onClick={() =>
              dispatch(
                openEventsModal({
                  type: "CONFIRM_CLOSE_EVENT",
                  payload: { eventId },
                })
              )
            }
            disabled={closing} >
            <span className="akar-icons--cross regular"></span>
            Close event
          </button>

          {event?.additionalNotes &&
            <div className="relative inline-block group">
              {/* Trigger */}
              <div className="text-[#147BFF] font-bold underline pt-[12px] cursor-pointer">
                Additional note
              </div>

              {/* Hover Content */}
              <div className="absolute right-0 top-full w-[380px] p-[24px] rounded-[20px] shadow-[0px_4px_4px_2px_#A2A0A040] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 translate-y-2 transition-all duration-200 z-10 bg-[#F2F7FF] flex flex-col gap-[8px]">
                <h4 className="font-bold text-[20px] ">Additional note</h4>
                <p className="text-[16px] text-[#333333]">
                  {event?.additionalNotes}
                </p>
              </div>
            </div>
          }


          <RegistrationToggle
            value={registrationEnabled}
            onChange={() => setRegistrationEnabled(!registrationEnabled)}
          />
        </div>
      </div>

      <div className="bg-white sticky z-10 top-0 pt-[20px]">
        <ActionableTabs tabs={EVENTS_DETAILS} defaultTab="attendees" />
      </div>

      <>
        {activeTab === "attendees" &&
          <div className="min-h-[calc(100dvh-180px)] bg-[#F2F7FF] rounded-[20px] overflow-y-auto">
            <Attendees eventId={eventId} />
          </div>
        }

        {activeTab === "memberMedia" &&
                 <>
          <MediaUploader
            data={membersMediaList}
            loading={membersMediaLoading}
            fetched={isMembersMediaFetched}
            eventId={eventId}
            type="media"
            onUpload={(files) =>
              dispatch(uploadMemberMedia({ files, eventId })).unwrap()
            }
            
            />
             <div ref={membersMediaRef} style={{ height: "1px" }} />
            </>
        }
{activeTab === "documents" && (
  <>
    <MediaUploader
      data={documentsList}
      loading={documentsLoading}
      fetched={isDocumentsFetched}
      eventId={eventId}
      type="document"
      onUpload={(files) =>
        dispatch(uploadDocument({ files, eventId })).unwrap()
      }
    />

    <div ref={documentsRef} style={{ height: "1px" }} />
  </>
)}

        {activeTab === "logistics" &&
          <div className="min-h-[calc(100dvh-180px)] bg-[#f2f7ff] rounded-[20px] overflow-y-auto mb-10 p-4">
            <LogisticsContent /></div>}
        {activeTab === "checklist" &&
          <div className="min-h-[calc(100dvh-180px)] bg-[#f2f7ff] rounded-[20px] overflow-y-auto mb-10 p-4" >
            <ChecklistContent /></div>}
        {activeTab === "eventcosting" &&
          <div className="min-h-[calc(100dvh-180px)] overflow-y-auto mb-10 p-4" >
            <Eventcosting /></div>}
      </>

      {currentModal?.type === "CONFIRM_CLOSE_EVENT" && eventId && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40" onClick={() => dispatch(closeAllEventsModals())}>
          <div className="w-[480px] rounded-[28px] bg-white pt-[53px] pb-[40px] shadow-xl flex flex-col items-center gap-[45px]" onClick={(e) => e.stopPropagation()}>
            <div className="text-[24px] font-[700] px-[68px] text-center">Are you sure you want to close
              this event?</div>
            <div className="flex gap-[80px]">
              <button onClick={() => dispatch(closeAllEventsModals())}
                className="rounded-full text-[20px] bg-[#999999] px-6 py-2 text-white w-[120px] cursor-pointer" >
                Cancel
              </button>

              <button onClick={handleCloseEvent} className="rounded-full text-[20px] bg-gradient-to-r from-[#5597ED] to-[#00449C] w-[120px] px-[16px] py-[8px] text-white cursor-pointer flex items-center justify-center" >
                {closing ? <div className="w-[20px] h-[20px] border-2 border-[white] border-t-transparent rounded-full animate-spin" /> : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalStack.map((modal, index) => {
        if (modal.type === "ATTENDEE_POPUP") {
          return (
            <MemberDetailsModal
              key={index}
              member={modal.payload}
              onClose={() => dispatch(closeAllEventsModals())}
            />
          );
        }

        if (modal.type === "DELETE_MEDIA_CONFIRM") {
          return (
            <DeleteMediaConfirm
              key={index}
              payload={modal.payload}
              onClose={() => dispatch(closeAllEventsModals())}
            />
          );
        }

        return null;
      })}

    </div>
  );
}
