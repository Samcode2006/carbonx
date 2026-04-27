import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function DebugSupabase() {
    const [status, setStatus] = useState('Testing connection...');
    const [details, setDetails] = useState({});

    useEffect(() => {
        async function testConnection() {
            try {
                // Test 1: Check if supabase client is created
                if (!supabase) {
                    setStatus('❌ Supabase client not created');
                    return;
                }

                // Test 2: Check environment variables
                const url = import.meta.env.VITE_SUPABASE_URL;
                const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

                setDetails({
                    url: url ? '✅ URL configured' : '❌ URL missing',
                    key: key ? '✅ Key configured' : '❌ Key missing',
                });

                if (!url || !key) {
                    setStatus('❌ Environment variables missing');
                    return;
                }

                // Test 3: Try to get session
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    setStatus(`❌ Session error: ${sessionError.message}`);
                    return;
                }

                // Test 4: Try a simple query (this might fail if tables don't exist)
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('count')
                        .limit(1);

                    if (error) {
                        setStatus(`⚠️ Database connection OK, but tables not set up: ${error.message}`);
                        setDetails(prev => ({ ...prev, database: '⚠️ Tables need setup' }));
                    } else {
                        setStatus('✅ Full connection successful');
                        setDetails(prev => ({ ...prev, database: '✅ Database OK' }));
                    }
                } catch (dbError) {
                    setStatus('✅ Auth OK, database needs setup');
                    setDetails(prev => ({ ...prev, database: '⚠️ Database needs setup' }));
                }

            } catch (error) {
                setStatus(`❌ Connection failed: ${error.message}`);
            }
        }

        testConnection();
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: 'white',
            border: '2px solid #000',
            borderRadius: 8,
            padding: 16,
            maxWidth: 300,
            zIndex: 1000,
            fontFamily: 'monospace',
            fontSize: 12
        }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Supabase Debug</div>
            <div style={{ marginBottom: 8 }}>{status}</div>
            {Object.entries(details).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 4 }}>
                    <strong>{key}:</strong> {value}
                </div>
            ))}
        </div>
    );
}