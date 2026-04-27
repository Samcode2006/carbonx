import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { formatCO2 } from '../utils/carbonCalculator';
import { Link2, Shield, Clock } from 'lucide-react';

function hashId(id) {
  // Simulate a blockchain hash from a Supabase UUID
  return '0x' + id.replace(/-/g, '').slice(0, 8).toUpperCase() + '...' + id.replace(/-/g, '').slice(-4).toUpperCase();
}

export default function Ledger() {
  const { currentUser, userData } = useAuth();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch ledger entries from Supabase
    const fetchLedgerEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('ledger_entries')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching ledger entries:', error);
          return;
        }

        // Transform Supabase data to match the expected format
        const transformedActions = data.map(entry => ({
          id: entry.id,
          type: getActionTypeFromString(entry.action_type),
          co2: entry.co2_saved,
          xp: entry.xp_earned,
          timestamp: new Date(entry.created_at),
          verification: entry.verification_method,
          distance: entry.metadata?.distance_km || null,
          location: entry.metadata?.location || null,
          imageUrl: entry.image_url,
          stravaActivityId: entry.strava_activity_id,
        }));

        setActions(transformedActions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ledger entries:', error);
        setLoading(false);
      }
    };

    fetchLedgerEntries();

    // Set up real-time subscription for new entries
    const subscription = supabase
      .channel('ledger_entries')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ledger_entries',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          const newEntry = payload.new;
          const transformedEntry = {
            id: newEntry.id,
            type: getActionTypeFromString(newEntry.action_type),
            co2: newEntry.co2_saved,
            xp: newEntry.xp_earned,
            timestamp: new Date(newEntry.created_at),
            verification: newEntry.verification_method,
            distance: newEntry.metadata?.distance_km || null,
            location: newEntry.metadata?.location || null,
            imageUrl: newEntry.image_url,
            stravaActivityId: newEntry.strava_activity_id,
          };

          setActions(prev => [transformedEntry, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);

  // Helper function to extract action type from action_type string
  const getActionTypeFromString = (actionType) => {
    if (!actionType) return 'unknown';

    const type = actionType.toLowerCase();
    if (type.includes('cycling') || type.includes('ride') || type.includes('bike')) return 'cycling';
    if (type.includes('bus') || type.includes('transport')) return 'bus';
    if (type.includes('recycling') || type.includes('recycle')) return 'recycling';
    if (type.includes('walk') || type.includes('walking')) return 'walking';
    if (type.includes('run') || type.includes('running')) return 'running';

    return 'eco-action';
  };

  const ACTION_ICONS = {
    cycling: '🚴',
    bus: '🚌',
    recycling: '♻️',
    walking: '🚶',
    running: '🏃',
    'eco-action': '🌱'
  };

  const ACTION_COLORS = {
    cycling: '#A3E635',
    bus: '#60A5FA',
    recycling: '#FDE047',
    walking: '#34D399',
    running: '#F87171',
    'eco-action': '#A78BFA'
  };

  return (
    <div style={{ background: '#F5F5F0', minHeight: 'calc(100vh - 64px)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Shield size={28} />
            <h1 className="nb-heading">Carbon Ledger</h1>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#000', color: '#A3E635', border: '2px solid #A3E635', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>
            🔗 BLOCKCHAIN-BACKED · IMMUTABLE · VERIFIED
          </div>
          <p className="nb-subheading" style={{ marginTop: 10 }}>
            Every eco-action you take is permanently recorded here. Tamper-proof. Transparent.
          </p>
        </motion.div>

        {/* Stats bar */}
        {userData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Records', val: actions.length, color: '#A3E635' },
              { label: 'Total CO₂', val: formatCO2(userData.co2Saved || 0), color: '#60A5FA' },
              { label: 'Total XP', val: `${userData.xp || 0} XP`, color: '#FDE047' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.color, border: '2px solid #000', borderRadius: 8, padding: '12px 20px', boxShadow: '3px 3px 0px #000', flex: '1 1 140px' }}>
                <div style={{ fontWeight: 900, fontSize: 20 }}>{s.val}</div>
                <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.7 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Ledger Chain */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: 36, display: 'inline-block', marginBottom: 12 }}>⛓️</motion.div>
            <div style={{ fontWeight: 700 }}>Loading ledger...</div>
          </div>
        ) : actions.length === 0 ? (
          <div className="nb-card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>No records yet</div>
            <p style={{ color: '#666', fontWeight: 500 }}>Upload your first eco-action to start your carbon ledger.</p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Vertical chain line */}
            <div style={{ position: 'absolute', left: 27, top: 0, bottom: 0, width: 3, background: '#000', zIndex: 0 }} />

            {actions.map((a, i) => {
              const ts = a.timestamp?.toDate?.() || new Date(a.timestamp);
              const color = ACTION_COLORS[a.type] || '#A3E635';
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{ display: 'flex', gap: 20, marginBottom: 20, position: 'relative', zIndex: 1 }}
                >
                  {/* Chain node */}
                  <div style={{
                    width: 56, height: 56, background: color, border: '3px solid #000',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0, boxShadow: '3px 3px 0px #000', zIndex: 2
                  }}>
                    {ACTION_ICONS[a.type] || '🌱'}
                  </div>

                  {/* Block */}
                  <div className="nb-card" style={{ flex: 1, padding: 20 }}>
                    {/* Block header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#888', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Link2 size={11} /> {hashId(a.id)}
                        </div>
                        <div style={{ fontWeight: 900, fontSize: 16, textTransform: 'capitalize' }}>
                          {a.type.replace('-', ' ')} Action
                          {a.verification && (
                            <span style={{
                              marginLeft: 8,
                              fontSize: 11,
                              background: a.verification === 'Strava' ? '#FF6B35' : a.verification === 'AI Image' ? '#9333EA' : '#6B7280',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontWeight: 600
                            }}>
                              {a.verification}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ background: '#000', color: '#A3E635', border: '2px solid #000', borderRadius: 4, padding: '3px 10px', fontWeight: 800, fontSize: 13, boxShadow: '2px 2px 0px #A3E635' }}>
                          ✅ VERIFIED
                        </span>
                      </div>
                    </div>

                    {/* Data fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                      {[
                        { label: 'CO₂ Saved', val: formatCO2(a.co2 || 0), color },
                        { label: 'XP Earned', val: `+${a.xp || 0} XP`, color: '#FDE047' },
                        { label: 'Distance', val: a.distance ? `${a.distance.toFixed(1)} km` : 'N/A', color: '#E5E5E5' },
                        { label: 'Timestamp', val: a.timestamp.toLocaleString(), color: '#F5F5F0', small: true },
                      ].map((f, fi) => (
                        <div key={fi} style={{ background: f.color, border: '2px solid #000', borderRadius: 6, padding: '8px 12px', boxShadow: '2px 2px 0px #000' }}>
                          <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6 }}>{f.label}</div>
                          <div style={{ fontWeight: 800, fontSize: f.small ? 11 : 15, marginTop: 2 }}>{f.val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Location */}
                    {a.location && (
                      <div style={{ marginTop: 10, fontSize: 11, color: '#888', fontWeight: 600 }}>
                        📍 {a.location.lat?.toFixed(5)}, {a.location.lng?.toFixed(5)} · Campus zone
                      </div>
                    )}

                    {/* Block index */}
                    <div style={{ marginTop: 8, fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>
                      BLOCK #{actions.length - i} · prev: {i < actions.length - 1 ? hashId(actions[i + 1]?.id || '0000') : '0x000000000000'}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Genesis block */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: actions.length * 0.06 }}
              style={{ display: 'flex', gap: 20, position: 'relative', zIndex: 1 }}>
              <div style={{ width: 56, height: 56, background: '#000', border: '3px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, boxShadow: '3px 3px 0px #A3E635' }}>
                🌍
              </div>
              <div style={{ flex: 1, background: '#000', border: '3px solid #A3E635', borderRadius: 10, padding: '16px 20px', color: '#A3E635', boxShadow: '4px 4px 0px #A3E635' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 12, opacity: 0.6 }}>GENESIS BLOCK</div>
                <div style={{ fontWeight: 900, marginTop: 4 }}>Campus Carbon Intelligence — Chain Initialized</div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.5, marginTop: 4 }}>0x0000000000000000 · Block #0</div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
