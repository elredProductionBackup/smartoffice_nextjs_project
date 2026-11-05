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
import {
  buildEventPayload, buildEventRequestChanges, buildEventRequestPayload, mapDraftToForm, mapRequestToForm,
} from "@/utils/eventPayload";
import { submitEvent } from "@/services/events.service";
import { createEventRequest, getEventRequests, updateEventRequest } from "@/services/eventRequest.service";
import { MdCurrencyRupee } from "react-icons/md";
import { mergeDateAndTime } from "@/utils/dateUtils";
import { addToast } from "@/store/toastSlice";
import { fetchEventDetails } from "@/store/events/eventsThunks";
import SuccessPopup from "@/_components/ConfirmationPopups/SuccessPopup";
import { FiArrowLeft, FiCheck, FiEdit3, FiMapPin, FiPlus, FiSend, FiVideo } from "react-icons/fi";

// A request can only be edited by its officer while it is in one of these
const EDITABLE_REQUEST_STATUSES = ["pending", "changesRequested", "doneWithRequestedChanges"];

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
    key: "budget",
    label: "Budget",
    title: "Estimated budget",
    errorKey: "budget",
    proposalOnly: true, // eventBudget is sent on event requests only
    hasData: (f) => f.budget !== "" && f.budget != null,
    reset: () => ({ budget: "" }),
  },
  {
    key: "reminder",
    label: "Reminder",
    title: "Reminder",
    modal: "REMINDER",
    errorKey: "reminder",
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
  // Editing an event request (from the Event Requests page) rather than an event
  const requestId = eventId ? null : searchParams.get("requestId");
  const isRequestEdit = !!requestId;
  const [requestLoading, setRequestLoading] = useState(isRequestEdit);
  const [loadedRequest, setLoadedRequest] = useState(null); // { status, requestedChanges, form }
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

  // Editing a live event is an update; anything else a portfolio officer submits is a proposal
  // that goes to POST /eventRequest for admin review
  const isUpdate = isEditMode && !form?.isDraft;
  const isProposal = (isPortfolioOfficer && !isUpdate) || isRequestEdit;

  const getFormErrors = () => {
    const errs = validateEvent(form);
    // The event request API takes 2–150 characters; validateEvent allows up to 200
    const name = form.eventName.trim();
    if (isProposal && !errs.eventName && (name.length < 2 || name.length > 150)) {
      errs.eventName = "Event name must be 2–150 characters";
    }
    // A new request needs a jpg/png cover file (an old URL can't be sent); an edit keeps the saved one
    if (isProposal && !isRequestEdit && !(form.image?.file instanceof File)) {
      return { image: "Upload a cover image", ...errs };
    }
    return hasCover ? errs : { image: "Upload a cover image", ...errs };
  };

  // POST /eventRequest, or PATCH with only the changed fields when editing one.
  // Resolves true when the server accepted it.
  const submitProposal = async () => {
    let res;
    if (isRequestEdit) {
      const changes = buildEventRequestChanges(loadedRequest.form, form);
      if (!Object.keys(changes).length) {
        dispatch(addToast({ message: { title: "Nothing to update", descrip: "You haven't changed anything yet." }, type: "error" }));
        return false;
      }
      res = await updateEventRequest({ eventRequestId: requestId, ...changes });
    } else {
      res = await createEventRequest(buildEventRequestPayload(form));
    }
    if (res?.data?.success) return true;
    dispatch(addToast({
      message: {
        title: isRequestEdit ? "Couldn't update the proposal" : "Couldn't send the proposal",
        descrip: res?.data?.message || "Please try again in a moment.",
      },
      type: "error",
    }));
    return false;
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

      // Portfolio officers propose: the request goes to admin review, not straight to addEvents
      if (!isDraft && isProposal) {
        if (await submitProposal()) setProposalSent(true);
        return;
      }

      const payload = buildEventPayload(form, isDraft, isEditMode);
      const res = await submitEvent(payload);

      if (res?.success) {
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

  const loading = eventDetailsFormLoader?.[eventId] || requestLoading;

  // Load the request being edited. Anything that can't be edited goes back to the requests page.
  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    const leave = (title, descrip) => {
      dispatch(addToast({ message: { title, descrip }, type: "error" }));
      router.replace("/dashboard/events/requests");
    };

    getEventRequests({ eventRequestId: requestId })
      .then((res) => {
        if (cancelled) return;
        if (!res?.data?.success) throw new Error(res?.data?.message || "Couldn't load this request");
        const result = res.data.result;
        const row = Array.isArray(result)
          ? result[0]
          : result?.list?.[0] || result?.eventRequests?.[0] || result?.data?.[0] || result;
        if (!row?.eventName) throw new Error("This request couldn't be found");
        if (!EDITABLE_REQUEST_STATUSES.includes(row.status)) {
          leave("Can't edit this request", "Only pending requests or ones sent back for changes can be edited.");
          return;
        }
        const mapped = mapRequestToForm(row);
        setForm(mapped);
        setLoadedRequest({ status: row.status, requestedChanges: row.requestedChanges || "", form: mapped });
        setBlocks(OPTIONAL_BLOCKS.filter((b) => b.hasData(mapped)).map((b) => b.key));
        setLocationMode(looksLikeLink(mapped.location) ? "online" : "place");
        setRequestLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Event request load error:", err);
        leave("Couldn't open the request", err.message);
      });

    return () => { cancelled = true; };
  }, [requestId, dispatch, router, setForm]);

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

  const submitLabel = isRequestEdit
    ? loadedRequest?.status === "changesRequested" ? "Resubmit" : "Save changes"
    : isUpdate ? "Update event" : isProposal ? "Propose" : "Create event";
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

  // "+" chips for blocks not on the form yet; Budget only applies to proposals
  const availableBlocks = OPTIONAL_BLOCKS.filter(
    (b) => !blocks.includes(b.key) && (!b.proposalOnly || isProposal)
  );

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
      case "budget":
        return (
          <div data-error="budget">
            <EventsInput
              // Plain text (not type="number") so arrow keys / mouse wheel can't nudge the amount
              type="text"
              inputMode="decimal"
              placeholder="Estimated cost of the event"
              value={form.budget}
              onChange={(e) => {
                const v = e.target.value;
                // digits with at most one decimal point and two decimal places
                if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) update("budget", v);
              }}
              icon={<MdCurrencyRupee className="text-[18px]" />}
              error={errors.budget}
            />
          </div>
        );
      case "reminder":
        return (
          <div data-error="reminder">
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
            {errors.reminder && <p className="mt-1 text-[13px] text-red-500">{errors.reminder}</p>}
          </div>
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
          {isRequestEdit ? "Edit proposal" : `${isUpdate ? "Update" : isProposal ? "Propose" : "Create"} event`}
        </h2>
      </div>

      {/* What the admin asked for, kept in view while the officer makes the changes */}
      {isRequestEdit && loadedRequest?.requestedChanges &&
        ["changesRequested", "doneWithRequestedChanges"].includes(loadedRequest.status) && (
        <div className="mb-5 flex items-start gap-3 rounded-[14px] bg-[#E8EEFE] border border-[#C7D5FB] px-4 py-3.5">
          <FiEdit3 className="mt-0.5 shrink-0 text-[#3B63E8]" />
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#1E3A8A]">Admin asked for these changes</p>
            <p className="text-[14px] text-[#1E3A8A] whitespace-pre-wrap break-words">{loadedRequest.requestedChanges}</p>
          </div>
        </div>
      )}

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

          {availableBlocks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {availableBlocks.map((block) => (
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
                {/* The event request API has no drafts, so proposals can only be sent */}
                {!isProposal && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={()=> dispatch(openEventFormModal({ type: "APPROVAL" }))}
                    className="h-[46px] px-4 sm:px-5 text-[15px] font-semibold border-[1.4px] border-[#0B57D0] text-[#0B57D0] rounded-full whitespace-nowrap cursor-pointer transition-colors hover:bg-[#F2F7FF] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Save as draft
                  </button>
                )}
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
        title={
          !isRequestEdit ? "Event proposal sent"
            : loadedRequest?.status === "changesRequested" ? "Proposal resubmitted" : "Proposal updated"
        }
        message={
          isRequestEdit
            ? "The admin has been told about your changes and will review the updated proposal."
            : "Your proposal has been sent to the admin for review. The event goes live once it's approved. You can track it on the Event Requests page."
        }
        onClose={() => router.push("/dashboard/events/requests")}
      />
    </div>
  );
};

export default CreateEvent;
