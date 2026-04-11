from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import shutil
import asyncio
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Set
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# WebSocket connection manager for DJ Live streaming
class DJStreamManager:
    def __init__(self):
        self.dj_connection: Optional[WebSocket] = None
        self.listeners: Set[WebSocket] = set()
        self.is_live: bool = False
        self.current_dj: Optional[str] = None
        self.stream_start_time: Optional[datetime] = None
    
    async def connect_dj(self, websocket: WebSocket, dj_name: str):
        if self.dj_connection is not None:
            await websocket.close(code=4001, reason="Another DJ is already broadcasting")
            return False
        
        await websocket.accept()
        self.dj_connection = websocket
        self.is_live = True
        self.current_dj = dj_name
        self.stream_start_time = datetime.now(timezone.utc)
        
        # Notify all listeners that DJ is live
        await self.broadcast_status()
        return True
    
    async def disconnect_dj(self):
        self.dj_connection = None
        self.is_live = False
        self.current_dj = None
        self.stream_start_time = None
        await self.broadcast_status()
    
    async def connect_listener(self, websocket: WebSocket):
        await websocket.accept()
        self.listeners.add(websocket)
        # Send current status to new listener
        await websocket.send_json({
            "type": "status",
            "is_live": self.is_live,
            "dj_name": self.current_dj,
            "listener_count": len(self.listeners)
        })
    
    def disconnect_listener(self, websocket: WebSocket):
        self.listeners.discard(websocket)
    
    async def broadcast_audio(self, audio_data: bytes):
        """Broadcast audio to all listeners"""
        disconnected = set()
        for listener in self.listeners:
            try:
                await listener.send_bytes(audio_data)
            except:
                disconnected.add(listener)
        
        # Clean up disconnected listeners
        self.listeners -= disconnected
    
    async def broadcast_status(self):
        """Broadcast DJ status to all listeners"""
        status = {
            "type": "status",
            "is_live": self.is_live,
            "dj_name": self.current_dj,
            "listener_count": len(self.listeners)
        }
        disconnected = set()
        for listener in self.listeners:
            try:
                await listener.send_json(status)
            except:
                disconnected.add(listener)
        self.listeners -= disconnected
    
    def get_status(self):
        return {
            "is_live": self.is_live,
            "dj_name": self.current_dj,
            "listener_count": len(self.listeners),
            "stream_start_time": self.stream_start_time.isoformat() if self.stream_start_time else None
        }

