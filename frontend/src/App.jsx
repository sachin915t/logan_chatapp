import { useState, useEffect } from "react";
import Login from "./components/Login";
import Chat from "./components/Chat";

function App() {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore session on mount
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem("chatUser");
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch {
      sessionStorage.removeItem("chatUser");
    } finally {
      setHydrated(true);
    }
  }, []);

  const handleLogin = (username, roomId, avatar) => {
    const userData = { username, roomId, avatar };
    sessionStorage.setItem("chatUser", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("chatUser");
    setUser(null);
  };

  // Avoid flash of Login screen before session is checked
  if (!hydrated) return null;

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <Chat
      username={user.username}
      roomId={user.roomId}
      avatar={user.avatar}
      onLogout={handleLogout}
    />
  );
}

export default App;