export const EVENTS_DETAILS = [
  { id: "attendees", label: "Attendees",value: "attendees" },
  { id: "memberMedia", label: "Member Media",value:"memberMedia" },
  { id: "documents", label: "My document",value:"documents" },
  { id: "logistics", label: "Logistics",value:"logistics" },
  { id: "checklist", label: "Event checklist",value:"checklist" },
];

export const UPCOMING_EVENTS = [
  {
    month: "December, 2025",
    items: [
      {
        id: "figma-config",
        name: "Figma Config",
        dateRange: "Mon 18 Feb 2026 - Fri 22 Aug 2026",
        time: "12:00 - 1:00 PM",
        shortDate: "22nd - 24th",
        date: "22nd - 24th",
        location: "Hyderabad",
        attendees: 102,
        image: "/image/figma-config.webp",
        speaker: {
          name: "Ellen Dissinger",
          title: "UX Research Lead",
          avatar: "/images/speaker1.png",
          bio: "Meet our speaker — a thought leader bringing fresh insights and real-world clarity.",
        },
        registrationOpen: true,
        tasks: {
          hard: { completed: 5, total: 8 },
          medium: { completed: 2, total: 10 },
          easy: { completed: 2, total: 3 },
        },
      },
      {
        id: "webflow-advanced-workshop",
        date: "26th",
        name: "Webflow Advanced Workshop",
        attendees: 75,
        location: "Mumbai",
        image: "/images/event2.png",
        tasks: {
          easy: { completed: 1, total: 5 },
        },
      },
    ],
  },
  {
    month: "January, 2026",
    items: [
      {
        id: "ux-research",
        date: "2nd - 4th",
        name: "UX Research & Testing Summit",
        attendees: 120,
        location: "Bangalore",
        image: "/images/event8.png",
        tasks: {
          hard: { completed: 1, total: 4 },
          medium: { completed: 3, total: 6 },
          easy: { completed: 5, total: 10 },
        },
      },
      {
        id: "design-systems",
        date: "10th",
        name: "Design Systems Workshop",
        attendees: 68,
        location: "Pune",
        image: "/images/event9.png",
        tasks: {
          medium: { completed: 4, total: 8 },
          easy: { completed: 6, total: 6 },
        },
      },
      {
        id: "product-thinking",
        date: "18th - 19th",
        name: "Product Thinking Bootcamp",
        attendees: 150,
        location: "Delhi",
        image: "/images/event10.png",
        tasks: {
          hard: { completed: 2, total: 5 },
        },
      },
      {
        id: "no-code-tools",
        date: "27th",
        name: "No-Code Tools Meetup",
        attendees: 54,
        location: "Hyderabad",
        image: "/images/event11.png",
        tasks: {
          easy: { completed: 0, total: 4 },
        },
      },
    ],
  },
];

export const DRAFT_EVENTS = [
  {
    month: "January, 2026",
    items: [
      {
        id: "draft",
        date: "10th",
        name: "Draft Event",
        attendees: 0,
        location: "Mumbai",
      },
    ],
  },
];

export const PAST_EVENTS = [
  {
    month: "November, 2025",
    items: [
      {
        id: "ux-design-bootcamp",
        date: "5th - 6th",
        name: "UX Design Bootcamp",
        attendees: 180,
        location: "Bangalore",
        image: "/images/event-past-1.png",
        tasks: {
          hard: { completed: 8, total: 8 },
          medium: { completed: 12, total: 12 },
          easy: { completed: 20, total: 20 },
        },
      },
      {
        id: "product-strategy",
        date: "18th",
        name: "Product Strategy Workshop",
        attendees: 96,
        location: "Mumbai",
        image: "/images/event-past-2.png",
        tasks: {
          medium: { completed: 10, total: 10 },
          easy: { completed: 14, total: 14 },
        },
      },
    ],
  },
  {
    month: "December, 2025",
    items: [
      {
        id: "design-systems-meetup",
        date: "3rd",
        name: "Design Systems Meetup",
        attendees: 65,
        location: "Hyderabad",
        image: "/images/event-past-3.png",
        tasks: {
          hard: { completed: 6, total: 6 },
        },
      },
    ],
  },
];

