
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
).replace(/\/$/, "");

const WS_URL = API_URL.replace(/^http/, "ws") + "/chat/ws";

function getToken() {
    if (typeof window === "undefined") return null;

    return localStorage.getItem("auth_access_token");
}

async function apiRequest(path, token, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

function formatTime(value) {
    if (!value) return "";

    const date = new Date(
        value.includes?.("Z") || value.includes?.("+")
            ? value
            : value.replace(" ", "T") + "Z"
    );

    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();
    const sameDay = date.toDateString() === today.toDateString();

    return sameDay
        ? date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })
        : date.toLocaleDateString([], {
            day: "numeric",
            month: "short",
        });
}

export default function ChatPage() {
    const [token, setToken] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [connection, setConnection] = useState("connecting");

    const socketRef = useRef(null);
    const activeIdRef = useRef(null);
    const bottomRef = useRef(null);
    const messagesRef = useRef([]);
    const pendingReadRef = useRef(null);

    useEffect(() => {
        activeIdRef.current = activeId;
    }, [activeId]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const loadConversations = useCallback(async (authToken) => {
        const data = await apiRequest("/chat/conversations", authToken);
        const items = Array.isArray(data)
            ? data
            : data.conversations || [];

        setConversations(items);
        return items;
    }, []);

    const loadMessages = useCallback(async (id, authToken) => {
        setLoadingMessages(true);

        try {
            const data = await apiRequest(
                `/chat/conversations/${encodeURIComponent(id)}/messages?limit=50`,
                authToken
            );

            const items = Array.isArray(data) ? data : data.messages || [];

            // The API returns oldest-first for a normal conversation view.
            setMessages(items);
            messagesRef.current = items;
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    const markRead = useCallback(async (id, authToken) => {
        try {
            await apiRequest(
                `/chat/conversations/${encodeURIComponent(id)}/read`,
                authToken,
                { method: "POST" }
            );

            setConversations((current) =>
                current.map((chat) =>
                    chat.id === id ? { ...chat, unread_count: 0 } : chat
                )
            );
        } catch (err) {
            console.error("Could not mark conversation as read:", err);
        }
    }, []);

    // Get the existing login token.
    useEffect(() => {
        const savedToken = getToken();
        setToken(savedToken);

        if (!savedToken) {
            setError("Please log in before opening your messages.");
            setLoadingChats(false);
        }
    }, []);

    // Load the inbox.
    useEffect(() => {
        if (!token) return;

        let cancelled = false;

        async function init() {
            setLoadingChats(true);
            setError("");

            try {
                const items = await loadConversations(token);

                if (cancelled) return;

                if (items.length > 0) {
                    setActiveId(items[0].id);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoadingChats(false);
            }
        }

        init();

        return () => {
            cancelled = true;
        };
    }, [token, loadConversations]);

    // Open the WebSocket and authenticate it with the existing JWT.
    useEffect(() => {
        if (!token) return;

        let disposed = false;
        let socket;

        try {
            socket = new WebSocket(WS_URL);
            socketRef.current = socket;
        } catch {
            setConnection("disconnected");
            return;
        }

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "auth", token }));
        };

        socket.onmessage = (event) => {
            let payload;

            try {
                payload = JSON.parse(event.data);
            } catch {
                return;
            }

            if (payload.type === "ready") {
                setConnection("connected");
                return;
            }

            if (payload.type === "auth:error") {
                setConnection("disconnected");
                setError(payload.message || "Chat authentication failed.");
                return;
            }

            if (payload.type === "pong") return;

            if (payload.type === "message:new") {
                const incoming = payload.message;
                if (!incoming) return;

                const conversationId =
                    incoming.conversation_id || payload.conversationId;

                if (conversationId === activeIdRef.current) {
                    setMessages((current) => {
                        if (current.some((item) => item.id === incoming.id)) {
                            return current;
                        }

                        const updated = [...current, incoming];
                        messagesRef.current = updated;
                        return updated;
                    });

                    if (incoming.sender_id !== undefined) {
                        // Mark messages from the other participant as read.
                        if (incoming.sender_id !== getCurrentUserId(token)) {
                            clearTimeout(pendingReadRef.current);
                            pendingReadRef.current = setTimeout(() => {
                                markRead(conversationId, token);
                            }, 250);
                        }
                    }
                }

                loadConversations(token).catch(console.error);
            }

            if (payload.type === "conversation:read") {
                // Read-receipt updates can be extended to show ticks.
                loadConversations(token).catch(console.error);
            }
        };

        socket.onclose = () => {
            if (!disposed) setConnection("disconnected");
        };

        socket.onerror = () => {
            if (!disposed) setConnection("disconnected");
        };

        return () => {
            disposed = true;
            clearTimeout(pendingReadRef.current);

            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            } else if (socket.readyState === WebSocket.CONNECTING) {
                socket.close();
            }

            if (socketRef.current === socket) socketRef.current = null;
        };
    }, [token, loadConversations, markRead]);

    // Load history and mark the selected conversation as read.
    useEffect(() => {
        if (!token || !activeId) {
            setMessages([]);
            return;
        }

        setError("");
        loadMessages(activeId, token);
        markRead(activeId, token);
    }, [token, activeId, loadMessages, markRead]);

    // Scroll to the latest message.
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeId]);

    async function sendMessage(event) {
        event.preventDefault();

        const body = draft.trim();
        if (!body || !activeId || !token || sending) return;

        setSending(true);
        setError("");

        try {
            const data = await apiRequest(
                `/chat/conversations/${encodeURIComponent(activeId)}/messages`,
                token,
                {
                    method: "POST",
                    body: JSON.stringify({ body }),
                }
            );

            const sent = data.message || data;

            setMessages((current) => {
                if (current.some((item) => item.id === sent.id)) return current;

                const updated = [...current, sent];
                messagesRef.current = updated;
                return updated;
            });

            setDraft("");
            await loadConversations(token);
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    const activeChat = conversations.find((chat) => chat.id === activeId);

    return (
        <main className="min-h-screen bg-[#f6f7f9] px-3 py-4 text-zinc-900 sm:px-6 sm:py-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <a
                            href="/"
                            className="text-sm font-semibold text-zinc-500 hover:text-black"
                        >
                            ← Back to NowYours
                        </a>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight">Messages</h1>
                        <p className="mt-1 text-sm text-zinc-500">
                            Chat directly with buyers and sellers.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-medium">
                        <span
                            className={`h-2 w-2 rounded-full ${connection === "connected"
                                ? "bg-emerald-500"
                                : connection === "connecting"
                                    ? "bg-amber-400"
                                    : "bg-red-400"
                                }`}
                        />
                        {connection === "connected"
                            ? "Live"
                            : connection === "connecting"
                                ? "Connecting"
                                : "Offline"}
                    </div>
                </header>

                {error && (
                    <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="font-bold"
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                <section className="grid min-h-[72vh] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:grid-cols-[320px_minmax(0,1fr)]">
                    {/* Conversation list */}
                    <aside className="flex min-h-[240px] flex-col border-b border-zinc-200 md:border-b-0 md:border-r">
                        <div className="border-b border-zinc-100 p-4">
                            <h2 className="font-semibold">Your conversations</h2>
                            <p className="mt-1 text-xs text-zinc-500">
                                {conversations.length} conversation
                                {conversations.length === 1 ? "" : "s"}
                            </p>
                        </div>

                        <div className="max-h-[35vh] flex-1 overflow-y-auto md:max-h-[65vh]">
                            {loadingChats ? (
                                <div className="p-5 text-sm text-zinc-500">
                                    Loading conversations...
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="p-6">
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-xl">
                                        ☺
                                    </div>
                                    <p className="font-medium">No conversations yet</p>
                                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                                        Open a listing and contact its seller to start a chat.
                                    </p>
                                </div>
                            ) : (
                                conversations.map((chat) => {
                                    const selected = chat.id === activeId;

                                    return (
                                        <button
                                            key={chat.id}
                                            type="button"
                                            onClick={() => setActiveId(chat.id)}
                                            className={`flex w-full gap-3 border-b border-zinc-100 p-4 text-left transition hover:bg-zinc-50 ${selected ? "bg-zinc-50" : "bg-white"
                                                }`}
                                        >
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                                                {(chat.other_user_name || "U")
                                                    .trim()
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="truncate text-sm font-semibold">
                                                        {chat.other_user_name || "Marketplace user"}
                                                    </p>
                                                    <span className="shrink-0 text-[10px] text-zinc-400">
                                                        {formatTime(
                                                            chat.last_message_at || chat.updated_at
                                                        )}
                                                    </span>
                                                </div>

                                                <p className="mt-1 truncate text-xs text-zinc-500">
                                                    {chat.listing_title || "Listing"}
                                                </p>

                                                <div className="mt-1 flex items-center justify-between gap-2">
                                                    <p className="truncate text-xs text-zinc-500">
                                                        {chat.last_message || "Start a conversation"}
                                                    </p>
                                                    {Number(chat.unread_count) > 0 && (
                                                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 px-1.5 text-[10px] font-bold text-white">
                                                            {chat.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </aside>

                    {/* Active chat */}
                    <div className="flex min-h-[55vh] min-w-0 flex-col md:min-h-[70vh]">
                        {activeChat ? (
                            <>
                                <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-4 sm:px-6">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 font-semibold">
                                        {(activeChat.other_user_name || "U")
                                            .trim()
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="truncate font-semibold">
                                            {activeChat.other_user_name || "Marketplace user"}
                                        </h2>
                                        <p className="truncate text-xs text-zinc-500">
                                            About: {activeChat.listing_title || "Marketplace listing"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4 overflow-y-auto bg-[#fcfcfd] p-4 sm:p-6">
                                    {loadingMessages ? (
                                        <p className="text-center text-sm text-zinc-400">
                                            Loading messages...
                                        </p>
                                    ) : messages.length === 0 ? (
                                        <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
                                            <div className="mb-3 text-3xl">✉</div>
                                            <p className="font-medium">Start the conversation</p>
                                            <p className="mt-1 text-sm text-zinc-500">
                                                Ask a question about this listing.
                                            </p>
                                        </div>
                                    ) : (
                                        messages.map((message) => {
                                            const mine =
                                                message.sender_id === getCurrentUserId(token);

                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${mine ? "justify-end" : "justify-start"
                                                        }`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${mine
                                                            ? "rounded-br-md bg-zinc-900 text-white"
                                                            : "rounded-bl-md border border-zinc-200 bg-white text-zinc-900"
                                                            }`}
                                                    >
                                                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                                            {message.body}
                                                        </p>
                                                        <p
                                                            className={`mt-1 text-right text-[10px] ${mine ? "text-zinc-400" : "text-zinc-400"
                                                                }`}
                                                        >
                                                            {formatTime(message.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={bottomRef} />
                                </div>

                                <form
                                    onSubmit={sendMessage}
                                    className="border-t border-zinc-100 bg-white p-3 sm:p-4"
                                >
                                    <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 focus-within:border-zinc-400">
                                        <textarea
                                            value={draft}
                                            onChange={(event) => setDraft(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === "Enter" &&
                                                    !event.shiftKey &&
                                                    !event.nativeEvent.isComposing
                                                ) {
                                                    event.preventDefault();
                                                    event.currentTarget.form?.requestSubmit();
                                                }
                                            }}
                                            placeholder="Write a message..."
                                            rows={1}
                                            maxLength={5000}
                                            className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none placeholder:text-zinc-400"
                                        />

                                        <button
                                            type="submit"
                                            disabled={!draft.trim() || sending}
                                            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {sending ? "Sending..." : "Send"}
                                        </button>
                                    </div>
                                    <p className="mt-2 px-1 text-[11px] text-zinc-400">
                                        Enter to send · Shift + Enter for a new line
                                    </p>
                                </form>
                            </>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
                                    ✉
                                </div>
                                <h2 className="text-lg font-semibold">Your messages</h2>
                                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                                    Choose a conversation to continue chatting, or contact a
                                    seller from one of their listings.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

// Read the JWT subject so messages can be aligned to the current user.
// This is only for display; the backend remains responsible for authentication.
function getCurrentUserId(token) {
    if (!token) return null;

    try {
        const base64 = token.split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
        const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "="
        );

        return JSON.parse(atob(padded)).sub || null;
    } catch {
        return null;
    }
}
