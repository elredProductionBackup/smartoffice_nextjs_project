"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import bell from "@/assets/logo/bell.svg";
import { FiCheckCircle, FiEdit3, FiInbox, FiRefreshCw, FiSend, FiTrash2, FiX, FiXCircle } from "react-icons/fi";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { useNotificationsStore } from "@/store/useNotificationsStore";

// Icon and colour per notification type (types from the event request API)
const TYPE_STYLE = {
  eventRequestCreated: { Icon: FiSend, className: "bg-[#FEF7E0] text-[#B06000]" },
  eventRequestUpdated: { Icon: FiEdit3, className: "bg-[#F2F7FF] text-[#0B57D0]" },
  eventRequestChangesDone: { Icon: FiRefreshCw, className: "bg-[#F3E8FF] text-[#7E22CE]" },
  eventRequestDeleted: { Icon: FiTrash2, className: "bg-[#F1F5F9] text-[#64748B]" },
  eventRequestApproved: { Icon: FiCheckCircle, className: "bg-[#E6F4EA] text-[#137333]" },
  eventRequestRejected: { Icon: FiXCircle, className: "bg-[#FEE2E2] text-[#B91C1C]" },
  eventRequestChangesRequested: { Icon: FiEdit3, className: "bg-[#E8EEFE] text-[#3B63E8]" },
};
const FALLBACK_STYLE = { Icon: FiInbox, className: "bg-[#F2F7FF] text-[#0B57D0]" };

const timeAgo = (value) => {
  if (!value) return "";
  const mins = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// Where a notification leads: the live event once approved, otherwise the request itself
const targetOf = (n) => {
  if (n.type === "eventRequestApproved" && n.eventId) return `/dashboard/events/${n.eventId}`;
  if (n.type === "eventRequestDeleted" || !n.eventRequestId) return "/dashboard/events/requests";
  return `/dashboard/events/requests?id=${n.eventRequestId}`;
};

export default function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(ref, close);

  const { items, unreadCount, loading, loadingMore, loaded, error, hasMore, fetch, markRead, markAllRead } =
    useNotificationsStore();

  // Refresh each time it opens, so anything missed while offline shows up
  const toggle = () => {
    if (!open) fetch();
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const openNotification = (n) => {
    markRead(n.id);
    close();
    router.push(targetOf(n));
  };

  const badge = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative h-[36px] w-[36px] md:h-[40px] md:w-[40px] rounded-full bg-white border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
          open ? "border-[#0B57D0]" : "border-[#D5E2F6] hover:border-[#0B57D0]"
        }`}
      >
        <Image src={bell} alt="" height={22} width={22} className="w-5 h-5 md:w-[22px] md:h-[22px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E40000] text-white text-[11px] font-bold leading-[18px] text-center ring-2 ring-[#F2F7FF]">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed left-3 right-3 top-[64px] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] z-50 sm:w-[380px] max-h-[min(560px,calc(100dvh-90px))] flex flex-col bg-white rounded-[16px] border border-[#EAEEF2] shadow-[0px_4px_16px_0px_#0000001a] overflow-hidden font-nunito"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#EAEEF2] shrink-0">
            <p className="text-[16px] font-bold text-[#1E293B]">
              Notifications
              {unreadCount > 0 && <span className="ml-1.5 text-[13px] font-semibold text-[#64748B]">{unreadCount} unread</span>}
            </p>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="px-2 py-1 rounded-md text-[13px] font-bold text-[#0B57D0] hover:bg-[#F2F7FF] cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <FiX />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading && !loaded ? (
              <div className="py-12 flex justify-center">
                <div className="w-7 h-7 border-[3px] border-[#0B57D0] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error && items.length === 0 ? (
              <div className="py-10 px-4 text-center text-[14px] text-[#64748B]">
                {error}.{" "}
                <button type="button" onClick={() => fetch()} className="font-bold text-[#0B57D0] hover:underline cursor-pointer">
                  Try again
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center gap-2 text-center">
                <span className="w-12 h-12 rounded-full bg-[#F2F7FF] text-[#0B57D0] grid place-items-center">
                  <FiInbox className="text-[22px]" />
                </span>
                <p className="text-[15px] font-semibold text-[#334155]">You&apos;re all caught up</p>
                <p className="text-[13px] text-[#94A3B8]">Updates on event requests will show up here.</p>
              </div>
            ) : (
              <ul>
                {items.map((n) => {
                  const { Icon, className } = TYPE_STYLE[n.type] || FALLBACK_STYLE;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openNotification(n)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-[#F1F5F9] cursor-pointer transition-colors ${
                          n.isRead ? "bg-white hover:bg-[#FAFAFA]" : "bg-[#F5F9FF] hover:bg-[#EEF4FF]"
                        }`}
                      >
                        <span className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${className}`}>
                          <Icon className="text-[16px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[14px] text-[#1E293B] ${n.isRead ? "font-semibold" : "font-bold"}`}>
                            {n.title}
                          </span>
                          {n.message && (
                            <span className="block text-[13px] text-[#475569] break-words line-clamp-3">{n.message}</span>
                          )}
                          <span className="block mt-0.5 text-[12px] text-[#94A3B8]">{timeAgo(n.createdAt)}</span>
                        </span>
                        {!n.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#0B57D0] shrink-0" aria-label="Unread" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {hasMore && items.length > 0 && (
              <div className="p-3 flex justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => fetch({ more: true })}
                  className="px-4 py-1.5 rounded-full text-[13px] font-bold text-[#0B57D0] bg-[#F2F7FF] cursor-pointer disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
