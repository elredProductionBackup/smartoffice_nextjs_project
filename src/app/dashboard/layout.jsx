"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiX } from "react-icons/fi";
import {
  BadgeCheck, CalendarDays, ChevronDown, ChevronUp, Handshake, House, LayoutDashboard, ListChecks, MessagesSquare,
  PanelLeftClose, PanelLeftOpen, ReceiptText, Send, UserCog, Users, Wallet,
} from "lucide-react";
import Header from "@/_components/Header";
import ProtectedRoute from "@/_components/ProtectedRoute";
import AssistantWidget from "@/_components/Assistant/AssistantWidget";
import NotificationsLive from "@/_components/Notifications/NotificationsLive";
import useGlobalLoader from "@/store/useGlobalLoader";
import { selectIsFinanceOfficer, selectIsLearningOfficer } from "@/store/auth/authSlice";
import { ShareableUrlSync } from "@/hooks/useShareableUrl";

// `group` sets the section heading; sections appear in the order their first item does
const NAV = {
  dashboard: { name: "Dashboard", path: "/dashboard/profile", icon: LayoutDashboard, group: "Overview" },
  events: { name: "Events", path: "/dashboard/events", icon: CalendarDays, group: "Operations" },
  actionable: { name: "Actionable", path: "/dashboard/actionable", icon: ListChecks, group: "Operations" },
  expenses: { name: "Expense Records", path: "/dashboard/expense-records", icon: ReceiptText, group: "Operations" },
  members: { name: "Members", path: "/dashboard/members?tab=member", icon: Users, group: "Community" },
  alliances: { name: "Vendor/Resources", path: "/dashboard/alliances?tab=vendors", icon: Handshake, group: "Community" },
  discussions: { name: "Discussions", path: "/dashboard/discussions", icon: MessagesSquare, group: "Community" },
  userManagement: { name: "User Management", path: "/dashboard/user-management", icon: UserCog, group: "Manage" },
};

const ADMIN_MENU = [NAV.dashboard, NAV.events, NAV.actionable, NAV.expenses, NAV.discussions];

const USER_MENU = [NAV.dashboard, NAV.actionable, NAV.expenses, NAV.discussions];

const LEARNING_OFFICER_MENU = [
  { ...NAV.dashboard, path: "/dashboard/portfolio-officer" },
  NAV.actionable, NAV.events, NAV.alliances, NAV.discussions,
];

const FINANCE_MANAGER_MENU = [
  { name: "Home", path: "/dashboard/profile", icon: House, group: "Overview" },
  { name: "Finance", path: "/dashboard/finance", icon: Wallet, group: "Finance" },
  { ...NAV.actionable, group: "Finance" },
  { name: "Approvals", path: "/dashboard/approvals", icon: BadgeCheck, group: "Finance" },
  NAV.discussions,
];

const SEND_BULK_ITEM = { name: "Send Bulk", path: "/dashboard/send-bulk", icon: Send, group: "Community" };

// Admin-only items tucked behind the "See more" toggle
const ADMIN_MORE_MENU = [NAV.members, NAV.alliances, NAV.userManagement, SEND_BULK_ITEM];

const COLLAPSED_KEY = "sidebarCollapsed";

const groupMenu = (items) => {
  const groups = new Map();
  items.forEach((item) => {
    if (!groups.has(item.group)) groups.set(item.group, []);
    groups.get(item.group).push(item);
  });
  return [...groups].map(([title, groupItems]) => ({ title, items: groupItems }));
};

const basePathOf = (url) => url.split("?")[0];

const isActive = (pathname, item) => {
  const basePath = basePathOf(item.path);
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
};


