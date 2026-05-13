from fastapi import APIRouter

from app.schemas import CalendarTemplateRequest, CalendarTemplateResponse
from app.services import calendar_service

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.post("/template-url", response_model=CalendarTemplateResponse)
def template_url(body: CalendarTemplateRequest) -> CalendarTemplateResponse:
    url = calendar_service.build_template_url(
        body.title,
        body.startDateTime,
        body.endDateTime,
        body.description,
    )
    return CalendarTemplateResponse(calendarUrl=url)
