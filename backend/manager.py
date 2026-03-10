from typing import List, Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.user_connections: Dict[WebSocket, str] = {}  # Track username per connection

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
        
        if websocket in self.user_connections:
            del self.user_connections[websocket]

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

    def get_room_count(self, room_id: str) -> int:
        return len(self.active_connections.get(room_id, []))

manager = ConnectionManager()