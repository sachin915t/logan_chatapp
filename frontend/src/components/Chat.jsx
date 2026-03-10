import { useState, useEffect, useRef } from "react";
import { Send, Wifi, WifiOff, LogOut, Hash, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useWebSocket } from "../hooks/useWebSocket";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function extractUrl(content) {
  const match = content.match(URL_REGEX);
  return match ? match[0] : null;
}

function renderText(content) {
  const parts = content.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer"
        style={{ color: "#60a5fa", textDecoration: "underline", wordBreak: "break-all" }}>
        {part}
      </a>
    ) : <span key={i}>{part}</span>
  );
}

function LinkPreview({ url }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/preview?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(data => { setPreview(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [url]);

  if (loading) return (
    <div style={{
      marginTop: 8, padding: "10px 12px",
      background: "#111", borderRadius: 10,
      border: "1px solid #2a2a2a",
      fontSize: 12, color: "#555",
    }}>
      Loading preview...
    </div>
  );

  if (!preview?.title && !preview?.image) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "block", marginTop: 8 }}>
      <div style={{
        background: "#111", border: "1px solid #2a2a2a",
        borderRadius: 10, overflow: "hidden",
        transition: "border-color 0.15s", cursor: "pointer", maxWidth: 280,
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "#444"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a2a"}
      >
        {preview.image && (
          <img src={preview.image} alt=""
            style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }}
            onError={e => e.target.style.display = "none"}
          />
        )}
        <div style={{ padding: "8px 10px" }}>
          {preview.title && (
            <p style={{
              margin: "0 0 3px", fontSize: 13, fontWeight: 600,
              color: "#fff", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis",
            }}>{preview.title}</p>
          )}
          {preview.description && (
            <p style={{
              margin: "0 0 4px", fontSize: 11, color: "#666",
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>{preview.description}</p>
          )}
          <p style={{
            margin: 0, fontSize: 10, color: "#444",
            display: "flex", alignItems: "center", gap: 3,
          }}>
            <ExternalLink size={9} />
            {new URL(url).hostname}
          </p>
        </div>
      </div>
    </a>
  );
}

const Chat = ({ username, roomId, avatar, onLogout }) => {
  const [inputMessage, setInputMessage] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [toast, setToast] = useState(null);

  const messagesEndRef = useRef(null);
  const typingCooldown = useRef(false);
  const typingTimeout = useRef(null);
  const toastTimer = useRef(null);

  const { connected, messages, sendMessage } = useWebSocket(
    `${import.meta.env.VITE_WS_URL}/ws/${roomId}/${username}`
  );

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (connected) showToast("Connected ✓");
    else showToast("Reconnecting...");
  }, [connected]);

  useEffect(() => {
    document.title = `#${roomId} — Logan Chat`;
    document.querySelector('meta[name="description"]')
      ?.setAttribute("content", `You are chatting in #${roomId} on Logan Chat.`);
    return () => { document.title = "Logan Chat"; };
  }, [roomId]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/rooms`)
      .then(r => r.json())
      .then(data => {
        const room = data.rooms?.find(r => r.room_id === roomId);
        if (room) setOnlineCount(room.count);
      })
      .catch(() => {});
  }, [roomId]);

  useEffect(() => {
    const countMsg = [...messages].reverse().find(m => m.type === "room_count");
    if (countMsg) setOnlineCount(countMsg.count);
  }, [messages]);

  useEffect(() => {
    const t = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(t);
  }, [messages]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.type === "message" && last.sender !== username) {
      setTypingUser(null);
      clearTimeout(typingTimeout.current);
      return;
    }
    if (last?.type !== "typing" || last.sender === username) return;
    setTypingUser(last.sender);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setTypingUser(null), 1500);
    return () => clearTimeout(typingTimeout.current);
  }, [messages, username]);

  const handleSend = () => {
    if (!inputMessage.trim() || !connected) return;
    sendMessage({
      type: "message",
      content: inputMessage.trim(),
      sender: username,
      avatar,
      timestamp: new Date().toISOString(),
    });
    setInputMessage("");
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);
    if (typingCooldown.current) return;
    sendMessage({ type: "typing", sender: username, avatar });
    typingCooldown.current = true;
    setTimeout(() => { typingCooldown.current = false; }, 1000);
  };

  return (
    <div
      className="flex flex-col bg-[#0d0d0d] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif", height: "100dvh", overflow: "hidden" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap');

        html, body {
          height: 100%;
          overflow: hidden;
          position: fixed;
          width: 100%;
        }

        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1); opacity: 1; }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        ::-webkit-scrollbar { width: 0px; }
        .msg-row { animation: msgIn 0.2s ease both; }

        .bubble-own {
          background: #fff; color: #000;
          border-radius: 18px 18px 4px 18px;
          padding: 10px 14px; font-size: 14px;
          line-height: 1.5; max-width: 72vw;
          word-break: break-word; display: inline-block;
        }
        .bubble-other {
          background: #1e1e1e; color: #f0f0f0;
          border-radius: 18px 18px 18px 4px;
          padding: 10px 14px; font-size: 14px;
          line-height: 1.5; max-width: 72vw;
          word-break: break-word; display: inline-block;
        }

        .chat-input {
          flex: 1; background: #1a1a1a;
          border: 1.5px solid #2a2a2a; color: #fff;
          border-radius: 12px; padding: 12px 15px;
          font-size: 16px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.2s;
          -webkit-appearance: none; min-width: 0;
        }
        .chat-input::placeholder { color: #444; }
        .chat-input:focus { border-color: #444; }
        .chat-input:disabled { opacity: 0.4; }

        .dot-bounce {
          display: inline-block; width: 5px; height: 5px;
          border-radius: 50%; background: #666;
          animation: dot 1.2s ease-in-out infinite;
        }

        .toast {
          position: fixed;
          top: 16px; left: 50%;
          transform: translateX(-50%);
          background: #1a1a1a;
          color: #fff;
          padding: 9px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          border: 1px solid #2a2a2a;
          white-space: nowrap;
          z-index: 999;
          pointer-events: none;
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
          animation: toastIn 0.25s cubic-bezier(0.22,1,0.36,1) both;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1a1a1a] bg-[#0d0d0d] shrink-0">
        <div className="flex items-center gap-2">
          <Hash size={16} color="#555" />
          <span className="font-bold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>
            {roomId}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {connected ? <Wifi size={13} color="#4ade80" /> : <WifiOff size={13} color="#f87171" />}
            <span style={{ fontSize: 12, color: connected ? "#4ade80" : "#f87171" }}>
              {connected ? "Live" : "Reconnecting"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"
              style={{ boxShadow: "0 0 6px #4ade80" }} />
            <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 500 }}>
              {onlineCount} online
            </span>
          </div>
          <img src={avatar} alt="you"
            className="w-7 h-7 rounded-full object-cover border border-[#2a2a2a]" />
          <button onClick={onLogout}
            className="bg-transparent border-none cursor-pointer flex p-1"
            style={{ color: "#555" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "#555"}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-4 pb-2 flex flex-col gap-1.5"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", minHeight: 0 }}
      >
        {messages
          .filter(msg => msg.type === "message" || msg.type === "system")
          .map((msg, idx) => {
            if (msg.type === "system") {
              return (
                <div key={`sys-${idx}`} style={{ textAlign: "center", fontSize: 11, color: "#444", padding: "4px 0" }}>
                  {msg.content}
                </div>
              );
            }

            const isOwn = msg.sender === username;
            const url = extractUrl(msg.content);

            return (
              <div key={`${msg.sender}-${msg.timestamp}-${idx}`}
                className={`msg-row flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                <img
                  src={isOwn ? avatar : (msg.avatar || avatar)} alt={msg.sender}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#2a2a2a]"
                />
                <div className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5">
                    {!isOwn && <span style={{ fontSize: 11, color: "#555", fontWeight: 500 }}>{msg.sender}</span>}
                    <span style={{ fontSize: 10, color: "#333" }}>
                      {format(new Date(msg.timestamp), "HH:mm")}
                    </span>
                  </div>
                  <div className={isOwn ? "bubble-own" : "bubble-other"}>
                    {renderText(msg.content)}
                    {url && <LinkPreview url={url} />}
                  </div>
                </div>
              </div>
            );
          })}

        {typingUser && (
          <div className="flex items-center gap-2 pl-9">
            <span style={{ fontSize: 11, color: "#444" }}>{typingUser}</span>
            <div className="flex gap-0.5">
              {[0, 0.2, 0.4].map((d, i) => (
                <span key={i} className="dot-bounce" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 border-t border-[#1a1a1a] bg-[#0d0d0d] shrink-0"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex gap-2.5 items-center">
          <input
            className="chat-input"
            type="text"
            value={inputMessage}
            onChange={handleTyping}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder={connected ? "Message..." : "Reconnecting..."}
            disabled={!connected}
            autoComplete="off"
            enterKeyHint="send"
          />
          <button
            onClick={handleSend}
            disabled={!connected || !inputMessage.trim()}
            className="w-11 h-11 bg-white text-black rounded-xl flex items-center justify-center shrink-0 border-none cursor-pointer"
            style={{ transition: "opacity 0.15s, transform 0.15s", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default Chat;