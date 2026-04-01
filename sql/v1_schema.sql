-- =============================================
-- 🏒 Power Play - Supabase Database Schema
-- Step 1: Database Setup
-- =============================================

-- =============================================
-- 1. CUSTOM TYPES (ENUMS)
-- =============================================

-- Position enum for players
CREATE TYPE position_type AS ENUM ('FW', 'DF', 'G');

-- Language preference for notifications
CREATE TYPE language_type AS ENUM ('ko', 'en');

-- User role enum
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Match status enum
CREATE TYPE match_status AS ENUM ('open', 'closed', 'canceled');

-- Participant status enum
CREATE TYPE participant_status AS ENUM ('applied', 'confirmed', 'waiting', 'canceled');

-- Team color enum for team balancing
CREATE TYPE team_color AS ENUM ('Black', 'White');

-- =============================================
-- 2. TABLES
-- =============================================

-- -----------------------------------------
-- 2.1 Rinks (Venues) - Must be created first (referenced by matches)
-- -----------------------------------------
CREATE TABLE rinks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ko TEXT NOT NULL,                      -- e.g. "제니스 아이스링크"
    name_en TEXT NOT NULL,                      -- e.g. "Zenith Ice Rink"
    map_url TEXT,                               -- Naver/Google Map Link
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE rinks IS 'Ice rink venues for matches';
COMMENT ON COLUMN rinks.name_ko IS 'Rink name in Korean';
COMMENT ON COLUMN rinks.name_en IS 'Rink name in English';

-- -----------------------------------------
-- 2.2 Profiles (Users)
-- -----------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,                             -- Display Name (Global friendly)
    position position_type DEFAULT 'FW',
    preferred_lang language_type DEFAULT 'ko',  -- For Notifications
    role user_role DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN profiles.full_name IS 'Display name, works for both Korean and English names';
COMMENT ON COLUMN profiles.position IS 'Default position: FW (Forward), DF (Defense), G (Goalie)';
COMMENT ON COLUMN profiles.preferred_lang IS 'ko for Korean, en for English';

-- -----------------------------------------
-- 2.3 Matches (Games)
-- -----------------------------------------
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rink_id UUID REFERENCES rinks(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,            -- Game Start Time
    fee INTEGER NOT NULL DEFAULT 0,             -- Cost per person
    max_fw INTEGER NOT NULL DEFAULT 8,          -- Max Forwards
    max_df INTEGER NOT NULL DEFAULT 4,          -- Max Defenders
    max_g INTEGER NOT NULL DEFAULT 2,           -- Max Goalies
    status match_status DEFAULT 'open',
    description TEXT,                           -- Host's notice
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE matches IS 'Ice hockey match/game listings';
COMMENT ON COLUMN matches.max_fw IS 'Maximum number of forwards allowed';
COMMENT ON COLUMN matches.max_df IS 'Maximum number of defenders allowed';
COMMENT ON COLUMN matches.max_g IS 'Maximum number of goalies allowed';

-- -----------------------------------------
-- 2.4 Participants (Roster)
-- -----------------------------------------
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    position position_type NOT NULL,            -- Applied Position (FW/DF/G)
    status participant_status DEFAULT 'applied',
    payment_status BOOLEAN DEFAULT FALSE,       -- true if paid
    team_color team_color,                      -- 'Black', 'White', or null (unassigned)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate entries for same user in same match
    UNIQUE(match_id, user_id)
);

COMMENT ON TABLE participants IS 'Match participation roster';
COMMENT ON COLUMN participants.position IS 'Position applied for this specific match';
COMMENT ON COLUMN participants.status IS 'applied: initial, confirmed: accepted, waiting: waitlist, canceled: withdrawn';
COMMENT ON COLUMN participants.team_color IS 'Team assignment for balancing (Black or White)';

-- =============================================
-- 3. INDEXES
-- =============================================

CREATE INDEX idx_matches_start_time ON matches(start_time);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_rink_id ON matches(rink_id);
CREATE INDEX idx_participants_match_id ON participants(match_id);
CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_participants_status ON participants(status);

-- =============================================
-- 4. UPDATED_AT TRIGGER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_rinks_updated_at
    BEFORE UPDATE ON rinks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE rinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------
-- 6.1 Rinks Policies
-- -----------------------------------------

-- Public read access
CREATE POLICY "Rinks are publicly readable"
    ON rinks FOR SELECT
    TO authenticated, anon
    USING (true);

-- Only admin can create/update/delete rinks
CREATE POLICY "Admins can insert rinks"
    ON rinks FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update rinks"
    ON rinks FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete rinks"
    ON rinks FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- -----------------------------------------
-- 6.2 Profiles Policies
-- -----------------------------------------

-- Public read access for profiles
CREATE POLICY "Profiles are publicly readable"
    ON profiles FOR SELECT
    TO authenticated, anon
    USING (true);

-- Users can insert their own profile (backup for trigger)
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin can update any profile (for role management)
CREATE POLICY "Admins can update any profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- -----------------------------------------
-- 6.3 Matches Policies
-- -----------------------------------------

-- Public read access for matches
CREATE POLICY "Matches are publicly readable"
    ON matches FOR SELECT
    TO authenticated, anon
    USING (true);

-- Only admin can create matches
CREATE POLICY "Admins can insert matches"
    ON matches FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admin can update matches
CREATE POLICY "Admins can update matches"
    ON matches FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admin can delete matches
CREATE POLICY "Admins can delete matches"
    ON matches FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- -----------------------------------------
-- 6.4 Participants Policies
-- -----------------------------------------

-- Public read access for participants
CREATE POLICY "Participants are publicly readable"
    ON participants FOR SELECT
    TO authenticated, anon
    USING (true);

-- Users can insert their own participation (join a match)
CREATE POLICY "Users can insert own participation"
    ON participants FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own participation (cancel)
CREATE POLICY "Users can update own participation"
    ON participants FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admin can update any participation (payment status, team assignment, etc.)
CREATE POLICY "Admins can update any participation"
    ON participants FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Users can delete their own participation
CREATE POLICY "Users can delete own participation"
    ON participants FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Admin can delete any participation
CREATE POLICY "Admins can delete any participation"
    ON participants FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current position counts for a match
CREATE OR REPLACE FUNCTION get_match_position_counts(p_match_id UUID)
RETURNS TABLE (
    fw_count BIGINT,
    df_count BIGINT,
    g_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE position = 'FW' AND status IN ('applied', 'confirmed')) AS fw_count,
        COUNT(*) FILTER (WHERE position = 'DF' AND status IN ('applied', 'confirmed')) AS df_count,
        COUNT(*) FILTER (WHERE position = 'G' AND status IN ('applied', 'confirmed')) AS g_count
    FROM participants
    WHERE match_id = p_match_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. SEED DATA (Optional - for development)
-- =============================================

-- Uncomment below to add sample rinks
/*
INSERT INTO rinks (name_ko, name_en, map_url) VALUES
    ('제니스 아이스링크', 'Zenith Ice Rink', 'https://map.naver.com/...'),
    ('목동 아이스링크', 'Mokdong Ice Rink', 'https://map.naver.com/...'),
    ('태릉 국제스케이트장', 'Taereung International Ice Rink', 'https://map.naver.com/...');
*/
