# FocusHome Backend (Week Scaffold)

This backend is a minimal FastAPI scaffold for this week's homework scope.
It contains health/main endpoints and a mocked AI parse endpoint.

## Endpoints

- `GET /`
- `GET /health`
- `GET /api/main`
- `POST /api/ai/parse-task`

## Run locally

1. Create and activate a virtual environment.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Start server:
   - `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

The AI parse endpoint is mocked for now (no real AI API call yet).
