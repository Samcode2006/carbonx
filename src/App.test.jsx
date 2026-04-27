// Simple test component to verify React is working
import React from 'react';

export default function AppTest() {
    return (
        <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
            <h1>React is Working! ✅</h1>
            <p>If you see this, React is rendering correctly.</p>
            <div style={{ marginTop: 20, padding: 10, background: '#f0f0f0', borderRadius: 5 }}>
                <strong>Environment Variables:</strong>
                <ul>
                    <li>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
                    <li>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
                </ul>
            </div>
        </div>
    );
}