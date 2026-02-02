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

  const [form, setForm] = useState({
    startDate: defaultStart,
    endDate: defaultEnd,
    eventType: { type: "", points: 1 },
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
    requiredInfo: {ticket: false, insurance: false, visa: false, },
    deadline: null, reminders: [],
  },
    additionalNote: "",
  });

  const update = (key, value) =>
    setForm((p) => ({ ...p, [key]: value }));

  const updateEventType = (key, value) =>
    setForm((p) => ({
      ...p,
      eventType: { ...p.eventType, [key]: value },
    }));

  return { form, setForm, update, updateEventType };
};