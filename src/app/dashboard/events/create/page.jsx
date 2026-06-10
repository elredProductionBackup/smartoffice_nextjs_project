"use client";

// import { Attachments } from "@/_components/UI/Attachments";
import { useState, useRef, useEffect  } from "react";
import { EventsInput } from "@/_components/UI/EventsInput";
import { EventTypeDropdown } from "@/_components/UI/EventTypeDropdown";
import { EventsTextarea } from "@/_components/UI/EventsTextarea";
import { CheckboxGroup } from "@/_components/UI/CheckboxGroup";
import { RegistrationToggle } from "@/_components/UI/RegistrationToggle";
import { ResourceSpeaker } from "@/_components/UI/ResourceSpeaker";
import DateTimeRangePicker from "@/_components/UI/DateTimeRangePicker";
import { EventImage } from "@/_components/UI/EventImage";
import ReminderField from "@/_components/EventsComps/ReminderField";
import ReminderModal from "@/_components/EventsComps/ReminderModal";
import { closeEventFormModal, openEventFormModal } from "@/store/events/eventsUiSlice";
import { useDispatch, useSelector } from "react-redux";
import LocationModal from "@/_components/EventsComps/LocationModal";
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

const CreateEvent = () => {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const isEditMode = !!eventId;
  const formContainerRef = useRef(null);
  const { form, update,setForm,errors,setErrors , updateEventType } = useEventForm();
  const [submitting, setSubmitting] = useState(false);
  const [draftSubmitting, setDraftSubmitting] = useState(false);
  const router = useRouter();
  
  const { eventDetailsMap,eventDetailsFormLoader } = useSelector((state) => state.events);

  const handleCreateEvent = async (e, isDraft = false) => {
    e?.preventDefault?.();


    const errs = validateEvent(form);
    if (Object.keys(errs).length) {
  setErrors(errs);

  setTimeout(() => {
    scrollToFirstError(errs);
  }, 50);

  return;
}

    const file = form.image?.file || form.image?.previewUrl;

    if (!file) {
      dispatch(addToast({
        message: {
          title: "Event Image Required",
          descrip: "Please upload an image for this event type",
        },
        type: "error",
      }));
    return;
  }

  try {
    isDraft ? setDraftSubmitting(true) : setSubmitting(true);

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
    // console.error("Create Event Failed:", error?.response || error);
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

    const dispatch = useDispatch();

    const scrollToFirstError = (errors) => {
      if (!formContainerRef.current) return;

      const firstErrorKey = Object.keys(errors)[0];

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
    const loading = eventDetailsFormLoader?.[eventId];

useEffect(() => {
  if (!eventId) return;

  dispatch(fetchEventDetails({ eventId, noSkip:true }));
}, [eventId]);

useEffect(() => {
  if (!eventId) return;

  const existing = eventDetailsMap[eventId];
  if (!existing) return;

  setForm(mapDraftToForm(existing)); 

}, [eventDetailsMap, eventId]);

    

    if (loading) {
  return (
    <div className="h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

  return (
    <div ref={formContainerRef} className="h-[calc(100vh-80px)] flex justify-center py-5 gap-[80px] overflow-auto relative">
        <EventImage
          value={form.image}
          onChange={(files) => update("image", files)}
        />

        <div  className="flex-1 max-w-[500px] ">
          <div className="mb-[30px] text-[36px] font-[600] flex items-center gap-[20px]">
           <span className="maki--arrow rotate-180 inline-block cursor-pointer" onClick={()=>router.back()}></span> {isEditMode && !form?.isDraft?'Update':'Create'} event</div>
            <div className="w-full flex flex-col gap-[30px]" >

              <EventsInput
                label="Event name*"
                icon={<span className="uil--calendar"></span>}
                placeholder="Enter Event name"
                value={form.eventName}
                onChange={(e) => {update("eventName", e.target.value);
                  clearFieldError(setErrors,"eventName")}}
                error={errors.eventName}
                dataError={'eventName'}
              />

              <EventTypeDropdown
                value={form.eventType}
                onChange={updateEventType}
                error={errors.eventType}
                icon={
                  <span className="material-symbols--event-list-outline-rounded" />
                }
                dataError={'eventType'}
              />

              {/* Description */}
              <EventsTextarea
                label="Event Description*"
                placeholder="Add event Description"
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
                />
              </div>

              <ReminderField reminders={form.reminder} />

              {/* Location */}
              <EventsInput
                  label="Event location*"
                  placeholder="Add location/room or meeting link"
                  value={form.location || ""}
                  readOnly
                   error={errors.location}
                  onClick={() =>
                    dispatch(openEventFormModal({ type: "LOCATION" }))
                  }
                  icon={<span className="weui--location-outlined"></span>}
                  dataError={'location'}
              />

              <CheckboxGroup
                label="Who can attend"
                options={[
                  { key: "member", label: "Member" },
                  { key: "spouse", label: "Spouse" },
                  { key: "children", label: "Children" },
                  { key: "guests", label: "Guests" },
                ]}
                value={form.attendees}
                onChange={(v) => update("attendees", v)}
              />


              <ResourceSpeaker
                value={form.speaker}
                onChange={(v) => update("speaker", v)}
                errors={errors.speaker}
              />

              <Collaborators form={form} setForm={setForm}/>

              {/* <Attachments
                value={form.attachments}
                onChange={(files) => update("attachments", files)}
              /> */}

                <EventsInput
                  label="Add travel info"
                  readOnly
                  onClick={() => dispatch(openEventFormModal({ type: "TRAVEL" }))}
                  error={errors.travelInfo}
                  svg="/logo/travel.svg"
                  isTravelField
                  travelData={form.travelInfo}
                />

              <EventsTextarea
                label="Additional note"
                placeholder="Additional note"
                value={form.additionalNote}
                onChange={(e) => update("additionalNote", e.target.value)}
                icon={<span className="meteor-icons--pencil"></span>}
                error={errors.additionalNote}
              />

               <RegistrationToggle
                value={form.registrationOpen}
                onChange={() =>
                  update("registrationOpen", !form.registrationOpen)
                }
              />


              {/* Actions */}
              <div className="flex gap-3 mb-[25px]">
                <button className="flex-1 h-[50px] text-[20px] font-[500] border border-[#0B57D0] text-[#0B57D0] rounded-full cursor-pointer" disabled={submitting} onClick={()=> dispatch(openEventFormModal({ type: "APPROVAL" }))} 
                >
                  Save as draft
                </button> 
                <button className="flex-1 h-[50px] text-[20px] font-[500] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer text-white rounded-full flex items-center justify-center" type="button" disabled={submitting} onClick={handleCreateEvent}>
                  {submitting?<div className="w-[20px] h-[20px] border-2 border-[white] border-t-transparent rounded-full animate-spin" />: isEditMode && !form?.isDraft ?'Update event':'Create event'}
                </button>
              </div>
            </div>
        </div>
        <DraftApprovalModal
          onConfirmCreate={() => dispatch(closeEventFormModal())}
          onSendForApproval={() => handleCreateEvent(undefined, true)}
          submitting={draftSubmitting}
        />
        <ReminderModal form={form} setForm={setForm} />
        <LocationModal form={form} setForm={setForm} setErrors={setErrors} />
        <TravelModal form={form} setForm={setForm} />
    </div>
  );
};

export default CreateEvent;