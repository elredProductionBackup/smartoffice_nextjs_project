export const TEMPLATE_CATEGORIES = ["Utility", "Marketing", "Authentication"];

export const CATEGORY_HELP = {
  Utility: "Utility is for updates the recipient asked for. It costs less and approves faster.",
  Marketing: "Marketing is for promotions and offers. It costs more and takes longer to approve.",
  Authentication: "Authentication is for one-time codes only. Keep the body short and code-focused.",
};

export const TEMPLATE_LANGUAGES = ["English (en)", "Hindi (hi)"];

export const TEMPLATE_BUTTONS = ["None", "Visit website", "Call phone number"];

export const PROMO_WORDS = ["free", "discount", "limited period", "limited time", "% off", "sale", "offer"];

export const EVENT_FIELDS = [
  { value: "contact_name", label: "Contact name" },
  { value: "event_name", label: "Event name" },
  { value: "event_date", label: "Event date" },
  { value: "event_site", label: "Event site" },
  { value: "custom_text", label: "Custom text" },
];

export const SAMPLE_MAP_VALUES = {
  contact_name: "Priya Nair",
  event_name: "North Cluster review",
  event_date: "12 Sep, 6:00 PM",
  event_site: "Andheri West",
  custom_text: "sample text",
};

export const INITIAL_TEMPLATES = [
  {
    id: "t1",
    code: "payment_overdue_v3",
    name: "Payment overdue notice",
    category: "Utility",
    language: "English (en)",
    channels: ["whatsapp", "email"],
    status: "rejected",
    bodies: {
      whatsapp:
        "Hi {{1}}, your payment of {{2}} was due on {{3}}. Pay now to avoid service interruption. Limited period offer: pay within 48 hours and skip the late fee.",
      email: "",
    },
    subject: "",
    footer: "",
    button: "None",
    variableMapping: { 1: "contact_name", 2: "custom_text", 3: "event_date" },
    rejectionReason:
      'Rejected by Meta: the message contains promotional wording in a utility template. Remove "limited period offer" from the body.',
  },
  {
    id: "t2",
    code: "outage_update_v1",
    name: "Outage update",
    category: "Utility",
    language: "English (en)",
    channels: ["whatsapp"],
    status: "pending",
    bodies: {
      whatsapp: "Hi {{1}}, we're aware of an outage in {{2}} and expect it resolved by {{3}}. Thanks for your patience.",
      email: "",
    },
    footer: "Reply STOP to opt out",
    button: "None",
    variableMapping: { 1: "contact_name", 2: "event_site", 3: "event_date" },
    submittedNote: "Submitted 40 min ago · usually approved within an hour",
  },
  {
    id: "t3",
    code: "event_reminder_v2",
    name: "Event reminder",
    category: "Utility",
    language: "English (en)",
    channels: ["whatsapp", "email"],
    status: "draft",
    bodies: {
      whatsapp: "Hi {{1}}, maintenance at {{2}} is scheduled for {{3}}.",
      email: "",
    },
    subject: "",
    footer: "",
    button: "None",
    variableMapping: { 1: "contact_name", 2: "event_site", 3: "event_date" },
    editedNote: "Edited 2 days ago · 3 validator warnings",
  },
  {
    id: "t4",
    code: "quarterly_news_v4",
    name: "Quarterly newsletter",
    category: "Marketing",
    language: "English (en)",
    channels: ["email"],
    status: "draft",
    bodies: {
      whatsapp: "",
      email: "Hi {{1}}, here's what's new this quarter at {{2}}.",
    },
    subject: "Your quarterly update from Smart Networks",
    footer: "",
    button: "None",
    variableMapping: { 1: "contact_name", 2: "event_name" },
    editedNote: "Edited 5 days ago · 1 validator warning",
  },
  {
    id: "t5",
    code: "welcome_msg_v1",
    name: "Welcome message",
    category: "Utility",
    language: "English (en)",
    channels: ["whatsapp"],
    status: "approved",
    bodies: {
      whatsapp: "Hi {{1}}, welcome to {{2}}! We're glad to have you onboard.",
      email: "",
    },
    footer: "Reply STOP to opt out",
    button: "None",
    variableMapping: { 1: "contact_name", 2: "event_name" },
    editedNote: "Approved 3 weeks ago",
  },
  {
    id: "t6",
    code: "password_reset_v2",
    name: "Password reset",
    category: "Authentication",
    language: "English (en)",
    channels: ["whatsapp"],
    status: "approved",
    bodies: {
      whatsapp: "Hi {{1}}, your OTP is {{2}}. It expires in {{3}} minutes.",
      email: "",
    },
    footer: "",
    button: "None",
    variableMapping: { 1: "contact_name", 2: "custom_text", 3: "custom_text" },
    editedNote: "Approved 1 month ago",
  },
  {
    id: "t7",
    code: "monthly_digest_v1",
    name: "Monthly digest",
    category: "Marketing",
    language: "English (en)",
    channels: ["email"],
    status: "approved",
    bodies: {
      whatsapp: "",
      email: "Hi {{1}}, here's your monthly digest for {{2}}.",
    },
    subject: "Your monthly digest is here",
    footer: "",
    button: "None",
    variableMapping: { 1: "contact_name", 2: "event_date" },
    editedNote: "Approved 2 months ago",
  },
  {
    id: "t8",
    code: "order_confirmation_v1",
    name: "Order confirmation",
    category: "Utility",
    language: "English (en)",
    channels: ["email"],
    status: "approved",
    bodies: {
      whatsapp: "",
      email: "Hi {{1}}, your order {{2}} has been confirmed and will arrive by {{3}}.",
    },
    subject: "Your order is confirmed",
    footer: "",
    button: "None",
    variableMapping: { 1: "contact_name", 2: "custom_text", 3: "event_date" },
    editedNote: "Approved 2 months ago",
  },
];

export function humanizeCode(code) {
  const stripped = (code || "").trim().replace(/_v\d+$/i, "");
  return stripped
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function slugify(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function extractPlaceholders(body) {
  const matches = [...(body || "").matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1]);
  return [...new Set(matches)].sort((a, b) => Number(a) - Number(b));
}
