from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="FocusHome Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParseTaskRequest(BaseModel):
    text: str


@app.get("/")
def root() -> dict:
    return {"message": "Welcome to FocusHome backend scaffold."}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "focushome-backend"}


@app.get("/api/main")
def api_main() -> dict:
    return {
        "app": "FocusHome",
        "version": "0.1.0",
        "message": "FocusHome backend is running.",
    }


@app.post("/api/ai/parse-task")
def parse_task(_: ParseTaskRequest) -> dict:
    return {
        "title": "Algorithm Study",
        "startDateTime": "2026-04-23T15:00:00+03:00",
        "endDateTime": "2026-04-23T16:00:00+03:00",
        "durationMinutes": 60,
        "difficulty": "MEDIUM",
        "description": "Mock AI parsed focus task",
        "calendarEligible": True,
    }
