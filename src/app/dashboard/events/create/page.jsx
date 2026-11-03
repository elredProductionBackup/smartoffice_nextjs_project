"use client";

import { useState, useRef, useEffect } from "react";
import { EventsInput } from "@/_components/UI/EventsInput";
import { EventsTextarea } from "@/_components/UI/EventsTextarea";
import { CheckboxGroup } from "@/_components/UI/CheckboxGroup";
import { RegistrationToggle } from "@/_components/UI/RegistrationToggle";
import { ResourceSpeaker } from "@/_components/UI/ResourceSpeaker";
import DateTimeRangePicker from "@/_components/UI/DateTimeRangePicker";
import ReadOnlyReminderRow from "@/_components/EventsComps/ReadOnlyReminderRow";
import ReminderModal from "@/_components/EventsComps/ReminderModal";
import { EventCoverPreview } from "@/_components/EventsComps/EventCoverPreview";
import { EventTypeChips } from "@/_components/EventsComps/EventTypeChips";
import { AddBlockPill, OptionalBlock } from "@/_components/EventsComps/OptionalBlock";
import { closeEventFormModal, openEventFormModal } from "@/store/events/eventsUiSlice";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import TravelModal from "@/_components/EventsComps/TravelModal";
import { Collaborators } from "@/_components/EventsComps/Collaborators";
import moment from "moment";
import DraftApprovalModal from "@/_components/EventsComps/DraftApprovalModal";
import { useEventForm } from "@/hooks/useEventForm";
import { clearFieldError, validateEvent } from "@/utils/validation";
import { buildEventPayload, mapDraftToForm } from "@/utils/eventPayload";
import { submitEvent } from "@/services/events.service";
import { mergeDateAndTime } from "@/utils/dateUtils";
import { addToast } from "@/store/toastSlice";
import { fetchEventDetails } from "@/store/events/eventsThunks";
import SuccessPopup from "@/_components/ConfirmationPopups/SuccessPopup";
import { FiArrowLeft, FiCheck, FiMapPin, FiPlus, FiSend, FiVideo } from "react-icons/fi";

// Optional parts of the form, added with the "+" chips under the required fields.
// `reset` restores the field defaults when a block is removed, so hidden data is never submitted.
const OPTIONAL_BLOCKS = [
  {
    key: "audience",
    label: "Audience",
    title: "Who can attend",
    hasData: (f) =>
      !f.attendees.member || f.attendees.spouse || f.attendees.children || f.attendees.guests || !f.registrationOpen,
    reset: () => ({
      attendees: { member: true, spouse: false, children: false, guests: false },
      registrationOpen: true,
    }),
  },
  {
    key: "reminder",
    label: "Reminder",
    title: "Reminder",
    modal: "REMINDER",
    hasData: (f) => f.reminder.length > 0,
    reset: () => ({ reminder: [] }),
  },
  {
    key: "collaborator",
    label: "Collaborator",
    title: "Collaborators",
    hasData: (f) => f.collaborators.some((c) => c.userCode),
    reset: () => ({ collaborators: [] }),
  },
  {
    key: "travel",
    label: "Travel",
    title: "Travel info",
    modal: "TRAVEL",
    errorKey: "travelInfo",
    hasData: (f) => {
      const t = f.travelInfo || {};
      return !!(t.venueLink || t.hotelLink || t.deadline || t.reminders?.length ||
        Object.values(t.requiredInfo || {}).some(Boolean));
    },
    reset: () => ({
      travelInfo: {
        venueLink: "", hotelLink: "",
        requiredInfo: { ticketDetails: false, insuranceDetails: false, visaInformation: false },
        deadline: null, reminders: [],
      },
    }),
  },
  {
    key: "note",
    label: "Note",
    title: "Additional note",
    errorKey: "additionalNote",
    hasData: (f) => !!f.additionalNote,
    reset: () => ({ additionalNote: "" }),
  },
];

