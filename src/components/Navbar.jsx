import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLevel, getLevelBadge } from '../utils/xpSystem';
import { Menu, X, Leaf, LayoutDashboard, Upload, Trophy, Gift, BookOpen, LogOut } from 'lucide-react';

const navLinks = [
  { to: '/',            label: 'Home',        icon: Leaf },
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/upload',      label: 'Upload',      icon: Upload },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/rewards',     label: 'Rewards',     icon: Gift },
  { to: '/ledger',      label: 'Ledger',      icon: BookOpen },
];

export default function Navbar() {
  const { userData, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const lvl = userData ? getLevel(userData.xp || 0) : null;

  return (
    <nav style={{ background: '#000', borderBottom: '3px solid #A3E635', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{ fontSize: 28 }}>🌍</span>
          <span style={{ color: '#A3E635', fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>
            CarboxX
          </span>
          <span style={{ color: '#fff', fontWeight: 400, fontSize: 13, opacity: 0.6 }}>Campus Carbon</span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden-mobile">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  color: active ? '#000' : '#fff',
                  background: active ? '#A3E635' : 'transparent',
                  border: active ? '2px solid #A3E635' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hidden-mobile">
          {userData && (
            <div style={{ background: '#1a1a1a', border: '2px solid #A3E635', borderRadius: 8, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{getLevelBadge(userData.level || 1)}</span>
              <div>
                <div style={{ color: '#A3E635', fontWeight: 800, fontSize: 13 }}>{userData.name}</div>
                <div style={{ color: '#999', fontSize: 11 }}>{userData.xp || 0} XP · {lvl?.label}</div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="nb-btn nb-btn-pink"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'none' }}
          className="show-mobile"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ background: '#111', borderTop: '2px solid #333', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 8,
                textDecoration: 'none', fontWeight: 700,
                color: location.pathname === to ? '#000' : '#fff',
                background: location.pathname === to ? '#A3E635' : '#1a1a1a',
              }}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
          <button onClick={logout} className="nb-btn nb-btn-pink" style={{ marginTop: 8 }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
