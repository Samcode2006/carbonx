import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { seedDemoData } from '../utils/seedDemo';
import { useAuth } from '../contexts/AuthContext';
import { Database, Users, Zap, CheckCircle, AlertCircle } from 'lucide-react';

export default function Seed() {
  const [status, setStatus] = useState(null); // null | 'loading' | 'done' | 'error'
  const [result, setResult] = useState(null);
  const { currentUser } = useAuth();

  async function handleSeed() {
    setStatus('loading');
    const res = await seedDemoData();
    setResult(res);
    setStatus(res.success ? 'done' : 'error');
  }

  return (
    <div style={{ background: '#F5F5F0', minHeight: 'calc(100vh - 64px)', padding: '60px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Database size={28} />
            <h1 className="nb-heading">Demo Data Seeder</h1>
          </div>
          <p className="nb-subheading" style={{ marginBottom: 32 }}>
            Preloads 10 demo users and 12 actions into Firestore for the leaderboard and demo mode.
          </p>

          <div className="nb-card" style={{ padding: 28, marginBottom: 24 }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>What will be seeded:</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: <Users size={16} />, text: '10 demo users (Level 1–3, various departments)' },
                { icon: <Zap size={16} />, text: '12 eco-actions (cycling, bus, recycling)' },
                { icon: <Database size={16} />, text: 'Actions spread across the past week for chart data' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F5F5F0', border: '2px solid #000', borderRadius: 8, fontWeight: 600 }}>
                  {item.icon} {item.text}
                </div>
              ))}
            </div>
          </div>

          {status === null && (
            <motion.button
              className="nb-btn nb-btn-green"
              style={{ width: '100%', padding: '16px', fontSize: 16 }}
              onClick={handleSeed}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Database size={18} /> Seed Demo Data
            </motion.button>
          )}

          {status === 'loading' && (
            <div className="nb-card" style={{ padding: 28, textAlign: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: 36, display: 'inline-block', marginBottom: 12 }}>⚙️</motion.div>
              <div style={{ fontWeight: 800 }}>Seeding Firestore...</div>
              <div style={{ color: '#666', fontSize: 13, marginTop: 6 }}>Writing users and actions...</div>
            </div>
          )}

          {status === 'done' && result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="nb-card-green" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <CheckCircle size={28} />
                <div style={{ fontWeight: 900, fontSize: 20 }}>Seeding Complete!</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 700 }}>✅ {result.users} users written to Firestore</div>
                <div style={{ fontWeight: 700 }}>✅ {result.actions} actions created</div>
                {result.skipped > 0 && <div style={{ fontWeight: 600, opacity: 0.7 }}>⏭️ {result.skipped} actions skipped (already exist)</div>}
              </div>
              <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, opacity: 0.7 }}>
                Head to the Leaderboard to see the demo data live!
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="nb-card-pink" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <AlertCircle size={24} />
                <div style={{ fontWeight: 900, fontSize: 18 }}>Seeding Failed</div>
              </div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{result?.error}</div>
              <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
                Make sure Firestore is enabled in your Firebase Console.
              </div>
              <button className="nb-btn nb-btn-black" style={{ marginTop: 16 }} onClick={() => setStatus(null)}>
                Try Again
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
