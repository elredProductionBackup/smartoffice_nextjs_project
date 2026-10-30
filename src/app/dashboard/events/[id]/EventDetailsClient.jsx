"use client";

import Image from "next/image";
import { HiArrowLeft, HiEllipsisVertical, HiOutlineTrash } from "react-icons/hi2";
import { closeEventThunk, deleteEventThunk, fetchDocuments, fetchEventDetails, fetchMembersMedia, uploadDocument, uploadMemberMedia } from "@/store/events/eventsThunks";
import { useParams, useSearchParams } from "next/navigation";
// import { UPCOMING_EVENTS, PAST_EVENTS, DRAFT_EVENTS } from "@/assets/helpers/sampleEvents";
import { EVENTS_DETAILS } from "@/assets/helpers/sampleEvents";
import ActionableTabs from "@/_components/ActionableTabs";
import { RegistrationToggle } from "@/_components/UI/RegistrationToggle";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MediaUploader from "@/_components/UI/MediaUploader";
import Attendees from "@/_components/EventsComps/Attendees";
import LogisticsContent from "@/_components/LogisticsContent";
import ChecklistContent from "@/_components/ChecklistContent";
import { useDispatch, useSelector } from "react-redux";
import { selectIsFinanceOfficer } from "@/store/auth/authSlice";
import moment from "moment";
import Eventcosting from "@/_components/Eventcosting";
import { closeAllEventsModals, openEventsModal } from "@/store/events/eventsUiSlice";
// import { closeEventThunk, fetchDocuments, fetchEventDetails, fetchMembersMedia, uploadDocument, uploadMemberMedia } from "@/store/events/eventsThunks";
import MemberDetailsModal from "@/_components/MemberDetailsModal";
import DeleteMediaConfirm from "@/_components/EventsComps/DeleteMediaConfirm";
import { useRef } from "react";
import { useCallback } from "react";
import useInfiniteScrollObserver from "@/hooks/useInfiniteScroll";
import { formatText, isValidImage } from "@/utils/functions";
import EventsMenu from "@/_components/EventsComps/EventsMenu";
import EventActionConfirmModal from "@/_components/EventsComps/EventActionConfirmModal";
// import { HiEllipsisVertical } from "react-icons/hi2";

// Finance managers only get the attendees and event costing tabs
const FINANCE_MANAGER_HIDDEN_TABS = ["checklist", "memberMedia", "documents"];

