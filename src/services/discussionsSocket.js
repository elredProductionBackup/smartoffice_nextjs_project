// services/discussionsSocket.js
// One Socket.IO connection to the /discussions namespace, shared by the whole app.
// The socket lives outside Redux because it is not serializable.
import { io } from "socket.io-client";
import api from "@/services/axios";

let socket = null;

// Same token the auth slice saves on login
export const getAccessToken = () => (typeof window === "undefined" ? null : localStorage.getItem("token"));

// NEXT_PUBLIC_SOCKET_URL wins; otherwise the origin of the REST base URL
const socketOrigin = () => {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  try {
    return new URL(api.defaults.baseURL, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
};

export const connectDiscussionsSocket = () => {
  if (socket) return { socket, created: false };
  socket = io(`${socketOrigin()}/discussions`, {
    path: "/socket.io",
    // A function, so every reconnect sends the current token, not the one from page load
    auth: (cb) => cb({ token: getAccessToken() }),
    transports: ["websocket", "polling"],
    reconnectionDelayMax: 10000,
  });
  return { socket, created: true };
};

export const getDiscussionsSocket = () => socket;

export const disconnectDiscussionsSocket = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};

// Emit and wait for the server's acknowledgement
export const emitWithAck = (event, payload, timeout = 8000) =>
  new Promise((resolve) => {
    if (!socket?.connected) return resolve({ success: false, message: "Not connected" });
    socket
      .timeout(timeout)
      .emit(event, payload, (err, res) =>
        resolve(err ? { success: false, message: "No answer from the server" } : res || { success: true })
      );
  });