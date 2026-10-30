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
    <div className="flex items-center gap-1">
      <Link
        href="/chat"
        className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        aria-label={`Chats${unreadChats ? `, ${unreadChats} unread` : ""}`}
      >
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
        <span className="hidden sm:inline">Chats</span>

        {unreadChats > 0 && (
          <span className="min-w-[18px] rounded-md bg-slate-900 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
            {unreadChats > 99 ? "99+" : unreadChats}
          </span>
        )}
      </Link>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ""}`}
          aria-expanded={open}
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
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>

          {unreadNotifications > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold leading-none text-white">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 z-[100] w-[min(360px,calc(100vw-16px))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Notifications
                </h2>
                <p className="text-xs text-slate-500">
                  {unreadNotifications} unread
                </p>
              </div>

              <button
                type="button"
                disabled={loading || unreadNotifications === 0}
                onClick={markAllRead}
                className="text-xs font-medium text-slate-900 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:rounded"
              >
                Mark all read
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
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
                      className="text-slate-400"
                    >
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                      <path d="M10 21h4" />
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-900">
                    You&apos;re all caught up
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    New message alerts will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => openNotification(notification)}
                    className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition last:border-0 hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-50 ${
                      notification.read_at ? "bg-white" : "bg-slate-50/80"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
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
                        <span className="text-sm font-medium text-slate-900">
                          {notification.title}
                        </span>
                        {!notification.read_at && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                        )}
                      </span>

                      <span className="mt-0.5 block break-words text-sm text-slate-600">
                        {notification.actor_name
                          ? `${notification.actor_name}: `
                          : ""}
                        {notification.body}
                      </span>

                      <span className="mt-1.5 block text-[11px] text-slate-400">
                        {formatTime(notification.created_at)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 p-2">
              <Link
                href="/chat"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
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