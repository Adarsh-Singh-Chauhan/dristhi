# DRISHTI — System Architecture

**Repository:** [Adarsh-Singh-Chauhan/dristhi](https://github.com/Adarsh-Singh-Chauhan/dristhi)  
**Verified:** 3 November 2026

DRISHTI is an evidence-led information-integrity and defensive cyber-incident review workspace. It helps a user capture a suspicious public claim, inspect explainable patterns, collect source evidence and route a structured case to a human reviewer.

> **Trust boundary:** An automated signal is not a truth verdict. An IP address is not a person. An SOS entry is not emergency dispatch.

## 1. Runtime architecture

![DRISHTI target architecture and production configuration status](assets/architecture-overview.svg)

The image distinguishes the intended persistent deployment from the current production configuration. The current health endpoint returns `storage: unconfigured`; therefore account and record persistence are not yet enabled on Vercel.

### Architecture in Mermaid

~~~mermaid
flowchart LR
  subgraph Clients
    U[User PWA]
    A[Superadmin console]
    D[40-minute demo sandbox]
  end
  subgraph Service
    F[FastAPI]
    AUTH[JWT authentication]
    ROLE[Server-side role / ownership checks]
    ANALYZE[Explainable rule analyser]
    CASE[Case and evidence workflow]
    OPS[Alerts and SOS]
    IOC[Public IP/domain registry]
  end
  subgraph Storage
    PG[(PostgreSQL · production target)]
    SQ[(SQLite · local development)]
    SS[Demo sessionStorage]
  end
  U --> F
  A --> F
  F --> AUTH --> ROLE
  F --> ANALYZE
  ROLE --> CASE
  ROLE --> OPS
  ROLE --> IOC
  ANALYZE --> PG
  CASE --> PG
  OPS --> PG
  IOC --> PG
  F -. local only .-> SQ
  D --> SS
~~~

## 2. Technology and runtime components

| Layer | Technology | Responsibility |
|---|---|---|
| Landing + workspace | HTML5, CSS3, Vanilla JS | Responsive website and app screens |
| PWA | Web manifest, service worker | Installable web shell; static-asset caching |
| API | Python 3.11+, FastAPI | HTTP routes, OpenAPI, request handling |
| Schemas | Pydantic v2 | Request and response validation |
| Authentication | JWT HS256 + scrypt password hashing | Bearer authentication and password storage |
| Local storage | SQLite | Development and test database |
| Persistent storage | PostgreSQL via psycopg | Production account and operational records |
| Demo storage | sessionStorage | Synthetic, active-tab sample session only |
| Hosting | Vercel | Static pages + Python function |
| Containers | Docker, Docker Compose | Local container workflow |
| Testing | pytest, HTTPX | API tests and endpoint validation |
| Research | mBERT, XLM-RoBERTa, NetworkX | Offline research tools; not live production inference |

## 3. Client routes

| Route | Responsibility |
|---|---|
| `/` | Public product landing page |
| `/app.html` | Main user workspace |
| `/demo.html` | Browser-only User + demo Superadmin sandbox |
| `/guide.html` | Illustrated guide |
| `/admin.html` | Real Superadmin login and console |
| `/alerts.html` | Alerts, trusted contacts and SOS |
| `/docs` | Swagger UI |
| `/openapi.json` | OpenAPI schema |
| `/health` | Service and storage health |

Legacy `/frontend/...` routes redirect to static public paths as configured in `vercel.json`.

## 4. Request and review flow

~~~mermaid
sequenceDiagram
  actor User
  participant UI as User workspace
  participant API as FastAPI
  participant Rule as Rule analyser
  participant DB as Persistent PostgreSQL
  participant Admin as Superadmin console
  User->>UI: Submit authorised public claim
  UI->>API: POST /api/v1/analyze
  API->>Rule: Inspect selected text/link patterns
  Rule-->>API: Score, matched signals, explanations, checks
  API-->>UI: Review-priority result + limitations
  User->>UI: Create case
  UI->>API: POST /api/v1/cases (JWT)
  API->>DB: Store user-owned case
  Admin->>API: GET /api/v1/admin/cases
  API->>DB: Fetch review queue
  Admin->>API: PATCH /api/v1/admin/cases/{id}
  API->>DB: Store evidence, reviewer notes, status and audit event
~~~

Final outcomes are constrained by API validation: a human reviewer must supply an evidence summary and at least one HTTP/HTTPS source URL before saving a conclusive outcome.

## 5. Data model and ownership

Core tables created or maintained by the application/migration include:

- `users`: email, password hash, role and creation time.
- `analyses`: user-owned short report excerpt, source metadata and matched signals.
- `case_files`: submitted claim, category, source, status, evidence summary, evidence URLs, notes and reviewer.
- `alerts`: user-specific or platform notices and read state.
- `trusted_contacts`: user-managed contact references.
- `sos_reports`: incident details, urgency, review state and optional GPS snapshot.
- `network_indicators`: public IP/domain observables, severity, provenance and analyst-entered approximate context.
- `admin_audit_log`: privileged action, actor, entity and timestamp.

Normal user queries are scoped to the authenticated user ID. Superadmin routes use server-side role checks; frontend hiding is not an access-control boundary.

## 6. Location and defensive IOC rules

- GPS is an optional one-time snapshot explicitly shared with an SOS submission.
- The app does not silently collect visitor IP addresses or track continuous device location.
- IP geolocation is approximate and can be inaccurate due to VPNs, proxies, NAT and shared egress.
- IOC map coordinates are entered by an authorised Superadmin and should have a documented source.
- A public IP address is not reliable identity attribution.

## 7. API reference

Use the live [Swagger UI](https://dristhi-five.vercel.app/docs) for exact schemas and response details.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | API and storage status |
| POST | `/api/v1/auth/register` | User sign-up |
| POST | `/api/v1/auth/login` | Token issue |
| GET | `/api/v1/auth/me` | Current account |
| POST | `/api/v1/analyze` | Explainable baseline analysis |
| GET / DELETE | `/api/v1/history` | Own analysis history |
| POST | `/api/v1/cases` | Create case |
| GET | `/api/v1/cases/mine` | Own case list |
| GET / PATCH | `/api/v1/admin/cases` | Superadmin case review |
| GET / POST / PATCH | `/api/v1/admin/sos` | SOS review |
| GET / POST / PATCH | `/api/v1/admin/network-indicators` | Defensive IOC registry |

## 8. Security and trust boundaries

| Threat | Design control |
|---|---|
| Unauthorised admin access | Server-side Superadmin role check on admin API routes |
| Cross-user record access | Authenticated user ID ownership filters |
| Automated score treated as a verdict | Review-priority wording; evidence-backed human outcomes |
| Private IP added to IOC registry | Reject private, local, reserved and non-global addresses |
| Unconsented location collection | GPS only when the user explicitly opts in to SOS location sharing |
| Demo credentials used on production | Demo runs in a separate browser-only simulator and never calls production APIs |
| Secret exposure | Store JWT and database values in private Vercel environment variables |
| Untraceable admin operations | Audit events for privileged review actions |

This is a prototype, not an independently audited service. Before operational rollout, add rate limiting, email verification and account recovery, backup/retention controls, monitoring, dependency scanning, incident response and an independent security review.

## 9. Production status and database gate

**Verified on 3 November 2026:** the live health endpoint returns:

```json
{"status":"ok","service":"drishti-api","version":"0.4.0","storage":"unconfigured"}
```

The Vercel project environment currently lacks `DATABASE_URL`. The project also has an empty `JWT_SECRET_KEY` environment entry. The application code generates a random signing key when the variable is absent; that is not an acceptable stable production configuration because sessions would not survive instance cold starts consistently.

Therefore production registration/login, persistent analysis history, real case files, alerts, trusted contacts, SOS records and Superadmin operations are not operational until both secrets and the database are configured.

### Required production sequence

1. Create a dedicated PostgreSQL database.
2. Apply `supabase/migrations/202611010001_drishti_core_admin_alerts_sos.sql`.
3. Set a stable high-entropy `JWT_SECRET_KEY` as a sensitive Vercel environment variable.
4. Set the private PostgreSQL `DATABASE_URL` as a sensitive Vercel environment variable.
5. Redeploy the project.
6. Confirm `/health` returns `storage: postgres`.
7. Register a fresh account and promote exactly one Superadmin using the documented bootstrap script.
8. Run end-to-end tests for user ownership, case review, SOS, alert delivery (in-app), admin routes and audit records.

Do not place secrets in Git, public documentation, frontend config or screenshots. See [Supabase setup](SUPABASE-FREE-SETUP.md).

## 10. Analysis limits and ML research boundary

Production analysis is a deterministic rule baseline: urgency language, forwarding pressure, authority wording, panic/threat language, selected URL shorteners, excessive capitalisation and repeated punctuation.

It does not browse the web, validate an official source, inspect media, attribute an actor, or decide truth. The mBERT/XLM-RoBERTa and NetworkX scripts in `ml/` are offline research components and are not connected to the live analyser. No production model weights/corpus are supplied.

## 11. Local development and tests

Follow [README local setup](../README.md#10--run-locally). Local development uses SQLite by default. Run backend tests with:

```bash
pip install -r backend/requirements.txt
pytest -q
```

