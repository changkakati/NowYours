
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
).replace(/\/$/, "");

const WS_URL = API_URL.replace(/^http/, "ws") + "/chat/ws";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_access_token");
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(
    value.includes?.("Z") || value.includes?.("+")
      ? value
      : value.replace(" ", "T") + "Z"
  );

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatNotifications() {
  const router = useRouter();

  const [token, setToken] = useState(null);
  const [unreadChats, setUnreadChats] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const socketRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setToken(getToken());
  }, []);

  const refreshData = useCallback(async (authToken) => {
    if (!authToken) return;

    try {
      const [notificationResponse, chatResponse] = await Promise.all([
        fetch(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: "no-store",
        }),
        fetch(`${API_URL}/chat/conversations`, {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: "no-store",
        }),
      ]);

      if (notificationResponse.status === 401 || chatResponse.status === 401) {
        return;
      }

      if (notificationResponse.ok) {
        const data = await notificationResponse.json();

        setNotifications(data.notifications || []);
        setUnreadNotifications(Number(data.unreadCount || 0));
      }

      if (chatResponse.ok) {
        const data = await chatResponse.json();
        const chats = data.conversations || [];

        setUnreadChats(
          chats.reduce(
            (total, chat) => total + Number(chat.unread_count || 0),
            0
          )
        );
      }
    } catch (error) {
      console.error("Could not refresh chat notifications:", error);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    refreshData(token);

    // Polling keeps badges current even when the socket disconnects.
    const interval = setInterval(() => refreshData(token), 20000);

    return () => clearInterval(interval);
  }, [token, refreshData]);

  useEffect(() => {
    if (!token) return;

    let disposed = false;
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "auth", token }));
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (
          payload.type === "notification:new" ||
          payload.type === "message:new" ||
          payload.type === "conversation:read"
        ) {
          refreshData(token);
        }
      } catch {
        // Ignore malformed socket messages.
      }
    };

    socket.onclose = () => {
      if (!disposed) socketRef.current = null;
    };

    socket.onerror = () => {
      // Polling continues if the WebSocket is unavailable.
    };

    return () => {
      disposed = true;
      socket.close();
      socketRef.current = null;
    };
  }, [token, refreshData]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function openNotification(notification) {
    if (!token) return;

    if (!notification.read_at) {
      try {
        const response = await fetch(
          `${API_URL}/notifications/${encodeURIComponent(notification.id)}/read`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error("Could not mark notification as read.");
        }

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, read_at: new Date().toISOString() }
              : item
          )
        );

        setUnreadNotifications((count) => Math.max(0, count - 1));
      } catch (error) {
        console.error(error);
      }
    }

    setOpen(false);

    if (notification.link) {
      router.push(notification.link);
    } else {
      router.push("/chat");
    }
  }

  async function markAllRead() {
    if (!token || unreadNotifications === 0) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Could not mark notifications as read.");
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read_at: item.read_at || new Date().toISOString(),
        }))
      );

      setUnreadNotifications(0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (!token) return null;

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/chat"
        className="relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
        aria-label={`Chats${unreadChats ? `, ${unreadChats} unread` : ""}`}
      >
        <svg
          viewBox="0 0 24 24"
          width="19"
          height="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8z" />
        </svg>
        <span>Chats</span>

        {unreadChats > 0 && (
          <span className="min-w-5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
            {unreadChats > 99 ? "99+" : unreadChats}
          </span>
        )}
      </Link>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100"
          aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ""}`}
          aria-expanded={open}
        >
          <svg
            viewBox="0 0 24 24"
            width="21"
            height="21"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>

          {unreadNotifications > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-12 z-[100] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Notifications
                </h2>
                <p className="text-xs text-gray-500">
                  {unreadNotifications} unread
                </p>
              </div>

              <button
                type="button"
                disabled={loading || unreadNotifications === 0}
                onClick={markAllRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
              >
                Mark all read
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="text-2xl">♧</div>
                  <p className="mt-2 text-sm font-medium text-gray-800">
                    You're all caught up
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    New message alerts will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => openNotification(notification)}
                    className={`flex w-full gap-3 border-b border-gray-100 px-4 py-4 text-left transition hover:bg-gray-50 ${
                      notification.read_at ? "bg-white" : "bg-indigo-50/60"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8z" />
                      </svg>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </span>
                        {!notification.read_at && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                        )}
                      </span>

                      <span className="mt-1 block break-words text-sm text-gray-600">
                        {notification.actor_name
                          ? `${notification.actor_name}: `
                          : ""}
                        {notification.body}
                      </span>

                      <span className="mt-2 block text-[11px] text-gray-400">
                        {formatTime(notification.created_at)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 p-3">
              <Link
                href="/chat"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Open chats
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
