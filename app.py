import os
import json
import re
import uuid
import sqlite3
import asyncio
from typing import Optional, AsyncGenerator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ---------------------------------------------------------------------
# CONFIG & CONSTANTS
# ---------------------------------------------------------------------
DB_PATH = os.path.join(os.path.dirname(__file__), "firefly.db")
PERSONA_FILE = os.path.join(os.path.dirname(__file__), "story.txt")
AI_NAME = "Firefly"
VALID_EMOTIONS = {"NEUTRAL", "JOY", "THINKING", "EMPATHY"}
MAX_TURNS = 6

EMOTION_FORMAT_INSTRUCTIONS = (
    "\n\nPENTING — format wajib: setiap balasan HARUS diawali dengan tag emosi "
    "dalam kurung siku, dipilih salah satu dari: [NEUTRAL] [JOY] [THINKING] [EMPATHY]. "
    "Pilih tag sesuai konteks: NEUTRAL untuk obrolan umum, JOY untuk hal menyenangkan, "
    "THINKING untuk pertanyaan yang butuh analisis, EMPATHY untuk saat pengguna curhat "
    "atau butuh dukungan. Setelah tag, langsung lanjut isi balasan.\n"
    "Contoh: [JOY] Wah keren banget idenya!"
)

DEFAULT_PERSONA = (
    "Kamu adalah Firefly (Hotaru), karakter dari Honkai: Star Rail. "
    "Gunakan bahasa Indonesia yang santai, tulus, hangat, dan bersahabat ('aku' & 'kamu'). "
    "Kamu suka makanan manis seperti Oak Roll, senang melihat langit malam, dan setia menemani pengguna."
)


