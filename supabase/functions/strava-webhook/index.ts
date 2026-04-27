import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StravaWebhookEvent {
    object_type: 'activity' | 'athlete';
    object_id: number;
    aspect_type: 'create' | 'update' | 'delete';
    owner_id: number;
    subscription_id: number;
    event_time: number;
}

interface StravaActivity {
    id: number;
    name: string;
    type: string;
    distance: number; // in meters
    moving_time: number; // in seconds
    elapsed_time: number;
    total_elevation_gain: number;
    start_date: string;
    athlete: {
        id: number;
    };
}

// CO2 savings calculations (grams per km)
const CO2_SAVINGS_PER_KM = {
    'Ride': 120, // Cycling saves ~120g CO2 per km vs car
    'EBikeRide': 100, // E-bike slightly less savings
    'Walk': 150, // Walking saves more vs car
    'Run': 150, // Running saves more vs car
    'Hike': 150, // Hiking saves more vs car
} as const;

// XP calculations (points per action)
const XP_CALCULATIONS = {
    base: 10, // Base XP for any eco-action
    perKm: 5, // Additional XP per km
    typeMultiplier: {
        'Ride': 1.5,
        'EBikeRide': 1.2,
        'Walk': 1.0,
        'Run': 1.3,
        'Hike': 1.4,
    }
} as const;

async function refreshStravaToken(refreshToken: string): Promise<string | null> {
    const stravaClientId = Deno.env.get('STRAVA_CLIENT_ID')
    const stravaClientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')

    try {
        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: stravaClientId,
                client_secret: stravaClientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        })

        if (response.ok) {
            const data = await response.json()
            return data.access_token
        }
    } catch (error) {
        console.error('Token refresh failed:', error)
    }

    return null
}

