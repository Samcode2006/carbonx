import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getLevel, getLevelBadge } from '../utils/xpSystem';

const features = [
  { icon: '📸', title: 'Upload Actions', desc: 'Submit proof of your eco-friendly actions — cycling, bus rides, recycling.', color: '#A3E635' },
  { icon: '🤖', title: 'AI Verification', desc: 'Gemini-powered AI (with smart fallback) confirms your submissions instantly.', color: '#60A5FA' },
  { icon: '🌱', title: 'Carbon Calculator', desc: 'Precise CO₂ savings: 120g/km cycling, 80g/km bus, 200g recycling.', color: '#FDE047' },
  { icon: '🏆', title: 'XP & Levels', desc: 'Earn XP for every gram saved. Level up from Eco Rookie to Carbon Hero.', color: '#FB7185' },
  { icon: '🌍', title: 'Live Leaderboard', desc: 'Real-time rankings updated from Firestore — see who\'s leading the green charge.', color: '#A3E635' },
  { icon: '🎁', title: 'Rewards Store', desc: 'Redeem XP for real campus rewards: coffee, meals, hoodies.', color: '#60A5FA' },
];

const floatingIcons = ['🌿', '🍃', '♻️', '🚲', '🌱', '☀️', '💧', '🌎'];

function FloatingEco({ icon, x, y, delay, duration }) {
  return (
    <motion.div
      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, fontSize: 24, pointerEvents: 'none', zIndex: 1 }}
      animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0], opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {icon}
    </motion.div>
  );
}

