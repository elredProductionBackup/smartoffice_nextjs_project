// Shared by the Add attendee popup flow and the sheet import: cleans attendee contact
// values into what addOfflineAttendees accepts, and checks them before they're sent.

// addOfflineAttendees accepts a 10-digit mobile or E.164, so drop spaces/dashes and keep a leading +.
// Sheets often have numbers without +91: "9876543210" stays as is, "919876543210" gets a +,
// the domestic trunk 0 ("09876543210") is dropped and the international 00 ("0091…") becomes +.
// A cell holding two numbers ("98765 43210 / 91234 56789") keeps only the first.
export function toApiPhone(value = "") {
  value = value.split(/[\/,;|]|\bor\b/i).find((part) => /\d/.test(part)) || "";
  const d = value.replace(/\D/g, "");
  if (!d) return "";
  if (value.trim().startsWith("+")) return `+${d}`;
  if (d.startsWith("00")) return `+${d.slice(2)}`;
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  return d.length > 10 ? `+${d}` : d;
}

// Sheet cells often carry "mailto:", stray spaces or two addresses; keep the first address found
export function toApiEmail(value = "") {
  const found = value.match(/[^\s<>,;:"'()\[\]]+@[^\s<>,;:"'()\[\]]+\.[^\s<>,;:"'()\[\].]+/);
  return found ? found[0] : value.trim();
}

// Popup/sheet values → one attendees[] item; empty optional fields are left out
export function toApiAttendee(values) {
  const item = {
    name: values.name?.trim(),
    companyName: values.company?.trim(),
    title: values.designation?.trim(),
    phoneNumber: toApiPhone(values.whatsapp),
    email: toApiEmail(values.email),
  };
  return Object.fromEntries(Object.entries(item).filter(([, v]) => v));
}

const PHONE_OK = /^(\d{10}|\+\d{10,15})$/;
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Errors keyed by field (name, whatsapp, email) for one attendee; {} when it can be sent as is
export function validateAttendee(values) {
  const errors = {};
  if (!values.name?.trim()) errors.name = "Name is required";
  if (values.whatsapp?.trim() && !PHONE_OK.test(toApiPhone(values.whatsapp))) {
    errors.whatsapp = "Enter a 10-digit mobile or +country code";
  }
  if (values.email?.trim() && !EMAIL_OK.test(toApiEmail(values.email))) {
    errors.email = "Enter a valid email";
  }
  return errors;
}

// Which field a failed[] reason from addOfflineAttendees belongs to, so the error shows under it
export function fieldForReason(reason = "") {
  const r = reason.toLowerCase();
  if (r.startsWith("name")) return "name";
  if (r.startsWith("email")) return "email";
  if (r.includes("phone")) return "whatsapp";
  return null;
}
