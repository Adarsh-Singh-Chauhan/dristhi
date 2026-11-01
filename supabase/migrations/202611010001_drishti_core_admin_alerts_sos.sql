-- DRISHTI PostgreSQL foundation for accounts, analysis history, alerts, SOS and administration.
-- Run this migration once in the dedicated DRISHTI Supabase project's SQL Editor.

BEGIN;

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

CREATE TABLE IF NOT EXISTS public.analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_platform TEXT NOT NULL,
  source_url TEXT,
  content_excerpt TEXT NOT NULL,
  score INTEGER NOT NULL,
  priority TEXT NOT NULL,
  indicators_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_created
  ON public.analyses(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info'
    CHECK (level IN ('info', 'medium', 'high')),
  category TEXT NOT NULL DEFAULT 'system'
    CHECK (category IN ('analysis', 'sos', 'system', 'reviewed_notice')),
  source_id TEXT,
  created_at TEXT NOT NULL,
  read_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_created
  ON public.alerts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.trusted_contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TEXT NOT NULL,
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user
  ON public.trusted_contacts(user_id);

CREATE TABLE IF NOT EXISTS public.sos_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  source_url TEXT,
  urgency TEXT NOT NULL DEFAULT 'high'
    CHECK (urgency IN ('normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  trusted_contact_ids_json TEXT NOT NULL DEFAULT '[]',
  review_notes TEXT,
  reviewed_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  location_shared BOOLEAN NOT NULL DEFAULT FALSE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_accuracy_m DOUBLE PRECISION
);

-- Additive upgrades for databases that applied the earlier SOS schema.
ALTER TABLE public.sos_reports ADD COLUMN IF NOT EXISTS location_shared BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.sos_reports ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.sos_reports ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.sos_reports ADD COLUMN IF NOT EXISTS location_accuracy_m DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_sos_status_created
  ON public.sos_reports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created
  ON public.admin_audit_log(created_at DESC);

-- Defensive network indicators entered by an authorised Superadmin.
-- These are public IP/domain observables, never automatically collected visitor IPs.
CREATE TABLE IF NOT EXISTS public.network_indicators (
  id TEXT PRIMARY KEY,
  indicator_type TEXT NOT NULL CHECK (indicator_type IN ('ip', 'domain')),
  indicator TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'under_review' CHECK (status IN ('under_review', 'confirmed', 'false_positive')),
  location_label TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  source_label TEXT NOT NULL,
  notes TEXT,
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_network_indicators_created
  ON public.network_indicators(created_at DESC);

ALTER TABLE public.network_indicators ENABLE ROW LEVEL SECURITY;

-- The application connects to PostgreSQL from the FastAPI server using DATABASE_URL.
-- No browser/anon-key access is granted to these private tables.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

COMMIT;
