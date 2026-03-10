from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import json
import re
import httpx
import asyncio
from bs4 import BeautifulSoup

from manager import manager
from models import Message, SessionLocal

RENDER_URL = "https://your-chat-app.onrender.com"

async def keep_alive():
    await asyncio.sleep(60)
    while True:
        try:
            async with httpx.AsyncClient() as client:
                await client.get(f"{RENDER_URL}/health")
        except:
            pass
        await asyncio.sleep(840)

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(keep_alive())
    print("Starting up...")
    yield
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/rooms")
async def get_rooms():
    rooms = [
        {"room_id": room_id, "count": count}
        for room_id, connections in manager.active_connections.items()
        if (count := len(connections)) > 0
    ]
    return {"rooms": rooms}

# Get messages with pagination support
@app.get("/rooms/{room_id}/messages")
async def get_room_messages(
    room_id: str, 
    limit: int = Query(50, ge=1, le=100),
    before: str = None  # Optional: for pagination
):
    db = SessionLocal()
    try:
        query = db.query(Message).filter(Message.room_id == room_id)
        
        if before:
            query = query.filter(Message.timestamp < before)
            
        messages = query.order_by(Message.timestamp.desc()).limit(limit).all()
        messages.reverse()  # Oldest first
        
        return {
            "messages": [
                {
                    "type": "message",
                    "content": m.content,
                    "sender": m.sender,
                    "timestamp": m.timestamp.isoformat(),
                    "avatar": m.avatar,
                }
                for m in messages
            ]
        }
    finally:
        db.close()

@app.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, username: str):
    # Validate
    if not re.match(r"^[a-zA-Z0-9_]{2,20}$", username):
        await websocket.close(code=1008)
        return
    if not re.match(r"^[a-zA-Z0-9_-]{2,30}$", room_id):
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, room_id, username)

    try:
        # Send current count
        await websocket.send_json({
            "type": "room_count",
            "count": manager.get_room_count(room_id)
        })

        # Send recent messages (last 20) - THIS IS KEY FOR MULTI-DEVICE
        db = SessionLocal()
        try:
            recent_messages = db.query(Message)\
                .filter(Message.room_id == room_id)\
                .order_by(Message.timestamp.desc())\
                .limit(20)\
                .all()
            recent_messages.reverse()
            
            for msg in recent_messages:
                await websocket.send_json({
                    "type": "message",
                    "content": msg.content,
                    "sender": msg.sender,
                    "timestamp": msg.timestamp.isoformat(),
                    "avatar": msg.avatar,
                    "_fromHistory": True,  # Mark as history
                })
        finally:
            db.close()

        # Broadcast join (to others only)
        await manager.broadcast({
            "type": "system",
            "content": f"{username} joined",
            "sender": "System",
            "timestamp": datetime.now().isoformat()
        }, room_id, exclude=websocket)

        await manager.broadcast({
            "type": "room_count",
            "count": manager.get_room_count(room_id)
        }, room_id)

        # Message loop with keepalive
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=55.0)
                
                if len(data) > 10_000:
                    await websocket.send_json({"type": "error", "content": "Message too large"})
                    continue

                message_data = json.loads(data)
                msg_type = message_data.get("type")

                # Handle client ping
                if msg_type == 'ping':
                    await websocket.send_json({"type": "pong"})
                    continue

                if msg_type == "message":
                    db = SessionLocal()
                    try:
                        db_message = Message(
                            room_id=room_id,
                            sender=username,
                            content=message_data.get("content", ""),
                            avatar=message_data.get("avatar")
                        )
                        db.add(db_message)
                        db.commit()
                        db.refresh(db_message)
                        timestamp = db_message.timestamp.isoformat()
                    finally:
                        db.close()
                else:
                    timestamp = datetime.now().isoformat()

                # Broadcast to ALL (including sender for consistency)
                await manager.broadcast({
                    "type": msg_type,
                    "content": message_data.get("content"),
                    "sender": message_data.get("sender"),
                    "avatar": message_data.get("avatar"),
                    "timestamp": timestamp
                }, room_id)

            except asyncio.TimeoutError:
                # Send server ping
                try:
                    await websocket.send_json({"type": "ping"})
                except:
                    break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, room_id, username)
        
        if room_id in manager.active_connections:
            await manager.broadcast({
                "type": "system",
                "content": f"{username} left",
                "sender": "System",
                "timestamp": datetime.now().isoformat()
            }, room_id)
            
            await manager.broadcast({
                "type": "room_count",
                "count": manager.get_room_count(room_id)
            }, room_id)

@app.get("/preview")
async def link_preview(url: str):
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(url, follow_redirects=True)
            soup = BeautifulSoup(res.text, "html.parser")
            return {
                "title": soup.find("meta", property="og:title") and soup.find("meta", property="og:title")["content"],
                "description": soup.find("meta", property="og:description") and soup.find("meta", property="og:description")["content"],
                "image": soup.find("meta", property="og:image") and soup.find("meta", property="og:image")["content"],
                "url": url,
            }
    except:
        return {"url": url}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)