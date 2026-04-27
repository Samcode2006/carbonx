-- Fix RLS Policy for User Signup
-- Run this in Supabase SQL Editor to fix the signup issue

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Recreate the INSERT policy with proper permissions
-- This allows users to create their profile during signup
CREATE POLICY "Users can insert own profile" ON public.users 
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile';