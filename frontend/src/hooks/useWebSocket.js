import { useEffect, useRef, useState, useCallback } from "react";

const RECONNECT_DELAY = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;
const EXPIRY_MINUTES = 10;
const HISTORY_KEY = (room) => `chat_history_${room}`;

export const useWebSocket = (url) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef(null);
  const shouldReconnect = useRef(true);
  const seenIds = useRef(new Set());
  const historyLoaded = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (historyLoaded.current) return;
    historyLoaded.current = true;

    const parts = url.split("/ws/")[1]?.split("/");
    const room = parts?.[0];
    if (!room) return;

    try {
      const saved = localStorage.getItem(HISTORY_KEY(room));
      if (saved) {
        const { messages: savedMsgs, savedAt } = JSON.parse(saved);
        const ageMinutes = (Date.now() - savedAt) / 1000 / 60;

        if (ageMinutes < EXPIRY_MINUTES) {
          savedMsgs.forEach(m => {
            const id = `${m.sender}-${m.timestamp}-${m.content}`;
            seenIds.current.add(id);
          });
          setMessages(savedMsgs);
        } else {
          localStorage.removeItem(HISTORY_KEY(room));
        }
      }
    } catch {
      // corrupt localStorage data — ignore
    }
  }, [url]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    const parts = url.split("/ws/")[1]?.split("/");
    const room = parts?.[0];
    if (!room) return;

    const onlyMessages = messages.filter(m => m.type === "message");
    if (!onlyMessages.length) return;

    try {
      localStorage.setItem(HISTORY_KEY(room), JSON.stringify({
        messages: onlyMessages.slice(-100), // keep last 100
        savedAt: Date.now(),
      }));
    } catch {}
  }, [messages, url]);

  const connect = useCallback(() => {
    if (!shouldReconnect.current) return;

    const websocket = new WebSocket(url);
    ws.current = websocket;

    websocket.onopen = () => {
      setConnected(true);
      reconnectAttempts.current = 0;
    };

    websocket.onclose = () => {
      setConnected(false);

      if (
        shouldReconnect.current &&
        reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS
      ) {
        reconnectAttempts.current += 1;
        const delay = RECONNECT_DELAY * reconnectAttempts.current;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    websocket.onerror = () => {
      websocket.close();
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        const msgId =
          data.id ?? `${data.sender}-${data.timestamp}-${data.content}`;

        if (seenIds.current.has(msgId)) return;
        seenIds.current.add(msgId);

        if (seenIds.current.size > 500) {
          const oldest = [...seenIds.current].slice(0, 100);
          oldest.forEach((id) => seenIds.current.delete(id));
        }

        setMessages((prev) => [...prev, data]);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };
  }, [url]);

  useEffect(() => {
    shouldReconnect.current = true;
    connect();

    return () => {
      shouldReconnect.current = false;
      clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    seenIds.current.clear();
  }, []);

  return { connected, messages, sendMessage, clearMessages };
};