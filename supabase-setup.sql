-- CarbonX Database Setup Script
-- Execute this in your Supabase SQL Editor

-- 1. Create the Users Table
-- This links directly to Supabase's built-in Auth system
CREATE TABLE public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    display_name TEXT,
    department TEXT, -- e.g., 'CS', 'Engineering' for the leaderboard
    total_xp INTEGER DEFAULT 0,
    total_co2_saved FLOAT DEFAULT 0.0,
    strava_access_token TEXT,
    strava_refresh_token TEXT,
    strava_user_id BIGINT, -- Strava's user ID for webhook matching
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create the Ledger Entries Table
-- This is the immutable log of all eco-actions
CREATE TABLE public.ledger_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    action_type TEXT NOT NULL, -- e.g., 'Cycling', 'Digital Notes', 'Public Transport'
    co2_saved FLOAT NOT NULL,
    xp_earned INTEGER NOT NULL,
    verification_method TEXT NOT NULL, -- 'Strava', 'AI Image', 'Manual'
    image_url TEXT, -- Used if verified via AI/Storage
    strava_activity_id BIGINT, -- Reference to Strava activity if applicable
    metadata JSONB, -- Additional data like distance, duration, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create indexes for better performance
CREATE INDEX idx_users_department ON public.users(department);
CREATE INDEX idx_users_total_xp ON public.users(total_xp DESC);
CREATE INDEX idx_users_total_co2_saved ON public.users(total_co2_saved DESC);
CREATE INDEX idx_users_strava_user_id ON public.users(strava_user_id);
CREATE INDEX idx_ledger_entries_user_id ON public.ledger_entries(user_id);
CREATE INDEX idx_ledger_entries_created_at ON public.ledger_entries(created_at DESC);
CREATE INDEX idx_ledger_entries_strava_activity_id ON public.ledger_entries(strava_activity_id);

-- 4. Turn on Row Level Security (RLS)
-- This ensures users can't hack the frontend to edit other people's XP
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- 5. Create Security Policies

-- Everyone can read the users table (needed for the live leaderboard)
CREATE POLICY "Leaderboard is public" ON public.users 
    FOR SELECT USING (true);

-- Users can update their own profile (but not XP/CO2 totals directly)
CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        -- Prevent direct manipulation of calculated fields
        total_xp = (SELECT total_xp FROM public.users WHERE id = auth.uid()) AND
        total_co2_saved = (SELECT total_co2_saved FROM public.users WHERE id = auth.uid())
    );

-- Users can insert their own user record (for profile creation)
CREATE POLICY "Users can insert own profile" ON public.users 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can view their own ledger history
CREATE POLICY "Users can view their own ledger" ON public.ledger_entries 
    FOR SELECT USING (auth.uid() = user_id);

-- Only authenticated users can insert an eco-action (pending verification)
CREATE POLICY "Users can insert their own actions" ON public.ledger_entries 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create functions for updating user totals
-- This function recalculates user totals from ledger entries
CREATE OR REPLACE FUNCTION update_user_totals(target_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET 
        total_xp = COALESCE((
            SELECT SUM(xp_earned) 
            FROM public.ledger_entries 
            WHERE user_id = target_user_id
        ), 0),
        total_co2_saved = COALESCE((
            SELECT SUM(co2_saved) 
            FROM public.ledger_entries 
            WHERE user_id = target_user_id
        ), 0.0),
        updated_at = NOW()
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to automatically update user totals when ledger entries are added
CREATE OR REPLACE FUNCTION trigger_update_user_totals()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_user_totals(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ledger_entry_insert
    AFTER INSERT ON public.ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_user_totals();

-- 8. Create storage bucket for eco-proof images
INSERT INTO storage.buckets (id, name, public)
VALUES ('eco-proofs', 'eco-proofs', true);

-- 9. Create storage policies
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload eco-proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'eco-proofs' AND 
        auth.role() = 'authenticated'
    );

-- Allow public read access for AI verification
CREATE POLICY "Public read access for eco-proofs" ON storage.objects
    FOR SELECT USING (bucket_id = 'eco-proofs');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own eco-proofs" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'eco-proofs' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 10. Create a view for leaderboard data (optional, for better performance)
CREATE VIEW public.leaderboard AS
SELECT 
    id,
    display_name,
    department,
    total_xp,
    total_co2_saved,
    created_at,
    ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank_xp,
    ROW_NUMBER() OVER (ORDER BY total_co2_saved DESC) as rank_co2
FROM public.users
WHERE display_name IS NOT NULL
ORDER BY total_xp DESC;

-- Grant access to the leaderboard view
GRANT SELECT ON public.leaderboard TO authenticated, anon;

-- 11. Create helper function for Strava user lookup
CREATE OR REPLACE FUNCTION get_user_by_strava_id(strava_id BIGINT)
RETURNS UUID AS $$
DECLARE
    user_uuid UUID;
BEGIN
    SELECT id INTO user_uuid 
    FROM public.users 
    WHERE strava_user_id = strava_id;
    
    RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to prevent duplicate Strava activities
CREATE OR REPLACE FUNCTION check_duplicate_strava_activity(
    target_user_id UUID, 
    activity_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO existing_count
    FROM public.ledger_entries
    WHERE user_id = target_user_id 
    AND strava_activity_id = activity_id;
    
    RETURN existing_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Setup complete!
-- Next steps:
-- 1. Deploy the Edge Functions
-- 2. Configure environment variables in Supabase
-- 3. Set up Strava webhook endpoint
-- 4. Test the integration