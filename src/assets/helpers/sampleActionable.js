export const actionableData=[
  {
    id: 1,
    text: "Today meeting with channel partner at 5:00 PM ",
    date: "2025-12-30",
    completed: false,
    avatars:[{},{},{},{},{}],
    completedAt: null,
    addedBy: "Meezan",
    time: "10:30 PM",
    subtasks: [
      {
        id: "1-1",
        text: "Prepare agenda Prepare agenda Prepare agenda Prepare agenda Prepare agenda Prepare agenda Prepare agenda Prepare agenda ",
        completed: false,
        addedBy: "Meezan",
        createdAt: "2025-12-23T10:35:00",
      },
      {
        id: "1-2",
        text: "Send calendar invite",
        completed: true,
        addedBy: "Ali",
        createdAt: "2025-12-23T10:40:00",
      },
      {
        id: "1-3",
        text: "Send calendar invite",
        completed: true,
        addedBy: "Ali",
        createdAt: "2025-12-23T10:40:00",
      },
    ],
    notes: "",
    collaborators: [],
    comments: [
      {
        id: 1,
        text: "This is a comment",
        author: "Meezan",
        createdAt: "2025-12-29T10:30:00Z",
      }
      ,
      { id: 2,
        author: "Tashaf", 
        text: "Need to follow up tomorrow" ,
        createdAt: "2025-12-29T10:30:00Z",
      }
    ]
  },
  {
    id: 2,
    text: "Your stay is confirmed at Hotel Gateway Grandeur",
    date: "2025-12-19",
    completed: false,
    avatars:[{},{}],
    completedAt: null,
        notes: "",
    collaborators: [],
    comments: [],
  },
  {
    id: 3,
    text: "Meeting with Jason Statham",
    date: "2025-12-19",
    completed: true,
    completedAt: new Date(),
        notes: "",
    collaborators: [],
    comments: [],
  },
      {
    id: 4,
    text: "Old follow-up call",
    date: "2025-12-15",
    completed: true,
    completedAt: new Date(),
        notes: "",
    collaborators: [],
    comments: [],
  },
  ]

  export const DUMMY_COLLABORATORS = [
  { id: 1, name: "Ayaan Khan" },
  { id: 2, name: "Sarah Ali" },
  { id: 3, name: "John Doe" },
  { id: 4, name: "Ritika Sharma" },
];
