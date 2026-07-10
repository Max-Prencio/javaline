from fastapi import WebSocket
from typing import Dict, List
import json
import asyncio


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, tenant_id: str, user_id: str):
        await websocket.accept()
        key = f"{tenant_id}:{user_id}"
        if key not in self.active_connections:
            self.active_connections[key] = []
        self.active_connections[key].append(websocket)

    def disconnect(self, websocket: WebSocket, tenant_id: str, user_id: str):
        key = f"{tenant_id}:{user_id}"
        if key in self.active_connections:
            self.active_connections[key] = [
                ws for ws in self.active_connections[key] if ws != websocket
            ]
            if not self.active_connections[key]:
                del self.active_connections[key]

    async def send_to_user(self, tenant_id: str, user_id: str, message: dict):
        key = f"{tenant_id}:{user_id}"
        if key in self.active_connections:
            for ws in self.active_connections[key]:
                try:
                    await ws.send_json(message)
                except Exception:
                    self.disconnect(ws, tenant_id, user_id)

    async def send_to_tenant(self, tenant_id: str, message: dict):
        for key, connections in list(self.active_connections.items()):
            if key.startswith(f"{tenant_id}:"):
                for ws in connections:
                    try:
                        await ws.send_json(message)
                    except Exception:
                        pass

    def get_connected_count(self, tenant_id: str = None) -> int:
        if tenant_id:
            return sum(
                1 for k in self.active_connections
                if k.startswith(f"{tenant_id}:")
            )
        return sum(len(v) for v in self.active_connections.values())


manager = ConnectionManager()
