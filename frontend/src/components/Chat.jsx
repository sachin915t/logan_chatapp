import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, Wifi, WifiOff, LogOut, Hash, ExternalLink, Smile } from "lucide-react";
import { format } from "date-fns";
import { useWebSocket } from "../hooks/useWebSocket";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const QUICK_EMOJIS = [
  "😀", "😂", "🥰", "😎", "🤔", "😢", "😡", "👍", 
  "👎", "❤️", "🔥", "🎉", "🤝", "🙏", "👏", "🚀",
  "😴", "🤯", "🤡", "💀", "👻", "👀", "🙄", "😭"
];

function extractUrl(content) {
  const match = content?.match(URL_REGEX);
  return match ? match[0] : null;
}

function renderText(content) {
  if (!content) return null;
  const parts = content.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer"
        className="text-blue-400 underline break-all">
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

  if (loading) return <div className="mt-2 text-xs text-zinc-600">Loading preview...</div>;
  if (!preview?.title && !preview?.image) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="block mt-2 no-underline max-w-[280px] rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-colors">
      {preview.image && (
        <img src={preview.image} alt=""
          className="w-full h-32 object-cover block"
          onError={e => e.target.style.display = "none"} />
      )}
      <div className="p-2 bg-zinc-900">
        {preview.title && (
          <p className="text-sm font-semibold text-white truncate mb-0.5">{preview.title}</p>
        )}
        {preview.description && (
          <p className="text-xs text-zinc-500 line-clamp-2 mb-1">{preview.description}</p>
        )}
        <p className="text-[10px] text-zinc-600 flex items-center gap-1">
          <ExternalLink size={9} />{new URL(url).hostname}
        </p>
      </div>
    </a>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center">
      {[0, 150, 300].map((delay, i) => (
        <span key={i}
          className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: "1s" }}
        />
      ))}
    </div>
  );
}

// Force treat timestamp as UTC then display in user's local time with AM/PM
function formatLocalTime(timestamp) {
  if (!timestamp) return "";
  try {
    let ts = String(timestamp).trim().replace(" ", "T");
    if (!ts.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(ts)) ts += "Z";
    const date = new Date(ts);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "";
  }
}

