<div align="center">

<a href="https://github.com/Adarsh-Singh-Chauhan/dristhi">
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0B1220,45:123B55,100:12A89D&height=230&section=header&text=DRISHTI&fontSize=76&fontColor=FFFFFF&fontAlignY=38&animation=fadeIn&desc=Pause.%20Verify.%20Understand.&descAlignY=61&descSize=19" width="100%" alt="DRISHTI — Pause. Verify. Understand." />
</a>

<img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=21&duration=2600&pause=800&color=55D6C2&center=true&vCenter=true&width=780&height=48&lines=Digital+misinformation+signal+analysis.;A+cybersecurity-led+approach+to+safer+sharing.;Detect+signals.+Check+evidence.+Keep+human+judgement." alt="Animated DRISHTI introduction" />

<p>
<img src="https://img.shields.io/badge/Project-Cybersecurity%20MVP-0F766E?style=for-the-badge" alt="Cybersecurity MVP" />
<img src="https://img.shields.io/badge/API-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
<img src="https://img.shields.io/badge/Docs-Swagger%20%2F%20OpenAPI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger OpenAPI" />
<img src="https://img.shields.io/badge/Auth-JWT%20%2B%20scrypt-2563EB?style=for-the-badge" alt="JWT and scrypt" />
<img src="https://img.shields.io/badge/Status-Early%20Prototype-F59E0B?style=for-the-badge" alt="Early prototype" />
</p>

