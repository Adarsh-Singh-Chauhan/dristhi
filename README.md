<div align="center">

# DRISHTI

### Pause. Verify. Understand.

**An information-integrity and defensive cyber-incident review workspace.**

[![Live workspace](https://img.shields.io/badge/PRODUCT-Live%20Preview-59D6C4?style=for-the-badge&logo=vercel&logoColor=07151B)](https://dristhi-five.vercel.app/)
[![Interactive demo](https://img.shields.io/badge/DEMO-40%20Minute%20Sandbox-173C4D?style=for-the-badge&logo=googlechrome&logoColor=white)](https://dristhi-five.vercel.app/demo.html)
[![API docs](https://img.shields.io/badge/API-Swagger%20OpenAPI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://dristhi-five.vercel.app/docs)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-See%20Repository-lightgrey?style=flat-square)](LICENSE)

[Product overview](https://dristhi-five.vercel.app/) · [User guide](docs/USER-GUIDE.md) · [Architecture](docs/ARCHITECTURE.md) · [Security](SECURITY.md) · [ML research](ml/README.md) · [Database setup](docs/SUPABASE-FREE-SETUP.md)

**Designed and developed by [Adarsh Singh Chauhan](https://github.com/Adarsh-Singh-Chauhan)**

</div>

---

## 01 — Project at a glance

DRISHTI is a cybersecurity-led information-integrity workspace for reviewing suspicious public claims, understanding explainable text and link signals, organising source evidence, and routing cases to human review.

Its guiding idea is simple:

> **Create a responsible pause between receiving information and sharing it.**

A forwarded message can lose its date, source, location or context. An authentic image can be reused with a misleading caption. A manipulated clip can imitate a trusted speaker. A suspicious link can resemble an official notice. DRISHTI is designed to help a user capture the claim, inspect review signals, check provenance, and record what the available evidence actually supports.

**DRISHTI is not an automated truth machine.** A signal is a prompt to investigate—not proof that information is false. Outcomes require evidence and human judgement.

| Project dimension | Description |
|---|---|
| Product category | Information integrity · Defensive cybersecurity · Human-in-the-loop review |
| Primary users | People reviewing public claims; authorised platform Superadmin |
| Main workflow | Submit → Inspect → Verify source → Create case → Human review |
| Analysis baseline | Deterministic, explainable text rules |
| API | Python 3.11+ · FastAPI · Pydantic |
| Client | HTML · CSS · Vanilla JavaScript · PWA shell |
| Data layer | SQLite locally; PostgreSQL when configured |
| Hosting | Vercel |
| Status | Prototype / early-stage product; production persistence requires database configuration |

## 02 — The problem

Information does not always travel with the context needed to interpret it. People may receive a forwarded claim without an original link, publication date, location, source document, or unedited media. They need a clear way to slow down, inspect visible warning signs, collect evidence, and escalate a concern for responsible review.

### Problem statement

**How might we help people and reviewers assess suspicious digital information without presenting automated signals as factual verdicts, compromising privacy, or encouraging surveillance?**

### Real-world context and published evidence

The following figures are external published context. They are **not DRISHTI metrics, model results, or detections**.

| Evidence | Why it matters | Primary source |
|---|---|---|
| **2,913 fact-checks** published by the PIB Fact Check Unit as of 1 April 2026 | Public-information verification is an active operational challenge. The unit's remit relates to misinformation concerning the Central Government. | [PIB / Ministry of I&B — 1 April 2026](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2247720&lang=1&reg=1) |
| **53%** of the India survey sample named WhatsApp as the biggest misinformation threat | Messaging platforms are an important part of the misinformation landscape. The survey is of English-language Indian news users with internet access, not all residents of India. | [Reuters Institute — Digital News Report 2025: India](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/india) |
| **1,400+ URLs** targeted for blocking during the Operation Sindoor misinformation response, as reported by PIB | Manipulation and distribution can involve links and channels as well as message text. | [PIB / Ministry of I&B — 2 April 2026](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2248361&lang=1&reg=3) |

### Published examples of manipulation

These are third-party reports, **not DRISHTI detections**:

- [News On AIR: government clarification about an AI-generated video attributed to Lt Gen Rajeev Puri](https://newsonair.gov.in/government-debunks-fake-ai-generated-video-of-lt-gen-rajeev-puri/).
- [AFP Fact Check: doctored clips circulating around protests, including altered audio](https://factcheck.afp.com/doc.afp.com.C3KH4KF).

These examples illustrate why source provenance, original media, chronology, context, independent corroboration and human review matter.

## 03 — The DRISHTI solution

DRISHTI separates two questions that are often wrongly merged:

1. **What visible patterns deserve a closer look?** The current baseline checks a limited set of text and URL indicators.
2. **What does the available evidence establish?** This requires source inspection, context, corroboration and a documented human decision.

### End-to-end workflow

~~~mermaid
flowchart TD
    A[User receives a public claim] --> B[Submit authorised text]
    B --> C[Add platform and original source URL]
    C --> D[Explainable signal analysis]
    D --> E[Read matched indicators and suggested checks]
    E --> F{Need a structured review?}
    F -- No --> G[Verify independently before sharing]
    F -- Yes --> H[Create private case file]
    H --> I[Superadmin evidence queue]
    I --> J[Check primary and independent sources]
    J --> K[Record evidence summary and reviewer notes]
    K --> L[Save a sourced review outcome]
    L --> M[User follows case status]
~~~

### Product principles

- **Explainability:** show which indicators matched and why.
- **Human judgement:** no automated score can set a final fact-check outcome.
- **Source provenance:** encourage original sources and evidence references.
- **Privacy:** avoid unnecessary personal data; keep history scoped to the account.
- **Defensive use:** public IP/domain indicators are for authorised investigation, not identifying people.
- **Safety:** an SOS is an internal review request, not emergency dispatch.
- **Abstention:** insufficient evidence must remain a valid outcome.

## 04 — Product experience

### Public product and user workspace

- [Open the DRISHTI website](https://drishti-five.vercel.app/)
- [Open the user workspace](https://drishti-five.vercel.app/app.html)
- [Open the illustrated user guide](https://drishti-five.vercel.app/guide.html)
- [Open API documentation](https://drishti-five.vercel.app/docs)

### Interface previews

| Product surface | Preview |
|---|---|
| User workspace | ![DRISHTI user workspace illustration](docs/assets/user-workspace-screen.svg) |
| Superadmin control room | ![DRISHTI Superadmin control room illustration](docs/assets/superadmin-control-room.svg) |
| System architecture | ![DRISHTI architecture diagram](docs/assets/architecture-overview.svg) |

These repository SVGs are **illustrative interface and architecture diagrams**, not screenshots of live customer records.

### Product modules

| Module | What it does | Role |
|---|---|---|
| Claim submission | Accepts a public claim/message, platform and optional public source URL | User |
| Explainable analysis | Returns review-priority score, matched indicators, explanation and suggested checks | User |
| Analysis history | Private short summaries, list and per-record deletion | Signed-in user |
| Evidence case files | Creates a structured case and tracks its review status | User |
| Evidence review desk | Records source URLs, evidence summary, reviewer notes and outcome | Superadmin |
| In-app alerts | Review-priority and platform notices | User / Superadmin |
| Trusted contacts | User-managed contact references for safety workflow | User |
| SOS request | Internal incident-review request with optional one-time location snapshot | User |
| SOS queue | Reviews requests and updates status | Superadmin |
| Threat intelligence registry | Curated public IP/domain indicators with source, severity and status | Superadmin |
| Global signal atlas | Displays consented SOS snapshots and analyst-entered approximate IOC locations | Superadmin |
| Audit trail | Records privileged actions and review operations | Superadmin |
| PWA shell | Responsive web experience with installable shell and cached static assets | User |
| Guided sandbox | Fictional user/admin workflows in a time-limited browser demo | Demo visitor |

### User journey

1. Open the workspace and paste only content you are authorised to review.
2. Select the source platform and optionally attach the public URL.
3. Analyse the message and inspect each matched indicator.
4. Follow the recommended source-verification checklist.
5. Create a case file when a human review is useful.
6. Follow the case status and read the evidence summary when available.

### Superadmin journey

1. Sign in with a separately promoted Superadmin account.
2. Open the evidence review queue.
3. Inspect the submitted claim and its source.
4. Record a concise evidence summary, one or more source URLs and reviewer notes.
5. Save a supported outcome or retain an inconclusive state.
6. Review SOS requests, notices, public IOC entries and the audit trail.

The production Superadmin role is assigned server-side. There is no public Superadmin sign-up.

## 05 — Analysis methodology and responsible-use boundaries

### Current production baseline

The live API's current analysis baseline is **deterministic and rule-based**. It is not a trained machine-learning classifier, live web fact-checker, or media-forensics engine.

Current signal families include:

- Urgency language and panic/threat wording.
- Pressure to forward or redistribute.
- Authority claims without a verifiable source in the submitted text.
- Forward-chain markers.
- Selected common URL shorteners.
- Excessive capitalisation and repeated punctuation.

The API returns a review-priority score, matched indicator explanations, and recommended checks. The score is **not** a probability that a claim is false.

### What it does not establish

DRISHTI currently does not independently:

- Browse the web to authenticate a source or verify a claim.
- Prove that a government notice is genuine.
- Inspect image, audio or video content for manipulation.
- Detect every deepfake or identify coordinated actors.
- Identify a person from an IP address or infer someone's precise location.
- Automatically report, remove, block, suspend or punish a person or account.
- Classify political viewpoints, ideology or sentiment.

Legitimate emergency messages may trigger a false positive; subtle or emerging misinformation may be missed. Users should verify important claims independently.

### Research components (not connected to production)

The `ml/` directory contains a research pipeline for multilingual text classification (mBERT / XLM-RoBERTa) and descriptive graph metrics using NetworkX. It requires a properly sourced dataset and training/evaluation workflow. No trained model weights or verified corpus are shipped as production assets, and the research pipeline is not connected to the live API.

Possible future work includes licensed datasets, OCR/media provenance, trusted fact-check-source retrieval, official platform APIs and carefully evaluated multilingual models. These are roadmap items, not current live features.

## 06 — System architecture

![DRISHTI architecture](docs/assets/architecture-overview.svg)

### Logical architecture

~~~mermaid
flowchart LR
    subgraph Client
      U[User PWA]
      D[Demo sandbox]
      S[Superadmin console]
    end
    subgraph API Layer
      F[FastAPI]
      AUTH[JWT authentication]
      RBAC[Server-side role checks]
      AN[Rule-based analyser]
      CASE[Case workflow]
      OPS[Alerts and SOS operations]
      IOC[Defensive IOC registry]
    end
    subgraph Persistence
      DB[(PostgreSQL production when configured)]
      SQ[(SQLite local development)]
    end
    U --> F
    S --> F
    D --> D
    F --> AUTH --> RBAC
    F --> AN
    RBAC --> CASE
    RBAC --> OPS
    RBAC --> IOC
    AN --> DB
    CASE --> DB
    OPS --> DB
    IOC --> DB
    F -. local development .-> SQ
~~~

### Trust boundaries

- Public client input is untrusted and must be validated server-side.
- Private history and case records are user-scoped.
- Privileged actions require a server-verified Superadmin role.
- Demo roles and demo records are client-side fiction; they are not credentials for production.
- Database secrets and JWT secrets belong in private environment variables, never in browser code or Git.
- Location sharing is optional and tied to a user-submitted SOS snapshot.
- GeoIP / IOC map positions are approximate network or analyst-provided context, not person tracking.

Full component, data-flow and trust-boundary notes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 07 — Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Language | Python 3.11+ | Backend and research scripts |
| API framework | FastAPI | REST endpoints and OpenAPI |
| Validation | Pydantic v2 | Request/response schemas |
| Authentication | JWT bearer tokens (HS256) | API session authentication |
| Password storage | scrypt | Password hashing |
| Local database | SQLite | Local development / tests |
| Production database option | PostgreSQL via psycopg | Persistent account and operational data |
| Frontend | HTML5, CSS3, Vanilla JavaScript | Responsive client interface |
| API documentation | Swagger UI / ReDoc | Interactive API reference |
| PWA | Web manifest and service worker | Installable web shell |
| Hosting | Vercel | Static pages and Python function |
| Containers | Docker / Docker Compose | Local containerised API |
| Testing | pytest / HTTPX | Automated API tests |
| ML research | Transformers, mBERT, XLM-RoBERTa, NetworkX | Offline research pipeline; not production-integrated |

For exact dependencies, see [backend/requirements.txt](backend/requirements.txt) and [requirements.txt](requirements.txt).

## 08 — API overview

Live documentation: [Swagger UI](https://dristhi-five.vercel.app/docs) · [OpenAPI schema](https://dristhi-five.vercel.app/openapi.json)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Service and storage status |
| POST | `/api/v1/auth/register` | Register a user account |
| POST | `/api/v1/auth/login` | Obtain bearer token |
| GET | `/api/v1/auth/me` | Read authenticated account and role |
| POST | `/api/v1/analyze` | Analyse submitted text |
| GET / DELETE | `/api/v1/history` | Read/delete signed-in user's history |
| POST | `/api/v1/cases` | Create a case file |
| GET | `/api/v1/cases/mine` | List own case files |
| GET / PATCH | `/api/v1/admin/cases` | Superadmin evidence review |
| GET / POST / PATCH | `/api/v1/admin/sos` | SOS review workflow |
| GET / POST / PATCH | `/api/v1/admin/network-indicators` | Public IP/domain IOC registry |

The API route list is an overview; use Swagger for request schemas, exact path parameters, response formats and current availability.

## 09 — Authentication, database and demo access

### Production authentication design

- User registration and sign-in are implemented in the FastAPI backend.
- Bearer tokens use JWT (HS256) with a configurable expiry.
- Passwords are hashed with scrypt.
- User history and cases are intended to be private and account-scoped.
- Superadmin access is granted by server-side role promotion, not by public registration.
- Secrets are supplied through environment variables.

### Important live deployment limitation

The repository's deployment notes state that the connected Vercel project currently has **no `DATABASE_URL` configured**. The API intentionally does not initialise SQLite on Vercel because function filesystems are ephemeral.

Until persistent PostgreSQL is connected:

- Production registration and login are unavailable.
- Analysis history and case files cannot persist.
- Production alerts, trusted contacts, SOS records and Superadmin operations cannot be used as durable records.
- The anonymous analysis endpoint may work when the API deployment is healthy.
- The browser-only demo is separate and remains the correct way to explore sample user/admin workflows.

Check the live [health endpoint](https://dristhi-five.vercel.app/health) before relying on account workflows. Production readiness requires `storage: postgres` and successful end-to-end tests.

### Public demo credentials

[**Launch the 40-minute demo**](https://dristhi-five.vercel.app/demo.html)

| Fictional demo role | Demo ID | Password |
|---|---|---|
| Mobile / User | `demo.user@drishti.in` | `DRISHTI-USER-40` |
| Superadmin control room | `demo.superadmin@drishti.in` | `DRISHTI-ADMIN-40` |

**Demo security boundary:** these are deliberately public sandbox credentials. Demo data lives in the active browser tab's `sessionStorage`, not in the production database. The timer and role selection are client-side demonstration controls, not a security boundary. Demo credentials must never be used for real accounts or production admin access.

### Enable persistent PostgreSQL

Follow the repository's [Supabase Free PostgreSQL & first-admin setup](docs/SUPABASE-FREE-SETUP.md). In summary:

1. Create a dedicated Supabase PostgreSQL project on the intended plan.
2. Apply the migration under `supabase/migrations/`.
3. Configure private `DATABASE_URL` and `JWT_SECRET_KEY` in Vercel environment variables.
4. Redeploy and confirm the health endpoint reports PostgreSQL storage.
5. Register your own account and promote the first Superadmin using the documented local script.
6. Test registration, login, history, case creation, SOS and admin operations end to end.

Never paste a real database connection string or admin password into GitHub, README, browser code or public issues.

## 10 — Run locally

### Requirements

- Python 3.11 or later
- Git
- A modern browser
- Docker (optional)

### Clone the repository

```bash
git clone https://github.com/Adarsh-Singh-Chauhan/dristhi.git
cd dristhi
```

### Start the FastAPI backend

**Windows PowerShell**

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
$env:JWT_SECRET_KEY = "replace-with-a-long-random-secret"
$env:DATABASE_PATH = "data/drishti.db"
uvicorn app.main:app --app-dir backend --reload
```

API: [http://127.0.0.1:8000](http://127.0.0.1:8000) · Swagger: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Start the frontend

Open a second terminal:

```powershell
cd frontend
python -m http.server 5500
```

Open [http://127.0.0.1:5500](http://127.0.0.1:5500).

For Docker, inspect [docker-compose.yml](docker-compose.yml) and the backend Dockerfile. Copy [.env.example](.env.example) to a private `.env` and set a strong secret before use.

### Run tests

```bash
pip install -r backend/requirements.txt
pytest -q
```

If tests require optional environment variables or a configured database, follow the test fixtures and setup notes in the repository.

## 11 — Repository structure

```text
dristhi/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app, auth, analysis and routes
│   │   ├── analyzer.py         # Explainable rule-based text signals
│   │   └── operations.py       # Case, SOS, alerts and admin operations
│   ├── tests/                  # Backend test suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # Source user interface
├── public/                     # Deployed website, demo, guide and assets
├── docs/
│   ├── assets/                 # Architecture and UI illustrations
│   ├── ARCHITECTURE.md
│   ├── USER-GUIDE.md
│   └── SUPABASE-FREE-SETUP.md
├── ml/                         # Offline ML / graph research pipeline
├── scripts/                    # Operational scripts, including first-admin bootstrap
├── supabase/migrations/        # PostgreSQL schema migrations
├── index.py                    # Vercel FastAPI entrypoint
├── index.html                  # Root/static routing entrypoint
├── vercel.json                 # Vercel routes, headers and function config
├── docker-compose.yml
├── requirements.txt
├── .env.example
├── SECURITY.md
└── README.md
```

## 12 — Security, privacy and safety

DRISHTI handles potentially sensitive claims and incident information. Use it conservatively.

- Submit only content you own or are authorised to review.
- Do not submit passwords, authentication tokens, private messages or unnecessary personal information.
- Do not use automated signals as evidence to harass, penalise or accuse a person.
- Treat IP geolocation as approximate. It is not identity attribution.
- Share GPS only when consciously submitting an SOS and only when needed.
- The SOS queue is an internal workflow; it does not contact emergency services or trusted contacts automatically.
- Keep database credentials, JWT secrets and admin passwords out of source control.
- Public demo credentials are not production credentials.
- Report security concerns using [SECURITY.md](SECURITY.md).

For a real emergency, contact local emergency services directly. DRISHTI is not an emergency dispatch service.

## 13 — Testing and deployment checklist

| Check | Expected result |
|---|---|
| Local API starts | FastAPI health check returns successfully |
| Analysis endpoint | Returns explainable indicators and a disclaimer |
| Register / login | Works against configured persistent storage |
| User history | Only the authenticated owner can read/delete own records |
| Case workflow | User creates a case; Superadmin reviews with evidence |
| Outcome validation | Final outcomes require evidence summary + source URL |
| SOS workflow | User submits request; Superadmin reviews queue |
| Role enforcement | Normal user cannot access Superadmin endpoints |
| Database health | Production reports PostgreSQL storage |
| Demo isolation | Public demo cannot read/write production records |
| PWA | Installable shell works on supported mobile browsers |
| Vercel deployment | Static routes, API, redirects and headers work as expected |

## 14 — Roadmap

These are proposed improvements, not a statement that they are already deployed:

- [ ] Configure persistent PostgreSQL on the production deployment.
- [ ] Run production end-to-end tests for registration, login, history and case workflows.
- [ ] Validate access control and audit coverage with security tests.
- [ ] Add verified-source retrieval and provenance workflows.
- [ ] Evaluate multilingual models on licensed, reviewed Hindi/English/code-mixed datasets.
- [ ] Add media-forensics and OCR only after dataset, evaluation and consent review.
- [ ] Add push/email delivery only with explicit opt-in, documented retention and cost review.
- [ ] Add accessible keyboard navigation, screen-reader labels and broader mobile QA.
- [ ] Publish versioned release notes and reproducible evaluation reports.

## 15 — Documentation and project links

| Resource | Link |
|---|---|
| Live website | https://dristhi-five.vercel.app/ |
| Main workspace | https://dristhi-five.vercel.app/app.html |
| Interactive demo | https://dristhi-five.vercel.app/demo.html |
| User guide | [docs/USER-GUIDE.md](docs/USER-GUIDE.md) |
| System architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Security policy | [SECURITY.md](SECURITY.md) |
| ML research notes | [ml/README.md](ml/README.md) |
| Supabase setup | [docs/SUPABASE-FREE-SETUP.md](docs/SUPABASE-FREE-SETUP.md) |
| API reference | https://drishti-five.vercel.app/docs |
| Source code | https://github.com/Adarsh-Singh-Chauhan/dristhi |
| Developer | [Adarsh Singh Chauhan](https://github.com/Adarsh-Singh-Chauhan) |

---

<div align="center">

### Pause. Verify. Then share.

**Technology can surface signals. Evidence and human judgement establish conclusions.**

Built with care by [Adarsh Singh Chauhan](https://github.com/Adarsh-Singh-Chauhan).

[Website](https://dristhi-five.vercel.app/) · [GitHub](https://github.com/Adarsh-Singh-Chauhan/dristhi) · [Demo](https://dristhi-five.vercel.app/demo.html)

</div>