const Chat = ({ username, roomId, avatar, onLogout }) => {
  const [inputMessage, setInputMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineCount, setOnlineCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState("success");
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const editableRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingCooldown = useRef(false);
  const typingTimers = useRef({});
  const toastTimer = useRef(null);
  const visualViewportHeight = useRef(window.innerHeight);
  const isComposing = useRef(false);
  const prevConnected = useRef(false);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef(null);

  const { connected, messages, sendMessage } = useWebSocket(
    `${import.meta.env.VITE_WS_URL}/ws/${roomId}/${username}`,
    roomId
  );

  useEffect(() => {
    if (connected && !prevConnected.current) {
      showToast("Connected ✓", "success");
    } else if (!connected && prevConnected.current) {
      showToast("Disconnected - reconnecting...", "warn");
    }
    prevConnected.current = connected;
  }, [connected]);

  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    setToastType(type);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    document.title = `#${roomId} — Logan Chat`;
    return () => { document.title = "Logan Chat"; };
  }, [roomId]);

  useEffect(() => {
    const countMsg = [...messages].reverse().find(m => m.type === "room_count");
    if (countMsg) setOnlineCount(countMsg.count);
  }, [messages]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.type !== "typing" || last.sender === username) return;
    const sender = last.sender;
    setTypingUsers(prev => new Set([...prev, sender]));
    clearTimeout(typingTimers.current[sender]);
    typingTimers.current[sender] = setTimeout(() => {
      setTypingUsers(prev => { const n = new Set(prev); n.delete(sender); return n; });
    }, 1500);
  }, [messages, username]);

  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current && isNearBottom && !isUserScrolling.current) {
      requestAnimationFrame(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); });
    }
  }, [messages, isNearBottom]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current?.contains(e.target)) return;
      if (e.target.closest('.emoji-toggle-btn')) return;
      if (showEmojiPicker) setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;
    const handleResize = () => {
      const keyboardOpen = vv.height < window.innerHeight - 100;
      setIsKeyboardOpen(keyboardOpen);
      if (keyboardOpen) setShowEmojiPicker(false);
      if (keyboardOpen && isNearBottom) {
        setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
      }
      visualViewportHeight.current = vv.height;
    };
    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    return () => { vv.removeEventListener('resize', handleResize); vv.removeEventListener('scroll', handleResize); };
  }, [isNearBottom]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    setIsNearBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 100);
    isUserScrolling.current = true;
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => { isUserScrolling.current = false; }, 150);
  }, []);

  const handleEditableInput = useCallback((e) => {
    setInputMessage(e.currentTarget.innerText || "");
    if (typingCooldown.current) return;
    sendMessage({ type: "typing", sender: username, avatar });
    typingCooldown.current = true;
    setTimeout(() => { typingCooldown.current = false; }, 1000);
  }, [sendMessage, username, avatar]);

  const handleSend = useCallback(() => {
    const trimmed = inputMessage.trim();
    if (!trimmed || !connected) return;
    if (editableRef.current) editableRef.current.innerHTML = "";
    setInputMessage("");
    setShowEmojiPicker(false);
    sendMessage({ type: "message", content: trimmed, sender: username, avatar, timestamp: new Date().toISOString() });
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 50);
    setTimeout(() => editableRef.current?.focus(), 0);
  }, [inputMessage, connected, sendMessage, username, avatar]);

  const handleEditableKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleEditablePaste = useCallback((e) => {
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  }, []);

  const insertEmoji = useCallback((emoji) => {
    if (!editableRef.current) return;
    editableRef.current.focus();
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    const node = document.createTextNode(emoji);
    range.insertNode(node);
    range.setStartAfter(node); range.setEndAfter(node);
    sel.removeAllRanges(); sel.addRange(range);
    setInputMessage(editableRef.current.innerText || "");
    setShowEmojiPicker(false);
    if (!typingCooldown.current) {
      sendMessage({ type: "typing", sender: username, avatar });
      typingCooldown.current = true;
      setTimeout(() => { typingCooldown.current = false; }, 1000);
    }
  }, [sendMessage, username, avatar]);

  // Keep server arrival order — do NOT sort by timestamp.
  // Sorting causes user messages (timestamped locally) to appear above
  // server-generated join/leave system messages that arrived just after.
  const visibleMessages = messages.filter(m => m.type === "message" || m.type === "system");
  const typingList = [...typingUsers].filter(u => u !== username);
  // ALWAYS preserve server arrival order — never sort by timestamp.
  // System messages (join/leave) have server timestamps that can be
  // identical or slightly ahead of the user's locally-timestamped messages,
  // causing them to appear in the wrong position if we sort.
  // The server already sends messages in correct chronological order.
  const sortedMessages = useMemo(() => visibleMessages, [visibleMessages]);

  useEffect(() => {
    if (messages.length > 0) messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  return (
    <div className="flex flex-col bg-[#0d0d0d] text-white overflow-hidden fixed inset-0"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap');
        * { -webkit-tap-highlight-color: transparent; }

        .msgs::-webkit-scrollbar { width: 6px; }
        .msgs::-webkit-scrollbar-track { background: transparent; }
        .msgs::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
        .msgs::-webkit-scrollbar-thumb:hover { background: #52525b; }
        .msgs { scrollbar-width: thin; scrollbar-color: #3f3f46 transparent; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.8) translateY(10px); }
          70%  { transform: scale(1.05) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pickerPop {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wmDrift {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.7; }
        }

        .msg-new { animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .msg-own { animation: popIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
        .picker-animate { animation: pickerPop 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards; transform-origin: bottom left; }

        @supports (-webkit-touch-callout: none) { .chat-input { font-size: 16px !important; } }

        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: #52525b;
          pointer-events: none;
          display: block;
        }

        .emoji-btn:hover { background-color: #3f3f46 !important; }
        .send-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 12px rgba(255,255,255,0.15); }
        .send-btn:active:not(:disabled) { transform: scale(0.9); }

       /* ── Own Message (Sender) ── */
.bubble-own {
  background: linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%);
  color: #09090b;
  /* Smoother radius with a distinct tail */
  border-radius: 20px 20px 4px 20px;
  margin-left: auto;
  
  /* Multi-layered shadow for realistic depth */
  box-shadow: 
    0 4px 15px -3px rgba(255, 255, 255, 0.1), 
    0 2px 6px -2px rgba(0, 0, 0, 0.2);
    
  /* Subtle inner border to catch light */
  border: 1px solid rgba(255, 255, 255, 0.4);
}

/* ── Other Message (Receiver) ── */
.bubble-other {
  background: #1e1e21; /* Slightly deeper than Zinc-800 */
  color: #fafafa;
  /* Smoother radius with a distinct tail */
  border-radius: 20px 20px 20px 4px;
  margin-right: auto;
  
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  
  /* Very subtle border to define it against a dark background */
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* ── Interaction Detail ── */
.bubble-own::after, .bubble-other::after {
  content: "";
  display: block;
  clear: both;
}
        .msg-row { overflow: visible !important; padding-bottom: 2px; }

    /* ── Watermark ── */
.chat-watermark {
  pointer-events: none;
  user-select: none;
  
  /* FIXED keeps it in one spot even when you scroll */
  position: fixed; 
  
  /* Center it in the viewport */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  
  /* Send it to the very back */
  z-index: -1; 
  
  /* Updated animation call to handle the new centering */
  animation: wmFlow 15s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
  will-change: transform;
}

.wm-name {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: clamp(80px, 9vw, 54px);
  color: rgba(255, 255, 255, 0.07);
  filter: blur(3px);
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.wm-app {
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  font-size: clamp(10px, 2.2vw, 14px);
  color: rgba(255, 255, 255, 0.04);
  filter: blur(1.5px);
  letter-spacing: 0.35em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* ── Smooth Floating Animation ── */
@keyframes wmFlow {
  0%, 100% {
    /* Keep the -50% centering and add slight drift */
    transform: translate(-50%, -50%) rotate(0deg);
  }
  33% {
    transform: translate(-48%, -52%) rotate(1deg);
  }
  66% {
    transform: translate(-52%, -48%) rotate(-0.5deg);
  }
}

        @media (max-width: 640px) { .chat-bubble { max-width: 89vw !important; } }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 border-b border-zinc-900 shrink-0 z-10 bg-[#0d0d0d]"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: 12 }}>
        <div className="flex items-center gap-2">
          <Hash size={15} className="text-zinc-600" />
          <span className="font-bold text-[15px]" style={{ fontFamily: "'Syne', sans-serif" }}>{roomId}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {connected ? <Wifi size={13} className="text-green-400" /> : <WifiOff size={13} className="text-red-400" />}
            <span className={`text-xs ${connected ? "text-green-400" : "text-red-400"}`}>
              {connected ? "Live" : "Reconnecting"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_#4ade80]" />
            <span className="text-xs text-green-400 font-medium">{onlineCount} online</span>
          </div>
          <img src={avatar} alt="me" className="w-7 h-7 rounded-full object-cover border border-zinc-800" />
          <span className={`text-white font-semibold tracking-wide text-sm transition-all duration-1000 ease-out
            ${connected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
            hover:text-blue-200 hover:drop-shadow-[0_0_8px_rgba(147,197,253,0.5)] cursor-default select-none`}>
            {username}
          </span>
          <button onClick={onLogout}
            className="text-zinc-600 hover:text-white transition-colors p-1 bg-transparent border-none cursor-pointer hover:bg-zinc-800 rounded-lg">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="msgs flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-2 relative"
        ref={messagesContainerRef} onScroll={handleScroll}>

        {/* Blurry watermark — username + app name */}
        <div className="chat-watermark" aria-hidden="true">
          <span className="wm-name">{username}</span>
          <span className="wm-app">Logan Chat</span>
        </div>

        {!connected && messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-zinc-600 text-sm">
            Connecting to chat...
          </div>
        )}

        {/* z-index 1 so messages sit above watermark */}
        <div className="flex flex-col gap-1 min-h-full justify-end" style={{ position: "relative", zIndex: 1 }}>
          {sortedMessages.map((msg, idx) => {
            if (msg.type === "system") {
              return (
                <div key={msg._localId ?? `sys-${idx}`}
                  className="text-center text-[11px] text-zinc-700 py-1 select-none msg-new"
                  style={{ animationDelay: `${idx * 30}ms` }}>
                  {msg.content}
                </div>
              );
            }

            const isOwn = msg.sender === username;
            const url = extractUrl(msg.content);
            const isNew = msg._localId && msg._sending;

            return (
              <div key={msg._localId ?? `${msg.sender}-${msg.timestamp}-${idx}`}
                className={`msg-row flex items-end gap-2 mb-0.5 ${isOwn ? "flex-row-reverse" : "flex-row"} ${isNew ? 'msg-own' : 'msg-new'}`}
                style={{ animationDelay: `${Math.min(idx * 30, 500)}ms` }}>

                <img src={isOwn ? avatar : (msg.avatar || avatar)} alt={msg.sender}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-zinc-800" />

                <div className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5">
                    {!isOwn && <span className="text-[11px] text-zinc-500 font-medium">{msg.sender}</span>}
                    <span className="text-[10px] text-zinc-600">{formatLocalTime(msg.timestamp)}</span>
                  </div>
                  <div className={`chat-bubble px-3 py-2 text-sm leading-relaxed break-words inline-block ${isOwn ? "bubble-own" : "bubble-other"}`}
                    style={{ maxWidth: "min(72vw, 340px)" }}>
                    {renderText(msg.content)}
                    {url && <LinkPreview url={url} />}
                  </div>
                </div>
              </div>
            );
          })}

          {typingList.length > 0 && (
            <div className="flex items-center gap-2 pl-9 py-0.5 msg-new">
              <span className="text-[11px] text-zinc-600">
                {typingList.length === 1
                  ? `${typingList[0]} is typing`
                  : `${typingList.slice(0, -1).join(", ")} and ${typingList.at(-1)} are typing`}
              </span>
              <TypingDots />
            </div>
          )}

          <div ref={messagesEndRef} className="h-1 shrink-0" />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 px-4 py-3 border-t border-zinc-900 bg-[#0d0d0d] z-20 relative"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>

        {showEmojiPicker && (
          <div ref={emojiPickerRef}
            className="absolute bottom-full left-2 right-2 mb-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-2 shadow-2xl z-50 max-h-[220px] overflow-y-auto picker-animate">
            <div className="grid grid-cols-8 gap-1">
              {QUICK_EMOJIS.map((emoji, idx) => (
                <button key={idx} onClick={() => insertEmoji(emoji)}
                  className="emoji-btn text-xl sm:text-2xl p-1.5 sm:p-2 hover:bg-zinc-800 rounded-lg flex items-center justify-center cursor-pointer"
                  type="button">
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 bg-zinc-900 rounded-2xl px-3 py-2 border border-zinc-800 focus-within:border-zinc-600 focus-within:bg-zinc-800/50 transition-all">
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditableInput}
            onKeyDown={handleEditableKeyDown}
            onPaste={handleEditablePaste}
            onCompositionStart={() => isComposing.current = true}
            onCompositionEnd={() => isComposing.current = false}
            placeholder={connected ? `Message #${roomId}` : "Reconnecting..."}
            className="chat-input flex-1 bg-transparent border-none outline-none text-white min-h-[20px] max-h-[100px] sm:max-h-[120px] overflow-y-auto break-words py-1.5 px-1 cursor-text"
            style={{ fontSize: "16px", fontFamily: "'DM Sans', sans-serif", lineHeight: "1.4", wordWrap: "break-word" }}
            role="textbox" aria-multiline="true" aria-label="Message input"
          />

          <button
            onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(prev => !prev); }}
            type="button"
            className={`emoji-toggle-btn p-1.5 sm:p-2 transition-all shrink-0 mb-0.5 rounded-lg ${
              showEmojiPicker ? "text-yellow-400 bg-zinc-800 rotate-12" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            }`}
            disabled={!connected}>
            <Smile size={18} className="sm:w-5 sm:h-5" />
          </button>

          <button onClick={handleSend} disabled={!connected || !inputMessage.trim()} type="button"
            className="send-btn w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-black flex items-center justify-center shrink-0 disabled:opacity-20 disabled:cursor-not-allowed border-none cursor-pointer mb-0.5 font-medium">
            <Send size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium pointer-events-none z-50 whitespace-nowrap border shadow-lg msg-new ${
          toastType === "success" ? "bg-green-950 text-green-400 border-green-900" : "bg-yellow-950 text-yellow-400 border-yellow-900"
        }`}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default Chat;