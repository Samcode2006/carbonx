import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, name) {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
        }
      }
    });

    if (authError) throw authError;

    // The database trigger will automatically create the user profile
    // So we just need to wait a moment and then fetch it
    if (authData.user) {
      // Wait a bit for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch the created user data
      await refreshUserData(authData.user.id);
    }

    return authData;
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUserData(null);
  }

  async function refreshUserData(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        // If the users table doesn't exist, set loading to false anyway
        setLoading(false);
        return;
      }

      if (data) {
        // Transform Supabase data to match expected format
        const transformedData = {
          id: data.id,
          name: data.display_name,
          email: currentUser?.email,
          xp: data.total_xp || 0,
          co2Saved: data.total_co2_saved || 0,
          level: Math.floor((data.total_xp || 0) / 100) + 1, // Calculate level from XP
          department: data.department || 'General',
          createdAt: data.created_at,
          stravaConnected: !!(data.strava_access_token && data.strava_user_id),
        };
        setUserData(transformedData);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setLoading(false);
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        refreshUserData(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setCurrentUser(session?.user ?? null);
        if (session?.user) {
          await refreshUserData(session.user.id);
        } else {
          setUserData(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    currentUser,
    userData,
    signup,
    login,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F5F0'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>CarbonX</div>
            <div style={{ color: '#666', fontSize: 14 }}>Loading...</div>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}
