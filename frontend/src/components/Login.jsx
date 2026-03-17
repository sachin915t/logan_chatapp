import { useState, useEffect } from "react";
import { ArrowRight, Github } from "lucide-react";

const avatars = [
  "https://i.pinimg.com/originals/0f/62/05/0f62058ee89389e00e7c6b0af5f7d984.jpg",
  "https://i.redd.it/yall-want-some-profile-pictures-v0-fcfhckppx9ze1.jpg?width=736&format=pjpg&auto=webp&s=02a0dd78585418a78148ad812a8567294f9e6fad",
  "https://images.coolpfp.com/nami-pfp-13.png",
  "https://i.pinimg.com/236x/97/0f/48/970f48d37a559488863cf320c65914bd.jpg",
  "https://cdn.rafled.com/anime-icons/images/9e7dc3f73ea749d8c2b6f7c759b141236b0ec84529d927b83560b2f66454b914.jpg",
  "https://characterai.io/i/200/static/avatars/uploaded/2025/12/29/bmCyQA4y31_ClTgH2043fRYeLCtOLjhmtPMhpzR1xoA.webp?webp=true&anim=0",
  "https://i.pinimg.com/736x/71/cd/cb/71cdcb3c961414f711c1bcff140496e2.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSd4d8YKYsl5PEMn2_kmfzY7tH6nuOeMNovXg&s",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9T8wjNF3O8_oS3waoKSUlZdcz743CMsTsSg&s",
  "https://i.pinimg.com/474x/79/d0/18/79d0187512e039063cd7c5ebc3f37cec.jpg",
  "https://i.pinimg.com/736x/3e/ae/1e/3eae1ef3d5ac917449c77a7f7d323099.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSs4w8_E-QlxxDMe5chj8v9MqnbTT-GCB3oSg&s",
  'https://i.pinimg.com/1200x/8a/d9/f8/8ad9f8400a8bf8221aee075cd38bffa1.jpg',
  'https://i.pinimg.com/236x/e3/1a/e1/e31ae12d1518623de4aaf1c0e19f2661.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQThc_JxYDNL_IKil3VdPn_eBLESOwpCZrZ2A&s',
  'https://preview.redd.it/would-you-consider-kumas-backstory-the-saddest-v0-2eqdy5pcyr1f1.jpeg?width=640&crop=smart&auto=webp&s=d7c8fab22e5ec2d41dd3f5f4d75c799a9f711260',
  'https://i.pinimg.com/736x/26/90/aa/2690aa1fff3b30eb656ec1b1e0817686.jpg',
  'https://i.pinimg.com/736x/9d/41/32/9d41323ed75a9c7a74bedb7202f07d93.jpg'
];
// url issue 
export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("Elbaf");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [showRooms, setShowRooms] = useState(false);
  const [roomWarning, setRoomWarning] = useState("");
  
  useEffect(() => {
  document.title = "Logan Chat — Join a Room";
  document.querySelector('meta[name="description"]')
    ?.setAttribute("content", "Join a real-time chat room. Pick your avatar and start chatting.");
  }, []);
  
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/rooms`)
      .then(r => r.json())
      .then(data => setRooms(data.rooms))
      .catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setTimeout(() => onLogin(trimmed, roomId.trim() || "general", avatar), 500);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#0d0d0d] p-5 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap');

        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'DM Sans', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .fade-up { animation: fadeUp 0.4s ease both; }
        .delay-1 { animation-delay: 0.05s; }
        .delay-2 { animation-delay: 0.12s; }
        .delay-3 { animation-delay: 0.20s; }

        .av {
          border-radius: 50%; overflow: hidden; aspect-ratio: 1;
          cursor: pointer; border: 2px solid transparent;
          transition: border-color 0.15s, transform 0.15s;
          background: #1a1a1a;
        }
        .av:hover { transform: scale(1.08); }
        .av.on { border-color: #fff; }

        .inp {
          width: 100%; background: #1a1a1a;
          border: 1.5px solid #2a2a2a; color: #fff;
          border-radius: 12px; padding: 13px 15px;
          font-size: 16px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.2s;
          -webkit-appearance: none;
        }
        .inp::placeholder { color: #555; }
        .inp:focus { border-color: #555; }

        .submit-btn {
          width: 100%; padding: 14px; background: #fff; color: #000;
          border: none; border-radius: 12px; font-size: 15px;
          font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 6px;
          transition: opacity 0.15s, transform 0.15s;
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .room-item {
          padding: 10px 14px; cursor: pointer;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 14px; color: #fff; transition: background 0.15s;
        }
        .room-item:hover { background: #252525; }
      `}</style>

      <div
        className="w-full max-w-sm transition-all duration-400 ease-out"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {/* Header */}
        <div className={`mb-7 ${mounted ? "fade-up delay-1" : "opacity-0"}`}>
          <div className="mb-3">
  <span style={{
    fontFamily: "'Syne', sans-serif",
    fontSize: 11, fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#333",
  }}>
    ✦ LOGAN 
  </span>
