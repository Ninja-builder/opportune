"""Opportune — AI-powered Student Opportunity Aggregator backend."""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os, logging, uuid, bcrypt, jwt as pyjwt

from seed_data import seed_if_empty
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Opportune API")
api = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)
logger = logging.getLogger("opportune")
logging.basicConfig(level=logging.INFO)


# ------------------------------ Models ------------------------------
class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: Literal["student", "admin"] = "student"
    grade_level: Optional[str] = None
    country: Optional[str] = None
    interests: List[str] = []
    onboarded: bool = False
    created_at: str


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class OnboardingIn(BaseModel):
    grade_level: str
    country: str
    interests: List[str]


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    grade_level: Optional[str] = None
    country: Optional[str] = None
    interests: Optional[List[str]] = None
    bio: Optional[str] = None


class Opportunity(BaseModel):
    id: str
    title: str
    organization: str
    type: str
    field: str
    description: str
    country: str
    remote: bool
    grade_levels: List[str]
    eligibility: str
    deadline: str
    prize: Optional[str] = None
    url: str
    source: str
    tags: List[str]
    featured: bool = False
    popularity: int = 0


class OpportunityIn(BaseModel):
    title: str
    organization: str
    type: str
    field: str
    description: str
    country: str
    remote: bool = False
    grade_levels: List[str] = []
    eligibility: str
    deadline: str
    prize: Optional[str] = None
    url: str
    source: str = "Admin"
    tags: List[str] = []
    featured: bool = False


class BookmarkIn(BaseModel):
    opportunity_id: str


class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None
    mode: Literal["mentor", "application", "essay"] = "mentor"


class ResumeScoreIn(BaseModel):
    resume_text: str
    target_role: Optional[str] = "internship"


class EssayBrainstormIn(BaseModel):
    prompt: str
    background: Optional[str] = ""


