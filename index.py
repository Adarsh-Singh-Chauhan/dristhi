"""Vercel entrypoint for the DRISHTI FastAPI application."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent

from fastapi.responses import FileResponse
from backend.app.main import app


@app.get("/", include_in_schema=False)
def frontend_home():
    """Serve the browser application at the project root."""
    return FileResponse(ROOT / "public" / "index.html")
