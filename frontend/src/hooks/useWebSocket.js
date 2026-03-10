import { useEffect, useRef, useState, useCallback } from "react";

const RECONNECT_DELAY = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;

export const useWebSocket = (url) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef(null);
  const shouldReconnect = useRef(true);
  const seenIds = useRef(new Set());

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

        // Unique ID: prefer server-provided id, else derive from content
        const msgId =
          data.id ?? `${data.sender}-${data.timestamp}-${data.content}`;

        if (seenIds.current.has(msgId)) return;
        seenIds.current.add(msgId);

        // Prune seen IDs to avoid unbounded memory growth
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