# ------------------------------ Auth helpers ------------------------------
def _hash(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def _verify(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False


def _make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=14),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def _current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def _require_admin(user: dict = Depends(_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def _public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u["name"],
        "role": u.get("role", "student"),
        "grade_level": u.get("grade_level"),
        "country": u.get("country"),
        "interests": u.get("interests", []),
        "onboarded": u.get("onboarded", False),
        "created_at": u.get("created_at", ""),
    }


# ------------------------------ Routes: Auth ------------------------------
@api.post("/auth/register", response_model=TokenOut)
async def register(body: RegisterIn):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": body.email.lower(),
        "password": _hash(body.password),
        "name": body.name,
        "role": "student",
        "grade_level": None,
        "country": None,
        "interests": [],
        "bio": "",
        "onboarded": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = _make_token(user_id)
    return TokenOut(access_token=token, user=UserPublic(**_public_user(doc)))


@api.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn):
    u = await db.users.find_one({"email": body.email.lower()})
    if not u or not _verify(body.password, u["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = _make_token(u["id"])
    return TokenOut(access_token=token, user=UserPublic(**_public_user(u)))


@api.get("/auth/me", response_model=UserPublic)
async def me(user: dict = Depends(_current_user)):
    return UserPublic(**_public_user(user))


@api.post("/auth/onboard", response_model=UserPublic)
async def onboard(body: OnboardingIn, user: dict = Depends(_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "grade_level": body.grade_level,
            "country": body.country,
            "interests": body.interests,
            "onboarded": True,
        }},
    )
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return UserPublic(**_public_user(fresh))


@api.put("/profile", response_model=UserPublic)
async def update_profile(body: ProfileUpdate, user: dict = Depends(_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return UserPublic(**_public_user(fresh))


# ------------------------------ Routes: Opportunities ------------------------------
@api.get("/opportunities", response_model=List[Opportunity])
async def list_opportunities(
    type: Optional[str] = None,
    country: Optional[str] = None,
    field: Optional[str] = None,
    grade_level: Optional[str] = None,
    remote: Optional[bool] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "deadline",
    limit: int = 100,
):
    q: dict = {}
    if type:
        q["type"] = type
    if country and country != "all":
        q["$or"] = [{"country": country}, {"country": "Global"}]
    if field and field != "all":
        q["field"] = field
    if grade_level:
        q["grade_levels"] = grade_level
    if remote is not None:
        q["remote"] = remote
    if search:
        q["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"organization": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
        ]

    cursor = db.opportunities.find(q, {"_id": 0}).limit(limit)
    items = await cursor.to_list(limit)
    if sort == "popularity":
        items.sort(key=lambda x: x.get("popularity", 0), reverse=True)
    else:
        items.sort(key=lambda x: x.get("deadline", ""))
    return items


@api.get("/opportunities/trending", response_model=List[Opportunity])
async def trending(limit: int = 6):
    cursor = db.opportunities.find({}, {"_id": 0}).sort("popularity", -1).limit(limit)
    return await cursor.to_list(limit)


@api.get("/opportunities/recommendations", response_model=List[Opportunity])
async def recommendations(user: dict = Depends(_current_user), limit: int = 6):
    interests = user.get("interests", []) or []
    grade = user.get("grade_level")
    country = user.get("country")
    q: dict = {}
    if grade:
        q["grade_levels"] = grade
    cursor = db.opportunities.find(q, {"_id": 0})
    items = await cursor.to_list(200)

    def score(o):
        s = 0
        for tag in o.get("tags", []) + [o.get("field", "")]:
            for interest in interests:
                if interest and interest.lower() in tag.lower():
                    s += 5
        if country and o.get("country") in (country, "Global"):
            s += 2
        s += o.get("popularity", 0) / 1000
        return s

    items.sort(key=score, reverse=True)
    return items[:limit]


@api.get("/opportunities/{op_id}", response_model=Opportunity)
async def get_opportunity(op_id: str):
    op = await db.opportunities.find_one({"id": op_id}, {"_id": 0})
    if not op:
        raise HTTPException(status_code=404, detail="Not found")
    await db.opportunities.update_one({"id": op_id}, {"$inc": {"popularity": 1}})
    return op


@api.post("/opportunities", response_model=Opportunity)
async def create_opportunity(body: OpportunityIn, _: dict = Depends(_require_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["popularity"] = 0
    await db.opportunities.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/opportunities/{op_id}", response_model=Opportunity)
async def update_opportunity(op_id: str, body: OpportunityIn, _: dict = Depends(_require_admin)):
    updates = body.model_dump()
    await db.opportunities.update_one({"id": op_id}, {"$set": updates})
    fresh = await db.opportunities.find_one({"id": op_id}, {"_id": 0})
    if not fresh:
        raise HTTPException(status_code=404, detail="Not found")
    return fresh


@api.delete("/opportunities/{op_id}")
async def delete_opportunity(op_id: str, _: dict = Depends(_require_admin)):
    await db.opportunities.delete_one({"id": op_id})
    return {"ok": True}


# ------------------------------ Bookmarks ------------------------------
@api.get("/bookmarks", response_model=List[Opportunity])
async def list_bookmarks(user: dict = Depends(_current_user)):
    rows = await db.bookmarks.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    ids = [r["opportunity_id"] for r in rows]
    if not ids:
        return []
    ops = await db.opportunities.find({"id": {"$in": ids}}, {"_id": 0}).to_list(500)
    return ops


@api.post("/bookmarks")
async def add_bookmark(body: BookmarkIn, user: dict = Depends(_current_user)):
    existing = await db.bookmarks.find_one({"user_id": user["id"], "opportunity_id": body.opportunity_id})
    if existing:
        return {"ok": True, "duplicate": True}
    await db.bookmarks.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "opportunity_id": body.opportunity_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


@api.delete("/bookmarks/{opportunity_id}")
async def remove_bookmark(opportunity_id: str, user: dict = Depends(_current_user)):
    await db.bookmarks.delete_one({"user_id": user["id"], "opportunity_id": opportunity_id})
    return {"ok": True}


# ------------------------------ Analytics ------------------------------
@api.get("/analytics")
async def analytics(user: dict = Depends(_current_user)):
    bookmarks = await db.bookmarks.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    op_ids = [b["opportunity_id"] for b in bookmarks]
    ops = await db.opportunities.find({"id": {"$in": op_ids}}, {"_id": 0}).to_list(500) if op_ids else []

    by_type: dict = {}
    by_field: dict = {}
    for o in ops:
        by_type[o["type"]] = by_type.get(o["type"], 0) + 1
        by_field[o["field"]] = by_field.get(o["field"], 0) + 1

    # Weekly activity (last 8 weeks) — from bookmark created_at
    weekly = []
    now = datetime.now(timezone.utc)
    for w in range(7, -1, -1):
        start = now - timedelta(days=(w + 1) * 7)
        end = now - timedelta(days=w * 7)
        count = sum(
            1 for b in bookmarks
            if start.isoformat() <= b.get("created_at", "") < end.isoformat()
        )
        weekly.append({"week": f"W-{w}", "saved": count})

    # Upcoming deadlines (next 90 days)
    upcoming = []
    for o in ops:
        d = o.get("deadline", "")
        if d and d > now.isoformat():
            upcoming.append({"title": o["title"], "deadline": d, "type": o["type"]})
    upcoming.sort(key=lambda x: x["deadline"])

    chat_count = await db.chat_messages.count_documents({"user_id": user["id"]})

    return {
        "total_saved": len(ops),
        "total_chats": chat_count,
        "by_type": [{"name": k, "value": v} for k, v in by_type.items()],
        "by_field": [{"name": k, "value": v} for k, v in by_field.items()],
        "weekly_activity": weekly,
        "upcoming_deadlines": upcoming[:10],
    }


# ------------------------------ Notifications ------------------------------
@api.get("/notifications")
async def notifications(user: dict = Depends(_current_user)):
    bookmarks = await db.bookmarks.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    op_ids = [b["opportunity_id"] for b in bookmarks]
    ops = await db.opportunities.find({"id": {"$in": op_ids}}, {"_id": 0}).to_list(500) if op_ids else []
    now = datetime.now(timezone.utc)
    out = []
    for o in ops:
        try:
            d = datetime.fromisoformat(o["deadline"])
            days = (d - now).days
            if 0 <= days <= 14:
                out.append({
                    "id": o["id"],
                    "title": o["title"],
                    "message": f"Deadline in {days} day{'s' if days != 1 else ''}",
                    "deadline": o["deadline"],
                    "level": "warning" if days <= 7 else "info",
                })
        except Exception:
            pass
    out.sort(key=lambda x: x["deadline"])
    return out


# ------------------------------ Admin ------------------------------
@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(_require_admin)):
    return {
        "users": await db.users.count_documents({}),
        "opportunities": await db.opportunities.count_documents({}),
        "bookmarks": await db.bookmarks.count_documents({}),
        "chats": await db.chat_messages.count_documents({}),
    }


@api.get("/admin/users")
async def admin_users(_: dict = Depends(_require_admin)):
    rows = await db.users.find({}, {"_id": 0, "password": 0}).to_list(500)
    return rows


# ------------------------------ AI ------------------------------
SYSTEM_PROMPTS = {
    "mentor": (
        "You are Opportune AI, an expert mentor for ambitious high school and college students. "
        "You give concise, actionable advice on internships, scholarships, hackathons, research, olympiads, "
        "and college admissions. Be warm, specific, and direct. Use markdown sparingly."
    ),
    "application": (
        "You are an expert admissions and application coach. Help the student craft strong applications, "
        "structure essays, and outline portfolios. Be specific and actionable."
    ),
    "essay": (
        "You are a Pulitzer-grade college essay coach. Help the student brainstorm scholarship and admissions essays "
        "with concrete hooks, structures, and angles. Stay authentic to the student's voice."
    ),
}


async def _ai_chat(session_id: str, system_prompt: str, message: str,
                   provider: str = "anthropic", model: str = "claude-sonnet-4-5-20250929") -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_prompt,
    ).with_model(provider, model)
    response = await chat.send_message(UserMessage(text=message))
    return response if isinstance(response, str) else str(response)


@api.post("/ai/chat")
async def ai_chat(body: ChatIn, user: dict = Depends(_current_user)):
    session_id = body.session_id or f"{user['id']}:{body.mode}"
    system = SYSTEM_PROMPTS.get(body.mode, SYSTEM_PROMPTS["mentor"])
    # personalize
    if user.get("grade_level") or user.get("interests"):
        system += f"\n\nStudent context: grade={user.get('grade_level')}, country={user.get('country')}, interests={', '.join(user.get('interests', []))}."

    try:
        # Use Claude 4.5 for chat
        reply = await _ai_chat(session_id, system, body.message, provider="anthropic", model="claude-4-5")
    except Exception as e:
        logger.exception("AI chat failed")
        raise HTTPException(status_code=502, detail=f"AI provider error: {e}")

    # persist
    now = datetime.now(timezone.utc).isoformat()
    await db.chat_messages.insert_many([
        {"id": str(uuid.uuid4()), "user_id": user["id"], "session_id": session_id,
         "role": "user", "content": body.message, "mode": body.mode, "created_at": now},
        {"id": str(uuid.uuid4()), "user_id": user["id"], "session_id": session_id,
         "role": "assistant", "content": reply, "mode": body.mode, "created_at": now},
    ])
    return {"reply": reply, "session_id": session_id}


@api.get("/ai/history")
async def ai_history(session_id: str, user: dict = Depends(_current_user)):
    rows = await db.chat_messages.find(
        {"user_id": user["id"], "session_id": session_id},
        {"_id": 0},
    ).to_list(500)
    rows.sort(key=lambda x: x.get("created_at", ""))
    return rows


@api.post("/ai/resume-score")
async def resume_score(body: ResumeScoreIn, user: dict = Depends(_current_user)):
    prompt = (
        f"Score this resume for a student applying for {body.target_role}. "
        "Return a JSON-like structured analysis with: overall_score (0-100), strengths (3 bullets), "
        "improvements (3 bullets), missing_keywords (5 keywords), and ats_score (0-100). "
        "Keep it tight and actionable. Use plain text headings, not code blocks.\n\nRESUME:\n" + body.resume_text
    )
    try:
        result = await _ai_chat(
            session_id=f"{user['id']}:resume",
            system_prompt="You are an elite resume reviewer specializing in student internship and scholarship applications.",
            message=prompt,
            provider="anthropic",
            model="claude-4-5"
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI error: {e}")
    return {"analysis": result}


@api.post("/ai/essay-brainstorm")
async def essay_brainstorm(body: EssayBrainstormIn, user: dict = Depends(_current_user)):
    prompt = (
        f"The student is brainstorming an essay for the following prompt:\n\n{body.prompt}\n\n"
        f"Student background:\n{body.background}\n\n"
        "Give 5 distinct angles, each with: a unique HOOK (one sentence), a 3-bullet OUTLINE, and a sample STRONG opening line. "
        "Make each angle feel authentic, surprising, and admissions-worthy."
    )
    try:
        result = await _ai_chat(
            session_id=f"{user['id']}:essay-brainstorm",
            system_prompt=SYSTEM_PROMPTS["essay"],
            message=prompt,
            provider="google",
            model="gemini-3"
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI error: {e}")
    return {"ideas": result}


# ------------------------------ Health ------------------------------
@api.get("/")
async def root():
    return {"app": "Opportune", "status": "ok"}


# ------------------------------ Startup ------------------------------
@app.on_event("startup")
async def on_startup():
    await seed_if_empty(db)
    # Seed admin user
    admin = await db.users.find_one({"email": "admin@opportune.app"})
    if not admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "admin@opportune.app",
            "password": _hash("Admin@123"),
            "name": "Admin",
            "role": "admin",
            "grade_level": None,
            "country": None,
            "interests": [],
            "bio": "",
            "onboarded": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    # Seed demo student
    demo = await db.users.find_one({"email": "demo@opportune.app"})
    if not demo:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "demo@opportune.app",
            "password": _hash("Demo@123"),
            "name": "Demo Student",
            "role": "student",
            "grade_level": "high_school",
            "country": "USA",
            "interests": ["Computer Science", "AI", "Research"],
            "bio": "Passionate about AI and research.",
            "onboarded": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
