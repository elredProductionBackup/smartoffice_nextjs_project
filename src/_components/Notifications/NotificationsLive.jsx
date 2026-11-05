"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectDiscussionsSocket } from "@/services/discussionsSocket";
import { useNotificationsStore } from "@/store/useNotificationsStore";
import { addToast } from "@/store/toastSlice";

const parse = (p) => {
  if (typeof p !== "string") return p || {};
  try {
    return JSON.parse(p);
  } catch {
    return {};
  }
};

// Mounted once in the dashboard layout. Opens the shared /discussions socket (each user is put in
// their own room by the server, nothing to join) and turns event request pushes into the bell
// badge, the dropdown list and a toast — on every page, not just Discussions.
export default function NotificationsLive() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (!token) return;
    const store = useNotificationsStore.getState();
    store.fetch(); // list (and unread count if the API sends it) before the first push

    const { socket } = connectDiscussionsSocket();
    const onNotification = (payload) => {
      const n = parse(payload);
      useNotificationsStore.getState().received(n);
      dispatch(addToast({ message: { title: n.title || "New notification", descrip: n.message || "" }, type: "success" }));
    };
    // Sent on connect/reconnect, after each new notification and after mark-as-read (in any tab)
    const onUnreadCount = (payload) => useNotificationsStore.getState().setUnreadCount(parse(payload).unreadCount);

    socket.on("eventRequest:notification", onNotification);
    socket.on("eventRequest:unreadCount", onUnreadCount);
    return () => {
      socket.off("eventRequest:notification", onNotification);
      socket.off("eventRequest:unreadCount", onUnreadCount);
    };
  }, [token, dispatch]);

  return null;
}