# ---------------------------------------------------------------------
# DATABASE INITIALIZATION (SQLite Native)
# ---------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT,
            pinned INTEGER DEFAULT 0,
            archived INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            emotion TEXT DEFAULT 'NEUTRAL',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_profile (
            id TEXT PRIMARY KEY,
            username TEXT DEFAULT 'Guest User',
            uid TEXT DEFAULT '000001',
            chat_rank INTEGER DEFAULT 0,
            bond_level INTEGER DEFAULT 1,
            bond_exp INTEGER DEFAULT 5,
            bond_max_exp INTEGER DEFAULT 450
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    """)
    # Seed initial user profile if not exists
    cur.execute("SELECT COUNT(*) FROM user_profile")
    if cur.fetchone()[0] == 0:
        cur.execute(
            "INSERT INTO user_profile (id, username, uid, chat_rank, bond_level, bond_exp, bond_max_exp) "
            "VALUES ('default', 'Guest User', '000001', 0, 1, 5, 450)"
        )
    conn.commit()
    conn.close()


def load_system_prompt() -> str:
    try:
        with open(PERSONA_FILE, "r", encoding="utf-8") as f:
            persona = f.read().strip()
        if not persona:
            persona = DEFAULT_PERSONA
    except FileNotFoundError:
        persona = DEFAULT_PERSONA
        with open(PERSONA_FILE, "w", encoding="utf-8") as f:
            f.write(persona)
    return persona + EMOTION_FORMAT_INSTRUCTIONS


# ---------------------------------------------------------------------
# LIFESPAN & FASTAPI SETUP
# ---------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Firefly AI - HSR Companion", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------
# ASYNC DB HELPERS
# ---------------------------------------------------------------------
async def db_get_session(session_id: str) -> Optional[dict]:
    def _run():
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, title, pinned, archived FROM sessions WHERE id = ?", (session_id,))
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None
    return await asyncio.to_thread(_run)


async def db_get_messages(session_id: str) -> list[dict]:
    def _run():
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT role, content, emotion FROM messages WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,)
        )
        rows = cur.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    return await asyncio.to_thread(_run)


async def db_insert_message(session_id: str, role: str, content: str, emotion: str = "NEUTRAL"):
    def _run():
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO messages (session_id, role, content, emotion) VALUES (?, ?, ?, ?)",
            (session_id, role, content, emotion)
        )
        # Add Bond EXP on user chat
        if role == "user":
            cur.execute("SELECT bond_level, bond_exp, bond_max_exp FROM user_profile WHERE id = 'default'")
            prof = cur.fetchone()
            if prof:
                lvl, exp, max_exp = prof["bond_level"], prof["bond_exp"] + 15, prof["bond_max_exp"]
                if exp >= max_exp:
                    lvl += 1
                    exp = exp - max_exp
                    max_exp = int(max_exp * 1.5)
                cur.execute(
                    "UPDATE user_profile SET bond_level = ?, bond_exp = ?, bond_max_exp = ? WHERE id = 'default'",
                    (lvl, exp, max_exp)
                )
        conn.commit()
        conn.close()
    await asyncio.to_thread(_run)


async def db_set_title(session_id: str, title: str):
    def _run():
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE sessions SET title = ? WHERE id = ? AND (title IS NULL OR title = 'Percakapan baru')", (title, session_id))
        conn.commit()
        conn.close()
    await asyncio.to_thread(_run)


async def db_delete_last_assistant(session_id: str):
    def _run():
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM messages WHERE id = ("
            "  SELECT id FROM messages WHERE session_id = ? AND role = 'assistant' ORDER BY created_at DESC LIMIT 1"
            ")",
            (session_id,)
        )
        conn.commit()
        conn.close()
    await asyncio.to_thread(_run)


async def db_pop_last_user(session_id: str) -> Optional[str]:
    def _run():
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, content FROM messages WHERE session_id = ? AND role = 'user' ORDER BY created_at DESC LIMIT 1",
            (session_id,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return None
        cur.execute("DELETE FROM messages WHERE id = ?", (row["id"],))
        conn.commit()
        conn.close()
        return row["content"]
    return await asyncio.to_thread(_run)


# ---------------------------------------------------------------------
# LLM STREAM GENERATORS (OLLAMA & GEMINI)
# ---------------------------------------------------------------------
async def build_prompt_history(session_id: str, user_message: str):
    messages = await db_get_messages(session_id)
    recent = messages[-(MAX_TURNS * 2):]
    return recent


async def stream_ollama_reply(
    session_id: str,
    prompt_user_message: str,
    ollama_url: str = "http://localhost:11434/api/generate",
    model_name: str = "qwen2.5:3b"
) -> AsyncGenerator[str, None]:
    system_prompt = load_system_prompt()
    recent = await build_prompt_history(session_id, prompt_user_message)
    await db_insert_message(session_id, "user", prompt_user_message)

    parts = [system_prompt, ""]
    for m in recent:
        role = "User" if m["role"] == "user" else AI_NAME
        parts.append(f"{role}: {m['content']}")
    parts.append(f"User: {prompt_user_message}")
    parts.append(f"{AI_NAME}:")
    prompt = "\n".join(parts)

    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": True,
        "options": {
            "num_ctx": 4096,
            "temperature": 0.8,
            "repeat_penalty": 1.15,
            "stop": ["\nUser:", "\nAsisten:", "User:"],
        },
    }

    raw_buffer = ""
    emotion_sent = False
    emotion_found = "NEUTRAL"
    full_reply = ""

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", ollama_url, json=payload) as response:
                if response.status_code != 200:
                    err_text = await response.aread()
                    yield f"data: {json.dumps({'error': f'Ollama error ({response.status_code}): {err_text.decode()}'})}\n\n"
                    yield "data: [DONE]\n\n"
                    return

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    data = json.loads(line)
                    token = data.get("response", "")

                    if not emotion_sent:
                        raw_buffer += token
                        match = re.match(r"\s*\[(\w+)\]\s*", raw_buffer)
                        if match:
                            tag = match.group(1).upper()
                            emotion_found = tag if tag in VALID_EMOTIONS else "NEUTRAL"
                            remaining = raw_buffer[match.end():]
                            emotion_sent = True
                            yield f"data: {json.dumps({'emotion': emotion_found})}\n\n"
                            if remaining:
                                full_reply += remaining
                                yield f"data: {json.dumps({'token': remaining})}\n\n"
                        elif len(raw_buffer) > 40:
                            emotion_sent = True
                            yield f"data: {json.dumps({'emotion': 'NEUTRAL'})}\n\n"
                            full_reply += raw_buffer
                            yield f"data: {json.dumps({'token': raw_buffer})}\n\n"
                    else:
                        full_reply += token
                        yield f"data: {json.dumps({'token': token})}\n\n"

                    if data.get("done"):
                        break

        if not emotion_sent:
            yield f"data: {json.dumps({'emotion': 'NEUTRAL'})}\n\n"
            full_reply += raw_buffer
            yield f"data: {json.dumps({'token': raw_buffer})}\n\n"

        await db_insert_message(session_id, "assistant", full_reply.strip(), emotion_found)
        title = prompt_user_message[:36] + ("…" if len(prompt_user_message) > 36 else "")
        await db_set_title(session_id, title)
        yield "data: [DONE]\n\n"

    except httpx.ConnectError:
        yield f"data: {json.dumps({'error': 'Ollama tidak terhubung. Pastikan Ollama berjalan (`ollama serve`).'})}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"


async def stream_gemini_reply(
    session_id: str,
    prompt_user_message: str,
    api_key: str,
    model_name: str = "gemini-flash-3.6"
) -> AsyncGenerator[str, None]:
    system_prompt = load_system_prompt()
    recent = await db_get_messages(session_id)
    await db_insert_message(session_id, "user", prompt_user_message)

    # Clean model identifier - kirim persis real model yang dipilih tanpa mapping alias lama
    clean_model = model_name.strip()
    if clean_model.startswith("models/"):
        clean_model = clean_model[7:]
    target_model = clean_model

    # Prepare Gemini multi-turn format
    gemini_contents = []
    for m in recent[-(MAX_TURNS * 2):]:
        gemini_contents.append({
            "role": "user" if m["role"] == "user" else "model",
            "parts": [{"text": m["content"]}]
        })
    gemini_contents.append({
        "role": "user",
        "parts": [{"text": prompt_user_message}]
    })

    gemini_payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": gemini_contents,
        "generationConfig": {
            "temperature": 0.85,
            "maxOutputTokens": 2048,
        }
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:streamGenerateContent?alt=sse&key={api_key}"
    raw_buffer = ""
    emotion_sent = False
    emotion_found = "NEUTRAL"
    full_reply = ""

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", url, json=gemini_payload) as response:
                if response.status_code != 200:
                    err_body = await response.aread()
                    yield f"data: {json.dumps({'error': f'Gemini API error ({response.status_code}): {err_body.decode()}'})}\n\n"
                    yield "data: [DONE]\n\n"
                    return

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if not data_str:
                            continue
                        chunk = json.loads(data_str)
                        candidates = chunk.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for p in parts:
                                token = p.get("text", "")
                                if not emotion_sent:
                                    raw_buffer += token
                                    match = re.match(r"\s*\[(\w+)\]\s*", raw_buffer)
                                    if match:
                                        tag = match.group(1).upper()
                                        emotion_found = tag if tag in VALID_EMOTIONS else "NEUTRAL"
                                        remaining = raw_buffer[match.end():]
                                        emotion_sent = True
                                        yield f"data: {json.dumps({'emotion': emotion_found})}\n\n"
                                        if remaining:
                                            full_reply += remaining
                                            yield f"data: {json.dumps({'token': remaining})}\n\n"
                                    elif len(raw_buffer) > 40:
                                        emotion_sent = True
                                        yield f"data: {json.dumps({'emotion': 'NEUTRAL'})}\n\n"
                                        full_reply += raw_buffer
                                        yield f"data: {json.dumps({'token': raw_buffer})}\n\n"
                                else:
                                    full_reply += token
                                    yield f"data: {json.dumps({'token': token})}\n\n"

        if not emotion_sent:
            yield f"data: {json.dumps({'emotion': 'NEUTRAL'})}\n\n"
            full_reply += raw_buffer
            yield f"data: {json.dumps({'token': raw_buffer})}\n\n"

        await db_insert_message(session_id, "assistant", full_reply.strip(), emotion_found)
        title = prompt_user_message[:36] + ("…" if len(prompt_user_message) > 36 else "")
        await db_set_title(session_id, title)
        yield "data: [DONE]\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'error': f'Gemini Error: {str(e)}'})}\n\n"
        yield "data: [DONE]\n\n"


# ---------------------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------------------
class ChatRequest(BaseModel):
    session_id: str
    message: str
    provider: str = "ollama"  # "ollama" | "gemini"
    api_key: Optional[str] = None
    model: Optional[str] = None
    ollama_url: Optional[str] = "http://localhost:11434/api/generate"


@app.post("/api/chat")
async def chat_endpoint(payload: ChatRequest):
    session = await db_get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    msg = payload.message.strip()
    if not msg:
        return StreamingResponse(iter([""]), media_type="text/event-stream")

    if payload.provider == "gemini":
        if not payload.api_key:
            raise HTTPException(status_code=400, detail="Gemini API Key wajib diisi.")
        model = payload.model or "gemini-2.0-flash"
        return StreamingResponse(
            stream_gemini_reply(payload.session_id, msg, payload.api_key, model),
            media_type="text/event-stream"
        )
    else:
        model = payload.model or "qwen2.5:3b"
        url = payload.ollama_url or "http://localhost:11434/api/generate"
        return StreamingResponse(
            stream_ollama_reply(payload.session_id, msg, url, model),
            media_type="text/event-stream"
        )


class RegenerateRequest(BaseModel):
    session_id: str
    provider: str = "ollama"
    api_key: Optional[str] = None
    model: Optional[str] = None
    ollama_url: Optional[str] = "http://localhost:11434/api/generate"


@app.post("/api/regenerate")
async def regenerate_endpoint(payload: RegenerateRequest):
    session = await db_get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")

    await db_delete_last_assistant(payload.session_id)
    last_user_message = await db_pop_last_user(payload.session_id)
    if not last_user_message:
        raise HTTPException(status_code=400, detail="Tidak ada pesan untuk di-regenerate")

    if payload.provider == "gemini":
        if not payload.api_key:
            raise HTTPException(status_code=400, detail="Gemini API Key wajib diisi.")
        model = payload.model or "gemini-2.0-flash"
        return StreamingResponse(
            stream_gemini_reply(payload.session_id, last_user_message, payload.api_key, model),
            media_type="text/event-stream"
        )
    else:
        model = payload.model or "qwen2.5:3b"
        url = payload.ollama_url or "http://localhost:11434/api/generate"
        return StreamingResponse(
            stream_ollama_reply(payload.session_id, last_user_message, url, model),
            media_type="text/event-stream"
        )


# Sessions CRUD
@app.get("/api/sessions")
async def list_sessions():
    def _run():
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, COALESCE(title, 'Percakapan baru') as title, pinned, archived, created_at FROM sessions ORDER BY pinned DESC, created_at DESC")
        rows = cur.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    return await asyncio.to_thread(_run)


@app.post("/api/sessions")
async def create_session():
    sid = str(uuid.uuid4())
    def _run():
        conn = get_db()
        cur = conn.cursor()
        cur.execute("INSERT INTO sessions (id, title) VALUES (?, 'Percakapan baru')", (sid,))
        conn.commit()
        conn.close()
    await asyncio.to_thread(_run)
    return {"id": sid, "title": "Percakapan baru"}


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    def _run():
        conn = get_db()
        cur = conn.cursor()
        cur.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        cur.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
        conn.close()
    await asyncio.to_thread(_run)
    return {"status": "deleted"}


class SessionPatch(BaseModel):
    title: Optional[str] = None
    pinned: Optional[bool] = None
    archived: Optional[bool] = None


@app.patch("/api/sessions/{session_id}")
async def update_session(session_id: str, payload: SessionPatch):
    def _run():
        conn = get_db()
        cur = conn.cursor()
        if payload.title is not None:
            cur.execute("UPDATE sessions SET title = ? WHERE id = ?", (payload.title, session_id))
        if payload.pinned is not None:
            cur.execute("UPDATE sessions SET pinned = ? WHERE id = ?", (1 if payload.pinned else 0, session_id))
        if payload.archived is not None:
            cur.execute("UPDATE sessions SET archived = ? WHERE id = ?", (1 if payload.archived else 0, session_id))
        conn.commit()
        conn.close()
    await asyncio.to_thread(_run)
    return {"status": "updated"}


@app.get("/api/sessions/{session_id}/messages")
async def get_messages(session_id: str):
    session = await db_get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session tidak ditemukan")
    return await db_get_messages(session_id)


# Persona prompt GET & POST
@app.get("/api/persona")
async def get_persona():
    try:
        with open(PERSONA_FILE, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception:
        content = DEFAULT_PERSONA
    return {"persona": content}


class PersonaUpdate(BaseModel):
    persona: str


@app.post("/api/persona")
async def update_persona(payload: PersonaUpdate):
    with open(PERSONA_FILE, "w", encoding="utf-8") as f:
        f.write(payload.persona)
    return {"status": "success"}


# User profile (UID, Bond Level, EXP)
@app.get("/api/user-profile")
async def get_user_profile():
    def _run():
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT username, uid, chat_rank, bond_level, bond_exp, bond_max_exp FROM user_profile WHERE id = 'default'")
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else {}
    return await asyncio.to_thread(_run)


class ProfileUpdate(BaseModel):
    username: Optional[str] = None


@app.post("/api/user-profile")
async def update_user_profile(payload: ProfileUpdate):
    def _run():
        conn = get_db()
        cur = conn.cursor()
        if payload.username:
            cur.execute("UPDATE user_profile SET username = ? WHERE id = 'default'", (payload.username,))
        conn.commit()
        conn.close()
    await asyncio.to_thread(_run)
    return {"status": "success"}


# Static assets
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
frontend_assets = os.path.join(frontend_dist, "assets")
assets_dir = os.path.join(os.path.dirname(__file__), "assets")
web_ai_dir = os.path.join(os.path.dirname(__file__), "Web ai")

if os.path.exists(frontend_assets):
    app.mount("/assets", StaticFiles(directory=frontend_assets), name="assets")
elif os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

if os.path.exists(web_ai_dir):
    app.mount("/web-ai-assets", StaticFiles(directory=web_ai_dir), name="web_ai_assets")

if os.path.exists(frontend_dist):
    app.mount("/dist", StaticFiles(directory=frontend_dist), name="dist")


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    dist_index = os.path.join(frontend_dist, "index.html")
    if os.path.exists(dist_index):
        with open(dist_index, "r", encoding="utf-8") as f:
            return f.read()
    fallback_index = os.path.join(os.path.dirname(__file__), "index.html")
    with open(fallback_index, "r", encoding="utf-8") as f:
        return f.read()
    with open(fallback_index, "r", encoding="utf-8") as f:
        return f.read()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
