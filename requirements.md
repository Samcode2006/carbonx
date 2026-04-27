# CarbonX Backend Requirements

## Project Overview
CarbonX is a gamified carbon footprint reduction React application with a Supabase backend that tracks eco-friendly actions, integrates with Strava for activity verification, and provides a competitive leaderboard system.

## Technical Stack
- **Frontend**: React + Vite
- **Backend**: Supabase (Free Tier)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Serverless Functions**: Supabase Edge Functions (Deno/TypeScript)
- **External Integration**: Strava API

## Core Requirements

### 1. Database Schema
- **users table**: Links to Supabase auth.users, stores user profile and Strava tokens
- **ledger_entries table**: Immutable log of all eco-actions with verification methods
- **Row Level Security**: Ensures data privacy and security
- **Public storage bucket**: For AI image verification uploads

### 2. Authentication & Authorization
- Supabase Auth integration
- RLS policies for data access control
- Service role key for server-side operations

### 3. Strava Integration
- OAuth 2.0 flow for user authorization
- Webhook receiver for real-time activity updates
- Secure token storage and refresh mechanism
- Automatic CO2 and XP calculation for cycling activities

### 4. Gamification System
- XP (Experience Points) for eco-actions
- CO2 savings tracking
- Department-based leaderboards
- Multiple verification methods (Strava, AI, Manual)

### 5. Image Verification
- Public storage bucket for eco-proof images
- AI-powered verification system integration
- Secure file upload with authentication

## Functional Requirements

### User Management
- User registration and authentication via Supabase Auth
- Profile management (display name, department)
- Strava account linking
- XP and CO2 savings tracking

### Activity Tracking
- Manual eco-action logging
- Strava activity automatic verification
- Image-based verification for manual actions
- Immutable audit trail in ledger_entries

### Leaderboard System
- Real-time leaderboard by department
- Total XP and CO2 savings display
- Public read access for competitive features

### Strava Integration
- OAuth authorization flow
- Webhook for real-time activity updates
- Automatic cycling activity verification
- CO2 calculation: 120g CO2 saved per km cycled

## Non-Functional Requirements

### Security
- Row Level Security on all tables
- Secure token storage
- Environment variable protection
- Input validation and sanitization

### Performance
- Efficient database queries
- Optimized RLS policies
- Edge function cold start optimization

### Scalability
- Supabase Free Tier limitations consideration
- Efficient webhook processing
- Batch operations where applicable

### Reliability
- Error handling and logging
- Token refresh mechanism
- Webhook retry logic
- Data consistency guarantees