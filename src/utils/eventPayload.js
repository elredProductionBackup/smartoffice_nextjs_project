import { getNextFullHour, toUTC } from "./dateUtils";
import moment from "moment";
const isValidImageFile = (file) => {
  if (!(file instanceof File)) return false;
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  return allowed.includes(file.type) && file.size <= 10 * 1024 * 1024;
};
const ensureHttps = (url) => {
  if (!url) return "";
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `https://${url}`;
};
export const buildEventPayload = (form, isDraft = false, isEditMode= false) => {
  const payload = {
    eventId: isEditMode ? form.eventId : "" ,
    
    eventName: form.eventName.trim(),
    eventType: form.eventType.type,
  ...( (isValidImageFile(form?.image?.file) || form?.image?.previewUrl) && {
      eventImage: form?.image?.file || form?.image?.previewUrl,
    }),
    point: form.eventType.points,
    eventDescription: form.description || "",

    startDateTime: toUTC(form.startDate),
    endDateTime: toUTC(form.endDate),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    reminder: form.reminder.map((r) => ({
      reminderName: r.audience,
      time: toUTC(r.datetime),
      notes: r.note
    })),

    eventLocation: form.location,

    whoCanAttend: {
      members: form.attendees.member,
      spouce: form.attendees.spouse,
      children: form.attendees.children,
      guests: form.attendees.guests,
    },

    isRegistration: form.registrationOpen,

    resourceName: form.speaker.name,
    resourceDescription: form.speaker.description,
    uploadResourceImageUrl: form.speaker.image || "",

    webLink: (form.speaker.weblinks || []).map(ensureHttps),

    collaborators: form.collaborators
      .filter((c) => c.userCode)
      .map((c) => ({
        userCode: c.userCode,
        points: c.point,
      })),

    travelInfo: {
      venueLink: ensureHttps(form.travelInfo.venueLink),
      hotelLink: ensureHttps(form.travelInfo.hotelLink),
      attendeesInfo: {
        ticketDetails: form.travelInfo?.requiredInfo?.ticketDetails,
        insuranceDetails: form.travelInfo.requiredInfo?.insuranceDetails,
        visaInformation: form.travelInfo?.requiredInfo?.visaInformation
      },
      deadLine: form.travelInfo.deadline ? toUTC(form.travelInfo.deadline) : "",
      remainder: form.travelInfo.reminders.map((r) => ({
        reminderName: r.label || "Reminder",
        time: toUTC(r.date),
        notes: r.note
      })),
    },

    additionalNotes: form.additionalNote || "",
    isDraft,
  };

  form.attachments?.forEach((item, i) => {
    if (item?.file instanceof File) {
      payload[`uploadDocument${i + 1}`] = item.file;
    }
  });

  return payload;
};

export const mapDraftToForm = (event) => {
  return {
    eventId:event.eventId || "",
    eventName: event.eventName || "",
    description: event.eventDescription || "",

    eventType: {
      type: event.eventType || "",
      points: event.point || 0,
    },

    startDate: event.startDateTime
      ? moment(event.startDateTime).local().toDate()
      : getNextFullHour(),

    endDate: event.endDateTime
      ? moment(event.endDateTime).local().toDate()
      : moment(getNextFullHour()).add(1, "hour").toDate(),
    image: {
      file: null,
      previewUrl: event.eventImage || null,
    },

    // reminder: form.reminder.map((r) => ({
    //   reminderName: r.audience,
    //   time: toUTC(r.datetime),
    //   notes: r.note
    // })),
reminder: (event?.reminder || []).map((r) => ({
  id:r?._id || "",
  audience: r?.reminderName || "",
  datetime: r?.time
    ? moment(r.time).local().toDate()
    : getNextFullHour(),
  note: r?.notes || "",
})),
    location: event.eventLocation || "",

    attendees: {
      member: event.whoCanAttend?.members || false,
      spouse: event.whoCanAttend?.spouce || false, 
      children: event.whoCanAttend?.children || false,
      guests: event.whoCanAttend?.guests || false,
    },

    registrationOpen: event.isRegistration ?? true,

    speaker: {
      name: event.resource?.resourceName || "",
      description: event.resource?.resourceDescription || "",
      weblinks: event.resource?.webLink || [],
      image: event.resource?.uploadResourceImageUrl || null,
    },

    collaborators: (event.collaborators || []).map((c) => ({
      userCode: c.userCode,
      point: c.points || 0,
      name: "",
      email: "",
      dpURL: "",
    })),

    attachments: event.attachment || [],

travelInfo: {
  venueLink: event?.travelInfo?.venueLink || "",
  hotelLink: event?.travelInfo?.hotelLink || "",

  requiredInfo: {
    ticketDetails:
      event?.travelInfo?.attendeesInfo?.ticketDetails || false,
    insuranceDetails:
      event?.travelInfo?.attendeesInfo?.insuranceDetails || false,
    visaInformation:
      event?.travelInfo?.attendeesInfo?.visaInformation || false,
  },

  deadline: event?.travelInfo?.deadLine
    ? moment(event.travelInfo.deadLine).local().toDate()
    : null,

  reminders: (event?.travelInfo?.remainder || []).map((r) => ({
    id: r?._id || crypto.randomUUID(),

    date: r?.time
      ? moment(r.time).local().toDate()
      : null,

    time: r?.time
      ? {
          hour: moment(r.time).format("HH"),
          minute: moment(r.time).format("mm"),
        }
      : { hour: "", minute: "" },

    note: r?.notes || "",
  })),
},
    additionalNote: event.additionalNotes || "",
    isDraft:event.isDraft || false
  };
};