"use client";

// import { Formik, Form, Field, ErrorMessage } from "formik";
// import * as Yup from "yup";
// import Calendar from "@/_components/UI/Calendar";
import { useState } from "react";
import { EventsInput } from "@/_components/UI/EventsInput";
import { EventTypeDropdown } from "@/_components/UI/EventTypeDropdown";
import { EventsTextarea } from "@/_components/UI/EventsTextarea";
import { CheckboxGroup } from "@/_components/UI/CheckboxGroup";
import { RegistrationToggle } from "@/_components/UI/RegistrationToggle";
import { Attachments } from "@/_components/UI/Attachments";
import { ResourceSpeaker } from "@/_components/UI/ResourceSpeaker";
import DateTimeRangePicker from "@/_components/UI/DateTimeRangePicker";
import { EventImage } from "@/_components/UI/EventImage";
import ReminderField from "@/_components/EventsComps/ReminderField";
import ReminderModal from "@/_components/EventsComps/ReminderModal";
import { openEventFormModal } from "@/store/events/eventsUiSlice";
import { useDispatch } from "react-redux";
import LocationModal from "@/_components/EventsComps/LocationModal";
import { useRouter } from "next/navigation";
import TravelModal from "@/_components/EventsComps/TravelModal";
import { Collaborators } from "@/_components/EventsComps/Collaborators";

const buildFormData = (form) => {
  const fd = new FormData();

  fd.append("eventName", form.eventName);
  fd.append("eventType", form.eventType);
  fd.append("description", form.description);
  fd.append("startDate", form.startDate.toISOString());
  fd.append("endDate", form.endDate.toISOString());
  fd.append("location", form.location);
  fd.append("registrationOpen", form.registrationOpen);

  // Attendees (object)
  Object.entries(form.attendees).forEach(([key, value]) => {
    fd.append(`attendees[${key}]`, value);
  });

  // Speaker
  fd.append("speaker[name]", form.speaker.name);
  fd.append("speaker[description]", form.speaker.description);
  fd.append("speaker[linkedin]", form.speaker.linkedin);

  if (form.speaker.image) {
    fd.append("speaker[image]", form.speaker.image);
  }

  // Attachments (array of files)
  form.attachments.forEach((file, index) => {
    fd.append(`attachments[${index}]`, file);
  });

  fd.append("travelInfo", form.travelInfo);
  fd.append("additionalNote", form.additionalNote);

  return fd;
};



const mergeDateAndTime = (date, time) => {
  const d = new Date(date);

  d.setHours(
    parseInt(time.hour, 10),
    parseInt(time.minute, 10),
    0,
    0
  );

  return d;
};



