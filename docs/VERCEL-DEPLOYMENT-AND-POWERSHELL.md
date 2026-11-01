# DRISHTI — Vercel deployment and Windows PowerShell

## Architecture

- Frontend: static assets in \`public/\`, delivered by Vercel.
- Backend: FastAPI application exported by root \`index.py\`.
- API documentation: \`/docs\`, \`/redoc\`, \`/openapi.json\`.
- Production persistence: PostgreSQL via \`DATABASE_URL\`.

## Vercel import

1. Open https://vercel.com/new.
2. Import GitHub repository \`Adarsh-Singh-Chauhan/dristhi\`.
3. Keep the repository root as Root Directory.
4. Use Python / FastAPI framework detection.
5. Ensure root \`requirements.txt\`, \`index.py\` and \`vercel.json\` are detected.
6. Add environment variables in Project Settings:
   - \`JWT_SECRET_KEY\`: long, random secret.
   - \`DATABASE_URL\`: PostgreSQL connection string.
   - \`ACCESS_TOKEN_TTL_MINUTES\`: \`60\`.
7. Deploy the \`main\` branch.

## Environment / database

Vercel Function filesystems are ephemeral. Do not use SQLite for production accounts/history.

Use PostgreSQL and set the pooled or direct connection string as \`DATABASE_URL\`. Never commit credentials.

## Production URLs

Replace these after Vercel returns the actual project domain:

- App: \`https://YOUR-VERCEL-DOMAIN.vercel.app/\`
- Swagger: \`https://YOUR-VERCEL-DOMAIN.vercel.app/docs\`
- Health: \`https://YOUR-VERCEL-DOMAIN.vercel.app/health\`

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

Open \`http://127.0.0.1:5500\`. Swagger: \`http://127.0.0.1:8000/docs\`.

## Vercel CLI — deploy from PowerShell

~~~powershell
npm install -g vercel
vercel login
vercel link
vercel
vercel --prod
~~~

Set production secrets through Vercel Project Settings → Environment Variables, not through Git.

