# CarbonX Backend Design Document

## Architecture Overview

CarbonX uses a serverless architecture built entirely on Supabase, leveraging PostgreSQL for data persistence, Edge Functions for business logic, and integrated authentication and storage services.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   Supabase      │    │   Strava API    │
│                 │    │                 │    │                 │
│  - Auth UI      │◄──►│  - Auth         │    │  - OAuth        │
│  - Dashboard    │    │  - PostgreSQL   │    │  - Webhooks     │
│  - Leaderboard  │    │  - Edge Funcs   │    │  - Activities   │
│  - Upload       │    │  - Storage      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Database Design

### Entity Relationship Diagram

```
auth.users (Supabase managed)
    │
    │ 1:1
    ▼
public.users
    │
    │ 1:N
    ▼
public.ledger_entries
```

### Table Schemas

#### users table
```sql
CREATE TABLE public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    display_name TEXT,
    department TEXT,
    total_xp INTEGER DEFAULT 0,
    total_co2_saved FLOAT DEFAULT 0.0,
    strava_access_token TEXT,
    strava_refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### ledger_entries table
```sql
CREATE TABLE public.ledger_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    action_type TEXT NOT NULL,
    co2_saved FLOAT NOT NULL,
    xp_earned INTEGER NOT NULL,
    verification_method TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security Model

### Row Level Security Policies

1. **Public Leaderboard Access**
   - Users table: SELECT allowed for all authenticated users
   - Enables real-time leaderboard functionality

2. **Private Ledger Access**
   - Ledger entries: Users can only SELECT/INSERT their own records
   - Prevents data tampering and ensures privacy

3. **Service Role Operations**
   - Edge Functions use service role key for privileged operations
   - Bypasses RLS for automated processes

## API Design

### Edge Functions

#### 1. exchange-strava-token
**Endpoint**: `/functions/v1/exchange-strava-token`
**Method**: POST
**Purpose**: Exchange Strava authorization code for access tokens

**Request Body**:
```json
{
  "authCode": "string",
  "userId": "uuid"
}
```

**Response**:
```json
{
  "success": boolean,
  "message": "string"
}
```

**Flow**:
1. Validate user authentication
2. Exchange code with Strava API
3. Store tokens in users table
4. Return success status

#### 2. strava-webhook
**Endpoint**: `/functions/v1/strava-webhook`
**Method**: POST
**Purpose**: Process Strava activity webhooks

**Request Body** (Strava format):
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

**Flow**:
1. Verify webhook signature
2. Fetch activity details from Strava API
3. Calculate CO2 savings and XP
4. Insert ledger entry
5. Update user totals

## Data Flow Diagrams

### Strava OAuth Flow
```
User → React Client → exchange-strava-token → Strava API → Database
  1. Click "Connect Strava"
  2. OAuth redirect
  3. Authorization code
  4. Token exchange
  5. Store tokens
```

### Activity Verification Flow
```
Strava → strava-webhook → Database → React Client
  1. Activity completed
  2. Webhook notification
  3. Fetch activity details
  4. Calculate rewards
  5. Update ledger
  6. Real-time UI update
```

## Storage Design

### eco-proofs Bucket
- **Purpose**: Store user-uploaded images for AI verification
- **Access**: Authenticated users can upload
- **Security**: Public read access for verification processing
- **File Types**: Images (jpg, png, webp)
- **Size Limit**: 5MB per file

## Integration Patterns

### Strava API Integration
- **OAuth 2.0**: Standard authorization flow
- **Webhooks**: Real-time activity notifications
- **Rate Limiting**: Respect Strava API limits
- **Token Refresh**: Automatic token renewal

### AI Verification Integration
- **Image Processing**: Upload to storage bucket
- **Verification Service**: External AI service integration
- **Result Processing**: Update ledger based on AI results

## Performance Considerations

### Database Optimization
- Indexes on frequently queried columns (user_id, created_at)
- Efficient RLS policy design
- Connection pooling via Supabase

### Edge Function Optimization
- Minimal cold start dependencies
- Efficient error handling
- Proper logging for debugging

### Caching Strategy
- Client-side caching for leaderboard data
- Supabase real-time subscriptions for live updates
- Edge function response caching where appropriate

## Error Handling

### Database Errors
- Foreign key constraint violations
- RLS policy violations
- Connection timeouts

### API Integration Errors
- Strava API rate limits
- Network timeouts
- Invalid tokens

### Edge Function Errors
- Authentication failures
- Validation errors
- External service failures

## Monitoring and Logging

### Metrics to Track
- User registration and activity
- Strava integration success rates
- Edge function performance
- Database query performance

### Logging Strategy
- Structured logging in Edge Functions
- Error tracking and alerting
- Performance monitoring
- Security event logging