export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.userType?.toLowerCase() === "admin";
  const isFinanceManager = useSelector(selectIsFinanceOfficer);
  const isLearningOfficer = useSelector(selectIsLearningOfficer);
  const network = user?.networkClusterDetails;

  const moreItems = isAdmin && !isFinanceManager && !isLearningOfficer ? ADMIN_MORE_MENU : [];
  const moreActive = moreItems.some((item) => isActive(pathname, item));
  // null = not toggled yet, so the list starts open when the current page is one of the hidden items
  const [showMore, setShowMore] = useState(null);
  const moreOpen = showMore ?? moreActive;
  const toggleMore = () => {
    setTooltip(null);
    setShowMore(!moreOpen);
  };

  // Tooltip is fixed-positioned so the scrollable sidebar doesn't clip it
  const [tooltip, setTooltip] = useState(null);
  // Mobile navigation drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Desktop sidebar width preference. ProtectedRoute renders on the client only, so reading storage here is safe.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setTooltip(null);
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, prev ? "0" : "1");
      } catch {
        // Storage blocked: the preference just won't persist
      }
      return !prev;
    });
  };

  useEffect(() => {
    useGlobalLoader.getState().hideLoader();
  }, []);

  // Close the drawer whenever the route changes (React-recommended "adjust state on prop change")
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
    // Reveal the hidden items when navigating to one of them from elsewhere
    if (moreActive) setShowMore(true);
  }

  // Close drawer with Escape and stop the page behind it from scrolling
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const showTooltip = (e, name) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ name, top: rect.top + rect.height / 2, left: rect.right + 12 });
  };
  const hideTooltip = () => setTooltip(null);

  const baseMenu = isLearningOfficer
    ? LEARNING_OFFICER_MENU
    : isFinanceManager
      ? FINANCE_MANAGER_MENU
      : isAdmin
        ? ADMIN_MENU
        : USER_MENU;

  // Admins reach Send Bulk through "See more" instead
  const showSendBulk = !isFinanceManager && !isLearningOfficer && moreItems.length === 0;
  const menu = showSendBulk ? [...baseMenu, SEND_BULK_ITEM] : baseMenu;
  const menuGroups = groupMenu(menu);

  const moreLabel = moreOpen ? "See less" : "See more";
  const MoreIcon = moreOpen ? ChevronUp : ChevronDown;

  const renderDesktopItem = (item) => {
    const active = isActive(pathname, item);
    const Icon = item.icon;
    return (
      <li key={item.path}>
        <Link
          href={item.path}
          aria-label={collapsed ? item.name : undefined}
          aria-current={active ? "page" : undefined}
          onMouseEnter={collapsed ? (e) => showTooltip(e, item.name) : undefined}
          onMouseLeave={hideTooltip}
          onClick={hideTooltip}
          className={`flex items-center gap-3 h-11 rounded-xl text-[15px] whitespace-nowrap transition-colors ${
            collapsed ? "justify-center" : "px-3"
          } ${
            active
              ? "bg-[#E8F0FE] text-[#0B57D0] font-bold"
              : "text-[#3C4757] font-semibold hover:bg-[#F2F7FF] hover:text-[#0B57D0]"
          }`}
        >
          <Icon size={20} strokeWidth={active ? 2.25 : 1.9} className="shrink-0" />
          {!collapsed && <span className="truncate">{item.name}</span>}
        </Link>
      </li>
    );
  };

  const renderMobileItem = (item) => {
    const active = isActive(pathname, item);
    const Icon = item.icon;
    return (
      <li key={item.path}>
        <Link
          href={item.path}
          tabIndex={drawerOpen ? 0 : -1}
          aria-current={active ? "page" : undefined}
          onClick={() => setDrawerOpen(false)}
          className={`flex items-center gap-3 h-12 px-3 rounded-xl text-[15px] transition-colors ${
            active
              ? "bg-[#E8F0FE] text-[#0B57D0] font-bold"
              : "text-[#3C4757] font-semibold hover:bg-[#F2F7FF]"
          }`}
        >
          <Icon size={20} strokeWidth={active ? 2.25 : 1.9} className="shrink-0" />
          {item.name}
        </Link>
      </li>
    );
  };

  return (
    <ProtectedRoute>
      <div className="h-dvh flex flex-col overflow-hidden">
        {/* Navbar */}
        <Header onMenuClick={() => setDrawerOpen(true)} />

        {/* Main */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Desktop / tablet sidebar: labelled sections, collapsible to an icon rail */}
          <div className="hidden md:block p-5 pr-0 flex-shrink-0">
            <nav
              aria-label="Main"
              className={`h-full flex flex-col bg-white border border-[#E5ECF6] rounded-[20px] shadow-[0px_1px_4px_0px_#0000000d] transition-[width] duration-200 ${
                collapsed ? "w-[76px]" : "w-[248px]"
              }`}
            >
              <div
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onScroll={hideTooltip}
              >
                {menuGroups.map((group, i) => (
                  <div key={group.title} className={i > 0 ? "mt-4" : ""}>
                    {collapsed ? (
                      i > 0 && <div className="h-px bg-[#EDF1F6] mx-2 mb-4" />
                    ) : (
                      <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7686] whitespace-nowrap">
                        {group.title}
                      </p>
                    )}
                    <ul className="flex flex-col gap-1">{group.items.map(renderDesktopItem)}</ul>
                  </div>
                ))}

                {moreItems.length > 0 && (
                  <>
                    {moreOpen && <ul className="flex flex-col gap-1 mt-1">{moreItems.map(renderDesktopItem)}</ul>}
                    <button
                      type="button"
                      onClick={toggleMore}
                      aria-expanded={moreOpen}
                      aria-label={collapsed ? moreLabel : undefined}
                      onMouseEnter={collapsed ? (e) => showTooltip(e, moreLabel) : undefined}
                      onMouseLeave={hideTooltip}
                      className={`mt-1 w-full flex items-center gap-3 h-11 rounded-xl text-[14px] font-semibold text-[#6B7686] hover:bg-[#F2F7FF] hover:text-[#0B57D0] transition-colors cursor-pointer whitespace-nowrap ${
                        collapsed ? "justify-center" : "px-3"
                      }`}
                    >
                      <MoreIcon size={20} strokeWidth={1.9} className="shrink-0" />
                      {!collapsed && moreLabel}
                    </button>
                  </>
                )}
              </div>

              <div className="shrink-0 border-t border-[#EDF1F6] p-3">
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  onMouseEnter={collapsed ? (e) => showTooltip(e, "Expand sidebar") : undefined}
                  onMouseLeave={hideTooltip}
                  className={`w-full flex items-center gap-3 h-11 rounded-xl text-[14px] font-semibold text-[#6B7686] hover:bg-[#F2F7FF] hover:text-[#0B57D0] transition-colors cursor-pointer whitespace-nowrap ${
                    collapsed ? "justify-center" : "px-3"
                  }`}
                >
                  {collapsed ? <PanelLeftOpen size={20} strokeWidth={1.9} /> : <PanelLeftClose size={20} strokeWidth={1.9} />}
                  {!collapsed && "Collapse"}
                </button>
              </div>
            </nav>

            {tooltip && (
              <span
                className="font-heading pointer-events-none fixed -translate-y-1/2 z-50
                whitespace-nowrap rounded-lg bg-[#F2F7FF] border border-[#D3E3FD] px-3 py-1.5 text-[13px] font-medium text-[#333333] shadow-md"
                style={{ top: tooltip.top, left: tooltip.left }}
              >
                {tooltip.name}
                <span className="absolute right-full top-1/2 -translate-y-1/2 h-2.5 w-2.5 rotate-45 bg-[#F2F7FF] border-l border-b border-[#D3E3FD] -mr-[5px]" />
              </span>
            )}
          </div>

          {/* Nested Page */}
          <main className="flex-1 min-w-0 flex flex-col mx-4 md:mx-5 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Mobile navigation drawer */}
        <div
          className={`md:hidden fixed inset-0 z-[90] transition-opacity duration-200 ${
            drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={!drawerOpen}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <nav
            aria-label="Main"
            className={`absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white shadow-xl flex flex-col transition-transform duration-200 ${
              drawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between h-15 px-4 border-b border-[#E5ECF6] shrink-0">
              <Image src="/logo/smart-networks.svg" alt="Smart Networks" width={124} height={32} className="object-contain" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="h-10 w-10 -mr-2 flex items-center justify-center rounded-full text-[#333] hover:bg-[#F2F7FF] cursor-pointer"
              >
                <FiX className="text-[22px]" />
              </button>
            </div>

            {network?.name && (
              <div className="mx-4 mt-4 flex items-center gap-2.5 rounded-xl bg-[#F2F7FF] border border-[#D5E2F6] px-3 py-2">
                {network.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={network.logo} alt="" className="w-7 h-7 rounded-full object-cover bg-white shrink-0" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-[#0B57D0] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {network.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="font-heading text-[14px] font-medium text-[#333] truncate">{network.name}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-4">
              {menuGroups.map((group, i) => (
                <div key={group.title} className={i > 0 ? "mt-4" : ""}>
                  <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7686]">
                    {group.title}
                  </p>
                  <ul className="flex flex-col gap-1">{group.items.map(renderMobileItem)}</ul>
                </div>
              ))}

              {moreItems.length > 0 && (
                <>
                  {moreOpen && <ul className="flex flex-col gap-1 mt-1">{moreItems.map(renderMobileItem)}</ul>}
                  <button
                    type="button"
                    onClick={toggleMore}
                    tabIndex={drawerOpen ? 0 : -1}
                    aria-expanded={moreOpen}
                    className="mt-1 w-full flex items-center gap-3 h-12 px-3 rounded-xl text-[15px] font-semibold text-[#6B7686] hover:bg-[#F2F7FF] transition-colors cursor-pointer"
                  >
                    <MoreIcon size={20} strokeWidth={1.9} className="shrink-0" />
                    {moreLabel}
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>

        <AssistantWidget />

        {/* Live event request notifications on every dashboard page */}
        <NotificationsLive />

        {/* Keep the network cluster code in the address bar so any copied link opens the right cluster */}
        <Suspense fallback={null}>
          <ShareableUrlSync />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
