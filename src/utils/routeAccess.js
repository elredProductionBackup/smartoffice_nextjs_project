export const ADMIN_ONLY_ROUTES = [
  "/dashboard/checklist",
  "/dashboard/members",
  "/dashboard/events",
];

// Finance managers can only open these pages; everything else is blocked.
const FINANCE_MANAGER_ROUTES = [
  "/dashboard/profile",
  "/dashboard/my-profile",
  "/dashboard/finance",
  "/dashboard/finance-budget",
  "/dashboard/actionable",
  "/dashboard/approvals",
];

// Event pages that stay blocked even though event details are allowed.
const FINANCE_MANAGER_BLOCKED_EVENT_PAGES = ["create", "budget-checklist"];

export const FINANCE_MANAGER_HOME = "/dashboard/profile";

export const isFinanceManagerRouteAllowed = (pathname = "") => {
  if (pathname === "/dashboard") return true;

  if (
    FINANCE_MANAGER_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    return true;
  }

  // Event details (/dashboard/events/:id), reached from Finance Budget
  const eventMatch = pathname.match(/^\/dashboard\/events\/([^/]+)/);
  return !!eventMatch && !FINANCE_MANAGER_BLOCKED_EVENT_PAGES.includes(eventMatch[1]);
};

// Learning officers can only open these pages; everything else is blocked.
const LEARNING_OFFICER_ROUTES = [
  "/dashboard/portfolio-officer",
  "/dashboard/my-profile",
  "/dashboard/actionable",
  "/dashboard/events",
];

export const LEARNING_OFFICER_HOME = "/dashboard/portfolio-officer";

export const isLearningOfficerRouteAllowed = (pathname = "") =>
  pathname === "/dashboard" ||
  LEARNING_OFFICER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

// Admins can open everything except these finance / portfolio officer pages.
const ADMIN_BLOCKED_ROUTES = [
  "/dashboard/finance",
  "/dashboard/finance-budget",
  "/dashboard/portfolio-officer",
];

export const ADMIN_HOME = "/dashboard/profile";

export const isAdminRouteAllowed = (pathname = "") =>
  !ADMIN_BLOCKED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
