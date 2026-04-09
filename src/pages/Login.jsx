import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Leaf, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        if (!name.trim()) return setError('Name is required.');
        await signup(email, password, name.trim());
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Email already in use.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-credential': 'Invalid email or password.',
      };
      setError(msgs[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F5F0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, background: '#A3E635', borderRadius: '50%', opacity: 0.15, zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 400, height: 400, background: '#60A5FA', borderRadius: '50%', opacity: 0.1, zIndex: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            style={{ fontSize: 56, marginBottom: 8 }}
          >🌍</motion.div>
          <h1 style={{ fontWeight: 900, fontSize: 28, letterSpacing: -0.5 }}>
            Campus Carbon Intelligence
          </h1>
          <p style={{ color: '#666', marginTop: 4, fontWeight: 500 }}>
            {isSignup ? 'Join the green revolution 🌱' : 'Welcome back, eco-warrior 💪'}
          </p>
        </div>

        {/* Card */}
        <div className="nb-card" style={{ padding: 32 }}>
          {/* Toggle */}
          <div style={{ display: 'flex', background: '#F5F5F0', border: '2px solid #000', borderRadius: 8, marginBottom: 28, overflow: 'hidden' }}>
            {['Login', 'Sign Up'].map((t, i) => (
              <button
                key={t}
                onClick={() => { setIsSignup(i === 1); setError(''); }}
                style={{
                  flex: 1, padding: '10px 0', fontWeight: 800, fontSize: 14,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: isSignup === (i === 1) ? '#000' : 'transparent',
                  color: isSignup === (i === 1) ? '#A3E635' : '#000',
                }}
              >{t}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {isSignup && (
              <div>
                <label className="nb-label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />Full Name</label>
                <input
                  className="nb-input"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="nb-label"><Mail size={12} style={{ display: 'inline', marginRight: 4 }} />Email</label>
              <input
                className="nb-input"
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="nb-label"><Lock size={12} style={{ display: 'inline', marginRight: 4 }} />Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="nb-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ background: '#FB7185', border: '2px solid #000', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}
              >
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="nb-btn nb-btn-green"
              style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 4, opacity: loading ? 0.7 : 1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? '⏳ Please wait...' : isSignup ? '🚀 Create Account' : '🔑 Login'}
            </motion.button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#666', fontSize: 13, fontWeight: 500 }}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setIsSignup(s => !s); setError(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, textDecoration: 'underline', color: '#000' }}>
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
