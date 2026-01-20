"use client";

// import { Formik, Form, Field, ErrorMessage } from "formik";
// import * as Yup from "yup";
// import Calendar from "@/_components/UI/Calendar";
import { useState } from "react";
import Image from "next/image";
import { EventsInput } from "@/_components/UI/EventsInput";
import { EventTypeDropdown } from "@/_components/UI/EventTypeDropdown";
import { EventsTextarea } from "@/_components/UI/EventsTextarea";
import { CheckboxGroup } from "@/_components/UI/CheckboxGroup";
import { RegistrationToggle } from "@/_components/UI/RegistrationToggle";
import { Attachments } from "@/_components/UI/Attachments";
import { ResourceSpeaker } from "@/_components/UI/ResourceSpeaker";

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


const EventImage = ({ image, setImage }) => {
  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
  };

  return (
    <div className="sticky top-0 flex flex-col items-center gap-[30px]">
      <div className="relative h-[600px]  aspect-[3/4] overflow-hidden rounded-[20px] bg-gray-200">
        {image ? (
          <Image
            src={image}
            alt="event"
            fill
            className="object-cover"
            sizes="450px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
            Event image preview
          </div>
        )}
      </div>

      <div className="flex flex-col gap-[20px] items-center">
        <label className="cursor-pointer text-[18px]">
          Change your event image
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleImage}
          />
        </label>
        <div className="flex flex-col items-center gap-[8px] text-[18px] font-[600]">
          <span className="h-[40px] w-[40px] rounded-full bg-[#147BFF1A] grid place-items-center">
            <Image src={`/logo/gallery.svg`} alt="Gallery Logo" height={22.4} width={22.4}/>
          </span>
          Gallery
        </div>
      </div>
    </div>
  );
};

const CreateEvent = () => {
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  

    const [form, setForm] = useState({
    eventName: "",
    eventType: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
    reminder: null,
    location: "",
    attendees: {
      member: true,
      spouse: false,
      children: false,
      guests: false,
    },
    registrationOpen: true,
    speaker: {
      name: "",
      description: "",
      linkedin: "",
      image: null ,
    },
    collaborators: [],
    attachments: [],
    travelInfo: "",
    additionalNote: "",
  });

  const validate = () => {
  const newErrors = {};

  if (!form.eventName.trim()) {
    newErrors.eventName = "Event name is required";
  }

  if (!form.eventType) {
    newErrors.eventType = "Please select event type";
  }

  // if (!form.startDate || !form.endDate) {
  //   newErrors.date = "Start & end date are required";
  // }

  // if (form.startDate > form.endDate) {
  //   newErrors.date = "End date cannot be before start date";
  // }

  if (!form.location.trim()) {
    newErrors.location = "Event location is required";
  }

  // if (form.speaker.name) {
  //   newErrors.speakerLinkedin = "LinkedIn URL is required";
  // }

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
    <div className="h-[calc(100vh-80px)] flex justify-center py-5 gap-[80px] relative overflow-auto relative">
      {/* <div className="flex  py-5"> */}
        {/* Left Sticky Image */}
        <EventImage image={image} setImage={setImage} />

        {/* Right Form */}
        <div className="flex-1 max-w-[500px]">
          <h1 className="mb-[30px] text-[36px] font-[600]">Create event</h1>
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
                icon={<span className="uil--calendar"></span>}
              />

              {/* Description */}
              <EventsTextarea
                label="Event Description"
                placeholder="Add event Description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                icon={<span className="uil--calendar"></span>}
              />

              {/* Location */}
              <EventsInput
                label="Event location"
                placeholder="Add location/room or meeting link"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                error={errors.location}
                icon={<span className="uil--calendar"></span>}
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

              <Attachments
                value={form.attachments}
                onChange={(files) => update("attachments", files)}
              />


              <EventsInput
                label="Add travel info"
                placeholder="Travel ticket, hotels, insurance, visa, local transport"
                value={form.travelInfo}
                onChange={(e) => update("travelInfo", e.target.value)}
                error={errors.travelInfo}
                icon={<span className="uil--calendar"></span>}
              />

              <EventsTextarea
                label="Additional note"
                placeholder="Additional note"
                value={form.additionalNote}
                onChange={(e) => update("additionalNote", e.target.value)}
                icon={<span className="uil--calendar"></span>}
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
    </div>
  );
};

export default CreateEvent;