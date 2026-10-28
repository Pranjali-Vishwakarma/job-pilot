"""Entry point so `uv run uvicorn main:app --reload` keeps working.

The application itself lives in app/main.py.
"""

from app.main import app

__all__ = ["app"]
