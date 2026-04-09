import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { calculateCO2, getCO2Description } from '../utils/carbonCalculator';
import { verifyAction } from '../utils/aiVerification';
import { runAntiCheatChecks } from '../utils/antiCheat';
import { Upload as UploadIcon, Image, CheckCircle, XCircle, MapPin, AlertTriangle, Loader } from 'lucide-react';

const ACTION_TYPES = [
  { id: 'cycling',   label: 'Cycling',   icon: '🚴', desc: '120g CO₂/km', needsDist: true,  color: '#A3E635' },
  { id: 'bus',       label: 'Bus Ride',  icon: '🚌', desc: '80g CO₂/km',  needsDist: true,  color: '#60A5FA' },
  { id: 'recycling', label: 'Recycling', icon: '♻️', desc: '200g fixed',  needsDist: false, color: '#FDE047' },
];

export default function Upload() {
  const { currentUser, userData, refreshUserData } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [actionType, setActionType] = useState('cycling');
  const [distance, setDistance] = useState('');
  const [step, setStep] = useState('idle'); // idle | checking | analyzing | result | saving | done | error
  const [result, setResult] = useState(null);
  const [co2, setCo2] = useState(0);
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const selectedType = ACTION_TYPES.find(t => t.id === actionType);

  // Get geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          setLocationLabel('📍 Campus zone detected');
        },
        () => setLocationLabel('📍 Location unavailable')
      );
    }
  }, []);

  function handleFile(f) {
    if (!f || !f.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP).');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
    setStep('idle');
    setResult(null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleAnalyze() {
    if (!file) return setError('Please upload an image first.');
    if (selectedType.needsDist && (!distance || Number(distance) <= 0)) {
      return setError('Please enter a valid distance in km.');
    }
    setError('');

    // Step 1: Anti-cheat checks
    setStep('checking');
    const check = await runAntiCheatChecks(currentUser.uid, file.name);
    if (!check.allowed) {
      setError(check.reason);
      setStep('error');
      return;
    }

    // Step 2: AI Verification
    setStep('analyzing');
    const verification = await verifyAction(file, actionType);

    const calc = calculateCO2(actionType, Number(distance) || 0);
    setCo2(calc);
    setResult({ ...verification, co2: calc });
    setStep('result');
  }

  async function handleSave() {
    if (!result?.verified) return;
    setStep('saving');
    try {
      const actionData = {
        userId: currentUser.uid,
        type: actionType,
        co2,
        distance: Number(distance) || 0,
        filename: file.name,
        timestamp: serverTimestamp(),
        location: location || null,
        verified: true,
      };

      await addDoc(collection(db, 'actions'), actionData);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        xp: increment(co2),
        co2Saved: increment(co2),
        level: Math.max(
          1,
          co2 + (userData?.xp || 0) >= 1500 ? 3 : co2 + (userData?.xp || 0) >= 500 ? 2 : 1
        ),
      });
      await refreshUserData(currentUser.uid);
      setStep('done');
    } catch (err) {
      setError('Failed to save action: ' + err.message);
      setStep('error');
    }
  }

  function reset() {
    setFile(null); setPreview(null); setStep('idle');
    setResult(null); setCo2(0); setError(''); setDistance('');
  }

  return (
    <div style={{ background: '#F5F5F0', minHeight: 'calc(100vh - 64px)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="nb-heading" style={{ marginBottom: 8 }}>Upload Eco-Action 📸</h1>
          <p className="nb-subheading" style={{ marginBottom: 32 }}>AI-verified CO₂ savings. Every action counts.</p>
        </motion.div>

        {/* Location Banner */}
        {locationLabel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: '#A3E635', border: '2px solid #000', borderRadius: 8, padding: '10px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, boxShadow: '3px 3px 0px #000' }}>
            <MapPin size={16} /> {locationLabel}
          </motion.div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left: Upload + Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* File Upload */}
            <div className="nb-card" style={{ padding: 20 }}>
              <label className="nb-label">📎 Upload Proof Image</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: `3px dashed ${dragOver ? '#A3E635' : '#000'}`,
                  borderRadius: 8, padding: 24, textAlign: 'center',
                  cursor: 'pointer', background: dragOver ? '#A3E63520' : '#F5F5F0',
                  transition: 'all 0.15s', minHeight: 160,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {preview ? (
                  <img src={preview} alt="preview" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 6, border: '2px solid #000', objectFit: 'cover' }} />
                ) : (
                  <>
                    <Image size={36} color="#999" />
                    <p style={{ fontWeight: 700, color: '#666', fontSize: 14 }}>Drop image here or click to browse</p>
                    <p style={{ fontSize: 12, color: '#aaa' }}>JPG, PNG, WEBP</p>
                  </>
                )}
              </div>
              <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
              {file && <p style={{ marginTop: 8, fontSize: 12, color: '#666', fontWeight: 600 }}>📄 {file.name}</p>}
            </div>

            {/* Action Type */}
            <div className="nb-card" style={{ padding: 20 }}>
              <label className="nb-label">🌿 Action Type</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ACTION_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setActionType(t.id); setDistance(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      border: `3px solid ${actionType === t.id ? '#000' : '#ddd'}`,
                      borderRadius: 8, background: actionType === t.id ? t.color : '#fff',
                      cursor: 'pointer', fontWeight: 700, fontSize: 14,
                      boxShadow: actionType === t.id ? '3px 3px 0px #000' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{t.icon}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div>{t.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Distance + Result */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Distance Input */}
            {selectedType.needsDist && (
              <div className="nb-card" style={{ padding: 20 }}>
                <label className="nb-label">📏 Distance (km)</label>
                <input
                  className="nb-input"
                  type="number" min="0.1" step="0.1"
                  placeholder="e.g. 2.5"
                  value={distance}
                  onChange={e => setDistance(e.target.value)}
                />
                {distance && Number(distance) > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ marginTop: 12, background: '#A3E635', border: '2px solid #000', borderRadius: 6, padding: '8px 12px', fontWeight: 800, fontSize: 13 }}
                  >
                    🌱 {getCO2Description(actionType, Number(distance), calculateCO2(actionType, Number(distance)))}
                  </motion.div>
                )}
              </div>
            )}

            {/* CO2 Preview for recycling */}
            {!selectedType.needsDist && (
              <div className="nb-card-yellow" style={{ padding: 20 }}>
                <div style={{ fontWeight: 900, fontSize: 28 }}>200g</div>
                <div style={{ fontWeight: 800 }}>CO₂ Saved</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Fixed rate for recycling</div>
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ background: '#FB7185', border: '2px solid #000', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'flex-start', fontWeight: 600, fontSize: 13, boxShadow: '3px 3px 0px #000' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </motion.div>
            )}

            {/* Analyze Button */}
            {step === 'idle' || step === 'error' ? (
              <motion.button
                className="nb-btn nb-btn-black"
                style={{ width: '100%', padding: '16px', fontSize: 16 }}
                onClick={handleAnalyze}
                disabled={!file}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <UploadIcon size={18} /> Analyze with AI
              </motion.button>
            ) : null}

            {/* Loading States */}
            <AnimatePresence>
              {(step === 'checking' || step === 'analyzing' || step === 'saving') && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="nb-card"
                  style={{ padding: 28, textAlign: 'center' }}
                >
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'inline-block', fontSize: 36, marginBottom: 12 }}>
                    ⚙️
                  </motion.div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {step === 'checking' && '🔍 Running anti-cheat checks...'}
                    {step === 'analyzing' && '🤖 AI analyzing your image...'}
                    {step === 'saving' && '💾 Saving to blockchain ledger...'}
                  </div>
                  <div style={{ color: '#666', marginTop: 6, fontSize: 13 }}>Please wait a moment</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
              {step === 'result' && result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <div
                    className={result.verified ? 'nb-card-green' : 'nb-card-pink'}
                    style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}
                  >
                    {result.verified
                      ? <CheckCircle size={28} style={{ flexShrink: 0 }} />
                      : <XCircle size={28} style={{ flexShrink: 0 }} />}
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>
                        {result.verified ? '✅ Verified!' : '❌ Rejected'}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>
                        {result.verified
                          ? `Action: ${result.type || actionType} · ${Math.round((result.confidence || 0.7) * 100)}% confidence`
                          : 'Image does not show a valid eco-action.'}
                      </div>
                      {result.verified && (
                        <div style={{ fontWeight: 900, fontSize: 22, marginTop: 8 }}>
                          +{result.co2}g CO₂ · +{result.co2} XP
                        </div>
                      )}
                    </div>
                  </div>

                  {result.verified && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="nb-btn nb-btn-black" style={{ flex: 1, padding: '14px' }} onClick={handleSave}>
                        💾 Save & Earn XP
                      </button>
                      <button className="nb-btn nb-btn-white" style={{ padding: '14px 18px' }} onClick={reset}>
                        ✕
                      </button>
                    </div>
                  )}
                  {!result.verified && (
                    <button className="nb-btn nb-btn-yellow" style={{ width: '100%', padding: '14px' }} onClick={reset}>
                      🔄 Try Again
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Done */}
            <AnimatePresence>
              {step === 'done' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="nb-card-green"
                  style={{ padding: 32, textAlign: 'center' }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontWeight: 900, fontSize: 22 }}>Action Saved!</div>
                  <div style={{ fontWeight: 600, marginTop: 6 }}>
                    +{co2}g CO₂ reduced · +{co2} XP earned
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 4, fontSize: 13, opacity: 0.7 }}>
                    Recorded in your Carbon Ledger 🔗
                  </div>
                  <button className="nb-btn nb-btn-black" style={{ marginTop: 20, width: '100%' }} onClick={reset}>
                    Upload Another
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile responsive fix */}
      <style>{`@media (max-width: 640px) { .upload-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
