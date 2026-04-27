# CarbonX Backend Architecture

## Overview

CarbonX backend is built entirely on Supabase, providing a serverless, scalable solution for the gamified carbon footprint reduction application. The architecture includes PostgreSQL database with Row Level Security, Edge Functions for Strava integration, and secure storage for image verification.

## 🏗️ Architecture Components

### Database (PostgreSQL)
- **users**: User profiles linked to Supabase Auth
- **ledger_entries**: Immutable log of all eco-actions
- **Row Level Security**: Ensures data privacy and security
- **Real-time subscriptions**: Live leaderboard updates

### Edge Functions (Deno/TypeScript)
- **exchange-strava-token**: OAuth token exchange with Strava
- **strava-webhook**: Real-time activity processing from Strava

### Storage
- **eco-proofs bucket**: Secure image storage for AI verification

### External Integrations
- **Strava API**: Activity tracking and verification
- **Gemini AI**: Image verification for manual eco-actions

## 📁 File Structure

```
├── supabase/
│   ├── functions/
│   │   ├── exchange-strava-token/
│   │   │   └── index.ts
│   │   └── strava-webhook/
│   │       └── index.ts
│   └── config.toml
├── src/utils/
│   └── stravaIntegration.js
├── supabase-setup.sql
├── deploy-supabase.md
├── requirements.md
├── design.md
├── tasks.md
└── .env.local
```

## 🚀 Quick Start

### 1. Database Setup
```sql
-- Execute supabase-setup.sql in your Supabase SQL Editor
-- This creates all tables, policies, and functions
```

### 2. Environment Variables
```env
# Add to Supabase Dashboard → Settings → Edge Functions
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
STRAVA_WEBHOOK_VERIFY_TOKEN=your_random_verify_token

# Add to .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRAVA_CLIENT_ID=your_strava_client_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Deploy Edge Functions
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy exchange-strava-token
supabase functions deploy strava-webhook
```

### 4. Configure Strava Webhook
```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_STRAVA_CLIENT_ID \
  -F client_secret=YOUR_STRAVA_CLIENT_SECRET \
  -F callback_url=https://YOUR_PROJECT.supabase.co/functions/v1/strava-webhook \
  -F verify_token=YOUR_WEBHOOK_VERIFY_TOKEN
```

## 🔐 Security Features

### Row Level Security (RLS)
- Users can only access their own ledger entries
- Public read access for leaderboard data
- Service role bypasses RLS for automated operations

### Data Protection
- Encrypted token storage
- Input validation and sanitization
- CORS protection
- Environment variable security

### Authentication
- Supabase Auth integration
- JWT token validation
- Secure session management

## 📊 Data Flow

### Strava Integration Flow
```
1. User clicks "Connect Strava" → OAuth redirect
2. User authorizes → Strava returns auth code
3. Frontend calls exchange-strava-token → Tokens stored
4. User completes activity → Strava sends webhook
5. strava-webhook processes → Ledger updated → XP awarded
```

### Manual Activity Flow
```
1. User uploads eco-proof image → Stored in bucket
2. AI verification processes image → Validates action
3. Frontend creates ledger entry → XP awarded
4. Leaderboard updates in real-time
```

## 🎮 Gamification System

### XP Calculation
```javascript
// Base XP + Distance XP × Type Multiplier
const xpEarned = (10 + distanceKm * 5) * typeMultiplier

// Type Multipliers:
// Cycling: 1.5x
// Running: 1.3x  
// Walking: 1.0x
// E-bike: 1.2x
// Hiking: 1.4x
```

### CO2 Savings Calculation
```javascript
// CO2 saved per km (vs car):
// Cycling: 120g/km
// Walking/Running: 150g/km
// E-bike: 100g/km

const co2SavedKg = (distanceKm * co2PerKm) / 1000
```

## 🔧 API Endpoints

### Edge Functions

#### POST /functions/v1/exchange-strava-token
Exchange Strava authorization code for access tokens.

