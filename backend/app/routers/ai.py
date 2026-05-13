from fastapi import APIRouter

from app.schemas import AIParsedTaskObject, ParseTaskRequest
from app.services import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/parse-task", response_model=AIParsedTaskObject)
def parse_task(body: ParseTaskRequest) -> AIParsedTaskObject:
    return ai_service.parse_task_text(body.text, body.timezone)
