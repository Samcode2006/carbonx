import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { getLevel, getLevelProgress, getXPToNextLevel, getLevelBadge } from '../utils/xpSystem';
import { formatCO2 } from '../utils/carbonCalculator';
import { generateSuggestions } from '../utils/suggestions';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Leaf, Zap, Trophy, Target, TrendingUp, Lightbulb } from 'lucide-react';

const COLORS = ['#A3E635', '#60A5FA', '#FDE047', '#FB7185', '#A3E635', '#60A5FA', '#FDE047'];

function StatCard({ icon, label, value, sub, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="nb-card"
      style={{ padding: 24, borderTop: `4px solid ${color}` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontWeight: 600 }}>{sub}</div>}
        </div>
        <div style={{ background: color, border: '2px solid #000', borderRadius: 8, padding: 10, boxShadow: '2px 2px 0px #000' }}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { currentUser, userData } = useAuth();
  const [actions, setActions] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [rank, setRank] = useState('—');
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 second timeout

    // Fetch recent actions from Supabase
    const fetchActions = async () => {
      try {
        const { data, error } = await supabase
          .from('ledger_entries')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching actions:', error);
          setActions([]);
          setLoading(false);
          clearTimeout(timeout);
          return;
        }

        // Transform Supabase data to match expected format
        const transformedActions = (data || []).map(entry => ({
          id: entry.id,
          type: getActionTypeFromString(entry.action_type),
          co2: entry.co2_saved * 1000, // Convert kg to grams for display
          xp: entry.xp_earned,
          timestamp: new Date(entry.created_at),
          verification: entry.verification_method,
          distance: entry.metadata?.distance_km || null,
          location: entry.metadata?.location || null,
        }));

        setActions(transformedActions);
        buildWeeklyData(transformedActions);
        if (userData) setSuggestions(generateSuggestions(userData, transformedActions));
        setLoading(false);
        clearTimeout(timeout);
      } catch (error) {
        console.error('Error fetching actions:', error);
        setActions([]);
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    fetchActions();

    // Set up real-time subscription for new entries
    const subscription = supabase
      .channel('dashboard_ledger_entries')
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
            co2: newEntry.co2_saved * 1000, // Convert kg to grams
            xp: newEntry.xp_earned,
            timestamp: new Date(newEntry.created_at),
            verification: newEntry.verification_method,
            distance: newEntry.metadata?.distance_km || null,
            location: newEntry.metadata?.location || null,
          };

          setActions(prev => [transformedEntry, ...prev.slice(0, 19)]); // Keep only 20 most recent
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser, userData]);

  // Helper function to extract action type from action_type string
  const getActionTypeFromString = (actionType) => {
    if (!actionType) return 'eco-action';

    const type = actionType.toLowerCase();
    if (type.includes('cycling') || type.includes('ride') || type.includes('bike')) return 'cycling';
    if (type.includes('bus') || type.includes('transport')) return 'bus';
    if (type.includes('recycling') || type.includes('recycle')) return 'recycling';
    if (type.includes('walk') || type.includes('walking')) return 'walking';
    if (type.includes('run') || type.includes('running')) return 'running';

    return 'eco-action';
  };

  // Fetch rank
  useEffect(() => {
    if (!userData) return;

    const fetchRank = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, total_xp')
          .order('total_xp', { ascending: false });

        if (error) {
          console.error('Error fetching leaderboard:', error);
          return;
        }

        const userIndex = data.findIndex(user => user.id === currentUser.id);
        setRank(userIndex >= 0 ? `#${userIndex + 1}` : '—');
      } catch (error) {
        console.error('Error fetching rank:', error);
      }
    };

    fetchRank();
  }, [userData, currentUser]);

  function buildWeeklyData(data) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const weekMap = {};
    days.forEach(d => weekMap[d] = 0);
    data.forEach(a => {
      if (!a.timestamp) return;
      const ts = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const diff = (now - ts) / (1000 * 60 * 60 * 24);
      if (diff <= 7) {
        const day = days[ts.getDay()];
        weekMap[day] += a.co2 || 0;
      }
    });
    setWeeklyData(days.map(d => ({ day: d, co2: weekMap[d] })));
  }

  if (!userData) return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: 40, display: 'inline-block', marginBottom: 12 }}>⚙️</motion.div>
        <div style={{ fontWeight: 700 }}>Loading dashboard...</div>
      </div>
    </div>
  );

  const xp = userData.xp || 0;
  const co2 = userData.co2Saved || 0;
  const lvl = getLevel(xp);
  const progress = getLevelProgress(xp);
  const xpToNext = getXPToNextLevel(xp);

  return (
    <div style={{ background: '#F5F5F0', minHeight: 'calc(100vh - 64px)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 48 }}>{getLevelBadge(userData.level || 1)}</span>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: 28, letterSpacing: -0.5 }}>Welcome back, {userData.name?.split(' ')[0]}!</h1>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span className="nb-badge" style={{ background: lvl.color }}>Level {userData.level || 1}: {lvl.label}</span>
                <span className="nb-badge" style={{ background: '#FDE047' }}>{rank} on Leaderboard</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* XP Progress Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="nb-card" style={{ padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontWeight: 700 }}>
            <span>⚡ XP Progress — Level {userData.level || 1} → {(userData.level || 1) + 1}</span>
            <span style={{ color: '#666', fontSize: 13 }}>{xp} XP · {xpToNext > 0 ? `${xpToNext} to next level` : 'Max level!'}</span>
          </div>
          <div className="nb-progress-track">
            <motion.div
              className="nb-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              style={{ background: lvl.color }}
            />
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
          <StatCard icon={<Leaf size={22} />} label="CO₂ Saved" value={formatCO2(co2)} sub="Total lifetime savings" color="#A3E635" />
          <StatCard icon={<Zap size={22} />} label="Total XP" value={`${xp.toLocaleString()} XP`} sub="1g CO₂ = 1 XP" color="#FDE047" />
          <StatCard icon={<Trophy size={22} />} label="Rank" value={rank} sub={`out of ${rank !== '—' ? rank.replace('#', '') + '+ users' : 'users'}`} color="#FB7185" />
          <StatCard icon={<Target size={22} />} label="Actions" value={actions.length} sub={`${actions.filter(a => {
            if (!a.timestamp) return false;
            const ts = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
            return (Date.now() - ts) < 86400000;
          }).length} today`} color="#60A5FA" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Weekly Chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="nb-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <TrendingUp size={18} />
              <h2 style={{ fontWeight: 800, fontSize: 16 }}>Weekly CO₂ Savings (g)</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontWeight: 700, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: '2px solid #000', borderRadius: 8, fontWeight: 700, boxShadow: '3px 3px 0px #000' }}
                  formatter={(v) => [`${v}g CO₂`, 'Saved']}
                />
                <Bar dataKey="co2" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {weeklyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#000" strokeWidth={2} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* AI Suggestions */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="nb-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Lightbulb size={18} />
              <h2 style={{ fontWeight: 800, fontSize: 16 }}>AI Suggestions</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {suggestions.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                  style={{ background: ['#A3E635', '#FDE047', '#60A5FA', '#FB7185'][i % 4], border: '2px solid #000', borderRadius: 8, padding: '10px 12px', fontSize: 12, fontWeight: 600, lineHeight: 1.4, boxShadow: '2px 2px 0px #000' }}>
                  {s}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>Recent Actions</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, fontWeight: 700, color: '#999' }}>Loading actions...</div>
          ) : actions.length === 0 ? (
            <div className="nb-card" style={{ padding: 40, textAlign: 'center', color: '#999' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 700 }}>No actions yet. Upload your first eco-action!</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="nb-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>CO₂ Saved</th>
                    <th>XP</th>
                    <th>Date</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.slice(0, 10).map(a => {
                    const icons = { cycling: '🚴', bus: '🚌', recycling: '♻️', walking: '🚶', running: '🏃', 'eco-action': '🌱' };
                    const ts = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
                    return (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 700 }}>{icons[a.type] || '🌱'} {a.type}</td>
                        <td><span style={{ background: '#A3E635', border: '1px solid #000', borderRadius: 4, padding: '2px 8px', fontWeight: 800, fontSize: 13 }}>{Math.round(a.co2)}g</span></td>
                        <td><span style={{ background: '#FDE047', border: '1px solid #000', borderRadius: 4, padding: '2px 8px', fontWeight: 800, fontSize: 13 }}>+{a.xp}</span></td>
                        <td style={{ color: '#666', fontSize: 13 }}>{ts.toLocaleDateString()}</td>
                        <td style={{ fontSize: 12, color: '#888' }}>{a.location ? `${a.location.lat?.toFixed(3)}, ${a.location.lng?.toFixed(3)}` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      <style>{`@media (max-width: 768px) { .dash-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