export default function EventDetailsClient() {
  // ================= ROUTER / PARAMS =================
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const eventId = params?.id;

  const isFinanceManager = useSelector(selectIsFinanceOfficer);
  const eventTabs = useMemo(
    () =>
      isFinanceManager
        ? EVENTS_DETAILS.filter((t) => !FINANCE_MANAGER_HIDDEN_TABS.includes(t.value))
        : EVENTS_DETAILS,
    [isFinanceManager]
  );

  const requestedTab = searchParams.get("tab") || "attendees";
  const activeTab = eventTabs.some((t) => t.value === requestedTab)
    ? requestedTab
    : "attendees";

  // ================= LOCAL STATE =================
  const [closing, setClosing] = useState(false);
    const [deleting, setDeleting] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  // Phones have no hover, so the "Additional note" popover also opens on tap
  const [noteOpen, setNoteOpen] = useState(false);
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

    const handleDeleteEvent = async () => {
    try {
      setDeleting(true);
      await dispatch(deleteEventThunk({ eventId })).unwrap();
      router.push(isPast ? "/dashboard/events?tab=past" : "/dashboard/events?tab=upcomming");
    } catch (err) {
      console.error(err);
    } finally {
      dispatch(closeAllEventsModals());
      setDeleting(false);
    }
  };

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

  // ================= BUDGET TYPE =================
  // getEventsDetails already returns the budget type name inside eventType
  const budgetTypeName = typeof event?.eventType === 'object'
    ? event?.eventType?.budgetType || event?.eventType?.type || event?.eventType?.name
    : event?.eventType;

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
  }, [activeTab, eventId, membersMediaPageNumber, dispatch]);

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
  }, [activeTab, eventId, documentsPageNumber, dispatch]);

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
  }, [activeTab, eventId, dispatch]);

  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventDetails({ eventId, noSkip:true }));
    }
  }, [eventId, dispatch]);

  // ================= DATE =================
  const start = moment(event?.startDateTime).local();
  const end = moment(event?.endDateTime).local();
  const isPast = moment(event?.startDateTime).isBefore(moment());

  const dateRange = start.isSame(end, "day")
    ? start.format("ddd, DD MMM YYYY")
    : `${start.format("ddd, DD MMM")} - ${end.format("ddd, DD MMM YYYY")}`;

  const timeRange =
    start && end
      ? start.isSame(end, "minute")
        ? start.format("h:mm A")
        : `${start.format("h:mm")} - ${end.format("h:mm A")}`
      : "";

  // ================= ACTIONS =================
  const handleBack = () => {
    const from = searchParams.get("from");

    if (from === "finance-budget" || from === "finance" || from === "portfolio-officer") {
      router.push(`/dashboard/${from}`);
    } else if (isFinanceManager) {
      router.push("/dashboard/finance-budget");
    } else if (isPast) {
      router.push("/dashboard/events?tab=past");
    } else {
      router.push("/dashboard/events?tab=upcomming");
    }
  };

  const eventMeta = [
    { label: "Venue", icon: "material-symbols--location-on", value: event?.eventLocation },
    { label: "Date", icon: "ic--round-date-range", value: dateRange },
    { label: "Time", icon: "icon-park-outline--time", value: timeRange },
  ];

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
    return <div className="p-5 md:p-10 text-xl">Loading event...</div>;
  }

  return (
    <div className="h-[calc(100dvh-60px)] md:h-[calc(100vh-80px)] flex flex-col gap-4 md:gap-[20px] overflow-y-auto overflow-x-hidden relative pb-20 md:pb-[20px] focus:outline-none" ref={containerRef}>

      <div className="bg-white rounded-2xl pt-4 lg:pt-6 pb-4 w-full relative z-[15] flex flex-col lg:flex-row gap-4 lg:gap-[36px] items-stretch">
        {/* Cover */}
        <div className="w-full h-[200px] sm:h-[280px] lg:h-auto lg:w-[240px] shrink-0 lg:min-h-[320px] relative rounded-[16px] overflow-hidden bg-[#F5F6F8]">
          <Image
            src={
              isValidImage(event?.eventImage)
                ? event.eventImage
                : "/logo/no-image.svg"
            }
            alt={event?.eventName || "event"}
            fill
            sizes="(min-width: 1024px) 240px, 100vw"
            className={isValidImage(event?.eventImage)
              ? "object-cover"
              : "object-contain p-14 opacity-60"}
          />
        </div>

        {/* Below lg this column dissolves into the stacked card, so the top bar can sit above the cover */}
        <div className="flex-1 min-w-0 flex flex-col gap-[24px] max-lg:contents">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 max-lg:order-first">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="shrink-0 w-[32px] h-[32px] -ml-[6px] grid place-items-center rounded-full text-[#111] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            >
              <HiArrowLeft className="w-[20px] h-[20px]" />
            </button>

            <div className="relative shrink-0" ref={menuRef}>
              {isFinanceManager ? null : !isPast ? (
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-[32px] h-[32px] grid place-items-center rounded-full hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                >
                  <HiEllipsisVertical className="text-[20px] text-[#111]" />
                </button>
              ) : (
                <button
                  onClick={() =>
                    dispatch(openEventsModal({ type: "CONFIRM_DELETE_EVENT", payload: { eventId } }))
                  }
                  className="flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm cursor-pointer"
                >
                  <HiOutlineTrash className="text-lg" />
                  Delete event
                </button>
              )}

              {showMenu && !isFinanceManager && (
                <EventsMenu
                  isPast={isPast}
                  onEdit={() => {
                    setShowMenu(false);
                    router.push(`/dashboard/events/create?id=${eventId}`);
                  }}
                  onCancel={() => {
                    setShowMenu(false);
                    dispatch(openEventsModal({ type: "CONFIRM_CANCEL_EVENT", payload: { eventId } }));
                  }}
                  onComplete={() => {
                    setShowMenu(false);
                    dispatch(openEventsModal({ type: "CONFIRM_COMPLETE_EVENT", payload: { eventId } }));
                  }}
                  onDelete={() => {
                    setShowMenu(false);
                    dispatch(openEventsModal({ type: "CONFIRM_DELETE_EVENT", payload: { eventId } }));
                  }}
                />
              )}
            </div>
          </div>

          {/* Title & description */}
          <div className="flex flex-col gap-[10px]">
            <div className="flex items-center gap-[8px] text-[12px] font-medium uppercase tracking-[1.5px] text-[#9CA3AF]">
              {budgetTypeName && <span className="text-[#147BFF]">{budgetTypeName}</span>}
              {budgetTypeName && <span>·</span>}
              <span>{isPast ? "Past" : "Upcoming"}</span>
            </div>

            <h1 className="font-heading text-[24px] lg:text-[32px] leading-[1.25] font-semibold text-[#111] break-words">
              {event?.eventName}
            </h1>

            {event?.eventDescription && (
              <p className="text-[15px] leading-[24px] md:text-[16px] md:leading-[26px] text-[#6B7280] break-words">
                {event.eventDescription}
              </p>
            )}
          </div>

          {/* Venue / date / time */}
          <div className="flex flex-wrap gap-x-5 md:gap-x-[32px] gap-y-[10px] text-[14px] md:text-[15px] text-[#374151]">
            {eventMeta.map(({ label, icon, value }) => (
              <div key={label} className="flex items-center gap-[8px] min-w-0" title={label}>
                <span className={`${icon} shrink-0 text-[#9CA3AF]`} style={{ width: 18, height: 18 }} />
                <span>{value || "—"}</span>
              </div>
            ))}
          </div>

          {/* Speaker & registration */}
          <div className="mt-auto pt-4 md:pt-[20px] border-t border-[#F0F1F3] flex flex-wrap md:flex-nowrap items-center justify-between gap-4 md:gap-6">
            {event?.resource?.resourceName ? (
              <div className="flex items-center gap-[12px] min-w-0">
                {event?.resource?.uploadResourceImageUrl ?
                  <Image src={event.resource.uploadResourceImageUrl} alt="speaker image" className="w-[44px] h-[44px] shrink-0 object-cover rounded-full" width={88} height={88} />
                  :
                  <div className="w-[44px] h-[44px] shrink-0 rounded-full bg-[#F3F4F6] text-[#6B7280] grid place-items-center text-[18px] font-medium">{event?.resource?.resourceName?.[0]?.toUpperCase()}</div>
                }
                <div className="min-w-0">
                  <p className="font-heading text-[18px] font-medium text-[#111] leading-[26px]">{event?.resource?.resourceName}</p>
                  <p className="text-[15px] text-[#9CA3AF] leading-[22px] line-clamp-1">
                    Speaker{event?.resource?.resourceDescription && ` · ${event.resource.resourceDescription}`}
                  </p>
                </div>
              </div>
            ) : <div />}

            <div className="flex items-center gap-5 md:gap-[32px] shrink-0 max-md:w-full max-md:justify-between">
              {event?.additionalNotes && (
                <div className="relative inline-block group">
                  <div
                    onClick={() => setNoteOpen((o) => !o)}
                    className="text-[14px] text-[#147BFF] font-medium hover:underline underline-offset-4 cursor-pointer text-right"
                  >
                    Additional note
                  </div>
                  <div className={`absolute max-md:left-0 md:right-0 top-full w-[min(380px,calc(100vw-32px))] md:w-[380px] p-4 md:p-[24px] rounded-[20px] shadow-[0px_4px_4px_2px_#A2A0A040] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 translate-y-2 transition-all duration-200 z-10 bg-[#F2F7FF] flex flex-col gap-[8px] max-h-[350px] overflow-scroll ${noteOpen ? "max-md:opacity-100 max-md:visible max-md:translate-y-0" : ""}`}>
                    <h4 className="font-bold text-[18px] md:text-[20px]">Additional note</h4>
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
      </div>

      <div className="bg-white sticky z-10 top-0 pt-2 md:pt-[20px]">
        {/* Below lg the tab row scrolls sideways instead of squeezing/wrapping the labels */}
        <div className="max-lg:overflow-x-auto max-lg:overflow-y-hidden max-lg:pb-px max-lg:whitespace-nowrap max-lg:[scrollbar-width:none] max-lg:[&>.action-tabs]:w-max max-lg:[&>.action-tabs]:min-w-full max-md:[&_.tab-item]:text-[17px] max-md:[&_.tab-item]:px-[12px]">
          {/* Mencken ships in one weight only, so no bold (it would be faux-bolded) */}
          <ActionableTabs tabs={eventTabs} defaultTab="attendees" labelClassName="font-heading font-normal" />
        </div>
      </div>

      <>
        {activeTab === "attendees" &&
          <div className="shrink-0 min-h-[calc(100dvh-180px)] bg-white">
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
          <div className="shrink-0 min-h-[calc(100dvh-180px)] bg-[#f2f7ff] rounded-[20px] p-4">
            <LogisticsContent /></div>}
        {activeTab === "checklist" &&
          <div className="shrink-0 min-h-[calc(100dvh-180px)] bg-[#f2f7ff] rounded-[20px] p-4" >
            <ChecklistContent eventId={eventId} /></div>}
        {activeTab === "eventcosting" &&
          <div className="w-full max-w-[1600px] px-[12px]">
            <Eventcosting
              eventId={eventId}
              eventBudget={Number(event?.eventBudget) || 0}
              event={event}
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
          isLoading={closing} 
          onCancel={() => dispatch(closeAllEventsModals())}
          onConfirm={async () => {
            await handleCloseEvent(); 
          }}
        />
      )}
            {currentModal?.type === "CONFIRM_DELETE_EVENT" && (
        <EventActionConfirmModal
          title="Are you sure you want to delete this event?"
          confirmText="Delete"
          cancelText="No"
          isLoading={deleting}
          onCancel={() => dispatch(closeAllEventsModals())}
          onConfirm={handleDeleteEvent}
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