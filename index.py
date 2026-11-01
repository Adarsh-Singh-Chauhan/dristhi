"""Vercel entrypoint for the DRISHTI FastAPI application."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from fastapi.responses import FileResponse  # noqa: E402
from app.main import app  # noqa: E402


@app.get("/", include_in_schema=False)
def frontend_home():
    """Serve the browser application at the project root."""
    return FileResponse(ROOT / "public" / "index.html")
