import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StravaTokenResponse {
    access_token: string;
    refresh_token: string;
    athlete: {
        id: number;
        firstname: string;
        lastname: string;
    };
}

interface RequestBody {
    authCode: string;
    userId: string;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase client with service role key
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get request body
        const { authCode, userId }: RequestBody = await req.json()

        // Validate input
        if (!authCode || !userId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Missing authCode or userId'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Get Strava credentials from environment
        const stravaClientId = Deno.env.get('STRAVA_CLIENT_ID')
        const stravaClientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')

        if (!stravaClientId || !stravaClientSecret) {
            console.error('Missing Strava credentials in environment variables')
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Server configuration error'
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: stravaClientId,
                client_secret: stravaClientSecret,
                code: authCode,
                grant_type: 'authorization_code',
            }),
        })

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text()
            console.error('Strava token exchange failed:', errorText)
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Failed to exchange authorization code'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        const tokenData: StravaTokenResponse = await tokenResponse.json()

        // Update user record with Strava tokens
        const { error: updateError } = await supabase
            .from('users')
            .update({
                strava_access_token: tokenData.access_token,
                strava_refresh_token: tokenData.refresh_token,
                strava_user_id: tokenData.athlete.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

        if (updateError) {
            console.error('Database update error:', updateError)
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Failed to save Strava credentials'
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        console.log(`Successfully linked Strava account for user ${userId}`)

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Strava account linked successfully',
                athlete: {
                    id: tokenData.athlete.id,
                    name: `${tokenData.athlete.firstname} ${tokenData.athlete.lastname}`
                }
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Unexpected error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                message: 'Internal server error'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})

/* To deploy this function:
1. Install Supabase CLI: npm install -g supabase
2. Login: supabase login
3. Link project: supabase link --project-ref YOUR_PROJECT_REF
4. Deploy: supabase functions deploy exchange-strava-token

Environment variables needed in Supabase:
- STRAVA_CLIENT_ID
- STRAVA_CLIENT_SECRET
- SUPABASE_URL (automatically provided)
- SUPABASE_SERVICE_ROLE_KEY (automatically provided)
*/