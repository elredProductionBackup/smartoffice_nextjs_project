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
import { closeEventThunk, fetchDocuments, fetchEventDetails, fetchMembersMedia, uploadDocument, uploadMemberMedia } from "@/store/events/eventsThunks";
import MemberDetailsModal from "@/_components/MemberDetailsModal";
import DeleteMediaConfirm from "@/_components/EventsComps/DeleteMediaConfirm";
import { useRef } from "react";
import { useCallback } from "react";
import useInfiniteScrollObserver from "@/hooks/useInfiniteScroll";
import { formatText, isValidImage } from "@/utils/functions";
import EventsMenu from "@/_components/EventsComps/EventsMenu";
import EventActionConfirmModal from "@/_components/EventsComps/EventActionConfirmModal";
import { HiEllipsisVertical } from "react-icons/hi2";
import { useBudgetTypeStore } from "@/store/useBudgetTypeStore";

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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ================= REFS =================
  const containerRef = useRef();

  // ================= REDUX STATE =================
  const {
    membersMediaMap, membersMediaFetched, membersMediaLoading, membersMediaPage, membersMediaTotal,
    documentsMap, documentsFetched, documentsLoading, documentsPage, documentsTotal,
  } = useSelector((state) => state.events);

  const modalStack = useSelector((state) => state.eventsUi.modalStack);

  const event = useSelector(
    (state) => state.events.eventDetailsMap[eventId]
  );

  // ================= BUDGET TYPES =================
  const { budgetTypes, fetchBudgetTypes } = useBudgetTypeStore();

  useEffect(() => {
    fetchBudgetTypes(true);
  }, [fetchBudgetTypes]);

  const matchedBudgetType = budgetTypes.find((b) => {
    const eventTypeStr = typeof event?.eventType === 'object'
      ? (event.eventType.budgetTypeId || event.eventType.id || event.eventType.type || event.eventType.name || '')
      : (event?.eventType || '');

    const target = String(eventTypeStr).toLowerCase().trim();
    if (!target) return false;

    const bId = String(b.budgetTypeId || b._id || b.id || '').toLowerCase().trim();
    const bName = String(b.budgetType || b.name || b.title || b.label || '').toLowerCase().trim();

    return bId === target || bName === target;
  });

  const budgetTypeName = matchedBudgetType
    ? (matchedBudgetType.budgetType || matchedBudgetType.name || matchedBudgetType.title || matchedBudgetType.label)
    : (typeof event?.eventType === 'object' ? event?.eventType?.type || event?.eventType?.name : event?.eventType);

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
    if (!eventId) return;

    if (activeTab === "memberMedia") {
      dispatch(fetchMembersMedia({ eventId, page: 1, limit: 20 }));
    }

    if (activeTab === "documents") {
      dispatch(fetchDocuments({ eventId, page: 1, limit: 20 }));
    }
  }, [activeTab, eventId]);

  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventDetails({ eventId, noSkip:true }));
    }
  }, [eventId]);

  // ================= DATE =================
  const start = moment(event?.startDateTime).local();
  const end = moment(event?.endDateTime).local();
  const isPast = moment(event?.startDateTime).isBefore(moment());

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
    <div className="h-[calc(100vh-80px)] flex flex-col gap-[20px] overflow-y-auto relative pb-[20px]" ref={containerRef}>

      <div className="bg-white rounded-2xl pt-6 flex justify-between gap-[105px] w-full relative z-[15]">
        <div className="flex-1 flex gap-[40px]">
          <div className="w-[250px] min-h-[320px] relative rounded-[20px] overflow-hidden flex justify-center items-center">
            <Image
              src={
                isValidImage(event?.eventImage)
                  ? event.eventImage
                  : "/logo/no-image.svg"
              }
              alt={event?.eventName || "event"}
              fill
              className={isValidImage(event?.eventImage)
                ? "object-cover"
                : "object-contain max-h-[60%] grid place-items-center"}
            />
          </div>

          <div className="flex-1 flex flex-col justify-between gap-[20px]">
            <div className="flex flex-col gap-[20px] items-start">
              <div className="flex flex-col gap-1 items-start">
                <div className="text-[36px] font-semibold flex items-center gap-[20px]">
                  <span className="maki--arrow rotate-180 inline-block cursor-pointer"
                    onClick={() => {
                      // const isPast = moment(event?.startDateTime).isBefore(moment());

                      if (isPast) {
                        router.push("/dashboard/events?tab=past");
                      } else {
                        router.push("/dashboard/events?tab=upcomming");
                      }
                    }}></span> {event?.eventName}</div>
                {budgetTypeName && (
                  <span className="text-[14px] font-bold text-[#5597ED] bg-[#5597ED]/10 px-3 py-[2px] rounded-full ml-[52px] tracking-[1px]">
                    {budgetTypeName}
                  </span>
                )}
              </div>
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

        <div className="flex flex-col items-end justify-between pb-4">
          <div className="relative" ref={menuRef}>
            {!isPast &&
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <HiEllipsisVertical className="text-3xl text-[#333]" />
            </button>
            }

            {showMenu && (
              <EventsMenu
                isPast={isPast}
                onEdit={() => {
                  setShowMenu(false);
                  router.push(`/dashboard/events/create?id=${eventId}`);
                }}
                onCancel={() => {
                  setShowMenu(false);
                  dispatch(
                    openEventsModal({
                      type: "CONFIRM_CANCEL_EVENT",
                      payload: { eventId },
                    })
                  );
                }}
                onComplete={() => {
                  setShowMenu(false);
                  dispatch(
                    openEventsModal({
                      type: "CONFIRM_COMPLETE_EVENT",
                      payload: { eventId },
                    })
                  );
                }}
              />
            )}
          </div>

          <div className="flex flex-col items-end gap-4">
            {event?.additionalNotes && (
              <div className="relative inline-block group">
                <div className="text-[#147BFF] font-bold underline cursor-pointer text-right">
                  Additional note
                </div>
                <div className="absolute right-0 top-full w-[380px] p-[24px] rounded-[20px] shadow-[0px_4px_4px_2px_#A2A0A040] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 translate-y-2 transition-all duration-200 z-10 bg-[#F2F7FF] flex flex-col gap-[8px] max-h-[350px] overflow-scroll">
                  <h4 className="font-bold text-[20px] ">Additional note</h4>
                  <p className="text-[16px] text-[#333333]">
                    {formatText(event?.additionalNotes)}
                  </p>
                </div>
              </div>
            )}

            <RegistrationToggle
              value={registrationEnabled}
              onChange={() => setRegistrationEnabled(!registrationEnabled)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white sticky z-10 top-0 pt-[20px]">
        <ActionableTabs tabs={EVENTS_DETAILS} defaultTab="attendees" />
      </div>

      <>
        {activeTab === "attendees" &&
          <div className="min-h-[calc(100dvh-180px)] bg-[#F2F7FF] rounded-[20px]">
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
            <ChecklistContent eventId={eventId} /></div>}
        {activeTab === "eventcosting" &&
          <div className="w-full max-w-[1600px]">
            <Eventcosting
              eventName={event?.eventName || '-'}
              portfolio={event?.portfolioName || event?.portfolio || '-'}
            />
          </div>}
      </>

      {currentModal?.type === "CONFIRM_CANCEL_EVENT" && (
        <EventActionConfirmModal
          title="Are you sure you want to cancel this event?"
          confirmText="Cancel"
          cancelText="No"
          isLoading={closing}
          onCancel={() => dispatch(closeAllEventsModals())}
          onConfirm={handleCloseEvent}
        />
      )}

      {currentModal?.type === "CONFIRM_COMPLETE_EVENT" && (
        <EventActionConfirmModal
          title="Are you sure you want to complete this event?"
          confirmText="Complete"
          cancelText="No"
          isLoading={closing} // Reusing closing state for now, or add a new one if needed
          onCancel={() => dispatch(closeAllEventsModals())}
          onConfirm={async () => {
            // Add actual complete logic here if different from close
            await handleCloseEvent(); 
          }}
        />
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
