// import { useState } from "react";
// import moment from "moment";
// import { getNextFullHour, mergeDateAndTime } from "../utils/dateUtils";

// export const useEventForm = () => {
//   const defaultStart = getNextFullHour();
//   const defaultEnd = moment(defaultStart).add(1, "hour").toDate();

//   const [form, setForm] = useState({
//     image: { file: null, previewUrl: null },
//     eventName: "",
//     eventType: { type: "", points: 1 },
//     description: "",
//     startDate: defaultStart,
//     endDate: defaultEnd,
//     reminder: [],
//     location: "",
//     attendees: { member: true, spouse: false, children: false, guests: false },
//     registrationOpen: true,
//     speaker: { name: "", description: "", weblinks: [], image: null },
//     collaborators: [],
//     attachments: [],
//     travelInfo: {},
//     additionalNote: "",
//   });

//   const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

//   const updateNested = (parent, key, value) =>
//     setForm((p) => ({ ...p, [parent]: { ...p[parent], [key]: value } }));

//   return { form, setForm, update, updateNested };
// };
import { useState } from "react";
import moment from "moment";
import { getNextFullHour } from "../utils/dateUtils";

export const useEventForm = () => {
  const defaultStart = getNextFullHour(); 
  const defaultEnd = moment(defaultStart).add(1, "hour").toDate();
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    eventId:"",
    startDate: defaultStart,
    endDate: defaultEnd,
    eventType: { type: "", points: 0 },
    image: { file: null, previewUrl: null },
    description: "",
    eventName: "",
    reminder: [],
    location: "",
    attendees: { member: true, spouse: false, children: false, guests: false },
    registrationOpen: true,
    speaker: { name: "", description: "", weblinks: [], image: null },
    collaborators: [],
    attachments: [],
    travelInfo: {
    venueLink: "", hotelLink: "",
    requiredInfo: {ticketDetails: false, insuranceDetails: false, visaInformation: false, },
    deadline: null, reminders: [],
    isDraft:false
  },
    additionalNote: "",
  });

const update = (key, value) => {
  setForm((p) => {
    let updated = { ...p, [key]: value };

    if (key === "startDate" && updated.endDate) {
      const start = new Date(value);
      const end = new Date(updated.endDate);

      const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      if (endDateOnly < startDateOnly) {
        const newEnd = new Date(start);
        newEnd.setHours(end.getHours(), end.getMinutes(), 0, 0);

        updated.endDate = newEnd;
      }
    }

    return updated;
  });

  setErrors((prev) => {
    if (!prev[key]) return prev;
    const newErr = { ...prev };
    delete newErr[key];
    return newErr;
  });
};

const updateEventType = (key, value) => {
  setForm((p) => ({
    ...p,
    eventType: { ...p.eventType, [key]: value },
  }));

  setErrors((prev) => {
    if (!prev.eventType) return prev;
    const newErr = { ...prev };
    delete newErr.eventType;
    return newErr;
  });
};

  return { form, setForm,errors,setErrors, update, updateEventType };
};