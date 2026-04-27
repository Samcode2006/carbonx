-- Automatic User Profile Creation Trigger
-- This creates a user profile automatically when someone signs up
-- Run this in Supabase SQL Editor

-- First, drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create a function that automatically creates a user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, department, total_xp, total_co2_saved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User'),
    'General',
    0,
    0.0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that runs after a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Now users don't need to insert their own profile - it's automatic!
-- But we still allow updates to their profile
CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        -- Prevent direct manipulation of calculated fields
        total_xp = (SELECT total_xp FROM public.users WHERE id = auth.uid()) AND
        total_co2_saved = (SELECT total_co2_saved FROM public.users WHERE id = auth.uid())
    );