</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif" }}
  className="text-2xl font-bold text-white mb-1 tracking-tight">
  Logan Chat App
</h1>
<p className="text-sm text-[#555]">
  Pick your vibe, join your room
</p>

{/* GitHub repo link */}
<a
  href="https://github.com/sachin915t/logan_chatapp"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    marginTop: 10, textDecoration: "none",
    color: "#444", fontSize: 12,
    transition: "color 0.15s",
  }}
  onMouseEnter={e => e.currentTarget.style.color = "#fff"}
  onMouseLeave={e => e.currentTarget.style.color = "#444"}
>
  <Github size={13} />
  <span>sachin915t/logan_chatapp</span>
  <ArrowRight size={11} />
</a>
         

          
        </div>

        
        

        {/* Avatar grid */}
        <div className={`mb-5 ${mounted ? "fade-up delay-2" : "opacity-0"}`}>
          <p className="text-[11px] font-semibold text-[#444] uppercase tracking-widest mb-2.5">
            Avatar
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {avatars.map((a, i) => (
              <div key={i} className={`av ${avatar === a ? "on" : ""}`} onClick={() => setAvatar(a)}>
                <img src={a} alt="" className="w-full h-full block object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className={`flex flex-col gap-2.5 ${mounted ? "fade-up delay-3" : "opacity-0"}`}
        >
          <input type="text" style={{ display: "none" }} />
          <input type="password" style={{ display: "none" }} />

          <input
  className="inp"
  type="text"
  name="chat-username"
  placeholder="zoro"
  value={username}
  maxLength={6}
  pattern="^[^\.]{1,6}$"
  onChange={(e) => {
    const value = e.target.value.replace(/\./g, ""); // remove dots
    setUsername(value.slice(0, 6)); // limit to 6 characters
  }}
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck="false"
  inputMode="text"
  data-form-type="other"
/>

          {/* Room input + dropdown */}
          <div className="relative">
          <input
  className="inp"
  type="text"
  name="chat-room"
  placeholder="Room ID"
  value={roomId}
  onChange={(e) => {
    const raw = e.target.value;

    // check if user tried invalid characters
    if (/[ .]/.test(raw)) {
      setRoomWarning("Spaces and dots are not allowed in Room ID");
    } else {
      setRoomWarning("");
    }

    // clean the value
    const cleaned = raw.replace(/[ .]/g, "").slice(0, 7);

    setRoomId(cleaned);
  }}
  onFocus={() => setShowRooms(true)}
  onBlur={() => setTimeout(() => setShowRooms(false), 150)}
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck="false"
  inputMode="text"
  data-form-type="other"
/>

{roomWarning && (
  <p style={{ color: "red", fontSize: "12px" }}>
    {roomWarning}
  </p>
)}
            {showRooms && rooms.length > 0 && (
              <div className="absolute top-[110%] left-0 right-0 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden z-10">
                {rooms.map((r) => (
                  <div key={r.room_id} className="room-item" onMouseDown={() => setRoomId(r.room_id)}>
                    <span>#{r.room_id}</span>
                    <span className="text-[#4ade80] text-xs">{r.count} online</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="submit-btn mt-1"
            disabled={!username.trim() || submitting}
          >
            {submitting
  ? <div className="spinner" />
  : <><span>Enter Room</span><ArrowRight size={15} /></>
}
          </button>
        </form>
      </div>
    </div>
  );
}
