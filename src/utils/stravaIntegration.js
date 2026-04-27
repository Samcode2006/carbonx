import { supabase } from '../supabaseClient.js';

/**
 * Strava Integration Utilities for CarbonX
 */

// Strava OAuth configuration
const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const STRAVA_AUTHORIZE_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_SCOPE = 'read,activity:read';

/**
 * Generate Strava OAuth authorization URL
 * @param {string} redirectUri - The redirect URI after authorization
 * @returns {string} Authorization URL
 */
export function getStravaAuthUrl(redirectUri = window.location.origin) {
    const params = new URLSearchParams({
        client_id: STRAVA_CLIENT_ID,
        response_type: 'code',
        redirect_uri: redirectUri,
        approval_prompt: 'force',
        scope: STRAVA_SCOPE,
    });

    return `${STRAVA_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Extract authorization code from URL parameters
 * @returns {string|null} Authorization code or null if not found
 */
export function getAuthCodeFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code');
}

/**
 * Exchange Strava authorization code for access tokens
 * @param {string} authCode - Authorization code from Strava
 * @param {string} userId - Current user's ID
 * @returns {Promise<{success: boolean, message: string, athlete?: object}>}
 */
export async function exchangeStravaToken(authCode, userId) {
    try {
        const { data, error } = await supabase.functions.invoke('exchange-strava-token', {
            body: {
                authCode,
                userId,
            },
        });

        if (error) {
            console.error('Supabase function error:', error);
            return {
                success: false,
                message: 'Failed to connect to Strava service',
            };
        }

        return data;
    } catch (error) {
        console.error('Token exchange error:', error);
        return {
            success: false,
            message: 'Network error occurred',
        };
    }
}

/**
 * Check if user has connected Strava account
 * @param {string} userId - User's ID
 * @returns {Promise<{connected: boolean, stravaUserId?: number}>}
 */
export async function checkStravaConnection(userId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('strava_user_id, strava_access_token')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error checking Strava connection:', error);
            return { connected: false };
        }

        const connected = !!(data?.strava_access_token && data?.strava_user_id);

        return {
            connected,
            stravaUserId: data?.strava_user_id,
        };
    } catch (error) {
        console.error('Error checking Strava connection:', error);
        return { connected: false };
    }
}

/**
 * Disconnect Strava account
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function disconnectStrava(userId) {
    try {
        const { error } = await supabase
            .from('users')
            .update({
                strava_access_token: null,
                strava_refresh_token: null,
                strava_user_id: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (error) {
            console.error('Error disconnecting Strava:', error);
            return {
                success: false,
                message: 'Failed to disconnect Strava account',
            };
        }

        return {
            success: true,
            message: 'Strava account disconnected successfully',
        };
    } catch (error) {
        console.error('Error disconnecting Strava:', error);
        return {
            success: false,
            message: 'Network error occurred',
        };
    }
}

/**
 * Get user's Strava activities from ledger
 * @param {string} userId - User's ID
 * @param {number} limit - Number of activities to fetch
 * @returns {Promise<Array>} Array of Strava activities
 */
export async function getStravaActivities(userId, limit = 10) {
    try {
        const { data, error } = await supabase
            .from('ledger_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('verification_method', 'Strava')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching Strava activities:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching Strava activities:', error);
        return [];
    }
}

/**
 * Handle Strava OAuth callback
 * This should be called on the page that Strava redirects to after authorization
 * @param {string} userId - Current user's ID
 * @returns {Promise<{success: boolean, message: string, athlete?: object}>}
 */
export async function handleStravaCallback(userId) {
    const authCode = getAuthCodeFromUrl();

    if (!authCode) {
        return {
            success: false,
            message: 'No authorization code found in URL',
        };
    }

    // Clear the code from URL
    const url = new URL(window.location);
    url.searchParams.delete('code');
    url.searchParams.delete('scope');
    window.history.replaceState({}, document.title, url.toString());

    // Exchange the code for tokens
    return await exchangeStravaToken(authCode, userId);
}

/**
 * Initiate Strava connection flow
 * @param {string} redirectUri - Optional redirect URI
 */
export function connectStrava(redirectUri) {
    const authUrl = getStravaAuthUrl(redirectUri);
    window.location.href = authUrl;
}

/**
 * Calculate CO2 savings and XP for manual activity entry
 * This mirrors the calculation logic in the webhook function
 * @param {string} activityType - Type of activity (Ride, Walk, Run, etc.)
 * @param {number} distanceKm - Distance in kilometers
 * @returns {object} CO2 saved (kg) and XP earned
 */
export function calculateActivityRewards(activityType, distanceKm) {
    // CO2 savings per km (grams)
    const CO2_SAVINGS_PER_KM = {
        'Ride': 120,
        'EBikeRide': 100,
        'Walk': 150,
        'Run': 150,
        'Hike': 150,
    };

    // XP calculations
    const XP_CALCULATIONS = {
        base: 10,
        perKm: 5,
        typeMultiplier: {
            'Ride': 1.5,
            'EBikeRide': 1.2,
            'Walk': 1.0,
            'Run': 1.3,
            'Hike': 1.4,
        }
    };

    const co2PerKm = CO2_SAVINGS_PER_KM[activityType] || 0;
    const co2Saved = (distanceKm * co2PerKm) / 1000; // Convert grams to kg

    const baseXp = XP_CALCULATIONS.base;
    const distanceXp = distanceKm * XP_CALCULATIONS.perKm;
    const typeMultiplier = XP_CALCULATIONS.typeMultiplier[activityType] || 1.0;
    const xpEarned = Math.round((baseXp + distanceXp) * typeMultiplier);

    return {
        co2Saved: Math.round(co2Saved * 1000) / 1000, // Round to 3 decimal places
        xpEarned,
    };
}

export default {
    getStravaAuthUrl,
    getAuthCodeFromUrl,
    exchangeStravaToken,
    checkStravaConnection,
    disconnectStrava,
    getStravaActivities,
    handleStravaCallback,
    connectStrava,
    calculateActivityRewards,
};