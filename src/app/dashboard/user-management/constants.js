export const ROLES = {
  admin: {
    label: "Admin",
    initials: "A",
    dot: "bg-[#1D72E8]",
    plural: "Admins",
    description: "Manages people, topics and every approval",
    className: "bg-[#E3EDFD] text-[#0B57D0]",
  },
  finance: {
    label: "Finance Officer",
    initials: "FO",
    dot: "bg-[#C026D3]",
    plural: "Finance Officers",
    description: "Approves payments and reviews spend",
    className: "bg-[#FBE8F7] text-[#A21CAF]",
  },
  portfolio: {
    label: "Portfolio Officer",
    initials: "PO",
    dot: "bg-[#16A34A]",
    plural: "Portfolio Officers",
    description: "Runs events and raises approval requests",
    className: "bg-[#DCF5E7] text-[#15803D]",
  },
  collaborator: {
    label: "Collaborator",
    initials: "C",
    dot: "bg-[#F59E0B]",
    plural: "Collaborators",
    description: "Joins discussions and helps on topics they're added to",
    className: "bg-[#FEF3C7] text-[#B45309]",
  },
};

export const PORTFOLIOS = [
  "Learning",
  "Forum",
  "Spouse Partner Forum",
  "Engagement",
  "Membership",
  "Spouse/Partner",
  "Retreat",
  "Governance",
  "Administration",
];

// Short codes for the role circles
export const PORTFOLIO_INITIALS = {
  Learning: "L",
  Forum: "F",
  "Spouse Partner Forum": "SPF",
  Engagement: "E",
  Membership: "M",
  "Spouse/Partner": "SP",
  Retreat: "R",
  Governance: "G",
  Administration: "Ad",
};

// Shown as a small dot + muted label under the user's name
export const STATUS = {
  active: { label: "Active", dot: "bg-[#22C55E]" },
  invited: { label: "Invite pending", dot: "bg-[#F59E0B]" },
  deactivated: { label: "Deactivated", dot: "bg-[#CBD5E1]" },
};

export const AVATAR_COLORS = ["#1D72E8", "#EA580C", "#4F46E5", "#0E8FA8", "#DB2777", "#16A34A", "#7C3AED", "#0D9488", "#B45309", "#BE123C"];
