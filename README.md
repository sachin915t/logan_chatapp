
# LoganChatApp

A minimal, open-source real-time chat application built with **FastAPI** + **WebSockets** on the backend and **React** + **Vite** on the frontend. Supports multiple rooms, live online counts, typing indicators, and avatar selection.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)
![WebSockets](https://img.shields.io/badge/WebSockets-native-orange.svg)

---

## ✨ Features

- 🔴 **Real-time messaging** via WebSockets — no polling, no refresh
- 🧑‍🤝‍🧑 **Multiple rooms** — join or create any room by ID
- 👥 **Live online count** — updates instantly as users join and leave
- ✍️ **Typing indicator** — bouncing dots when someone is typing
- 🎭 **Avatar selection** — pick your look before joining
- 💾 **Message persistence** — chat history saved to SQLite via SQLAlchemy
- 🔄 **Auto-reconnect** — client reconnects automatically with exponential backoff
- 📱 **Mobile optimized** — works on all screen sizes

---

## 🗂 Project Structure

```
├── backend/
│   ├── main.py          # FastAPI app, WebSocket endpoint
│   ├── manager.py       # Connection manager (rooms, broadcast, count)
│   ├── models.py        # SQLAlchemy models + DB session
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Login.jsx        # Avatar picker + room join screen
    │   │   └── Chat.jsx         # Chat UI with messages + input
    │   ├── hooks/
    │   │   └── useWebSocket.js  # WebSocket hook with reconnect + dedup
    │   └── App.jsx
    ├── .env.example
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

---

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**`requirements.txt`**
```
fastapi
uvicorn
sqlalchemy
websockets
```

---

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

**`.env.example`**
```env
VITE_WS_URL=ws://localhost:8000
VITE_API_URL=http://localhost:8000
```

---

## 📡 WebSocket Protocol

All messages are JSON. The client and server communicate using these message types:

| Type | Direction | Description |
|------|-----------|-------------|
| `message` | both | A chat message with `content`, `sender`, `avatar`, `timestamp` |
| `typing` | client → server → clients | Signals the user is typing |
| `system` | server → clients | Join/leave notifications |
| `room_count` | server → clients | Current number of users in the room |

**Example message payload:**
```json
{
  "type": "message",
  "content": "Hey everyone!",
  "sender": "naruto",
  "avatar": "https://...",
  "timestamp": "2025-03-10T14:32:00.000Z"
}
```

---

## 🔌 REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/health` | Server status |
| `GET` | `/rooms` | List active rooms with online counts |
| `WS` | `/ws/{room_id}/{username}` | WebSocket connection |

---

## 🛠 Improvements & Roadmap

Contributions are welcome! Here are areas to improve:

### 🔐 Auth & Security
- [ ] Add JWT authentication — currently anyone can join with any username
- [ ] Rate limiting on WebSocket messages to prevent spam
- [ ] Sanitize message content (XSS prevention)
- [ ] Username uniqueness enforcement per room

### 💾 Storage & History
- [ ] Switch from SQLite to PostgreSQL for production use
- [ ] Load previous messages on room join (paginated history)
- [ ] Message deletion / editing with edit history
- [ ] File and image sharing support

### 🧑‍🤝‍🧑 Rooms & Users
- [ ] Private/password-protected rooms
- [ ] User list panel showing who is online in the room
- [ ] Room creation with custom names and descriptions
- [ ] Persistent usernames with profiles

### 📱 UX & Frontend
- [ ] Unread message badge when tab is not focused
- [ ] Browser push notifications
- [ ] Message reactions (emoji)
- [ ] Reply-to / quote a message
- [ ] Dark/light theme toggle
- [ ] Sound notification on new message

### ⚙️ Infrastructure
- [ ] Redis pub/sub for horizontal scaling across multiple server instances
- [ ] Deployment guide (Railway, Render, Fly.io)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please open an issue first for major changes so we can discuss the approach.

---

---

## 👨‍💻 Author

Built by **Sachin** — open to contributions, feedback, and ideas.

---
## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.