async function fetchStravaActivity(
    activityId: number,
    accessToken: string
): Promise<StravaActivity | null> {
    try {
        const response = await fetch(
            `https://www.strava.com/api/v3/activities/${activityId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        )

        if (response.ok) {
            return await response.json()
        } else if (response.status === 401) {
            // Token might be expired
            console.log('Access token expired for activity fetch')
            return null
        }
    } catch (error) {
        console.error('Failed to fetch Strava activity:', error)
    }

    return null
}

function calculateRewards(activity: StravaActivity): { co2Saved: number; xpEarned: number } {
    const distanceKm = activity.distance / 1000 // Convert meters to km
    const activityType = activity.type as keyof typeof CO2_SAVINGS_PER_KM

    // Calculate CO2 savings
    const co2PerKm = CO2_SAVINGS_PER_KM[activityType] || 0
    const co2Saved = (distanceKm * co2PerKm) / 1000 // Convert grams to kg

    // Calculate XP
    const baseXp = XP_CALCULATIONS.base
    const distanceXp = distanceKm * XP_CALCULATIONS.perKm
    const typeMultiplier = XP_CALCULATIONS.typeMultiplier[activityType] || 1.0
    const xpEarned = Math.round((baseXp + distanceXp) * typeMultiplier)

    return { co2Saved, xpEarned }
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Handle webhook verification (GET request from Strava)
    if (req.method === 'GET') {
        const url = new URL(req.url)
        const mode = url.searchParams.get('hub.mode')
        const token = url.searchParams.get('hub.verify_token')
        const challenge = url.searchParams.get('hub.challenge')

        const verifyToken = Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN')

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('Webhook verification successful')
            return new Response(JSON.stringify({ 'hub.challenge': challenge }), {
                headers: { 'Content-Type': 'application/json' }
            })
        } else {
            console.log('Webhook verification failed')
            return new Response('Forbidden', { status: 403 })
        }
    }

    // Handle webhook events (POST request)
    if (req.method === 'POST') {
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            const supabase = createClient(supabaseUrl, supabaseServiceKey)

            const webhookEvent: StravaWebhookEvent = await req.json()

            console.log('Received webhook event:', webhookEvent)

            // Only process activity creation events
            if (
                webhookEvent.object_type !== 'activity' ||
                webhookEvent.aspect_type !== 'create'
            ) {
                return new Response('Event ignored', { status: 200 })
            }

            // Find user by Strava ID
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, strava_access_token, strava_refresh_token')
                .eq('strava_user_id', webhookEvent.owner_id)
                .single()

            if (userError || !userData) {
                console.log(`User not found for Strava ID: ${webhookEvent.owner_id}`)
                return new Response('User not found', { status: 404 })
            }

            // Check if this activity was already processed
            const { data: existingEntry } = await supabase
                .from('ledger_entries')
                .select('id')
                .eq('user_id', userData.id)
                .eq('strava_activity_id', webhookEvent.object_id)
                .single()

            if (existingEntry) {
                console.log(`Activity ${webhookEvent.object_id} already processed`)
                return new Response('Activity already processed', { status: 200 })
            }

            // Fetch activity details from Strava
            let activity = await fetchStravaActivity(
                webhookEvent.object_id,
                userData.strava_access_token
            )

            // If token expired, try to refresh it
            if (!activity && userData.strava_refresh_token) {
                console.log('Attempting to refresh Strava token')
                const newAccessToken = await refreshStravaToken(userData.strava_refresh_token)

                if (newAccessToken) {
                    // Update token in database
                    await supabase
                        .from('users')
                        .update({ strava_access_token: newAccessToken })
                        .eq('id', userData.id)

                    // Retry activity fetch
                    activity = await fetchStravaActivity(webhookEvent.object_id, newAccessToken)
                }
            }

            if (!activity) {
                console.error(`Failed to fetch activity ${webhookEvent.object_id}`)
                return new Response('Failed to fetch activity', { status: 500 })
            }

            // Only process activities that save CO2 (cycling, walking, etc.)
            const activityType = activity.type as keyof typeof CO2_SAVINGS_PER_KM
            if (!CO2_SAVINGS_PER_KM[activityType]) {
                console.log(`Activity type ${activity.type} not eligible for CO2 savings`)
                return new Response('Activity type not eligible', { status: 200 })
            }

            // Calculate rewards
            const { co2Saved, xpEarned } = calculateRewards(activity)

            if (co2Saved <= 0 || xpEarned <= 0) {
                console.log('No rewards calculated for activity')
                return new Response('No rewards calculated', { status: 200 })
            }

            // Insert ledger entry
            const { error: insertError } = await supabase
                .from('ledger_entries')
                .insert({
                    user_id: userData.id,
                    action_type: `${activity.type} - ${activity.name}`,
                    co2_saved: co2Saved,
                    xp_earned: xpEarned,
                    verification_method: 'Strava',
                    strava_activity_id: activity.id,
                    metadata: {
                        distance_km: activity.distance / 1000,
                        moving_time_minutes: activity.moving_time / 60,
                        activity_type: activity.type,
                        start_date: activity.start_date,
                    }
                })

            if (insertError) {
                console.error('Failed to insert ledger entry:', insertError)
                return new Response('Database error', { status: 500 })
            }

            console.log(
                `Successfully processed activity ${activity.id} for user ${userData.id}: ` +
                `${co2Saved.toFixed(3)}kg CO2 saved, ${xpEarned} XP earned`
            )

            return new Response(
                JSON.stringify({
                    success: true,
                    co2_saved: co2Saved,
                    xp_earned: xpEarned
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )

        } catch (error) {
            console.error('Webhook processing error:', error)
            return new Response('Internal server error', { status: 500 })
        }
    }

    return new Response('Method not allowed', { status: 405 })
})

/* To deploy this function:
1. Deploy: supabase functions deploy strava-webhook

Environment variables needed:
- STRAVA_CLIENT_ID
- STRAVA_CLIENT_SECRET  
- STRAVA_WEBHOOK_VERIFY_TOKEN (set this to a random string)
- SUPABASE_URL (automatically provided)
- SUPABASE_SERVICE_ROLE_KEY (automatically provided)

Strava Webhook Setup:
1. Go to https://www.strava.com/settings/api
2. Create a webhook subscription with:
   - Callback URL: https://YOUR_PROJECT.supabase.co/functions/v1/strava-webhook
   - Verify Token: Same as STRAVA_WEBHOOK_VERIFY_TOKEN
   - Events: activity
*/