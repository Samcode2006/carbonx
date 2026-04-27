# CarbonX Supabase Deployment Guide

## Prerequisites

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project reference ID and API keys

## Environment Variables Setup

### 1. Supabase Dashboard Environment Variables

Go to your Supabase project dashboard → Settings → Edge Functions → Environment Variables and add:

```
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
STRAVA_WEBHOOK_VERIFY_TOKEN=your_random_verify_token
```

### 2. Local Development Environment

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRAVA_CLIENT_ID=your_strava_client_id
```

## Database Setup

### 1. Run SQL Setup Script

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Execute the script

This will create:
- `users` and `ledger_entries` tables
- Row Level Security policies
- Storage bucket for eco-proofs
- Helper functions and triggers
- Performance indexes

### 2. Verify Database Setup

Run these queries to verify everything is set up correctly:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('users', 'ledger_entries');

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('users', 'ledger_entries');

-- Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'eco-proofs';
```

## Edge Functions Deployment

### 1. Login and Link Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Deploy Functions

```bash
# Deploy Strava token exchange function
supabase functions deploy exchange-strava-token

# Deploy Strava webhook function
supabase functions deploy strava-webhook
```

### 3. Verify Deployment

Check the Functions section in your Supabase dashboard to ensure both functions are deployed and running.

## Strava API Setup

### 1. Create Strava Application

1. Go to [Strava Developers](https://developers.strava.com/)
2. Create a new application
3. Set Authorization Callback Domain to your domain (e.g., `localhost:5173` for development)
4. Note your Client ID and Client Secret

### 2. Configure Webhook Subscription

Use the Strava API to create a webhook subscription:

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_STRAVA_CLIENT_ID \
  -F client_secret=YOUR_STRAVA_CLIENT_SECRET \
  -F callback_url=https://YOUR_PROJECT.supabase.co/functions/v1/strava-webhook \
  -F verify_token=YOUR_WEBHOOK_VERIFY_TOKEN
```

Or use this JavaScript code in your browser console:

```javascript
fetch('https://www.strava.com/api/v3/push_subscriptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    client_id: 'YOUR_STRAVA_CLIENT_ID',
    client_secret: 'YOUR_STRAVA_CLIENT_SECRET',
    callback_url: 'https://YOUR_PROJECT.supabase.co/functions/v1/strava-webhook',
    verify_token: 'YOUR_WEBHOOK_VERIFY_TOKEN'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## Frontend Integration

### 1. Update Supabase Client Configuration

Update your `src/supabaseClient.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 2. Update Environment Variables

Update your `.env.local` file with the correct values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRAVA_CLIENT_ID=your_strava_client_id
```

## Testing the Setup

### 1. Test Database Connection

```javascript
// Test in browser console
import { supabase } from './src/supabaseClient.js'

// Test connection
const { data, error } = await supabase.from('users').select('count')
console.log('Database test:', { data, error })
```

### 2. Test Edge Functions

```bash
# Test token exchange function
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/exchange-strava-token \
  -H "Content-Type: application/json" \
  -d '{"authCode":"test","userId":"test"}'

# Test webhook function (verification)
curl "https://YOUR_PROJECT.supabase.co/functions/v1/strava-webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test"
```

### 3. Test Strava Integration

1. Implement Strava OAuth flow in your React app
2. Complete the authorization process
3. Check that tokens are stored in the database
4. Create a test activity in Strava
5. Verify webhook processes the activity

## Troubleshooting

### Common Issues

1. **Edge Function Deployment Fails**
   - Check that you're logged in: `supabase status`
   - Verify project linking: `supabase projects list`
   - Check function logs in Supabase dashboard

2. **Database Connection Issues**
   - Verify environment variables are set correctly
   - Check RLS policies allow your operations
   - Ensure user is authenticated for protected operations

3. **Strava Webhook Not Working**
   - Verify webhook subscription is active
   - Check Edge Function logs for errors
   - Ensure verify token matches
   - Test webhook URL accessibility

4. **Token Exchange Fails**
   - Verify Strava client credentials
   - Check authorization callback domain matches
   - Ensure authorization code is fresh (expires quickly)

### Debugging Commands

```bash
# Check Supabase status
supabase status

# View function logs
supabase functions logs exchange-strava-token
supabase functions logs strava-webhook

# Test local development
supabase start
supabase functions serve
```

## Security Checklist

- [ ] RLS policies are enabled and tested
- [ ] Environment variables are set in Supabase dashboard (not in code)
- [ ] Strava client secret is not exposed to frontend
- [ ] Storage bucket policies are configured correctly
- [ ] Edge functions handle errors gracefully
- [ ] Input validation is implemented
- [ ] CORS headers are configured properly

## Production Deployment

1. Update environment variables for production URLs
2. Configure custom domain if needed
3. Set up monitoring and alerting
4. Test all functionality end-to-end
5. Monitor Edge Function performance and errors
6. Set up backup and recovery procedures

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Strava API Documentation](https://developers.strava.com/docs/)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)