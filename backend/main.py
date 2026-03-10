from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import json
import re
import httpx
import asyncio

from manager import manager
from models import Message, SessionLocal

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    yield
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your domain when you deploy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Chat API is running", "status": "online"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, username: str):

    # Validate username and room_id
    if not re.match(r"^[a-zA-Z0-9_]{2,20}$", username):
        await websocket.close(code=1008)
        return
    if not re.match(r"^[a-zA-Z0-9_-]{2,30}$", room_id):
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, room_id)

    # Send current count immediately to just this client
    await websocket.send_json({
        "type": "room_count",
        "count": manager.get_room_count(room_id)
    })

    # Broadcast join message + updated count to everyone
    await manager.broadcast({
        "type": "system",
        "content": f"{username} joined the room",
        "sender": "System",
        "timestamp": datetime.now().isoformat()
    }, room_id)

    await manager.broadcast({
        "type": "room_count",
        "count": manager.get_room_count(room_id)
    }, room_id)

    try:
        while True:
            data = await websocket.receive_text()

            # Manual 10KB size check
            if len(data) > 10_000:
                await websocket.send_json({"type": "error", "content": "Message too large"})
                continue

            message_data = json.loads(data)
            msg_type = message_data.get("type")

            # Save only real messages to DB
            if msg_type == "message":
                db = SessionLocal()
                try:
                    db_message = Message(
                        room_id=room_id,
                        sender=username,
                        content=message_data.get("content", "")
                    )
                    db.add(db_message)
                    db.commit()
                finally:
                    db.close()

            # Broadcast full payload
            await manager.broadcast({
                "type": msg_type,
                "content": message_data.get("content"),
                "sender": message_data.get("sender"),
                "avatar": message_data.get("avatar"),
                "timestamp": message_data.get("timestamp", datetime.now().isoformat())
            }, room_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

        await manager.broadcast({
            "type": "system",
            "content": f"{username} left the room",
            "sender": "System",
            "timestamp": datetime.now().isoformat()
        }, room_id)

        await manager.broadcast({
            "type": "room_count",
            "count": manager.get_room_count(room_id)
        }, room_id)

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(keep_alive())
    print("Starting up...")
    yield
    print("Shutting down...")

async def keep_alive():
    await asyncio.sleep(60)  # wait for server to start
    while True:
        try:
            async with httpx.AsyncClient() as client:
                await client.get("https://your-chat-app.onrender.com/health")
        except:
            pass
        await asyncio.sleep(840)  # ping every 14 minutes
        
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)