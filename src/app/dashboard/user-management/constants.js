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

// Page role keys -> API role keys; Collaborator has no API role yet, so it isn't offered when inviting or editing
export const API_ROLES = { admin: "admin", finance: "financeOfficer", portfolio: "portfolioOfficer" };

// The API needs a country code; numbers typed without one are treated as Indian (+91) for now.
// "98765 43210" / "098765 43210" / "919876543210" / "+91 98765 43210" -> "+919876543210"; a bare "+91" counts as empty
export const toApiPhone = (value = "") => {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits || digits === "91") return "";
  if (raw.startsWith("+")) return `+${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+91${digits.replace(/^0+/, "")}`;
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
