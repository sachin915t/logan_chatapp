import { useState, useEffect, useCallback } from "react";
import Login from "./components/Login";
import Chat from "./components/Chat";

function App() {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore session on mount
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem("chatUser");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        // Validate saved data has required fields before restoring
        if (parsed?.username && parsed?.roomId && parsed?.avatar) {
          setUser(parsed);
        } else {
          sessionStorage.removeItem("chatUser");
        }
      }
    } catch {
      sessionStorage.removeItem("chatUser");
    } finally {
      setHydrated(true);
    }
  }, []);

  const handleLogin = useCallback((username, roomId, avatar) => {
    const userData = { username, roomId, avatar };
    try {
      sessionStorage.setItem("chatUser", JSON.stringify(userData));
    } catch {
      // sessionStorage might be blocked (private mode, storage full, etc.)
      // Still allow login, just won't persist
    }
    setUser(userData);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("chatUser");
    setUser(null);
  }, []);

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