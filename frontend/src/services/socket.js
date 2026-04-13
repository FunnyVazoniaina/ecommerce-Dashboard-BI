import { io } from "socket.io-client";

const resolveSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
};

const socket = io(resolveSocketUrl(), {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

export default socket;
