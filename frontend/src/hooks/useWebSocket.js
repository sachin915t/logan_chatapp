import { useEffect, useRef, useState, useCallback } from "react";

const RECONNECT_DELAY = 1000; // Faster reconnect
const MAX_RECONNECT_ATTEMPTS = 20;

export const useWebSocket = (url, roomId) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef(null);
  const shouldReconnect = useRef(true);
  const msgCounter = useRef(0);
  const receivedIds = useRef(new Set());
  const pingTimeout = useRef(null);
  const isBackground = useRef(false);

  // Reset on room change
  useEffect(() => {
    setMessages([]);
    receivedIds.current.clear();
    msgCounter.current = 0;
  }, [roomId]);

  // Handle visibility change (tab switching, multitasking)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isBackground.current = true;
      } else {
        isBackground.current = false;
        // Reconnect immediately when coming back
        if (!connected && shouldReconnect.current) {
          clearTimeout(reconnectTimer.current);
          reconnectAttempts.current = 0;
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connected]);

  const connect = useCallback(() => {
    if (!shouldReconnect.current) return;

    // Clean up old connection
    if (ws.current) {
      ws.current.onclose = null;
      ws.current.close();
    }

    const websocket = new WebSocket(url);
    ws.current = websocket;

    websocket.onopen = () => {
      setConnected(true);
      reconnectAttempts.current = 0;
    };

    websocket.onclose = () => {
      setConnected(false);
      
      if (shouldReconnect.current && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current += 1;
        // Exponential backoff with max 5 seconds
        const delay = Math.min(RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts.current), 5000);
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    websocket.onerror = () => {
      websocket.close();
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle ping/pong
        if (data.type === 'ping') {
          websocket.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        if (data.type === 'pong') return;

        // Create unique ID for deduplication
        const msgId = data.timestamp && data.sender 
          ? `${data.sender}-${data.timestamp}-${data.content?.slice(0, 30)}`
          : `msg-${++msgCounter.current}`;

        // Skip if already seen
        if (receivedIds.current.has(msgId)) {
          console.log('Duplicate message skipped:', msgId);
          return;
        }
        
        receivedIds.current.add(msgId);
        data._localId = msgCounter.current++;

        setMessages((prev) => [...prev, data]);
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };
  }, [url]);

  useEffect(() => {
    shouldReconnect.current = true;
    reconnectAttempts.current = 0;
    connect();

    return () => {
      shouldReconnect.current = false;
      clearTimeout(reconnectTimer.current);
      clearTimeout(pingTimeout.current);
      ws.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, message not sent");
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    receivedIds.current.clear();
    msgCounter.current = 0;
  }, []);

  return { connected, messages, sendMessage, clearMessages };
};