# DRISHTI — Vercel deployment and Windows PowerShell

## Architecture

- Frontend: static assets in `public/`, delivered by Vercel.
- Backend: FastAPI application exported by root `index.py`.
- Production Function region: Mumbai (`bom1`).
- Git integration: pushes to `main` trigger Vercel production deployments.
- API documentation: `/docs`, `/redoc`, `/openapi.json`.
- Production persistence: PostgreSQL via `DATABASE_URL`.

## Live Vercel project

The project is already linked to GitHub and deployed. No manual import is required.

- App: https://dristhi-five.vercel.app/
- Swagger: https://dristhi-five.vercel.app/docs
- Health: https://dristhi-five.vercel.app/health
- Repository: https://github.com/Adarsh-Singh-Chauhan/dristhi

The Vercel project has a stable `JWT_SECRET_KEY` and `ACCESS_TOKEN_TTL_MINUTES=60` configured as environment variables. A persistent PostgreSQL `DATABASE_URL` is not configured yet. The hosted app therefore supports anonymous analysis, but account registration, sign-in and saved history stay disabled until a dedicated database is connected.

## Environment / database

Vercel Function filesystems are ephemeral. Do not use SQLite for production accounts/history.

Use PostgreSQL and set the pooled or direct connection string as `DATABASE_URL`. Never commit credentials.

## Production URLs

- App: https://dristhi-five.vercel.app/
- Swagger: https://dristhi-five.vercel.app/docs
- Health: https://dristhi-five.vercel.app/health

## Windows PowerShell — run locally

Clone the repository:

~~~powershell
git clone https://github.com/Adarsh-Singh-Chauhan/dristhi.git
Set-Location .\dristhi
~~~

**Terminal 1 — Backend**

~~~powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt

$env:JWT_SECRET_KEY = (python -c "import secrets; print(secrets.token_urlsafe(48))")
$env:DATABASE_URL = ""
$env:DATABASE_PATH = "data\drishti.db"
$env:CORS_ORIGINS = "http://127.0.0.1:5500,http://localhost:5500"

python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
~~~

**Terminal 2 — Frontend**

~~~powershell
Set-Location .\frontend
python -m http.server 5500 --bind 127.0.0.1
~~~

Open `http://127.0.0.1:5500`. Swagger: `http://127.0.0.1:8000/docs`.

## Vercel CLI — deploy from PowerShell

~~~powershell
npm install -g vercel
vercel login
vercel link
vercel
vercel --prod
~~~

Set production secrets through Vercel Project Settings → Environment Variables, not through Git.

