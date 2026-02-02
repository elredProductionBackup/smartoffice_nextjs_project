import { toUTC } from "./dateUtils";

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
export const buildEventPayload = (form, isDraft = false) => {
  const payload = {
    eventId: "",

    eventName: form.eventName.trim(),
    eventType: form.eventType.type,
    ...(isValidImageFile(form.image?.file) && {
      eventImage: form.image.file,
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
      attendeesInfo:{
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