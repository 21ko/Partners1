-- Partners — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor to initialise the database.

-- ── Builders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS builders (
    username          TEXT PRIMARY KEY,
    password          TEXT NOT NULL,           -- bcrypt hashed
    github_username   TEXT NOT NULL,
    avatar            TEXT DEFAULT '',
    bio               TEXT DEFAULT '',
    building_style    TEXT DEFAULT 'figures_it_out',
    interests         TEXT[] DEFAULT '{}',
    open_to           TEXT[] DEFAULT '{}',
    availability      TEXT DEFAULT 'open',
    current_idea      TEXT,
    city              TEXT,
    github_languages  TEXT[] DEFAULT '{}',
    github_repos      JSONB DEFAULT '[]',
    total_stars       INTEGER DEFAULT 0,
    public_repos      INTEGER DEFAULT 0,
    learning          TEXT[] DEFAULT '{}',
    experience_level  TEXT DEFAULT 'intermediate',
    looking_for       TEXT DEFAULT 'build_partner',
    email             TEXT DEFAULT '',
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Sessions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    session_id  TEXT PRIMARY KEY,
    username    TEXT NOT NULL REFERENCES builders(username) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username);

-- ── Communities ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS communities (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name           TEXT NOT NULL,
    description    TEXT DEFAULT '',
    type           TEXT DEFAULT 'general',   -- interest | stack | city | design | hackathon
    host_username  TEXT,
    event_date     TEXT,
    extra_data     JSONB DEFAULT '{}',
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Community Members ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_members (
    community_id  UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    username      TEXT NOT NULL REFERENCES builders(username) ON DELETE CASCADE,
    joined_at     TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (community_id, username)
);

CREATE INDEX IF NOT EXISTS idx_community_members_username ON community_members(username);

-- ── Seed Communities ──────────────────────────────────────────
INSERT INTO communities (name, description, type) VALUES
    ('AI Tools',     'Building with LLMs, agents, and AI-powered products',            'interest'),
    ('Web Apps',     'Frontend, fullstack, and everything that runs in a browser',      'stack'),
    ('Dev Tools',    'CLIs, editors, compilers — tools for developers',               'interest'),
    ('Mobile',       'iOS, Android, and cross-platform mobile builders',              'stack'),
    ('Open Source',  'Building in public, contributing to the commons',               'interest'),
    ('UI/UX',        'Designers who code and developers who design',                  'design'),
    ('Paris Builders', 'Community for developers and makers in Paris',                'city'),
    ('London Tech',  'Building the future in London',                                 'city'),
    ('Berlin Hackers', 'Berlin-based builders and founders',                          'city'),
    ('San Francisco Hub', 'Connect with builders in the heart of SF',                 'city'),
    ('Casablanca Devs', 'Growing the tech ecosystem in Casablanca',                   'city')
ON CONFLICT DO NOTHING;
