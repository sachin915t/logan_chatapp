import { useState, useEffect, useRef } from "react";
import { Send, Wifi, WifiOff, LogOut, Hash } from "lucide-react";
import { format } from "date-fns";
import { useWebSocket } from "../hooks/useWebSocket";

const Chat = ({ username, roomId, avatar, onLogout }) => {
  const [inputMessage, setInputMessage] = useState("");
    const [typingUser, setTypingUser] = useState(null);
    const [onlineCount, setOnlineCount] = useState(0);

  const messagesEndRef = useRef(null);
  const typingCooldown = useRef(false);
  const typingTimeout = useRef(null);

  const { connected, messages, sendMessage } = useWebSocket(
    `${import.meta.env.VITE_WS_URL}/ws/${roomId}/${username}`
  );


    //oneline count
useEffect(() => {
  const last = messages[messages.length - 1];
  if (last?.type === "room_count") {
    setOnlineCount(last.count);
  }
}, [messages]);
    
    
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleSend = (e) => {
    e.preventDefault();
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
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100dvh", background: "#0d0d0d",
      fontFamily: "'DM Sans', sans-serif", color: "#fff",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap');

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1);   opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        ::-webkit-scrollbar { width: 0px; }

        .msg-row { animation: msgIn 0.2s ease both; }

        .bubble-own {
          background: #fff;
          color: #000;
          border-radius: 18px 18px 4px 18px;
          padding: 10px 14px;
          font-size: 14px;
          line-height: 1.5;
          max-width: 72vw;
          word-break: break-word;
        }
        .bubble-other {
          background: #1e1e1e;
          color: #f0f0f0;
          border-radius: 18px 18px 18px 4px;
          padding: 10px 14px;
          font-size: 14px;
          line-height: 1.5;
          max-width: 72vw;
          word-break: break-word;
        }

        .chat-input {
          flex: 1;
          background: #1a1a1a;
          border: 1.5px solid #2a2a2a;
          color: #fff;
          border-radius: 12px;
          padding: 12px 15px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s;
          -webkit-appearance: none;
          min-width: 0;
        }
        .chat-input::placeholder { color: #444; }
        .chat-input:focus { border-color: #444; }
        .chat-input:disabled { opacity: 0.4; }

        .send-btn {
          width: 44px; height: 44px;
          background: #fff; color: #000;
          border: none; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: opacity 0.15s, transform 0.15s;
        }
        .send-btn:hover:not(:disabled) { opacity: 0.85; transform: scale(1.05); }
        .send-btn:active:not(:disabled) { transform: scale(0.95); }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .dot-bounce {
          display: inline-block;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #666;
          animation: dot 1.2s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: "1px solid #1a1a1a",
        background: "#0d0d0d",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Hash size={16} color="#555" />
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
            {roomId}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {connected
              ? <Wifi size={13} color="#4ade80" />
              : <WifiOff size={13} color="#f87171" />
            }
            <span style={{ fontSize: 12, color: connected ? "#4ade80" : "#f87171" }}>
              {connected ? "Live" : "Reconnecting"}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
  <div style={{
    width: 7, height: 7, borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 6px #4ade80",
  }} />
  <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 500 }}>
    {onlineCount} online
  </span>
</div>
          </div>

          <img
            src={avatar}
            alt="you"
            style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "1.5px solid #2a2a2a" }}
          />

          <button
            onClick={onLogout}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#555", padding: 4, display: "flex",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "#555"}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "16px 16px 8px",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        {messages
          .filter((msg) => msg.type === "message" || msg.type === "system")
          .map((msg, idx) => {

            if (msg.type === "system") {
              return (
                <div key={`sys-${idx}`} style={{
                  textAlign: "center", fontSize: 11,
                  color: "#444", padding: "4px 0",
                }}>
                  {msg.content}
                </div>
              );
            }

            const isOwn = msg.sender === username;

            return (
              <div
                key={`${msg.sender}-${msg.timestamp}-${idx}`}
                className="msg-row"
                style={{
                  display: "flex",
                  flexDirection: isOwn ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                {/* Avatar */}
                <img
                  src={isOwn ? avatar : (msg.avatar || avatar)}
                  alt={msg.sender}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    objectFit: "cover", flexShrink: 0,
                    border: "1.5px solid #2a2a2a",
                  }}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: isOwn ? "flex-end" : "flex-start" }}>
                  {/* Name + time */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {!isOwn && (
                      <span style={{ fontSize: 11, color: "#555", fontWeight: 500 }}>
                        {msg.sender}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: "#333" }}>
                      {format(new Date(msg.timestamp), "HH:mm")}
                    </span>
                  </div>

                  <div className={isOwn ? "bubble-own" : "bubble-other"}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

        {/* Typing */}
        {typingUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 36 }}>
            <span style={{ fontSize: 11, color: "#444" }}>{typingUser}</span>
            <div style={{ display: "flex", gap: 3 }}>
              {[0, 0.2, 0.4].map((d, i) => (
                <span key={i} className="dot-bounce" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid #1a1a1a",
        background: "#0d0d0d",
        flexShrink: 0,
      }}>
        <form
          onSubmit={handleSend}
          style={{ display: "flex", gap: 10, alignItems: "center" }}
        >
          <input
            className="chat-input"
            type="text"
            value={inputMessage}
            onChange={handleTyping}
            placeholder={connected ? "Message..." : "Reconnecting..."}
            disabled={!connected}
            autoComplete="off"
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!connected || !inputMessage.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;