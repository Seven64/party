import os
import uuid
import logging
import secrets
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional

import aiosqlite
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from ytmusicapi import YTMusic


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "ADMIN")
SQLITE_PATH = os.environ.get("SQLITE_PATH", str(ROOT_DIR / "queuebeats.db"))

# In-memory session token store (survives across requests, reset on restart)
ADMIN_TOKENS: set[str] = set()

# YouTube Music (unauthenticated)
yt = YTMusic()

app = FastAPI(title="QueueBeats API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("queuebeats")


# ---------- Models ----------
class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str


class PartyCreate(BaseModel):
    name: str


class Party(BaseModel):
    id: str
    name: str
    created_at: str


class SearchResult(BaseModel):
    videoId: str
    title: str
    artist: str
    thumbnail: Optional[str] = None
    duration: Optional[str] = None


class QueueAdd(BaseModel):
    videoId: str
    title: str
    artist: str
    thumbnail: Optional[str] = None
    duration: Optional[str] = None
    guest_name: str
    priority: bool = False


class QueueItem(BaseModel):
    id: str
    party_id: str
    videoId: str
    title: str
    artist: str
    thumbnail: Optional[str] = None
    duration: Optional[str] = None
    guest_name: str
    priority: bool
    added_at: str
    played: bool = False


# ---------- DB ----------
async def get_db():
    conn = await aiosqlite.connect(SQLITE_PATH)
    conn.row_factory = aiosqlite.Row
    try:
        yield conn
    finally:
        await conn.close()


async def init_db():
    async with aiosqlite.connect(SQLITE_PATH) as db:
        await db.execute(
            """CREATE TABLE IF NOT EXISTS parties (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at TEXT NOT NULL
            )"""
        )
        await db.execute(
            """CREATE TABLE IF NOT EXISTS queue (
                id TEXT PRIMARY KEY,
                party_id TEXT NOT NULL,
                videoId TEXT NOT NULL,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                thumbnail TEXT,
                duration TEXT,
                guest_name TEXT NOT NULL,
                priority INTEGER NOT NULL DEFAULT 0,
                added_at TEXT NOT NULL,
                played INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY(party_id) REFERENCES parties(id)
            )"""
        )
        await db.commit()


@app.on_event("startup")
async def _startup():
    await init_db()
    logger.info(f"QueueBeats started - SQLite at {SQLITE_PATH}")


# ---------- Auth ----------
def require_admin(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[len("Bearer "):]
    if token not in ADMIN_TOKENS:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token


@api_router.post("/admin/login", response_model=LoginResponse)
async def admin_login(body: LoginRequest):
    if body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Falsches Passwort")
    token = secrets.token_urlsafe(24)
    ADMIN_TOKENS.add(token)
    return LoginResponse(token=token)


@api_router.get("/admin/verify")
async def admin_verify(_=Depends(require_admin)):
    return {"ok": True}


@api_router.post("/admin/logout")
async def admin_logout(token: str = Depends(require_admin)):
    ADMIN_TOKENS.discard(token)
    return {"ok": True}


# ---------- Search ----------
@api_router.get("/search", response_model=List[SearchResult])
async def search(q: str, limit: int = 12):
    q = q.strip()
    if not q:
        return []
    try:
        raw = yt.search(q, filter="songs", limit=limit)
        if not raw:
            # Fallback: unauthenticated songs filter can return empty; try videos.
            raw = yt.search(q, filter="videos", limit=limit)
    except Exception as exc:
        logger.warning(f"YTMusic search failed: {exc}")
        raise HTTPException(status_code=502, detail="Suche fehlgeschlagen")

    results: list[SearchResult] = []
    for item in raw:
        vid = item.get("videoId")
        if not vid:
            continue
        artists = item.get("artists") or []
        artist = ", ".join(a.get("name", "") for a in artists if isinstance(a, dict) and a.get("name")) or "Unknown"
        thumbs = item.get("thumbnails") or []
        thumb = thumbs[-1].get("url") if thumbs else None
        results.append(SearchResult(
            videoId=vid,
            title=item.get("title") or "Untitled",
            artist=artist,
            thumbnail=thumb,
            duration=item.get("duration"),
        ))
    return results


# ---------- Parties ----------
@api_router.post("/parties", response_model=Party)
async def create_party(body: PartyCreate, _=Depends(require_admin), db=Depends(get_db)):
    pid = uuid.uuid4().hex[:8]
    created = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO parties (id, name, created_at) VALUES (?, ?, ?)",
        (pid, body.name.strip() or "Party", created),
    )
    await db.commit()
    return Party(id=pid, name=body.name.strip() or "Party", created_at=created)


@api_router.get("/parties", response_model=List[Party])
async def list_parties(_=Depends(require_admin), db=Depends(get_db)):
    cur = await db.execute("SELECT id, name, created_at FROM parties ORDER BY created_at DESC")
    rows = await cur.fetchall()
    return [Party(**dict(r)) for r in rows]


@api_router.get("/parties/{party_id}", response_model=Party)
async def get_party(party_id: str, db=Depends(get_db)):
    cur = await db.execute("SELECT id, name, created_at FROM parties WHERE id=?", (party_id,))
    row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Party nicht gefunden")
    return Party(**dict(row))


@api_router.delete("/parties/{party_id}")
async def delete_party(party_id: str, _=Depends(require_admin), db=Depends(get_db)):
    await db.execute("DELETE FROM queue WHERE party_id=?", (party_id,))
    await db.execute("DELETE FROM parties WHERE id=?", (party_id,))
    await db.commit()
    return {"ok": True}


# ---------- Queue ----------
def _row_to_queue(row) -> QueueItem:
    d = dict(row)
    d["priority"] = bool(d["priority"])
    d["played"] = bool(d["played"])
    return QueueItem(**d)


@api_router.post("/parties/{party_id}/queue", response_model=QueueItem)
async def add_to_queue(party_id: str, body: QueueAdd, db=Depends(get_db)):
    cur = await db.execute("SELECT id FROM parties WHERE id=?", (party_id,))
    if not await cur.fetchone():
        raise HTTPException(status_code=404, detail="Party nicht gefunden")
    qid = uuid.uuid4().hex
    added = datetime.now(timezone.utc).isoformat()
    await db.execute(
        """INSERT INTO queue (id, party_id, videoId, title, artist, thumbnail, duration, guest_name, priority, added_at, played)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)""",
        (qid, party_id, body.videoId, body.title, body.artist, body.thumbnail, body.duration,
         body.guest_name.strip() or "Guest", 1 if body.priority else 0, added),
    )
    await db.commit()
    cur = await db.execute("SELECT * FROM queue WHERE id=?", (qid,))
    row = await cur.fetchone()
    return _row_to_queue(row)


@api_router.get("/parties/{party_id}/queue", response_model=List[QueueItem])
async def get_queue(party_id: str, db=Depends(get_db)):
    # Ordering: not-played first, priority desc, added_at asc; then played ones last
    cur = await db.execute(
        """SELECT * FROM queue WHERE party_id=?
           ORDER BY played ASC, priority DESC, added_at ASC""",
        (party_id,),
    )
    rows = await cur.fetchall()
    return [_row_to_queue(r) for r in rows]


@api_router.post("/parties/{party_id}/queue/next", response_model=Optional[QueueItem])
async def mark_current_played(party_id: str, _=Depends(require_admin), db=Depends(get_db)):
    """Mark the currently-playing (first unplayed) song as played, return the new head."""
    cur = await db.execute(
        """SELECT * FROM queue WHERE party_id=? AND played=0
           ORDER BY priority DESC, added_at ASC LIMIT 1""",
        (party_id,),
    )
    row = await cur.fetchone()
    if row:
        await db.execute("UPDATE queue SET played=1 WHERE id=?", (row["id"],))
        await db.commit()
    # return next head
    cur = await db.execute(
        """SELECT * FROM queue WHERE party_id=? AND played=0
           ORDER BY priority DESC, added_at ASC LIMIT 1""",
        (party_id,),
    )
    nxt = await cur.fetchone()
    return _row_to_queue(nxt) if nxt else None


@api_router.delete("/parties/{party_id}/queue/{item_id}")
async def remove_queue_item(party_id: str, item_id: str, _=Depends(require_admin), db=Depends(get_db)):
    await db.execute("DELETE FROM queue WHERE id=? AND party_id=?", (item_id, party_id))
    await db.commit()
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"app": "QueueBeats", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