const LOCATION_MODES = [
  { key: "place", label: "In person", placeholder: "Venue or room", Icon: FiMapPin },
  { key: "online", label: "Online", placeholder: "Meeting link", Icon: FiVideo },
];

const looksLikeLink = (value) => /^(https?:\/\/|www\.)\S+$/i.test((value || "").trim());

const RING_RADIUS = 16;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

// How many required fields are filled, as a ring in the action bar
const ProgressRing = ({ done, total }) => {
  const complete = done === total;
  return (
    <div
      className="relative w-10 h-10 shrink-0"
      role="img"
      aria-label={`${done} of ${total} required fields filled`}
      title="Required fields"
    >
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={RING_RADIUS} fill="none" strokeWidth="3.5" className="stroke-[#E8EBF0]" />
        <circle
          cx="20"
          cy="20"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - done / total)}
          className={`transition-[stroke-dashoffset] duration-300 ${complete ? "stroke-[#17915A]" : "stroke-[#0B57D0]"}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[#4A5466]">
        {complete ? <FiCheck className="text-[16px] text-[#17915A]" /> : `${done}/${total}`}
      </span>
    </div>
  );
};

const CreateEvent = () => {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const isEditMode = !!eventId;
  const formContainerRef = useRef(null);
  const { form, update,setForm,errors,setErrors , updateEventType } = useEventForm();
  const [submitting, setSubmitting] = useState(false);
  const [draftSubmitting, setDraftSubmitting] = useState(false);
  const [proposalSent, setProposalSent] = useState(false);
  // Keys of the optional blocks on the form, in the order they were added
  const [blocks, setBlocks] = useState([]);
  const [lastAddedBlock, setLastAddedBlock] = useState(null);
  const [locationMode, setLocationMode] = useState("place");
  const router = useRouter();
  const dispatch = useDispatch();

  const { eventDetailsMap,eventDetailsFormLoader } = useSelector((state) => state.events);
  const isPortfolioOfficer = useSelector((state) => state.auth.selectedRole) === "portfolioOfficer";

  const hasCover = !!(form.image?.file || form.image?.previewUrl);

  const getFormErrors = () => {
    const errs = validateEvent(form);
    return hasCover ? errs : { image: "Upload a cover image", ...errs };
  };

  const handleCreateEvent = async (e, isDraft = false) => {
    e?.preventDefault?.();

    const errs = getFormErrors();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setTimeout(() => {
        scrollToFirstError(errs);
      }, 50);
      return;
    }

    try {
      isDraft ? setDraftSubmitting(true) : setSubmitting(true);

      const payload = buildEventPayload(form, isDraft, isEditMode);
      const res = await submitEvent(payload);

      if (res?.success) {
        // Portfolio officers propose: confirm it went to the admin instead of leaving straight away
        if (!isDraft && isPortfolioOfficer && !(isEditMode && !form?.isDraft)) {
          setProposalSent(true);
          return;
        }
        if (isDraft) {
          router.push("/dashboard/events?tab=draft");
          return;
        } else {
          router.push("/dashboard/events");
          return;
        }
      } else {
        dispatch(addToast({
          message: {
            title: "Something Went Wrong",
            descrip: res?.message?`${res.message}`:`Please try again in a moment.`,
          },
          type: "error",
        }));
      }
    } catch (error) {
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
        dispatch(addToast({ message: "Please fix the highlighted errors", type: "error" }));
        return;
      }

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      dispatch(addToast({ message, type: "error" }));
      setErrors({ api: message });

    } finally {
      isDraft ? setDraftSubmitting(false) : setSubmitting(false);
    }
  };

  const getTimeFromDate = (date) => ({
    hour: moment(date).format("HH"),
    minute: moment(date).format("mm"),
  });

  const scrollToFirstError = (errors) => {
    if (!formContainerRef.current) return;

    // Start and end share one date & time field
    const firstErrorKey = Object.keys(errors)[0] === "endDate" ? "startDate" : Object.keys(errors)[0];

    const el = formContainerRef.current.querySelector(
      `[data-error="${firstErrorKey}"]`
    );

    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const addBlock = (block) => {
    setBlocks((prev) => [...prev, block.key]);
    setLastAddedBlock(block.key);
    if (block.modal) dispatch(openEventFormModal({ type: block.modal }));
  };

  const removeBlock = (block) => {
    setBlocks((prev) => prev.filter((key) => key !== block.key));
    setForm((prev) => ({ ...prev, ...block.reset() }));
    if (block.errorKey) clearFieldError(setErrors, block.errorKey);
  };

  const loading = eventDetailsFormLoader?.[eventId];

  useEffect(() => {
    if (!eventId) return;

    dispatch(fetchEventDetails({ eventId, noSkip:true }));
  }, [eventId, dispatch]);

  useEffect(() => {
    if (!eventId) return;

    const existing = eventDetailsMap[eventId];
    if (!existing) return;

    const mapped = mapDraftToForm(existing);
    setForm(mapped);
    // Show the optional blocks that already hold data
    setBlocks(OPTIONAL_BLOCKS.filter((b) => b.hasData(mapped)).map((b) => b.key));
    setLocationMode(looksLikeLink(mapped.location) ? "online" : "place");
  }, [eventDetailsMap, eventId]);

  if (loading) {
    return (
      <div className="h-[calc(100dvh-60px)] md:h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#0B57D0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isUpdate = isEditMode && !form?.isDraft;
  const isProposal = isPortfolioOfficer && !isUpdate;
  const submitLabel = isUpdate ? "Update event" : isProposal ? "Propose" : "Create event";
  const busy = submitting || draftSubmitting;

  // Same checks as submit, run live to drive the progress ring
  const liveErrors = getFormErrors();
  const requiredChecks = [
    !liveErrors.image,
    !liveErrors.eventName,
    !liveErrors.eventType,
    !liveErrors.description,
    !liveErrors.startDate && !liveErrors.endDate,
    !liveErrors.location,
    !liveErrors.speaker?.name,
  ];
  const requiredDone = requiredChecks.filter(Boolean).length;
  const allRequiredDone = requiredDone === requiredChecks.length;

  const activeLocationMode = LOCATION_MODES.find((m) => m.key === locationMode);
  const LocationIcon = activeLocationMode.Icon;

  const renderBlockBody = (key) => {
    switch (key) {
      case "audience":
        return (
          <>
            <CheckboxGroup
              options={[
                { key: "member", label: "Member" },
                { key: "spouse", label: "Spouse" },
                { key: "children", label: "Children" },
                { key: "guests", label: "Guests" },
              ]}
              value={form.attendees}
              onChange={(v) => update("attendees", v)}
            />
            <div className="mt-3.5 rounded-xl bg-[#F8FAFD] border border-[#E3EAF5] px-4 py-3.5">
              <RegistrationToggle
                value={form.registrationOpen}
                onChange={() => update("registrationOpen", !form.registrationOpen)}
              />
            </div>
          </>
        );
      case "reminder":
        return (
          <>
            <div className="flex flex-col gap-[6px]">
              {form.reminder.length > 0 ? (
                form.reminder.map((r) => <ReadOnlyReminderRow key={r.id || r._id} reminder={r} />)
              ) : (
                <ReadOnlyReminderRow reminder={null} />
              )}
            </div>
            <button
              type="button"
              onClick={() => dispatch(openEventFormModal({ type: "REMINDER" }))}
              className="inline-flex items-center gap-1.5 mt-2 py-1 text-[14px] font-bold text-[#0B57D0] cursor-pointer hover:underline"
            >
              <FiPlus />
              {form.reminder.length > 0 ? "Add/Edit reminder" : "Add reminder"}
            </button>
          </>
        );
      case "collaborator":
        return <Collaborators showLabel={false} form={form} setForm={setForm} />;
      case "travel":
        return (
          <EventsInput
            readOnly
            onClick={() => dispatch(openEventFormModal({ type: "TRAVEL" }))}
            error={errors.travelInfo}
            svg="/logo/travel.svg"
            isTravelField
            travelData={form.travelInfo}
          />
        );
      case "note":
        return (
          <div className="pb-[22px]">
            <EventsTextarea
              placeholder="Add a note"
              value={form.additionalNote}
              onChange={(e) => update("additionalNote", e.target.value)}
              icon={<span className="meteor-icons--pencil"></span>}
              error={errors.additionalNote}
              dataError={"additionalNote"}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={formContainerRef} className="w-full max-w-[1100px] mx-auto pt-4 pb-20 md:pt-6 md:px-6 md:pb-0 font-nunito">

      {/* ── Page header ── */}
      <div className="flex items-center gap-2.5 mb-5 md:mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          title="Back"
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#333333] hover:bg-[#F2F7FF] cursor-pointer transition-colors shrink-0"
        >
          <FiArrowLeft className="text-[22px]" />
        </button>
        <h2 className="font-heading text-[28px] md:text-[34px] leading-[1.1] text-[#1B2230]">
          {isUpdate ? "Update" : "Create"} event
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)] gap-5 lg:gap-7 items-start">

        {/* ── Left: cover, which turns into a live preview ── */}
        <div className="lg:sticky lg:top-4">
          <EventCoverPreview
            value={form.image}
            onChange={(files) => update("image", files)}
            error={errors.image}
          />
        </div>

        {/* ── Right: required fields, then optional add-ons ── */}
        <div className="min-w-0">
          <div className="rounded-[18px] bg-white border border-[#E8EBF0] p-5 sm:p-6 flex flex-col gap-7">
            <EventsInput
              label="Event name"
              required
              icon={<span className="uil--calendar"></span>}
              placeholder="Enter event name"
              value={form.eventName}
              onChange={(e) => {update("eventName", e.target.value);
                clearFieldError(setErrors,"eventName")}}
              error={errors.eventName}
              dataError={'eventName'}
            />

            <EventTypeChips
              value={form.eventType}
              onChange={updateEventType}
              error={errors.eventType}
              dataError={'eventType'}
            />

            <EventsTextarea
              label="Description"
              required
              placeholder="Add description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              icon={<span className="solar--chat-line-outline"></span>}
              error={errors.description}
              dataError={'description'}
            />

            <div data-error={'startDate'}>
              <DateTimeRangePicker
                startDate={form.startDate}
                endDate={form.endDate}
                startTime={getTimeFromDate(form.startDate)}
                endTime={getTimeFromDate(form.endDate)}

                onStartDateChange={(date) =>
                  update("startDate", mergeDateAndTime(date, getTimeFromDate(form.startDate)))
                }

                onEndDateChange={(date) =>
                  update("endDate", mergeDateAndTime(date, getTimeFromDate(form.endDate)))
                }

                onStartTimeChange={(time) => {
                  const newStartDate = mergeDateAndTime(form.startDate, time);

                  update("startDate", newStartDate);

                  const isSameDay = moment(form.startDate).isSame(form.endDate, "day");

                  if (isSameDay) {
                    const newEndDate = moment(newStartDate)
                      .add(1, "hour")
                      .toDate();

                    update("endDate", newEndDate);
                  }
                }}

                onEndTimeChange={(time) =>
                  update("endDate", mergeDateAndTime(form.endDate, time))
                }

                error={errors.startDate || errors.endDate}
                required
              />
            </div>

            <div data-error={'location'}>
              <div className="flex items-center justify-between gap-3 mb-[6px] min-h-[30px]">
                <label htmlFor="event-location" className="text-[14px] text-[#333333] font-[700]">
                  Location<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div role="group" aria-label="Location type" className="inline-flex p-[3px] rounded-[9px] bg-[#F2F5F9]">
                  {LOCATION_MODES.map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      aria-pressed={locationMode === mode.key}
                      onClick={() => setLocationMode(mode.key)}
                      className={`h-[26px] px-3 rounded-[7px] text-[13px] font-medium cursor-pointer transition-colors ${
                        locationMode === mode.key
                          ? "bg-white text-[#0B57D0] shadow-[0_1px_3px_rgba(20,35,60,0.12)]"
                          : "text-[#4A5466]"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
              <EventsInput
                id="event-location"
                placeholder={activeLocationMode.placeholder}
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                icon={<LocationIcon className="text-[18px]" />}
                error={errors.location}
                autoComplete="off"
              />
            </div>

            <ResourceSpeaker
              value={form.speaker}
              onChange={(v) => {
                update("speaker", v);
                clearFieldError(setErrors, "speaker");
              }}
              errors={errors.speaker}
            />
          </div>

          {/* Optional blocks, in the order they were added */}
          {blocks.map((key) => {
            const block = OPTIONAL_BLOCKS.find((b) => b.key === key);
            return (
              <OptionalBlock
                key={key}
                title={block.title}
                required={block.required}
                onRemove={() => removeBlock(block)}
                scrollOnMount={key === lastAddedBlock}
              >
                {renderBlockBody(key)}
              </OptionalBlock>
            );
          })}

          {blocks.length < OPTIONAL_BLOCKS.length && (
            <div className="flex flex-wrap gap-2 mt-4">
              {OPTIONAL_BLOCKS.filter((b) => !blocks.includes(b.key)).map((block) => (
                <AddBlockPill key={block.key} label={block.label} onClick={() => addBlock(block)} />
              ))}
            </div>
          )}

          {/* ── Actions ── */}
          <div className="sticky bottom-0 z-[5] mt-5 pt-3 pb-4 bg-[linear-gradient(to_top,#FFFFFF_70%,rgba(255,255,255,0))]">
            <div className="flex items-center gap-3 p-2 pl-3 rounded-full bg-white border border-[#E8EBF0] shadow-[0_10px_30px_-14px_rgba(20,35,60,0.25)]">
              <ProgressRing done={requiredDone} total={requiredChecks.length} />
              <p className="flex-1 min-w-0 text-[13px] text-[#8C95A5] truncate max-sm:hidden">
                {isProposal
                  ? "Your proposal will be reviewed before it goes live."
                  : "Save a draft anytime and come back to finish it."}
              </p>
              <div className="flex gap-2 max-sm:ml-auto">
                <button
                  type="button"
                  disabled={busy}
                  onClick={()=> dispatch(openEventFormModal({ type: "APPROVAL" }))}
                  className="h-[46px] px-4 sm:px-5 text-[15px] font-semibold border-[1.4px] border-[#0B57D0] text-[#0B57D0] rounded-full whitespace-nowrap cursor-pointer transition-colors hover:bg-[#F2F7FF] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Save as draft
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCreateEvent}
                  className={`h-[46px] px-5 sm:px-6 sm:min-w-[140px] text-[15px] font-semibold text-white rounded-full whitespace-nowrap bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer flex items-center justify-center gap-2 transition-opacity hover:opacity-95 disabled:cursor-not-allowed ${
                    allRequiredDone ? "shadow-[0px_8px_20px_-6px_#0B57D080]" : "opacity-55"
                  }`}
                >
                  {submitting ? (
                    <div className="w-[20px] h-[20px] border-2 border-[white] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {isProposal ? <FiSend /> : <FiCheck />}
                      {submitLabel}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DraftApprovalModal
        onConfirmCreate={() => dispatch(closeEventFormModal())}
        onSendForApproval={() => handleCreateEvent(undefined, true)}
        submitting={draftSubmitting}
      />
      <ReminderModal form={form} setForm={setForm} />
      <TravelModal form={form} setForm={setForm} />

      <SuccessPopup
        isOpen={proposalSent}
        title="Event proposal sent"
        message="Your event details have been sent to the admin, and the event will be created shortly. You can track its progress on the Event Requests page."
        onClose={() => router.push("/dashboard/events/requests")}
      />
    </div>
  );
};

export default CreateEvent;