const CreateEvent = () => {
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [startTime, setStartTime] = useState({
    hour: "15",
    minute: "00",
  });

  const [endTime, setEndTime] = useState({
    hour: "15",
    minute: "00",
  });

  const router = useRouter()

  const dispatch = useDispatch();


    const [form, setForm] = useState({
    eventName: "", eventType: "", description: "", startDate: new Date(), endDate: new Date(),
    reminder: [], location: "",
    attendees: { member: true, spouse: false, children: false, guests: false },
    registrationOpen: true,
    speaker: { name: "", description: "", linkedin: "", image: null },
    collaborators: [], attachments: [],   travelInfo: {
    venueLink: "", hotelLink: "",
    requiredInfo: {ticket: false, insurance: false, visa: false, },
    deadline: null, reminders: [], note: "",
  }, additionalNote: "",
  });

  const validate = () => {
    const newErrors = {};

    if (!form.eventName.trim()) {
      newErrors.eventName = "Event name is required";
    }

    if (!form.eventType) {
      newErrors.eventType = "Please select event type";
    }

    if (!form.location.trim()) {
      newErrors.location = "Event location is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

const handleCreateEvent = (e) => {
  e?.preventDefault?.();

  const isValid = validate();

  if (!isValid) return;

  const formData = buildFormData(form);

  console.log(form)
};

  const update = (key, value) =>
    setForm((p) => ({ ...p, [key]: value }));

  return (
    <div className="h-[calc(100vh-80px)] flex justify-center py-5 gap-[80px] overflow-auto relative">
        <EventImage value={image} onChange={setImage} />

        {/* Right Form */}
        <div className="flex-1 max-w-[500px]">
          <div className="mb-[30px] text-[36px] font-[600] flex items-center gap-[20px]">
           <span className="maki--arrow rotate-180 inline-block cursor-pointer" onClick={()=>router.back()}></span> Create event</div>
            <div className="w-full flex flex-col gap-[30px]">

              <EventsInput
                label="Event name"
                icon={<span className="uil--calendar"></span>}
                placeholder="Enter Event name"
                value={form.eventName}
                onChange={(e) => update("eventName", e.target.value)}
                error={errors.eventName}
              />

              <EventTypeDropdown
                value={form.eventType}
                onChange={(v) => update("eventType", v)}
                error={errors.eventType}
                icon={<span className="material-symbols--event-list-outline-rounded"></span>}
              />

              {/* Description */}
              <EventsTextarea
                label="Event Description"
                placeholder="Add event Description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                icon={<span className="solar--chat-line-outline"></span>}
              />

              <div>
                <DateTimeRangePicker
                  startDate={form.startDate}
                  endDate={form.endDate}
                  startTime={startTime}
                  endTime={endTime}
                  onStartDateChange={(date) =>
                    update("startDate", mergeDateAndTime(date, startTime))
                  }
                  onEndDateChange={(date) =>
                    update("endDate", mergeDateAndTime(date, endTime))
                  }
                  onStartTimeChange={(time) => {
                    setStartTime(time);
                    update("startDate", mergeDateAndTime(form.startDate, time));
                  }}
                  onEndTimeChange={(time) => {
                    setEndTime(time);
                    update("endDate", mergeDateAndTime(form.endDate, time));
                  }}
                  error={errors.date}
                />
              </div>

              <ReminderField reminders={form.reminder} />

              {/* Location */}
              <EventsInput
                  label="Event location"
                  placeholder="Add location/room or meeting link"
                  value={form.location || ""}
                  readOnly
                  onClick={() =>
                    dispatch(openEventFormModal({ type: "LOCATION" }))
                  }
                  icon={<span className="weui--location-outlined"></span>}
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

             <RegistrationToggle
                value={form.registrationOpen}
                onChange={() =>
                  update("registrationOpen", !form.registrationOpen)
                }
              />

              <ResourceSpeaker
                value={form.speaker}
                onChange={(v) => update("speaker", v)}
              />

              <Collaborators  form={form}
          setForm={setForm}/>

              <Attachments
                value={form.attachments}
                onChange={(files) => update("attachments", files)}
              />


              <EventsInput
                label="Add travel info"
                placeholder="Travel ticket, hotels, insurance, visa, local transport"
                value={
                  form.travelInfo?.venueLink ||
                  form.travelInfo?.hotelLink
                    ? "Travel info added"
                    : ""
                }
                readOnly
                onClick={() =>
                  dispatch(openEventFormModal({ type: "TRAVEL" }))
                }
                svg={"/logo/travel.svg"}
              />

              <EventsTextarea
                label="Additional note"
                placeholder="Additional note"
                value={form.additionalNote}
                onChange={(e) => update("additionalNote", e.target.value)}
                icon={<span className="meteor-icons--pencil"></span>}
              />


              {/* Actions */}
              <div className="flex gap-3 mb-[25px]">
                <button className="flex-1 h-[50px] text-[20px] font-[500] border border-[#0B57D0] text-[#0B57D0] rounded-full cursor-pointer">
                  Save as draft
                </button>
                <button className="flex-1 h-[50px] text-[20px] font-[500] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer text-white rounded-full" type="button" onClick={handleCreateEvent}>
                  Create event
                </button>
              </div>
            </div>
        </div>
        <ReminderModal
          form={form}
          setForm={setForm}
        />
        <LocationModal form={form} setForm={setForm} />
        <TravelModal form={form} setForm={setForm} />
    </div>
  );
};

export default CreateEvent;