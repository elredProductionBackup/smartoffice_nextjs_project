"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiCheckSquare, FiDollarSign, FiHome, FiSend, FiX } from "react-icons/fi";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { LuUserCog } from "react-icons/lu";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import dashboardLogo from "@/assets/logo/mage_dashboard.svg";
import memberLogo from "@/assets/logo/tdesign_member.svg";
import eventsLogo from "@/assets/logo/events.svg";
import actionableLogo from "@/assets/logo/actionable.svg";
import alliancesLogo from "@/assets/logo/la_handshake.svg";
import Header from "@/_components/Header";
import ProtectedRoute from "@/_components/ProtectedRoute";
import AssistantWidget from "@/_components/Assistant/AssistantWidget";
import useGlobalLoader from "@/store/useGlobalLoader";
import { selectIsFinanceOfficer, selectIsLearningOfficer } from "@/store/auth/authSlice";
import { ShareableUrlSync } from "@/hooks/useShareableUrl";

const ADMIN_MENU = [
  { name: "Dashboard", path: "/dashboard/profile", logo: dashboardLogo },
  { name: "Events", path: "/dashboard/events", logo: eventsLogo },
  { name: "Actionable", path: "/dashboard/actionable", logo: actionableLogo },
  { name: "Expense Records", path: "/dashboard/expense-records", icon: <FaFileInvoiceDollar className="text-[22px]" /> },
  { name: "Members", path: "/dashboard/members?tab=member", logo: memberLogo },
  { name: "Vendor/Resources", path: "/dashboard/alliances?tab=vendors", logo: alliancesLogo },
  { name: "Discussions", path: "/dashboard/discussions", icon: <HiOutlineChatBubbleLeftRight className="text-[24px]" /> },
  { name: "User Management", path: "/dashboard/user-management", icon: <LuUserCog className="text-[23px]" /> },
];

const USER_MENU = [
  { name: "Dashboard", path: "/dashboard/profile", logo: dashboardLogo },
  { name: "Actionable", path: "/dashboard/actionable", logo: actionableLogo },
  { name: "Expense Records", path: "/dashboard/expense-records", icon: <FaFileInvoiceDollar className="text-[22px]" /> },
  { name: "Discussions", path: "/dashboard/discussions", icon: <HiOutlineChatBubbleLeftRight className="text-[24px]" /> },
];

const LEARNING_OFFICER_MENU = [
  { name: "Dashboard", path: "/dashboard/portfolio-officer", logo: dashboardLogo },
  { name: "Actionable", path: "/dashboard/actionable", logo: actionableLogo },
  { name: "Events", path: "/dashboard/events", logo: eventsLogo },
  { name: "Vendor/Resources", path: "/dashboard/alliances?tab=vendors", logo: alliancesLogo },
  { name: "Discussions", path: "/dashboard/discussions", icon: <HiOutlineChatBubbleLeftRight className="text-[24px]" /> },
];

const FINANCE_MANAGER_MENU = [
  { name: "Home", path: "/dashboard/profile", icon: <FiHome className="text-[22px]" /> },
  { name: "Finance", path: "/dashboard/finance", icon: <FiDollarSign className="text-[22px]" /> },
  { name: "Actionable", path: "/dashboard/actionable", logo: actionableLogo },
  { name: "Approvals", path: "/dashboard/approvals", icon: <FiCheckSquare className="text-[22px]" /> },
  { name: "Discussions", path: "/dashboard/discussions", icon: <HiOutlineChatBubbleLeftRight className="text-[24px]" /> },
];

const SEND_BULK_ITEM = { name: "Send Bulk", path: "/dashboard/send-bulk", icon: <FiSend className="text-[22px]" /> };

const basePathOf = (url) => url.split("?")[0];

const isActive = (pathname, item) => {
  const basePath = basePathOf(item.path);
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
};

const MenuIcon = ({ item }) => (item.icon ? item.icon : <Image src={item.logo} alt="" aria-hidden="true" />);

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.userType?.toLowerCase() === "admin";
  const isFinanceManager = useSelector(selectIsFinanceOfficer);
  const isLearningOfficer = useSelector(selectIsLearningOfficer);
  const network = user?.networkClusterDetails;

  // Tooltip is fixed-positioned so the scrollable sidebar doesn't clip it
  const [tooltip, setTooltip] = useState(null);
  // Mobile navigation drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    useGlobalLoader.getState().hideLoader();
  }, []);

  // Close the drawer whenever the route changes (React-recommended "adjust state on prop change")
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
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

  const showSendBulk = !isFinanceManager && !isLearningOfficer;
  const menu = showSendBulk ? [...baseMenu, SEND_BULK_ITEM] : baseMenu;
  const sidebarCount = menu.length;

  return (
    <ProtectedRoute>
      <div className="h-dvh flex flex-col overflow-hidden">
        {/* Navbar */}
        <Header onMenuClick={() => setDrawerOpen(true)} />

        {/* Main */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Desktop / tablet icon rail */}
          <div className="hidden md:block p-5 flex-shrink-0">
            <nav
              aria-label="Main"
              className="w-21 bg-[#F2F7FF] h-full p-5 rounded-2xl overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              onScroll={hideTooltip}
            >
              {/* Spread items over the rail, but cap gaps at 40px so short menus don't over-stretch */}
              <ul
                className="flex flex-col justify-between gap-5"
                style={{ minHeight: `min(100%, ${sidebarCount * 44 + (sidebarCount - 1) * 40}px)` }}
              >
                {menu.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        aria-label={item.name}
                        aria-current={active ? "page" : undefined}
                        onMouseEnter={(e) => showTooltip(e, item.name)}
                        onMouseLeave={hideTooltip}
                        onClick={hideTooltip}
                        className={`h-11 w-11 flex items-center justify-center rounded-md transition ${
                          active ? "bg-[#D3E3FD] font-medium" : "hover:bg-blue-100"
                        }`}
                      >
                        <MenuIcon item={item} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
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

            <ul className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
              {menu.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      tabIndex={drawerOpen ? 0 : -1}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 h-12 px-3 rounded-xl text-[15px] transition-colors ${
                        active ? "bg-[#D3E3FD] text-[#0B57D0] font-semibold" : "text-[#333] hover:bg-[#F2F7FF]"
                      }`}
                    >
                      <span className="w-8 h-8 flex items-center justify-center shrink-0 [&_img]:w-6 [&_img]:h-6">
                        <MenuIcon item={item} />
                      </span>
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <AssistantWidget />

        {/* Keep the network cluster code in the address bar so any copied link opens the right cluster */}
        <Suspense fallback={null}>
          <ShareableUrlSync />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