dj_stream_manager = DJStreamManager()

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    role: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "dj"
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class StreamStatus(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    is_live: bool = False
    stream_url: Optional[str] = None
    current_dj: Optional[str] = None
    listeners: int = 0
    started_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StreamStatusUpdate(BaseModel):
    is_live: Optional[bool] = None
    stream_url: Optional[str] = None
    current_dj: Optional[str] = None
    listeners: Optional[int] = None

class Track(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    artist: str
    album: Optional[str] = None
    duration: Optional[int] = None
    played_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    dj_id: Optional[str] = None

class TrackCreate(BaseModel):
    title: str
    artist: str
    album: Optional[str] = None
    duration: Optional[int] = None
    dj_id: Optional[str] = None

class ScheduleItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dj_id: str
    dj_name: str
    day_of_week: int
    start_time: str
    end_time: str
    show_name: str
    description: Optional[str] = None

class ScheduleItemCreate(BaseModel):
    dj_id: str
    dj_name: str
    day_of_week: int
    start_time: str
    end_time: str
    show_name: str
    description: Optional[str] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VisitorStats(BaseModel):
    total_visits: int = 0
    unique_visitors: int = 0
    today_visits: int = 0

class StreamMetadata(BaseModel):
    title: str = ""
    artist: str = ""
    song: str = ""
    listeners: int = 0
    server_name: str = ""
    bitrate: int = 0
    is_live: bool = False

class SocialLinks(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    facebook: str = ""
    instagram: str = ""
    tiktok: str = ""
    youtube: str = ""
    twitter: str = ""
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Advertisement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = ""
    image_url: str
    link_url: Optional[str] = ""
    is_active: bool = True
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdvertisementCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    image_url: str
    link_url: Optional[str] = ""
    is_active: bool = True
    order: int = 0

class WeatherData(BaseModel):
    city: str
    country: str
    temp_c: float
    temp_f: float
    condition: str
    icon: str
    humidity: int
    wind_kph: float

class ChatMessageCreate(BaseModel):
    username: str
    message: str

class ChatMessagesResponse(BaseModel):
    messages: List[ChatMessage]
    online_count: int

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"username": username}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@api_router.post("/auth/register", response_model=User)
async def register(user_input: UserCreate):
    existing = await db.users.find_one({"username": user_input.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = get_password_hash(user_input.password)
    user_dict = user_input.model_dump()
    user_dict.pop('password')
    user_obj = User(**user_dict)
    
    doc = user_obj.model_dump()
    doc['password'] = hashed_password
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user_obj

@api_router.post("/auth/login", response_model=Token)
async def login(user_input: UserLogin):
    user = await db.users.find_one({"username": user_input.username}, {"_id": 0})
    if not user or not verify_password(user_input.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user.pop('password')
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user_obj = User(**user)
    access_token = create_access_token(data={"sub": user_obj.username})
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/stream/status", response_model=StreamStatus)
async def get_stream_status():
    status_doc = await db.stream_status.find_one({}, {"_id": 0})
    if not status_doc:
        default_status = StreamStatus()
        doc = default_status.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.stream_status.insert_one(doc)
        return default_status
    
    if isinstance(status_doc.get('updated_at'), str):
        status_doc['updated_at'] = datetime.fromisoformat(status_doc['updated_at'])
    if isinstance(status_doc.get('started_at'), str):
        status_doc['started_at'] = datetime.fromisoformat(status_doc['started_at'])
    
    return StreamStatus(**status_doc)

@api_router.put("/stream/status", response_model=StreamStatus)
async def update_stream_status(update: StreamStatusUpdate, current_user: User = Depends(get_current_admin)):
    current_status = await db.stream_status.find_one({}, {"_id": 0})
    if not current_status:
        current_status = StreamStatus().model_dump()
    
    update_data = update.model_dump(exclude_unset=True)
    if update_data.get('is_live') and not current_status.get('is_live'):
        update_data['started_at'] = datetime.now(timezone.utc).isoformat()
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.stream_status.update_one({}, {"$set": update_data}, upsert=True)
    
    updated = await db.stream_status.find_one({}, {"_id": 0})
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    if isinstance(updated.get('started_at'), str):
        updated['started_at'] = datetime.fromisoformat(updated['started_at'])
    
    return StreamStatus(**updated)

@api_router.get("/djs", response_model=List[User])
async def get_djs(limit: int = 50):
    djs = await db.users.find({"role": "dj"}, {"_id": 0, "password": 0}).limit(limit).to_list(limit)
    for dj in djs:
        if isinstance(dj.get('created_at'), str):
            dj['created_at'] = datetime.fromisoformat(dj['created_at'])
    return djs

@api_router.get("/djs/{dj_id}", response_model=User)
async def get_dj(dj_id: str):
    dj = await db.users.find_one({"id": dj_id, "role": "dj"}, {"_id": 0, "password": 0})
    if not dj:
        raise HTTPException(status_code=404, detail="DJ not found")
    if isinstance(dj.get('created_at'), str):
        dj['created_at'] = datetime.fromisoformat(dj['created_at'])
    return User(**dj)

@api_router.put("/djs/{dj_id}", response_model=User)
async def update_dj(dj_id: str, update_data: dict, current_user: User = Depends(get_current_admin)):
    dj = await db.users.find_one({"id": dj_id}, {"_id": 0})
    if not dj:
        raise HTTPException(status_code=404, detail="DJ not found")
    
    allowed_fields = ['full_name', 'bio', 'avatar_url', 'email']
    filtered_update = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    await db.users.update_one({"id": dj_id}, {"$set": filtered_update})
    
    updated = await db.users.find_one({"id": dj_id}, {"_id": 0, "password": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return User(**updated)

@api_router.delete("/djs/{dj_id}")
async def delete_dj(dj_id: str, current_user: User = Depends(get_current_admin)):
    result = await db.users.delete_one({"id": dj_id, "role": "dj"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="DJ not found")
    return {"message": "DJ deleted successfully"}

@api_router.get("/tracks/current", response_model=Optional[Track])
async def get_current_track():
    track = await db.tracks.find_one({}, {"_id": 0}, sort=[("played_at", -1)])
    if not track:
        return None
    if isinstance(track.get('played_at'), str):
        track['played_at'] = datetime.fromisoformat(track['played_at'])
    return Track(**track)

@api_router.get("/tracks/history", response_model=List[Track])
async def get_track_history(limit: int = 20):
    tracks = await db.tracks.find({}, {"_id": 0}).sort("played_at", -1).limit(limit).to_list(limit)
    for track in tracks:
        if isinstance(track.get('played_at'), str):
            track['played_at'] = datetime.fromisoformat(track['played_at'])
    return tracks

@api_router.post("/tracks", response_model=Track)
async def add_track(track_input: TrackCreate, current_user: User = Depends(get_current_admin)):
    track_obj = Track(**track_input.model_dump())
    doc = track_obj.model_dump()
    doc['played_at'] = doc['played_at'].isoformat()
    await db.tracks.insert_one(doc)
    return track_obj

@api_router.get("/schedule", response_model=List[ScheduleItem])
async def get_schedule(limit: int = 100):
    items = await db.schedule.find({}, {"_id": 0}).limit(limit).to_list(limit)
    return items

@api_router.post("/schedule", response_model=ScheduleItem)
async def create_schedule_item(item_input: ScheduleItemCreate, current_user: User = Depends(get_current_admin)):
    item_obj = ScheduleItem(**item_input.model_dump())
    doc = item_obj.model_dump()
    await db.schedule.insert_one(doc)
    return item_obj

@api_router.delete("/schedule/{schedule_id}")
async def delete_schedule_item(schedule_id: str, current_user: User = Depends(get_current_admin)):
    result = await db.schedule.delete_one({"id": schedule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule item not found")
    return {"message": "Schedule item deleted successfully"}

@api_router.post("/chat/messages", response_model=ChatMessage)
async def create_chat_message(message_input: ChatMessageCreate):
    # Validate message
    if not message_input.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(message_input.message) > 200:
        raise HTTPException(status_code=400, detail="Message too long")
    if len(message_input.username) > 20:
        raise HTTPException(status_code=400, detail="Username too long")
    
    message_obj = ChatMessage(**message_input.model_dump())
    doc = message_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.chat_messages.insert_one(doc)
    
    # Keep only last 100 messages
    total_count = await db.chat_messages.count_documents({})
    if total_count > 100:
        messages_to_delete = await db.chat_messages.find({}, {"_id": 1}).sort("created_at", 1).limit(total_count - 100).to_list(total_count - 100)
        ids_to_delete = [msg["_id"] for msg in messages_to_delete]
        await db.chat_messages.delete_many({"_id": {"$in": ids_to_delete}})
    
    return message_obj

@api_router.get("/chat/messages", response_model=ChatMessagesResponse)
async def get_chat_messages(limit: int = 50):
    messages = await db.chat_messages.find({}, {"_id": 0}).sort("created_at", 1).limit(limit).to_list(limit)
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    
    # Calculate online count (users who sent messages in last 5 minutes)
    five_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    recent_users = await db.chat_messages.distinct("username", {
        "created_at": {"$gte": five_minutes_ago.isoformat()}
    })
    online_count = len(recent_users)
    
    return ChatMessagesResponse(messages=messages, online_count=online_count)

@api_router.delete("/chat/messages")
async def clear_chat_messages(current_user: User = Depends(get_current_admin)):
    result = await db.chat_messages.delete_many({})
    return {"message": f"Deleted {result.deleted_count} messages"}

@api_router.post("/visitors/track")
async def track_visitor(request_data: dict = {}):
    """Registra una visita a la página"""
    visitor_id = request_data.get('visitor_id', str(uuid.uuid4()))
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    # Incrementar contador total
    await db.visitor_stats.update_one(
        {"type": "global"},
        {"$inc": {"total_visits": 1}},
        upsert=True
    )
    
    # Registrar visitante único
    existing_visitor = await db.visitors.find_one({"visitor_id": visitor_id})
    if not existing_visitor:
        await db.visitors.insert_one({
            "visitor_id": visitor_id,
            "first_visit": datetime.now(timezone.utc).isoformat(),
            "last_visit": datetime.now(timezone.utc).isoformat()
        })
        await db.visitor_stats.update_one(
            {"type": "global"},
            {"$inc": {"unique_visitors": 1}},
            upsert=True
        )
    else:
        await db.visitors.update_one(
            {"visitor_id": visitor_id},
            {"$set": {"last_visit": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Contador de hoy
    await db.daily_visits.update_one(
        {"date": today},
        {"$inc": {"count": 1}},
        upsert=True
    )
    
    return {"success": True, "visitor_id": visitor_id}

@api_router.get("/visitors/stats", response_model=VisitorStats)
async def get_visitor_stats():
    """Obtiene las estadísticas de visitantes"""
    # Números base iniciales para mostrar credibilidad
    BASE_TOTAL_VISITS = 30000
    BASE_UNIQUE_VISITORS = 12500
    BASE_TODAY_VISITS = 150
    
    global_stats = await db.visitor_stats.find_one({"type": "global"}, {"_id": 0})
    
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    today_stats = await db.daily_visits.find_one({"date": today}, {"_id": 0})
    
    return VisitorStats(
        total_visits=BASE_TOTAL_VISITS + (global_stats.get("total_visits", 0) if global_stats else 0),
        unique_visitors=BASE_UNIQUE_VISITORS + (global_stats.get("unique_visitors", 0) if global_stats else 0),
        today_visits=BASE_TODAY_VISITS + (today_stats.get("count", 0) if today_stats else 0)
    )

@api_router.get("/stream/metadata", response_model=StreamMetadata)
async def get_stream_metadata():
    """Obtiene los metadatos actuales del stream de Icecast"""
    import httpx
    
    # URL del endpoint de metadatos de Icecast
    metadata_url = os.environ.get('STREAM_METADATA_URL')
    
    if not metadata_url:
        logger.warning("STREAM_METADATA_URL not set in environment")
        return StreamMetadata(
            title="",
            artist="",
            song="",
            listeners=0,
            server_name="SalsaMixLive",
            bitrate=128,
            is_live=False
        )
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(metadata_url)
            if response.status_code == 200:
                data = response.json()
                
                # Extraer información del source
                icestats = data.get('icestats', {})
                source = icestats.get('source', {})
                
                # Si hay múltiples sources, puede ser una lista
                if isinstance(source, list):
                    source = source[0] if source else {}
                
                # Parsear el título (formato: "Artista - Canción")
                full_title = source.get('title', '')
                artist = ""
                song = ""
                
                if ' - ' in full_title:
                    parts = full_title.split(' - ', 1)
                    artist = parts[0].strip()
                    song = parts[1].strip()
                else:
                    song = full_title
                
                return StreamMetadata(
                    title=full_title,
                    artist=artist,
                    song=song,
                    listeners=source.get('listeners', 0),
                    server_name=source.get('server_name', 'SalsaMixLive'),
                    bitrate=source.get('bitrate', 128),
                    is_live=True
                )
    except Exception as e:
        logger.error(f"Error fetching stream metadata: {e}")
    
    # Retornar valores por defecto si hay error
    return StreamMetadata(
        title="",
        artist="",
        song="",
        listeners=0,
        server_name="SalsaMixLive",
        bitrate=128,
        is_live=False
    )

@api_router.get("/stream/proxy")
async def stream_proxy():
    """Proxy HTTPS para el stream HTTP de Asura Hosting - Optimizado para estabilidad"""
    from starlette.responses import StreamingResponse
    import httpx
    
    stream_url = os.environ.get('STREAM_URL', 'http://cast1.asurahosting.com:7527/autodj')
    
    async def generate():
        while True:
            try:
                # Timeout largo para streaming continuo
                timeout = httpx.Timeout(connect=10.0, read=300.0, write=10.0, pool=10.0)
                
                async with httpx.AsyncClient(timeout=timeout, http2=False) as http_client:
                    async with http_client.stream(
                        'GET', 
                        stream_url,
                        headers={
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                            "Accept": "*/*",
                            "Connection": "keep-alive",
                            "Icy-MetaData": "0",
                        }
                    ) as response:
                        if response.status_code != 200:
                            logger.error(f"Stream returned status {response.status_code}")
                            await asyncio.sleep(2)
                            continue
                        
                        # Chunks grandes para mejor buffering (16KB)
                        async for chunk in response.aiter_bytes(chunk_size=16384):
                            if chunk:
                                yield chunk
                                
            except httpx.TimeoutException:
                logger.warning("Stream timeout, reconnecting...")
                await asyncio.sleep(1)
                continue
            except httpx.ConnectError:
                logger.warning("Stream connection error, reconnecting...")
                await asyncio.sleep(2)
                continue
            except Exception as e:
                logger.error(f"Stream error: {e}")
                await asyncio.sleep(2)
                continue
    
    return StreamingResponse(
        generate(),
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "*",
            "Accept-Ranges": "none",
            "Connection": "keep-alive",
            "X-Content-Type-Options": "nosniff",
        }
    )

# ============== SOCIAL LINKS ==============
@api_router.get("/social-links")
async def get_social_links():
    """Obtiene los enlaces de redes sociales"""
    links = await db.social_links.find_one({}, {"_id": 0})
    if not links:
        # Crear enlaces por defecto
        default_links = SocialLinks()
        doc = default_links.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.social_links.insert_one(doc)
        return default_links
    if isinstance(links.get('updated_at'), str):
        links['updated_at'] = datetime.fromisoformat(links['updated_at'])
    return SocialLinks(**links)

@api_router.put("/social-links")
async def update_social_links(links: dict, current_user: User = Depends(get_current_admin)):
    """Actualiza los enlaces de redes sociales"""
    allowed_fields = ['facebook', 'instagram', 'tiktok', 'youtube', 'twitter']
    filtered = {k: v for k, v in links.items() if k in allowed_fields}
    filtered['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.social_links.update_one({}, {"$set": filtered}, upsert=True)
    return {"message": "Social links updated successfully"}

# ============== ADVERTISEMENTS ==============
@api_router.get("/advertisements", response_model=List[Advertisement])
async def get_advertisements(active_only: bool = True):
    """Obtiene los anuncios publicitarios"""
    query = {"is_active": True} if active_only else {}
    ads = await db.advertisements.find(query, {"_id": 0}).sort("order", 1).to_list(50)
    for ad in ads:
        if isinstance(ad.get('created_at'), str):
            ad['created_at'] = datetime.fromisoformat(ad['created_at'])
    return ads

@api_router.post("/advertisements", response_model=Advertisement)
async def create_advertisement(ad_input: AdvertisementCreate, current_user: User = Depends(get_current_admin)):
    """Crea un nuevo anuncio publicitario"""
    ad_obj = Advertisement(**ad_input.model_dump())
    doc = ad_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.advertisements.insert_one(doc)
    return ad_obj

@api_router.put("/advertisements/{ad_id}", response_model=Advertisement)
async def update_advertisement(ad_id: str, update_data: dict, current_user: User = Depends(get_current_admin)):
    """Actualiza un anuncio publicitario"""
    allowed_fields = ['title', 'description', 'image_url', 'link_url', 'is_active', 'order']
    filtered = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    result = await db.advertisements.update_one({"id": ad_id}, {"$set": filtered})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    
    updated = await db.advertisements.find_one({"id": ad_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Advertisement(**updated)

@api_router.delete("/advertisements/{ad_id}")
async def delete_advertisement(ad_id: str, current_user: User = Depends(get_current_admin)):
    """Elimina un anuncio publicitario"""
    result = await db.advertisements.delete_one({"id": ad_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    return {"message": "Advertisement deleted successfully"}

# ============== FILE UPLOAD ==============
@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_admin)):
    """Sube una imagen al servidor"""
    # Validar tipo de archivo
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido. Use JPG, PNG, GIF o WEBP")
    
    # Generar nombre único
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Guardar archivo
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar archivo: {str(e)}")
    
    # Retornar URL
    return {
        "filename": unique_filename,
        "url": f"/uploads/{unique_filename}",
        "message": "Imagen subida exitosamente"
    }

# ============== WEATHER ==============
@api_router.get("/weather")
async def get_weather():
    """Obtiene el clima de New York y Cali, Colombia"""
    import httpx
    
    # Datos de clima simulados (en producción usar una API real como OpenWeatherMap)
    # Por ahora usamos wttr.in que es gratuita y no requiere API key
    cities = [
        {"name": "New York", "country": "USA", "query": "New+York"},
        {"name": "Cali", "country": "Colombia", "query": "Cali,Colombia"}
    ]
    
    weather_data = []
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for city in cities:
            try:
                # Usar wttr.in API gratuita
                response = await client.get(
                    f"https://wttr.in/{city['query']}?format=j1",
                    headers={"User-Agent": "curl/7.68.0"}
                )
                if response.status_code == 200:
                    data = response.json()
                    current = data.get('current_condition', [{}])[0]
                    
                    weather_data.append({
                        "city": city['name'],
                        "country": city['country'],
                        "temp_c": float(current.get('temp_C', 0)),
                        "temp_f": float(current.get('temp_F', 0)),
                        "condition": current.get('weatherDesc', [{}])[0].get('value', 'Unknown'),
                        "icon": get_weather_emoji(current.get('weatherCode', '113')),
                        "humidity": int(current.get('humidity', 0)),
                        "wind_kph": float(current.get('windspeedKmph', 0))
                    })
            except Exception as e:
                logger.error(f"Error fetching weather for {city['name']}: {e}")
                # Datos por defecto en caso de error
                weather_data.append({
                    "city": city['name'],
                    "country": city['country'],
                    "temp_c": 20.0,
                    "temp_f": 68.0,
                    "condition": "No disponible",
                    "icon": "🌡️",
                    "humidity": 0,
                    "wind_kph": 0.0
                })
    
    return weather_data

def get_weather_emoji(code: str) -> str:
    """Convierte código de clima a emoji"""
    weather_emojis = {
        '113': '☀️',  # Sunny
        '116': '⛅',  # Partly cloudy
        '119': '☁️',  # Cloudy
        '122': '☁️',  # Overcast
        '143': '🌫️',  # Mist
        '176': '🌧️',  # Patchy rain
        '179': '🌨️',  # Patchy snow
        '182': '🌧️',  # Patchy sleet
        '185': '🌧️',  # Patchy freezing drizzle
        '200': '⛈️',  # Thundery outbreaks
        '227': '🌨️',  # Blowing snow
        '230': '❄️',  # Blizzard
        '248': '🌫️',  # Fog
        '260': '🌫️',  # Freezing fog
        '263': '🌧️',  # Patchy light drizzle
        '266': '🌧️',  # Light drizzle
        '281': '🌧️',  # Freezing drizzle
        '284': '🌧️',  # Heavy freezing drizzle
        '293': '🌧️',  # Patchy light rain
        '296': '🌧️',  # Light rain
        '299': '🌧️',  # Moderate rain
        '302': '🌧️',  # Heavy rain
        '305': '🌧️',  # Heavy rain
        '308': '🌧️',  # Heavy rain
        '311': '🌧️',  # Freezing rain
        '314': '🌧️',  # Heavy freezing rain
        '317': '🌨️',  # Light sleet
        '320': '🌨️',  # Moderate sleet
        '323': '🌨️',  # Patchy light snow
        '326': '🌨️',  # Light snow
        '329': '🌨️',  # Patchy moderate snow
        '332': '🌨️',  # Moderate snow
        '335': '🌨️',  # Patchy heavy snow
        '338': '❄️',  # Heavy snow
        '350': '🌨️',  # Ice pellets
        '353': '🌧️',  # Light rain shower
        '356': '🌧️',  # Moderate rain shower
        '359': '🌧️',  # Torrential rain shower
        '362': '🌨️',  # Light sleet showers
        '365': '🌨️',  # Moderate sleet showers
        '368': '🌨️',  # Light snow showers
        '371': '🌨️',  # Moderate snow showers
        '374': '🌨️',  # Light ice pellet showers
        '377': '🌨️',  # Moderate ice pellet showers
        '386': '⛈️',  # Patchy light rain with thunder
        '389': '⛈️',  # Moderate heavy rain with thunder
        '392': '⛈️',  # Patchy light snow with thunder
        '395': '⛈️',  # Moderate heavy snow with thunder
    }
    return weather_emojis.get(code, '🌡️')

# ============== DJ LIVE STREAMING ==============
@api_router.get("/dj-live/status")
async def get_dj_live_status():
    """Get current DJ live streaming status"""
    return dj_stream_manager.get_status()

@app.websocket("/api/ws/dj-broadcast/{dj_name}")
async def dj_broadcast_websocket(websocket: WebSocket, dj_name: str):
    """WebSocket endpoint for DJ to broadcast audio"""
    # Verify token from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4003, reason="No token provided")
        return
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user or user.get("role") != "admin":
            await websocket.close(code=4003, reason="Not authorized")
            return
    except:
        await websocket.close(code=4003, reason="Invalid token")
        return
    
    connected = await dj_stream_manager.connect_dj(websocket, dj_name)
    if not connected:
        return
    
    logger.info(f"DJ '{dj_name}' started broadcasting")
    
    try:
        while True:
            # Receive audio data from DJ
            data = await websocket.receive_bytes()
            # Broadcast to all listeners
            await dj_stream_manager.broadcast_audio(data)
    except WebSocketDisconnect:
        logger.info(f"DJ '{dj_name}' disconnected")
    except Exception as e:
        logger.error(f"DJ broadcast error: {e}")
    finally:
        await dj_stream_manager.disconnect_dj()

@app.websocket("/api/ws/dj-listen")
async def dj_listen_websocket(websocket: WebSocket):
    """WebSocket endpoint for listeners to receive DJ audio"""
    await dj_stream_manager.connect_listener(websocket)
    
    try:
        while True:
            # Keep connection alive, receive any messages (like ping)
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Listener error: {e}")
    finally:
        dj_stream_manager.disconnect_listener(websocket)

app.include_router(api_router)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()