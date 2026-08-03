from typing import List, Dict
from fastapi import WebSocket
from datetime import datetime
from sqlalchemy import func

from models import SessionLocal, Message


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.user_connections: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, room_id: str, username: str):
        await websocket.accept()

        if room_id not in self.active_connections:
            self.active_connections[room_id] = []

        self.active_connections[room_id].append(websocket)
        self.user_connections[websocket] = username

    def disconnect(self, websocket: WebSocket, room_id: str, username: str = None):
        if room_id in self.active_connections:
            try:
                self.active_connections[room_id].remove(websocket)
            except ValueError:
                pass

            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

        self.user_connections.pop(websocket, None)

    async def broadcast(self, message: dict, room_id: str, exclude: WebSocket = None):
        if room_id not in self.active_connections:
            return

        disconnected = []

        for connection in self.active_connections[room_id]:
            if connection == exclude:
                continue

            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn, room_id)

    def get_room_count(self, room_id: str):
        return len(self.active_connections.get(room_id, []))

    def discover(self):
        db = SessionLocal()

        try:
            results = (
                db.query(
                    Message.room_id,
                    func.count(Message.id).label("messages"),
                    func.max(Message.timestamp).label("last_activity"),
                )
                .group_by(Message.room_id)
                .all()
            )

            rooms = []

            for room_id, messages, last_activity in results:

                online = self.get_room_count(room_id)

                rooms.append({
                    "id": room_id,
                    "online": online,
                    "messages": messages,
                    "last_activity": (
                        last_activity.isoformat()
                        if last_activity else None
                    ),
                    "score": online * 10 + messages,
                })

            trending = sorted(
                rooms,
                key=lambda x: x["score"],
                reverse=True,
            )

            live = sorted(
                [r for r in rooms if r["online"] > 0],
                key=lambda x: x["online"],
                reverse=True,
            )

            return {
                "featured": trending[0] if trending else None,
                "trending": trending[:10],
                "live": live[:10],
            }

        finally:
            db.close()


manager = ConnectionManager()