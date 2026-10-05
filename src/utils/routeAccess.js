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
