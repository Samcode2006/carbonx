import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, ShoppingBag, AlertCircle } from 'lucide-react';

const REWARDS = [
  {
    id: 'coffee', icon: '☕', name: 'Free Coffee',
    desc: 'One free coffee at the campus café. Show your redemption code at the counter.',
    xpCost: 100, color: '#FDE047', stock: 50,
  },
  {
    id: 'meal', icon: '🍱', name: 'Free Meal',
    desc: 'One free meal at the campus canteen. Valid for lunch or dinner.',
    xpCost: 300, color: '#60A5FA', stock: 20,
  },
  {
    id: 'hoodie', icon: '👕', name: 'Campus Hoodie',
    desc: 'Exclusive Campus Carbon Intelligence hoodie. Limited edition!',
    xpCost: 1000, color: '#FB7185', stock: 10,
  },
  {
    id: 'notebook', icon: '📓', name: 'Eco Notebook',
    desc: 'Recycled paper notebook with the CCI logo. Go paperless where you can!',
    xpCost: 150, color: '#A3E635', stock: 30,
  },
  {
    id: 'bottle', icon: '💧', name: 'Water Bottle',
    desc: 'Stainless steel eco water bottle. Replace 500 plastic bottles a year!',
    xpCost: 500, color: '#A3E635', stock: 15,
  },
  {
    id: 'tote', icon: '👜', name: 'Eco Tote Bag',
    desc: 'Stylish canvas tote bag made from organic materials.',
    xpCost: 80, color: '#FDE047', stock: 40,
  },
];

export default function Rewards() {
  const { currentUser, userData, refreshUserData } = useAuth();
  const [redeeming, setRedeeming] = useState(null);
  const [redeemed, setRedeemed] = useState(null);
  const [error, setError] = useState('');

  const xp = userData?.xp || 0;

  async function handleRedeem(reward) {
    if (xp < reward.xpCost) return;
    setRedeeming(reward.id);
    setError('');

    try {
      // Create a redemption record in the ledger
      const { error: ledgerError } = await supabase
        .from('ledger_entries')
        .insert([{
          user_id: currentUser.id,
          action_type: `Reward Redemption: ${reward.name}`,
          co2_saved: 0, // No CO2 impact for redemptions
          xp_earned: -reward.xpCost, // Negative XP for spending
          verification_method: 'System',
          metadata: {
            reward_id: reward.id,
            reward_name: reward.name,
            redemption_code: Math.random().toString(36).substring(2, 10).toUpperCase()
          }
        }]);

      if (ledgerError) {
        throw new Error(ledgerError.message);
      }

      // Refresh user data to get updated totals
      await refreshUserData(currentUser.id);
      setRedeemed(reward);

    } catch (err) {
      console.error('Redemption error:', err);
      setError('Redemption failed: ' + err.message);
    } finally {
      setRedeeming(null);
    }
  }

  return (
    <div style={{ background: '#F5F5F0', minHeight: 'calc(100vh - 64px)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 12 }}>
          <h1 className="nb-heading">🎁 Rewards Store</h1>
          <p className="nb-subheading" style={{ marginTop: 8 }}>Redeem your hard-earned XP for real campus perks</p>
        </motion.div>

        {/* XP Balance */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="nb-card-green"
          style={{ padding: '16px 24px', marginBottom: 36, display: 'flex', alignItems: 'center', gap: 16, maxWidth: 400 }}
        >
          <span style={{ fontSize: 32 }}>⚡</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: 28 }}>{xp.toLocaleString()} XP</div>
            <div style={{ fontWeight: 700, fontSize: 13, opacity: 0.7 }}>Available to spend</div>
          </div>
        </motion.div>

        {error && (
          <div style={{ background: '#FB7185', border: '2px solid #000', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 8, fontWeight: 600 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Rewards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {REWARDS.map((r, i) => {
            const canAfford = xp >= r.xpCost;
            const isRedeeming = redeeming === r.id;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="nb-card"
                style={{ padding: 24, opacity: canAfford ? 1 : 0.75, display: 'flex', flexDirection: 'column' }}
              >
                {/* Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    fontSize: 40, background: r.color, border: '2px solid #000',
                    borderRadius: 10, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '3px 3px 0px #000'
                  }}>{r.icon}</div>
                  <span style={{ background: canAfford ? '#A3E635' : '#E5E5E5', border: '2px solid #000', borderRadius: 6, padding: '4px 12px', fontWeight: 800, fontSize: 14, boxShadow: '2px 2px 0px #000' }}>
                    ⚡ {r.xpCost} XP
                  </span>
                </div>

                <h3 style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>{r.name}</h3>
                <p style={{ color: '#666', fontSize: 13, lineHeight: 1.5, fontWeight: 500, flex: 1, marginBottom: 16 }}>{r.desc}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>📦 {r.stock} in stock</span>
                  {!canAfford && (
                    <span style={{ fontSize: 12, color: '#999', fontWeight: 600 }}>
                      Need {r.xpCost - xp} more XP
                    </span>
                  )}
                </div>

                <motion.button
                  className={`nb-btn ${canAfford ? 'nb-btn-black' : 'nb-btn-white'}`}
                  style={{ width: '100%', padding: '12px', fontSize: 14, cursor: canAfford ? 'pointer' : 'not-allowed' }}
                  onClick={() => canAfford && handleRedeem(r)}
                  disabled={!canAfford || !!redeeming}
                  whileHover={canAfford ? { scale: 1.02 } : {}}
                  whileTap={canAfford ? { scale: 0.97 } : {}}
                >
                  {isRedeeming ? '⏳ Redeeming...' : canAfford ? '🎁 Redeem Now' : '🔒 Not enough XP'}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {redeemed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: '#00000080', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
            onClick={() => setRedeemed(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="nb-card-green"
              style={{ padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontSize: 56, marginBottom: 16 }}>{redeemed.icon}</div>
              <CheckCircle size={32} style={{ margin: '0 auto 12px' }} />
              <h2 style={{ fontWeight: 900, fontSize: 24, marginBottom: 8 }}>Redeemed!</h2>
              <p style={{ fontWeight: 600, marginBottom: 4 }}><strong>{redeemed.name}</strong></p>
              <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>Show this screen at the campus store to claim your reward.</p>
              <div style={{ background: '#000', color: '#A3E635', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', letterSpacing: 2, fontWeight: 800, fontSize: 18, marginBottom: 20 }}>
                CODE: {Math.random().toString(36).substring(2, 10).toUpperCase()}
              </div>
              <button className="nb-btn nb-btn-black" style={{ width: '100%' }} onClick={() => setRedeemed(null)}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
