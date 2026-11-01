# DRISHTI — Supabase Free PostgreSQL & first-admin setup

This guide keeps DRISHTI on free tiers. **Do not upgrade, add paid compute, enable add-ons, or add a paid notification provider.** Supabase Free is $0/month. Current included allowances include 500 MB database per project, 5 GB egress and 1 GB file storage. Supabase says repeated Free quota breaches can cause service restrictions (such as pausing or read-only mode), so keep usage within the published limits rather than upgrading. See https://supabase.com/docs/guides/platform/billing-on-supabase and https://supabase.com/docs/guides/platform/billing-faq.

## 1. Create a dedicated Free organization and project

1. Open the [Supabase dashboard](https://supabase.com/dashboard).
2. Open the organization switcher and choose **New organization**.
3. Name it **DRISHTI** (or **DRISHTI Free**) and select the **Free** plan. Do not select Pro, Team, or Enterprise.
4. Create a project named **drishti-postgres**.
5. Select **Mumbai (ap-south-1)** to keep the database close to the Vercel Mumbai function region.
6. Generate a strong database password and save it in your password manager. Do not put it in GitHub, README, an issue, or a chat message.
7. Keep billing on Free. Do not add a paid payment method or turn on compute upgrades, PITR, IPv4, custom domains, branching, log drains, or other paid add-ons. If a screen asks you to upgrade or enter billing details, stop and do not continue.

Supabase currently allows up to **two active Free projects** across all organizations where you are Owner or Admin; paused projects do not count. Your connected account showed one ACTIVE_HEALTHY project and two INACTIVE projects when this guide was prepared, so check the Free-project counter in the dashboard before creating another. Free projects can pause after about seven days of low database activity. Paused projects do not incur compute charges and can be restored from the dashboard. See https://supabase.com/docs/guides/platform/free-project-pausing.

## 2. Create the PostgreSQL schema

1. Open the new DRISHTI project.
2. Go to **SQL Editor → New query**.
3. Open `supabase/migrations/202611010001_drishti_core_admin_alerts_sos.sql` in this repository.
4. Paste the complete SQL into the editor and run it once.
5. Confirm that the tables `users`, `analyses`, `alerts`, `trusted_contacts`, `sos_reports`, and `admin_audit_log` exist.

The migration enables Row Level Security and creates no public policies. The application accesses these tables through the server-side PostgreSQL connection only. Do not expose a database password or service-role key in browser JavaScript.

## 3. Connect the database to Vercel

1. In Supabase, open **Project Settings → Database → Connection string**.
2. Choose a PostgreSQL connection string suitable for the Vercel server runtime. For a serverless deployment, use the Supabase pooler option and keep the project password private.
3. In [Vercel → DRISHTI → Settings → Environment Variables](https://vercel.com/dashboard), add:
   - `DATABASE_URL` = the private PostgreSQL connection string
   - Apply it to **Production**, and Preview only if you intend to test there.
4. Keep the existing `JWT_SECRET_KEY` private and unchanged. Do not put either secret in GitHub.
5. Redeploy the latest production deployment after saving the environment variable.
6. Check `https://dristhi-five.vercel.app/health`. The storage field should report `postgres`, not `unconfigured`.

If the Free project pauses, restore it from the Supabase dashboard. Do not upgrade simply to prevent pausing; restoration is the zero-cost path.

## 4. Create your first admin login safely

Admin credentials must **never** be committed to GitHub. The repository is public, so storing a username/password there would expose the admin account.

1. Open the live DRISHTI application and register using the email address you want as the administrator.
2. Choose your own strong password and save it privately.
3. On your own Windows machine, temporarily set `DATABASE_URL` in PowerShell to the private Supabase connection string:
   ```powershell
   $env:DATABASE_URL = "PASTE_PRIVATE_POSTGRES_CONNECTION_STRING_HERE"
   python -m pip install "psycopg[binary]>=3.2,<4.0"
   python scripts/promote_first_admin.py admin@example.com
   Remove-Item Env:DATABASE_URL
   ```
4. Replace `admin@example.com` with the exact email used during registration.
5. Sign out and sign in again so the application reads the updated role.

The script promotes only an existing account and refuses to run if an admin already exists. It does not generate, store, or print a password. Keep the database connection string out of terminal screenshots and shared logs.

## 5. Zero-cost notification scope

The initial zero-cost design uses **in-app alerts** and an **admin SOS review queue**. Selecting trusted contacts records who the user wants to involve, but it does not silently send SMS, WhatsApp, or email. Automatic delivery needs a separately configured messaging/push provider and may create usage or third-party charges. Do not enable one without a separate cost review and explicit approval.

An automatic analysis alert means “high review priority / verify this”, not “confirmed misinformation”. SOS is an urgent request for DRISHTI reviewers; it is not an automatic police, ambulance, or emergency-services dispatch.

## 6. Vercel free-tier guardrail

The existing Vercel deployment is on **Hobby ($0)**. Keep it on Hobby; do not start a Pro trial or upgrade. Hobby is for personal, non-commercial projects. Vercel documents that over-limit Hobby features generally become unavailable until the usage window resets instead of starting a paid usage cycle. See https://vercel.com/docs/plans/hobby. Keep the default `*.vercel.app` URL; a separately purchased custom domain is not part of this zero-cost setup.

## 7. What is not enabled yet

Creating the Supabase organization/project and adding `DATABASE_URL` are owner-controlled setup steps. Until those are completed and verified, production account registration, saved history, persistent alerts, SOS storage, and the admin console must remain disabled. Do not share the database password or any service-role key; only share the project reference/URL and a confirmation that the environment variable is configured.
