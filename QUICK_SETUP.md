# Quick Setup Guide for CarbonX

## ✅ What's Working
- React app is running
- Supabase client is configured
- Email validation (only @vvce.ac.in emails allowed)

## 🔧 What You Need to Do Now

### Step 1: Set Up Database Tables

**The error you're seeing** ("Could not find the table 'public.users'") means the database tables haven't been created yet.

**To fix this:**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/ljivtyzjawhgsohwozkg
   - Log in with your Supabase account

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Run the Setup Script**
   - Open the file `supabase-setup.sql` in your project
   - Copy ALL the contents (Ctrl+A, Ctrl+C)
   - Paste into the Supabase SQL Editor
   - Click "Run" button (or press Ctrl+Enter)

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see two tables: `users` and `ledger_entries`

### Step 2: Test the App

After running the SQL script:

1. **Refresh your browser** (F5)
2. **Try to sign up** with a @vvce.ac.in email
3. You should be able to create an account successfully!

## 📋 What the SQL Script Does

The `supabase-setup.sql` script creates:

- ✅ **users table** - Stores user profiles, XP, CO2 savings
- ✅ **ledger_entries table** - Immutable log of all eco-actions
- ✅ **Row Level Security (RLS)** - Ensures data privacy
- ✅ **Storage bucket** - For eco-proof images
- ✅ **Triggers** - Automatically updates user totals
- ✅ **Helper functions** - For common operations
- ✅ **Indexes** - For better performance

## 🎯 After Database Setup

Once the database is set up, you can:

1. **Sign up** with your @vvce.ac.in email
2. **Log in** to the dashboard
3. **Upload eco-actions** (cycling, recycling, etc.)
4. **Earn XP and CO2 savings**
5. **View the leaderboard**
6. **Redeem rewards**

## 🚀 Optional: Strava Integration

If you want to integrate Strava for automatic activity tracking:

1. Set up Strava API credentials
2. Deploy the Edge Functions
3. Configure the webhook

See `deploy-supabase.md` for detailed instructions.

## ❓ Troubleshooting

### If you still see the error after running SQL:
1. Make sure the SQL script ran without errors
2. Check the Supabase logs for any error messages
3. Verify the tables exist in "Table Editor"
4. Try refreshing the browser with Ctrl+Shift+R (hard refresh)

### If signup fails:
1. Check that you're using a @vvce.ac.in email
2. Make sure password is at least 6 characters
3. Check browser console for error messages

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console (F12) for error messages
2. Check the Supabase logs in the dashboard
3. Review the error message carefully - it usually tells you what's wrong