**Request:**
```json
{
  "authCode": "string",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": boolean,
  "message": "string",
  "athlete": {
    "id": number,
    "name": "string"
  }
}
```

#### POST /functions/v1/strava-webhook
Process Strava activity webhooks.

**Webhook Event:**
```json
{
  "object_type": "activity",
  "object_id": number,
  "aspect_type": "create",
  "owner_id": number,
  "subscription_id": number,
  "event_time": number
}
```

### Database Tables

#### users
```sql
id UUID PRIMARY KEY REFERENCES auth.users
display_name TEXT
department TEXT
total_xp INTEGER DEFAULT 0
total_co2_saved FLOAT DEFAULT 0.0
strava_access_token TEXT
strava_refresh_token TEXT
strava_user_id BIGINT
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### ledger_entries
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
action_type TEXT NOT NULL
co2_saved FLOAT NOT NULL
xp_earned INTEGER NOT NULL
verification_method TEXT NOT NULL
image_url TEXT
strava_activity_id BIGINT
metadata JSONB
created_at TIMESTAMP
```

## 🛠️ Development Tools

### Frontend Integration
```javascript
import { 
  connectStrava, 
  handleStravaCallback, 
  checkStravaConnection,
  getStravaActivities 
} from './utils/stravaIntegration.js';

// Connect Strava account
connectStrava();

// Handle OAuth callback
const result = await handleStravaCallback(userId);

// Check connection status
const { connected } = await checkStravaConnection(userId);
```

### Database Helpers
```sql
-- Update user totals
SELECT update_user_totals('user-uuid');

-- Check for duplicate activities
SELECT check_duplicate_strava_activity('user-uuid', 12345);

-- Get user by Strava ID
SELECT get_user_by_strava_id(67890);
```

## 📈 Performance Optimizations

### Database Indexes
- `idx_users_department` - Leaderboard queries
- `idx_users_total_xp` - XP rankings
- `idx_ledger_entries_user_id` - User activity history
- `idx_ledger_entries_created_at` - Recent activities

### Edge Function Optimizations
- Minimal dependencies for fast cold starts
- Efficient error handling
- Connection pooling via Supabase
- Proper logging for debugging

### Caching Strategy
- Client-side leaderboard caching
- Real-time subscriptions for live updates
- Edge function response optimization

## 🔍 Monitoring & Debugging

### Logging
```bash
# View Edge Function logs
supabase functions logs exchange-strava-token
supabase functions logs strava-webhook

# Check Supabase status
supabase status
```

### Common Issues
1. **Token Exchange Fails**: Check Strava client credentials
2. **Webhook Not Triggered**: Verify subscription and verify token
3. **RLS Blocks Query**: Ensure user is authenticated
4. **Function Timeout**: Optimize function performance

### Health Checks
```sql
-- Check recent activities
SELECT COUNT(*) FROM ledger_entries WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check user connections
SELECT COUNT(*) FROM users WHERE strava_access_token IS NOT NULL;

-- Check webhook processing
SELECT * FROM ledger_entries WHERE verification_method = 'Strava' ORDER BY created_at DESC LIMIT 10;
```

## 🚀 Production Deployment

### Checklist
- [ ] Environment variables configured
- [ ] Edge Functions deployed
- [ ] Database schema applied
- [ ] Strava webhook registered
- [ ] RLS policies tested
- [ ] Storage bucket configured
- [ ] Monitoring set up
- [ ] Backup procedures in place

### Scaling Considerations
- Supabase Free Tier limits
- Edge Function concurrent executions
- Database connection pooling
- Storage usage monitoring
- API rate limiting

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Strava API Documentation](https://developers.strava.com/docs/)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🤝 Contributing

1. Follow the established patterns in Edge Functions
2. Maintain RLS policies for security
3. Add proper error handling and logging
4. Update documentation for new features
5. Test thoroughly before deployment

## 📄 License

This backend architecture is part of the CarbonX project. See the main project README for license information.