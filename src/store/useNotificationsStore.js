import { create } from "zustand";
import { getNotifications, markNotificationsRead } from "@/services/eventRequest.service";

const PAGE_SIZE = 20;

// The REST response shape isn't documented; the socket payload is, so rows are read with those names
const pickList = (result) =>
  Array.isArray(result) ? result : result?.list || result?.notifications || result?.data || result?.rows || [];

export const toNotification = (n) => ({
  id: n.notificationId || n._id,
  type: n.type || "",
  title: n.title || "Notification",
  message: n.message || "",
  eventRequestId: n.eventRequestId || "",
  eventId: n.eventId || "",
  createdAt: n.createdAt,
  isRead: !!n.isRead,
});

// Bell badge and dropdown list for event request notifications.
// The unread count is owned by the server: it pushes eventRequest:unreadCount on connect,
// after each new notification and after mark-as-read, and the badge just shows that number.
export const useNotificationsStore = create((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,
  loadingMore: false,
  loaded: false,
  error: "",
  hasMore: false,
  // Bumped on every live notification, so open pages (Event Requests) can refresh
  version: 0,

  setUnreadCount: (count) => set({ unreadCount: Math.max(0, Number(count) || 0) }),

  // Live push: put it on top of the list (if loaded) and take the count that came with it
  received: (payload) => {
    const n = toNotification(payload);
    set((s) => ({
      items: s.loaded && !s.items.some((i) => i.id === n.id) ? [n, ...s.items] : s.items,
      unreadCount: payload.unreadCount !== undefined ? Math.max(0, Number(payload.unreadCount) || 0) : s.unreadCount + 1,
      version: s.version + 1,
    }));
  },

  fetch: async ({ more = false } = {}) => {
    const { items, loading, loadingMore } = get();
    if (loading || loadingMore) return;
    set(more ? { loadingMore: true } : { loading: true, error: "" });
    try {
      const start = more ? items.length : 0;
      const res = await getNotifications({ start, offset: PAGE_SIZE });
      if (!res?.data?.success) throw new Error(res?.data?.message || "Couldn't load notifications");
      const result = res.data.result;
      const rows = pickList(result).map(toNotification);
      const total = result?.totalCount ?? res.data.totalCount;
      const unread = result?.unreadCount ?? res.data.unreadCount;
      set((s) => ({
        items: more ? [...s.items, ...rows.filter((r) => !s.items.some((i) => i.id === r.id))] : rows,
        hasMore: total !== undefined ? start + rows.length < total : rows.length === PAGE_SIZE,
        loaded: true,
        ...(unread !== undefined && { unreadCount: Math.max(0, Number(unread) || 0) }),
      }));
    } catch (err) {
      console.error("Notifications load error:", err);
      if (!more) set({ error: err.message || "Couldn't load notifications" });
    } finally {
      set({ loading: false, loadingMore: false });
    }
  },

  // Optimistic; the server then pushes the real count over the socket
  markRead: async (id) => {
    const target = get().items.find((i) => i.id === id);
    if (!target || target.isRead) return;
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, isRead: true } : i)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
    try {
      const res = await markNotificationsRead({ notificationId: id });
      if (!res?.data?.success) throw new Error(res?.data?.message);
    } catch (err) {
      console.error("Mark notification read error:", err);
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, isRead: false } : i)),
        unreadCount: s.unreadCount + 1,
      }));
    }
  },

  markAllRead: async () => {
    const before = get();
    set((s) => ({ items: s.items.map((i) => ({ ...i, isRead: true })), unreadCount: 0 }));
    try {
      const res = await markNotificationsRead({ markAll: true });
      if (!res?.data?.success) throw new Error(res?.data?.message);
    } catch (err) {
      console.error("Mark all read error:", err);
      set({ items: before.items, unreadCount: before.unreadCount });
    }
  },

  reset: () => set({ items: [], unreadCount: 0, loaded: false, hasMore: false, error: "", version: 0 }),
}));
