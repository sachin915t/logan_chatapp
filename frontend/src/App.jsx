import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import Login from "./components/Login";
import Chat from "./components/Chat";
import DiscoverRooms from "./components/DiscoverRooms";

function LoginRoute({ user, onLogin }) {
  if (user) return <Navigate to="/discover" replace />;
  return <Login onLogin={onLogin} />;
}

function DiscoverRoute({ user, rooms, onJoin, onBack }) {
  if (!user) return <Navigate to="/" replace />;
  return <DiscoverRooms rooms={rooms} onJoin={onJoin} onBack={onBack} />;
}

function RoomRoute({ user, onLogout }) {
  const { roomId: rawRoomId } = useParams();
  const roomId = decodeURIComponent(rawRoomId ?? "");

  if (!user) return <Navigate to="/" replace />;
  if (!roomId) return <Navigate to="/discover" replace />;

  return (
    <Chat
      username={user.username}
      roomId={roomId}
      avatar={user.avatar}
      onLogout={onLogout}
    />
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const navigate = useNavigate();

  // Restore session (username/avatar only — the room comes from the URL)
  useEffect(() => {
    async function restore() {
      try {
        const saved = sessionStorage.getItem("chatUser");

        if (saved) {
          const parsed = JSON.parse(saved);

          if (parsed?.username && parsed?.avatar) {
            setUser(parsed);

            try {
              const res = await fetch(`${import.meta.env.VITE_API_URL}/discover`);
              const data = await res.json();
              setRooms(data.trending || []);
            } catch (err) {
              console.error(err);
            }
          }
        }
      } catch {
        sessionStorage.removeItem("chatUser");
      } finally {
        setHydrated(true);
      }
    }

    restore();
  }, []);

  const handleLogin = useCallback(
    async (username, avatar) => {
      const userData = { username, avatar };
      sessionStorage.setItem("chatUser", JSON.stringify(userData));
      setUser(userData);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/discover`);
        const data = await res.json();
        setRooms(data.trending || []);
      } catch (err) {
        console.error(err);
      }

      navigate("/discover");
    },
    [navigate]
  );

  const handleJoin = useCallback(
    (roomId) => {
      navigate(`/room/${encodeURIComponent(roomId)}`);
    },
    [navigate]
  );

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("chatUser");
    setUser(null);
    setRooms([]);
    navigate("/");
  }, [navigate]);

  if (!hydrated) return null;

  return (
    <Routes>
      <Route path="/" element={<LoginRoute user={user} onLogin={handleLogin} />} />
      <Route
        path="/discover"
        element={
          <DiscoverRoute
            user={user}
            rooms={rooms}
            onJoin={handleJoin}
            onBack={handleLogout}
          />
        }
      />
      <Route
        path="/room/:roomId"
        element={<RoomRoute user={user} onLogout={handleLogout} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
