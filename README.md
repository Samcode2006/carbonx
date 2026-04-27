# CarbonX - Campus Carbon Intelligence

A gamified carbon footprint reduction platform for campus communities. Track eco-friendly actions, earn XP, compete on leaderboards, and redeem rewards!

![CarbonX](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/React-19.2.4-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

## 🌍 Features

- **📸 Upload Eco-Actions** - Submit proof of cycling, public transport, recycling
- **🤖 AI Verification** - Gemini-powered verification system
- **🌱 Carbon Calculator** - Precise CO₂ savings tracking (120g/km cycling, 80g/km bus)
- **🏆 XP & Levels** - Gamified progression system (1 XP = 1g CO₂ saved)
- **📊 Live Leaderboard** - Real-time rankings by department
- **🎁 Rewards Store** - Redeem XP for campus perks
- **🚴 Strava Integration** - Automatic activity tracking

## 🚀 Tech Stack

- **Frontend**: React + Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Styling**: Custom CSS with Neobrutalism design
- **Animations**: Framer Motion
- **Charts**: Recharts
- **External APIs**: Strava API, Gemini AI

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Strava API credentials (optional)
- Gemini API key (optional)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/carbonx.git
cd carbonx
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI Configuration (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key

# Strava Configuration (Optional)
VITE_STRAVA_CLIENT_ID=your_strava_client_id
VITE_STRAVA_CLIENT_SECRET=your_strava_client_secret
```

### 4. Set up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the `supabase-setup.sql` script
4. Run the `fix-signup-trigger.sql` script

### 5. Deploy Edge Functions (Optional - for Strava)

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy exchange-strava-token
supabase functions deploy strava-webhook
```

### 6. Start development server

```bash
npm run dev
```

Visit `http://localhost:5173`

## 🔐 Authentication

- Only **@vvce.ac.in** email addresses are allowed to sign up
- Email confirmation is disabled for easier testing
- Supabase Auth handles all authentication

## 📊 Database Schema

### Users Table
- `id` - UUID (links to auth.users)
- `display_name` - User's full name
- `department` - Department for leaderboard
- `total_xp` - Total experience points
- `total_co2_saved` - Total CO₂ saved (kg)
- `strava_access_token` - Strava OAuth token
- `strava_refresh_token` - Strava refresh token
- `strava_user_id` - Strava user ID

### Ledger Entries Table
- `id` - UUID
- `user_id` - Foreign key to users
- `action_type` - Type of eco-action
- `co2_saved` - CO₂ saved (kg)
- `xp_earned` - XP earned
- `verification_method` - Strava/AI/Manual
- `image_url` - Proof image URL
- `metadata` - Additional data (JSONB)

## 🎮 How It Works

1. **Sign Up** - Create account with @vvce.ac.in email
2. **Upload Action** - Submit proof of eco-friendly action
3. **AI Verification** - System verifies and calculates CO₂ savings
4. **Earn XP** - Get XP based on CO₂ saved (1:1 ratio)
5. **Level Up** - Progress through levels (100 XP per level)
6. **Compete** - View your rank on the leaderboard
7. **Redeem** - Spend XP on campus rewards

## 🚴 Strava Integration

### Setup
1. Create Strava app at https://www.strava.com/settings/api
2. Set Authorization Callback Domain to your domain
3. Add credentials to environment variables
4. Deploy Edge Functions to Supabase

### Features
- Automatic activity tracking
- Real-time webhook notifications
- CO₂ calculation for cycling activities
- Automatic XP rewards

## 🎨 Design System

CarbonX uses a **Neobrutalism** design style:
- Bold borders (2-3px solid black)
- Vibrant colors (#A3E635, #60A5FA, #FDE047, #FB7185)
- Hard shadows (3-4px offset)
- High contrast
- Playful, energetic feel

## 📱 Pages

- **Home** - Hero section with features and CTA
- **Dashboard** - User stats, weekly chart, recent actions
- **Upload** - Submit eco-actions with proof
- **Leaderboard** - Real-time rankings by department
- **Ledger** - Blockchain-style immutable action log
- **Rewards** - Redeem XP for campus perks
- **Login/Signup** - Authentication pages

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables
5. Deploy!

### Environment Variables on Vercel

Add these in Vercel dashboard → Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_STRAVA_CLIENT_ID`
- `VITE_STRAVA_CLIENT_SECRET`

## 📄 License

MIT License - feel free to use this project for your campus!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

Built with 💚 for a greener campus