-- FocusHome cloud persistence (Supabase Postgres)
-- Run: python scripts/init_db.py

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    status TEXT NOT NULL,
    source TEXT,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    actual_duration_seconds INTEGER NOT NULL DEFAULT 0,
    calendar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

CREATE TABLE IF NOT EXISTS inventories (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 0,
    bricks INTEGER NOT NULL DEFAULT 0,
    glass INTEGER NOT NULL DEFAULT 0,
    roof_tiles INTEGER NOT NULL DEFAULT 0,
    unlocked_assets JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_homes (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'starter',
    stack_count INTEGER NOT NULL DEFAULT 0,
    decoration_placements JSONB NOT NULL DEFAULT '[]'::jsonb,
    owned_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    grid_cells JSONB NOT NULL DEFAULT '[]'::jsonb,
    home_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS completed_homes (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    tier TEXT NOT NULL,
    snapshot JSONB NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completed_homes_user_id ON completed_homes(user_id);

CREATE TABLE IF NOT EXISTS preferences (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    language TEXT NOT NULL DEFAULT 'en',
    theme TEXT NOT NULL DEFAULT 'cozy',
    default_duration_seconds INTEGER NOT NULL DEFAULT 1500,
    calendar_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_events (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON activity_events(user_id);
