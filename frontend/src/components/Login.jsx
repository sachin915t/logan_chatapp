import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

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
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("general");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [showRooms, setShowRooms] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  // Fetch active rooms
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/rooms`)
      .then(r => r.json())
      .then(data => setRooms(data.rooms))
      .catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || submitting) return;
    setSubmitting(true);
    setTimeout(() => onLogin(username.trim(), roomId, avatar), 500);
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0d0d0d",
      fontFamily: "'DM Sans', sans-serif",
      padding: "20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700&display=swap');

        @keyframes in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .av {
          border-radius: 50%;
          overflow: hidden;
          aspect-ratio: 1;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.15s, transform 0.15s;
          background: #1a1a1a;
        }
        .av:hover { transform: scale(1.08); }
        .av.on { border-color: #fff; }

        .inp {
          width: 100%;
          box-sizing: border-box;
          background: #1a1a1a;
          border: 1.5px solid #2a2a2a;
          color: #fff;
          border-radius: 12px;
          padding: 13px 15px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s;
          -webkit-appearance: none;
        }
        .inp::placeholder { color: #555; }
        .inp:focus { border-color: #555; }

        .btn {
          width: 100%;
          padding: 14px;
          background: #fff;
          color: #000;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: opacity 0.15s, transform 0.15s;
        }
        .btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .btn:active:not(:disabled) { transform: scale(0.98); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .room-item {
          padding: 10px 14px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #fff;
          transition: background 0.15s;
        }
        .room-item:hover { background: #252525; }
      `}</style>

      <div style={{
        width: "100%",
        maxWidth: 380,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(14px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}>

        {/* Header */}
        <div style={{
          marginBottom: 28,
          animation: mounted ? "in 0.4s ease 0.05s both" : "none",
        }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 24, fontWeight: 700,
            color: "#fff", margin: "0 0 4px",
          }}>Join a room</h1>
          <p style={{ color: "#555", fontSize: 13, margin: 0 }}>
            Choose your avatar and jump in
          </p>
        </div>

        {/* Avatar grid */}
        <div style={{
          marginBottom: 20,
          animation: mounted ? "in 0.4s ease 0.12s both" : "none",
        }}>
          <p style={{
            color: "#444", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.07em", textTransform: "uppercase",
            marginBottom: 10,
          }}>Avatar</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 7 }}>
            {avatars.map((a, i) => (
              <div key={i} className={`av ${avatar === a ? "on" : ""}`} onClick={() => setAvatar(a)}>
                <img src={a} alt="" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex", flexDirection: "column", gap: 10,
            animation: mounted ? "in 0.4s ease 0.2s both" : "none",
          }}
        >
          <input
            className="inp"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            required
          />

          {/* Room input with dropdown */}
          <div style={{ position: "relative" }}>
            <input
              className="inp"
              type="text"
              placeholder="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onFocus={() => setShowRooms(true)}
              onBlur={() => setTimeout(() => setShowRooms(false), 150)}
              autoComplete="off"
              autoCapitalize="off"
            />

            {showRooms && rooms.length > 0 && (
              <div style={{
                position: "absolute", top: "110%", left: 0, right: 0,
                background: "#1a1a1a",
                border: "1.5px solid #2a2a2a",
                borderRadius: 12,
                overflow: "hidden",
                zIndex: 10,
              }}>
                {rooms.map((r) => (
                  <div
                    key={r.room_id}
                    className="room-item"
                    onMouseDown={() => setRoomId(r.room_id)}
                  >
                    <span>#{r.room_id}</span>
                    <span style={{ color: "#4ade80", fontSize: 12 }}>
                      {r.count} online
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn"
            disabled={!username.trim() || submitting}
            style={{ marginTop: 4 }}
          >
            {submitting
              ? <div className="spinner" />
              : <><span>Join Room</span><ArrowRight size={15} /></>
            }
          </button>
        </form>

      </div>
    </div>
  );
}