export default function Home() {
  const { userData } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });

  // Parallax transforms
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const lvl = userData ? getLevel(userData.xp || 0) : null;

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div style={{ background: '#F5F5F0', overflowX: 'hidden' }}>

      {/* ═══ HERO SECTION ═══ */}
      <section ref={heroRef} style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        {/* Parallax Background */}
        <motion.div style={{ y: bgY, position: 'absolute', inset: 0, zIndex: 0 }}>
          <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative' }}>
            {/* Grid pattern */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'linear-gradient(#A3E63520 1px, transparent 1px), linear-gradient(90deg, #A3E63520 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }} />
            {/* Colored blobs */}
            <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, background: '#A3E635', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15 }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, background: '#60A5FA', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.1 }} />
            <div style={{ position: 'absolute', top: '40%', right: '20%', width: 300, height: 300, background: '#FDE047', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.08 }} />
          </div>
        </motion.div>

        {/* Floating eco icons */}
        {floatingIcons.map((icon, i) => (
          <FloatingEco
            key={i} icon={icon}
            x={5 + (i * 12) % 90} y={10 + (i * 17) % 80}
            delay={i * 0.4} duration={3 + (i % 3)}
          />
        ))}

        {/* Hero Content */}
        <motion.div
          style={{ y: textY, opacity, position: 'relative', zIndex: 2, width: '100%' }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#A3E635', border: '2px solid #A3E635', borderRadius: 6, padding: '6px 14px', marginBottom: 20 }}>
                  <span style={{ fontWeight: 800, fontSize: 12, color: '#000', textTransform: 'uppercase', letterSpacing: 1 }}>🌍 Campus Carbon Intelligence</span>
                </div>
                <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: 20, letterSpacing: -2 }}>
                  Save the Planet,<br />
                  <span style={{ color: '#A3E635' }}>Earn Rewards.</span>
                </h1>
                <p style={{ color: '#aaa', fontSize: 18, lineHeight: 1.6, marginBottom: 32, fontWeight: 500 }}>
                  Track your eco-friendly actions, get AI-verified CO₂ savings, earn XP, and compete with your campus on the live leaderboard.
                </p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Link to="/upload" className="nb-btn nb-btn-green" style={{ fontSize: 15, padding: '14px 28px' }}>
                    🚀 Start Saving CO₂
                  </Link>
                  <Link to="/leaderboard" className="nb-btn nb-btn-white" style={{ fontSize: 15, padding: '14px 28px' }}>
                    🏆 View Leaderboard
                  </Link>
                </div>

                {userData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{ marginTop: 28, background: '#111', border: '2px solid #A3E635', borderRadius: 10, padding: '14px 20px', display: 'inline-flex', gap: 16, alignItems: 'center' }}
                  >
                    <span style={{ fontSize: 28 }}>{getLevelBadge(userData.level || 1)}</span>
                    <div>
                      <div style={{ color: '#A3E635', fontWeight: 800 }}>Welcome back, {userData.name?.split(' ')[0]}!</div>
                      <div style={{ color: '#999', fontSize: 13 }}>{userData.xp || 0} XP • {(userData.co2Saved / 1000 || 0).toFixed(2)}kg saved • {lvl?.label}</div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Right side stats */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            >
              {[
                { label: 'CO₂ Rate', val: '120g/km', sub: 'Cycling savings', color: '#A3E635' },
                { label: 'Bus Rate', val: '80g/km', sub: 'Public transit', color: '#60A5FA' },
                { label: 'Recycling', val: '200g', sub: 'Per action', color: '#FDE047' },
                { label: 'Max XP', val: '1 XP/g', sub: 'Direct CO₂ ratio', color: '#FB7185' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  style={{
                    background: s.color, border: '3px solid #000',
                    borderRadius: 12, padding: '20px', boxShadow: '4px 4px 0px #000',
                    color: '#000'
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{s.val}</div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{s.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{s.sub}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: '#A3E635', fontSize: 24, zIndex: 2 }}
        >↓</motion.div>
      </section>

      {/* ═══ FEATURES SECTION ═══ */}
      <section style={{ padding: '100px 24px', background: '#F5F5F0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <h2 className="nb-heading">Everything you need to<br /><span style={{ background: '#A3E635', padding: '0 8px' }}>go green</span></h2>
            <p className="nb-subheading" style={{ marginTop: 12 }}>A complete sustainability platform built for campus communities</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp} initial="hidden" whileInView="visible"
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="nb-card"
                style={{ padding: 28 }}
                whileHover={{ y: -4 }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
                <div style={{ display: 'inline-block', background: f.color, border: '2px solid #000', borderRadius: 6, padding: '2px 10px', marginBottom: 12, fontWeight: 800, fontSize: 12 }}>
                  {f.title}
                </div>
                <p style={{ color: '#444', fontWeight: 500, lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ padding: '100px 24px', background: '#000' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.h2
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="nb-heading" style={{ color: '#fff', textAlign: 'center', marginBottom: 60 }}
          >
            How it <span style={{ color: '#A3E635' }}>works</span>
          </motion.h2>

          <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { step: '01', title: 'Upload Proof', desc: 'Snap a photo of your eco-action and upload it.', color: '#A3E635' },
              { step: '02', title: 'AI Verifies', desc: 'Our AI checks and classifies your submission.', color: '#FDE047' },
              { step: '03', title: 'Earn XP', desc: 'CO₂ saved = XP earned. Watch your level grow!', color: '#FB7185' },
              { step: '04', title: 'Get Rewards', desc: 'Redeem XP for real campus perks and prizes.', color: '#60A5FA' },
            ].map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp} initial="hidden" whileInView="visible"
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                style={{ flex: '1 1 200px', padding: '32px 24px', borderRight: i < 3 ? '2px solid #222' : 'none', textAlign: 'center' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: s.color, border: '3px solid #fff', borderRadius: 12, fontSize: 20, fontWeight: 900, marginBottom: 16, boxShadow: '4px 4px 0px #fff' }}>
                  {s.step}
                </div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{s.title}</div>
                <div style={{ color: '#999', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section style={{ padding: '100px 24px', background: '#A3E635', borderTop: '4px solid #000', borderBottom: '4px solid #000' }}>
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}
        >
          <h2 className="nb-heading" style={{ marginBottom: 20 }}>Ready to make a<br />difference? 🌍</h2>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 32, opacity: 0.8 }}>
            Join your campus peers. Every gram of CO₂ saved counts toward a cleaner future.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/upload" className="nb-btn nb-btn-black" style={{ fontSize: 16, padding: '16px 32px' }}>
              🚀 Upload Your First Action
            </Link>
            <Link to="/dashboard" className="nb-btn nb-btn-white" style={{ fontSize: 16, padding: '16px 32px' }}>
              📊 Go to Dashboard
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#000', borderTop: '3px solid #222', padding: '32px 24px', textAlign: 'center', color: '#666', fontSize: 13 }}>
        <span style={{ color: '#A3E635', fontWeight: 800 }}>Campus Carbon Intelligence</span> · Built with 💚 for a greener campus
      </footer>
    </div>
  );
}
