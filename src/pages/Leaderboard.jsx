import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { getLevelBadge, getLevel } from '../utils/xpSystem';
import { formatCO2 } from '../utils/carbonCalculator';
import { Trophy, Medal, Award } from 'lucide-react';

const DEPARTMENTS = ['All', 'CS', 'Engineering', 'Business', 'Science', 'Arts'];

const MOCK_DEPARTMENTS = ['CS', 'Engineering', 'Business', 'Science', 'Arts', 'CS', 'Engineering', 'CS'];

export default function Leaderboard() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState('All');

  useEffect(() => {
    // Fetch users from Supabase leaderboard view
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, display_name, department, total_xp, total_co2_saved, created_at')
          .order('total_xp', { ascending: false });

        if (error) {
          console.error('Error fetching leaderboard:', error);
          setUsers([]);
          setLoading(false);
          return;
        }

        // Transform Supabase data to match expected format
        const transformedUsers = (data || []).map((user, i) => ({
          id: user.id,
          name: user.display_name || 'Anonymous',
          xp: user.total_xp || 0,
          co2Saved: user.total_co2_saved || 0,
          level: Math.floor((user.total_xp || 0) / 100) + 1, // Calculate level from XP
          dept: user.department || MOCK_DEPARTMENTS[i % MOCK_DEPARTMENTS.length], // Use department or fallback
          createdAt: user.created_at,
        }));

        setUsers(transformedUsers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Set up real-time subscription for leaderboard updates
    const subscription = supabase
      .channel('leaderboard_updates')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        () => {
          // Refetch leaderboard when users table changes
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filtered = dept === 'All' ? users : users.filter(u => u.dept === dept);
  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const PODIUM_COLORS = ['#FDE047', '#E5E5E5', '#FB7185'];
  const PODIUM_ICONS = [<Trophy size={20} />, <Medal size={20} />, <Award size={20} />];

  return (
    <div style={{ background: '#F5F5F0', minHeight: 'calc(100vh - 64px)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 className="nb-heading" style={{ marginBottom: 8 }}>🏆 Live Leaderboard</h1>
          <p className="nb-subheading">Real-time rankings — updated live from Supabase</p>
        </motion.div>

        {/* Department Filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36 }}>
          {DEPARTMENTS.map(d => (
            <button key={d} onClick={() => setDept(d)}
              className="nb-btn"
              style={{
                padding: '8px 18px', fontSize: 13,
                background: dept === d ? '#000' : '#fff',
                color: dept === d ? '#A3E635' : '#000',
                border: '2px solid #000',
                boxShadow: dept === d ? '3px 3px 0px #A3E635' : '2px 2px 0px #000',
              }}
            >{d}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: 36, display: 'inline-block', marginBottom: 12 }}>⚙️</motion.div>
            <div style={{ fontWeight: 700 }}>Loading leaderboard...</div>
          </div>
        ) : (
          <>
            {/* Podium Top 3 */}
            {top3.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 40, alignItems: 'flex-end', flexWrap: 'wrap' }}
              >
                {/* Reorder: 2nd, 1st, 3rd */}
                {[top3[1], top3[0], top3[2]].map((u, podiumIdx) => {
                  if (!u) return null;
                  const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
                  const height = rank === 1 ? 200 : rank === 2 ? 160 : 140;
                  const color = PODIUM_COLORS[rank - 1];
                  const isMe = u.id === currentUser?.id;
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: podiumIdx * 0.15 }}
                      style={{ textAlign: 'center', flex: rank === 1 ? '0 0 220px' : '0 0 180px' }}
                    >
                      {/* Avatar */}
                      <div style={{ fontSize: 36, marginBottom: 8 }}>{getLevelBadge(u.level || 1)}</div>
                      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{u.name?.split(' ')[0]}</div>
                      {isMe && <div style={{ fontSize: 11, color: '#666', marginBottom: 4, fontWeight: 700 }}>← You</div>}
                      {/* Podium block */}
                      <div style={{
                        height, background: color, border: '3px solid #000',
                        borderRadius: '10px 10px 0 0', boxShadow: '4px 4px 0px #000',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{PODIUM_ICONS[rank - 1]}</div>
                        <div style={{ fontWeight: 900, fontSize: 22 }}>#{rank}</div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{(u.xp || 0).toLocaleString()} XP</div>
                        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7 }}>{formatCO2(u.co2Saved || 0)}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Full Table */}
            {filtered.length === 0 ? (
              <div className="nb-card" style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🏜️</div>
                <div style={{ fontWeight: 700 }}>No users found for this department.</div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="nb-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>User</th>
                        <th>Dept</th>
                        <th>XP</th>
                        <th>CO₂ Saved</th>
                        <th>Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u, i) => {
                        const isMe = u.id === currentUser?.id;
                        const lvl = getLevel(u.xp || 0);
                        return (
                          <motion.tr key={u.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            style={{ background: isMe ? '#FDE04740' : undefined }}
                          >
                            <td>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 32, height: 32, borderRadius: 6,
                                background: i === 0 ? '#FDE047' : i === 1 ? '#E5E5E5' : i === 2 ? '#FB7185' : '#F5F5F0',
                                border: '2px solid #000', fontWeight: 900, fontSize: 13
                              }}>
                                #{i + 1}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700 }}>
                              {u.name} {isMe && <span style={{ fontSize: 11, background: '#A3E635', border: '1px solid #000', borderRadius: 4, padding: '1px 6px', marginLeft: 6 }}>You</span>}
                            </td>
                            <td><span className="nb-badge" style={{ background: '#60A5FA', fontSize: 11 }}>{u.dept}</span></td>
                            <td style={{ fontWeight: 800 }}>{(u.xp || 0).toLocaleString()}</td>
                            <td><span style={{ background: '#A3E635', border: '1px solid #000', borderRadius: 4, padding: '2px 8px', fontWeight: 800, fontSize: 13 }}>{formatCO2(u.co2Saved || 0)}</span></td>
                            <td>
                              <span style={{ background: lvl.color, border: '1px solid #000', borderRadius: 4, padding: '2px 8px', fontWeight: 800, fontSize: 12 }}>
                                {getLevelBadge(u.level || 1)} L{u.level || 1}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