**Created by [Adarsh Singh Chauhan](https://github.com/Adarsh-Singh-Chauhan)**

**[Vercel deployment & Windows PowerShell guide](docs/VERCEL-DEPLOYMENT-AND-POWERSHELL.md)** · **[Supabase Free & first-admin setup](docs/SUPABASE-FREE-SETUP.md)** · **[Alerts & SOS](https://dristhi-five.vercel.app/alerts.html)** · **[Admin Console](https://dristhi-five.vercel.app/admin.html)** · **[Frontend source](frontend/)** · **[Backend source](backend/)**

</div>

---

**[Open the live DRISHTI workspace](https://dristhi-five.vercel.app/)** · **[API documentation](https://dristhi-five.vercel.app/docs)** · **[Health check](https://dristhi-five.vercel.app/health)**

## Live deployment status (1 November 2026)

The frontend and FastAPI service are deployed on Vercel. Anonymous message analysis is available. The production health endpoint currently reports `storage: unconfigured`: user registration, sign-in, saved history, in-app alerts, SOS persistence and the role-restricted admin console remain unavailable until a persistent PostgreSQL `DATABASE_URL` is added to the Vercel project. The Alerts & SOS workspace and Admin Console pages, API routes, database migration and first-admin setup procedure are now in the repository and await database activation. Local development continues to use SQLite by default. The current detector is a deterministic, explainable rule-based baseline—not a trained AI model or an external fact-checking service.

## Mobile user app & single-Superadmin console

The existing browser workspace is also packaged as an **installable Progressive Web App (PWA)** for the user experience. It keeps the same analysis, account, history, alerts and SOS workflows rather than introducing a second disconnected codebase.

- **User app:** responsive mobile layout, home-screen installation, thumb-friendly navigation, app icon and a small offline app shell. API actions still require a network connection.
- **Superadmin:** a separate restricted control room at [`/admin.html`](https://drishti-five.vercel.app/admin.html) for account-level overview, SOS review and in-app notices.
- **One privileged account:** the bootstrap script promotes one existing registered account to `superadmin`. New registrations remain ordinary `user` accounts. Legacy `admin` role records continue to work during the transition.
- **No public admin signup:** never publish the Superadmin email, password, database URL or token in this repository.

### Install the user app on Android

1. Open the [DRISHTI workspace](https://drishti-five.vercel.app/) in Chrome.
2. Tap **Install app** when the browser offers it, or open the browser menu (⋮) and choose **Install app** / **Add to Home screen**.
3. Launch DRISHTI from the new home-screen icon.

The PWA shell can load previously cached interface files offline. Sign-in, message analysis, saved history, alerts and SOS require the API and configured persistent storage.

### Superadmin activation

Follow [the Supabase Free setup guide](docs/SUPABASE-FREE-SETUP.md). Register the intended owner account first, then run `scripts/promote_first_admin.py` locally with a private `DATABASE_URL`. The script serialises bootstrap attempts, refuses a second privileged account and never generates or stores a password.

**Production limitation:** if `/health` still reports `storage: unconfigured`, server-side account creation, analysis history, persistent SOS and Superadmin APIs remain disabled until PostgreSQL is connected. The PWA packaging does not bypass this requirement.

## 01 · Project overview

**DRISHTI** is a cybersecurity-oriented information-integrity analysis prototype. It explores how suspicious messaging patterns, urgency-based forwards, unverified authority claims, panic language and shortened links can be surfaced for further human verification.

The idea began with a practical observation: messages and posts can move quickly through WhatsApp, Instagram, Telegram and other digital channels. During sensitive events, misleading or context-free claims may trigger confusion, fear or harmful decisions before readers have time to check the source.

DRISHTI aims to add a deliberate verification step between receiving a message and sharing it.

> **Product principle:** Detect signals. Verify evidence. Never confuse a signal with proof.

### What DRISHTI is — and is not

| DRISHTI is | DRISHTI is not |
| --- | --- |
| A review-priority and content-signal assistant | An authority that declares a message true or false |
| A tool for examining public claims and forwarded text | A political-opinion or ideology classifier |
| A human-in-the-loop verification workflow | An automated censorship or takedown system |
| A cybersecurity learning and prototyping project | A replacement for professional fact-checkers or official sources |

Political criticism, dissent, journalism, satire and legitimate debate must not be treated as misinformation merely because of their viewpoint, target or tone. The same evidence standards should apply regardless of party, leader, institution or ideology.

## 02 · Problem statement

Digital communication has made information sharing immediate and borderless. The same speed also creates opportunities for misleading claims, impersonation, manipulated media and coordinated amplification.

A message may:
- Present an unverified claim as an urgent official announcement.
- Ask recipients to forward it to every group or contact.
- Remove the original date, source or surrounding context.
- Use a shortened or unfamiliar link to redirect readers.
- Reuse an old photograph, video or notice as if it were current.
- Imitate the language or visual identity of a trusted institution.
- Exploit a crisis, public-safety concern or breaking-news event to provoke panic.

The challenge is not simply that false information exists. It is that ordinary readers often lack a quick, understandable way to identify warning signs and know what to verify next.

**Core problem:** How might we help people and review teams recognise suspicious information-sharing patterns early, organise verification steps and make more informed decisions—without automatically labelling viewpoints, people or political positions as false?

## 03 · Proposed solution

DRISHTI provides a structured workflow:

1. **Submit** — a user pastes text and optionally selects the platform or adds a source URL.
2. **Inspect** — a transparent baseline engine checks for selected signals such as urgency, forwarding pressure, authority claims without a citation, panic language, shortened links and unusual text formatting.
3. **Prioritise** — the system returns a low, medium or high review-priority label based only on the signals it detected.
4. **Explain** — each matched signal is shown with a plain-language explanation.
5. **Verify** — the interface suggests source, date, context, image and cross-publication checks.
6. **Review history** — signed-in users can revisit or delete their saved analysis records.

The score is **not a probability that a claim is false**. It is a transparent triage score for deciding whether additional review may be useful.

## 04 · Current MVP capabilities

- Responsive information-integrity workspace.
- Manual text submission with platform selection.
- Optional source URL field.
- Transparent, explainable heuristic signal checks.
- Review-priority score and matched-signal explanations.
- Recommended verification checklist.
- User registration and login endpoints.
- Password hashing using Python scrypt.
- Short-lived JWT bearer access tokens.
- SQLite persistence for users and saved analysis summaries.
- Authenticated analysis history and per-record deletion.
- In-app review-priority alerts, trusted-contact records and user SOS submission endpoints.
- Role-restricted admin APIs for SOS review, audit logging and in-app notices.
- Dedicated Alerts & SOS and Admin Console pages; persistence activates after PostgreSQL setup.
- FastAPI Swagger UI, OpenAPI schema and ReDoc.
- Dockerfile and Docker Compose starter configuration.
- Unit tests for the baseline analysis rules.
- Clear prototype limitations and responsible-use guidance.

### Signal categories in the baseline engine

| Signal | What it looks for | What it does not prove |
| --- | --- | --- |
| Urgency language | Phrases such as “act now” or “तुरंत” | That the claim is false |
| Share pressure | “Forward to everyone” or similar prompts | That a campaign is coordinated |
| Unverified authority wording | Institutional claims without a source in the submitted text | That the institution did not make the claim |
| Forward markers | “Forwarded” or similar chain indicators | The original sender or intent |
| Panic / threat wording | Alarm-oriented phrases | That the situation is harmless or dangerous |
| Shortened links | Common URL shortener domains | That a destination is malicious |
| Excessive capitalisation | High uppercase-letter ratio | A reliable deception signal by itself |
| Repeated punctuation | Repeated exclamation or question marks | A factual verdict |

## 05 · Application preview

The repository includes a lightweight web interface in the frontend directory.

- **Workspace:** enter a message, choose a platform and review the result.
- **Signal report:** inspect the review-priority score, detected indicators and recommended checks.
- **History:** view and delete saved analyses after signing in.
- **Methodology:** understand what the baseline engine checks and where it can fail.
- **API documentation:** explore endpoints through Swagger UI at /docs.

The frontend can run in a clearly labelled local-demo mode when the API is unavailable. Demo mode is illustrative and does not save reports or authenticate users.

## 06 · Technology stack

| Layer | Technology |
| --- | --- |
| Backend language | Python 3.11+ |
| API framework | FastAPI |
| API schema / docs | OpenAPI 3, Swagger UI, ReDoc |
| Request validation | Pydantic |
| Authentication | JWT bearer tokens (HS256) |
| Password storage | Python scrypt |
| Database | SQLite for the prototype |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Containerisation | Docker, Docker Compose |
| Testing | pytest |

The initial public repository contained only a starter README and no application source. This MVP therefore establishes a new, documented implementation baseline. No earlier language, model, training dataset or production architecture is being assumed.

## 07 · Architecture

~~~text
┌──────────────────────────────┐
│       Browser / Frontend     │
│  Workspace · Report · History│
└──────────────┬───────────────┘
               │ HTTPS / JSON
               ▼
┌──────────────────────────────┐
│        FastAPI Backend       │
│  Auth · Analysis · History   │
└───────┬──────────────┬───────┘
        │              │
        ▼              ▼
┌──────────────┐  ┌────────────────┐
│ scrypt + JWT │  │ Signal Engine  │
│ Auth helpers │  │ Explainable    │
└──────────────┘  │ baseline rules │
                  └───────┬────────┘
                          ▼
                  ┌────────────────┐
                  │ SQLite Storage │
                  │ Users + reports│
                  └────────────────┘
~~~

### API route map

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | /health | Public | Health check |
| POST | /api/v1/auth/register | Public | Create an account |
| POST | /api/v1/auth/login | Public | Obtain a bearer token |
| GET | /api/v1/auth/me | Bearer token | Read current user |
| POST | /api/v1/analyze | Optional bearer token | Analyse submitted text; save only for signed-in users who request history |
| GET | /api/v1/history | Bearer token | List the current user's saved analyses |
| DELETE | /api/v1/history/{analysis_id} | Bearer token | Delete one of the current user's reports |

### Interactive API documentation

After starting the backend:
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
- OpenAPI JSON: http://127.0.0.1:8000/openapi.json

## 08 · Run locally

### Prerequisites

- Python 3.11 or newer.
- A modern browser.
- Git.
- Optional: Docker and Docker Compose.

### 1. Clone the repository

~~~bash
git clone https://github.com/Adarsh-Singh-Chauhan/dristhi.git
cd dristhi
~~~

### 2. Configure the backend

~~~bash
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS / Linux
# source .venv/bin/activate

pip install -r backend/requirements.txt
~~~

Set a strong, private JWT secret before starting the backend.

Windows PowerShell:

~~~powershell
$env:JWT_SECRET_KEY = "replace-with-a-long-random-secret"
$env:DATABASE_PATH = "data/drishti.db"
uvicorn app.main:app --app-dir backend --reload
~~~

macOS / Linux:

~~~bash
export JWT_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
export DATABASE_PATH="data/drishti.db"
uvicorn app.main:app --app-dir backend --reload
~~~

Backend runs at http://127.0.0.1:8000.

### 3. Start the frontend

In a second terminal:

~~~bash
cd frontend
python -m http.server 5500
~~~

Open http://127.0.0.1:5500.

The frontend calls the local API at http://127.0.0.1:8000 by default. For another deployment, configure window.DRISHTI_API_BASE before app.js loads.

### 4. Run tests

~~~bash
pip install -r backend/requirements.txt
pytest backend/tests -q
~~~

### 5. Run with Docker Compose

Copy .env.example to .env, set a strong JWT_SECRET_KEY, then run:

~~~bash
docker compose up --build
~~~

The API will be available at http://127.0.0.1:8000.

## 09 · Verification methodology

The current engine is a **deterministic rule-based baseline**, not a trained machine-learning classifier.

Its job is limited to flagging selected textual patterns. It does not:
- Search the internet to verify the content.
- Confirm whether a government, public body or named person issued a statement.
- Inspect a photo, video, voice note or document attachment.
- Detect coordinated actors or infer who created a campaign.
- Verify the origin, destination or safety of a shortened URL.
- Determine intent, authenticity or factual truth.

### Recommended human verification checklist

- Find the earliest available publication of the claim.
- Locate the primary document, statement or data being referenced.
- Check the date, location and full context.
- Compare multiple independent, credible sources.
- Inspect whether a photo or video is old, cropped or presented out of context.
- Open links cautiously; do not enter credentials on unfamiliar pages.
- Record the evidence and uncertainty before reaching a conclusion.

## 10 · Problems, risks and global challenges

DRISHTI is designed around challenges that appear across information ecosystems worldwide. These are problem areas for research and future engineering—not claims that the current MVP already solves them.

| Challenge | Why it matters | Future direction |
| --- | --- | --- |
| Multilingual misinformation | Claims may be translated, transliterated or altered across languages | Language-aware models and region-specific evaluation |
| Crisis-time rumours | Urgent claims can spread during disasters, conflict or public emergencies | Crisis-context workflows and trusted primary-source references |
| Deepfakes and synthetic media | Audio, images and video can be manipulated | Media forensics, provenance signals and specialist review |
| Context collapse | Old content may be reused with a new date or location | Reverse-image search integrations and temporal context |
| Impersonation and spoofed notices | Messages may imitate official institutions or brands | Domain, certificate and source-provenance checks |
| Coordinated amplification | Repeated posts may create a false sense of consensus | Privacy-preserving network analysis with strong safeguards |
| Shortened and deceptive URLs | Link previews may hide the destination | Safe URL expansion and reputation checks in an isolated service |
| Limited fact-checking capacity | Human reviewers cannot manually inspect every forward | Explainable triage and reviewer queues |
| Algorithmic amplification | Engagement-driven distribution can increase reach | Research integrations using public, policy-compliant data |
| Privacy and evidence handling | Messages may contain personal or sensitive information | Data minimisation, retention controls and privacy-by-design |
| False positives | Legitimate urgent alerts or political speech may be flagged | Calibration, appeal and human-review mechanisms |
| Uneven access to trusted sources | Reliable information may be difficult to find in some regions | Local source registries and transparent source quality criteria |

## 11 · Responsible use, fairness and safeguards

This project must remain viewpoint-neutral and evidence-led.

- Do not classify content as harmful merely because it criticises India, a government, a political party, a public official, a company or an institution.
- Do not rank people, communities, journalists or political groups by ideology.
- Do not generate a “traitor”, “anti-national” or similar identity label.
- Do not automate reporting, account suspension, takedown or law-enforcement referral.
- Do not treat keyword matches, sentiment or virality as proof of falsity.
- Show why a signal was raised and what evidence is still missing.
- Include human review, appeal and correction paths before any consequential use.
- Minimise personal data and avoid collecting private group messages without consent and a valid legal basis.

The system should support readers and reviewers—not decide what opinions people may express.

## 12 · Security and privacy notes

The MVP includes password hashing and signed, expiring bearer tokens. It is a development foundation, not a completed production security assessment.

Before public deployment:
- Use HTTPS everywhere.
- Set a high-entropy JWT_SECRET_KEY and keep it outside source control.
- Restrict CORS_ORIGINS to the exact frontend domains.
- Use managed secrets and a managed database with backups.
- Add rate limiting and abuse monitoring at the gateway / reverse proxy.
- Add email verification, password reset and account recovery.
- Evaluate secure, HttpOnly cookie-based sessions or a backend-for-frontend for production.
- Add formal retention, export and account-deletion policies.
- Review database access, audit events, dependency updates and incident response.
- Conduct independent security and privacy testing.

Never commit real user messages, access tokens, passwords, API keys or production database files.

See SECURITY.md for reporting and deployment guidance.

## 13 · Known limitations

- Rule-based phrase matching can miss subtle or newly emerging narratives.
- The baseline vocabulary is limited and does not offer comprehensive language coverage.
- Urgent language may be appropriate in legitimate emergency communication.
- A shortened URL is not automatically malicious.
- The engine does not fetch sources or provide independent fact-checking.
- No social-platform APIs are connected in this MVP.
- No image, video, audio, OCR or deepfake analysis is implemented.
- No coordinated-campaign attribution or actor identification is implemented.
- SQLite is suitable for a small prototype, not a high-availability global service.
- Authentication does not yet include email verification, refresh tokens, recovery or enterprise SSO.
- The browser's demo fallback is illustrative and must not be confused with the backend result.

## 14 · Future roadmap

### Phase 1 — MVP foundation
- [x] FastAPI and OpenAPI / Swagger documentation.
- [x] User registration and login.
- [x] Password hashing and bearer authentication.
- [x] Explainable baseline text-signal analysis.
- [x] Saved history and per-record deletion.
- [x] Responsive browser interface.
- [x] Prototype scope and responsible-use documentation.

### Phase 2 — Evidence and source verification
- [ ] Source registry with transparent inclusion criteria.
- [ ] Citation and evidence attachment workflow.
- [ ] Safe URL expansion and domain reputation integration.
- [ ] Publication-date and context comparison.
- [ ] Reviewer notes, correction and appeal workflow.

### Phase 3 — Multilingual and media research
- [ ] Hindi and other language evaluation datasets with consent and documented provenance.
- [ ] Translation-aware and code-mixed text analysis.
- [ ] OCR for screenshots and public notices.
- [ ] Image provenance and reverse-search integrations.
- [ ] Audio / video forensics research with confidence and limitations clearly disclosed.

### Phase 4 — Campaign-pattern research
- [ ] Privacy-preserving analysis of public, lawfully accessible content.
- [ ] Repetition and timing pattern analysis.
- [ ] Coordinated amplification research with human oversight.
- [ ] False-positive measurement and independent evaluation.
- [ ] Transparent source and methodology governance.

### Phase 5 — Responsible scale
- [ ] PostgreSQL and managed infrastructure.
- [ ] Queue-based processing and observability.
- [ ] Regional language and accessibility improvements.
- [ ] Security audits, privacy impact assessment and red-team testing.
- [ ] Partnerships with independent researchers and fact-checking organisations.

Roadmap items are proposals; they are not implemented features.

## 15 · Contributing

Contributions are welcome in software engineering, security review, accessibility, language evaluation, documentation and responsible AI research.

Before proposing a classifier or dataset:
1. Document the intended use and limits.
2. Check data provenance, consent and licensing.
3. Measure false positives and false negatives across viewpoints and languages.
4. Avoid identity or ideology labels.
5. Include reproducible tests and human-review guidance.

## 16 · Author

**Adarsh Singh Chauhan**

- GitHub: [Adarsh-Singh-Chauhan](https://github.com/Adarsh-Singh-Chauhan)
- LinkedIn: [Adarsh Singh Chauhan](https://www.linkedin.com/in/adarsh-singh-5189b9283/)

---

<div align="center">

**DRISHTI — A better pause before the next share.**

<sub>Built as a cybersecurity and information-integrity prototype. Verify independently. Think critically. Share responsibly.</sub>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:12A89D,50:123B55,100:0B1220&height=110&section=footer" width="100%" alt="DRISHTI footer" />

</div>
