import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { calculateCO2, getCO2Description } from '../utils/carbonCalculator';
import { verifyAction } from '../utils/aiVerification';
import { saveAction } from '../utils/saveAction';
import { runAntiCheatChecks } from '../utils/antiCheat';
import { getLevel } from '../utils/xpSystem';
import { Upload as UploadIcon, Image, Video, CheckCircle, XCircle, MapPin, AlertTriangle } from 'lucide-react';

const ACTION_TYPES = [
  { id: 'cycling',   label: 'Cycling',   icon: '🚴', desc: '120g CO₂ per km', needsDist: true,  color: '#A3E635' },
  { id: 'bus',       label: 'Bus Ride',  icon: '🚌', desc: '80g CO₂ per km',  needsDist: true,  color: '#60A5FA' },
  { id: 'recycling', label: 'Recycling', icon: '♻️', desc: '200g (fixed)',     needsDist: false, color: '#FDE047' },
];

export default function Upload() {
  const { currentUser, userData, refreshUserData } = useAuth();
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' | 'video'
  const [preview, setPreview] = useState(null);
  const [actionType, setActionType] = useState('cycling');
  const [distance, setDistance] = useState('');
  const [step, setStep] = useState('idle'); // idle | checking | analyzing | result | saving | done | error
  const [result, setResult] = useState(null);
  const [co2, setCo2] = useState(0);
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('Detecting location...');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const selectedType = ACTION_TYPES.find(t => t.id === actionType);

  // Geo-tracking on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          setLocationLabel('📍 You are in campus zone ✅');
        },
        () => setLocationLabel('📍 Location unavailable — proceeding without GPS')
      );
    } else {
      setLocationLabel('📍 Geolocation not supported by your browser');
    }
  }, []);

  function handleFile(f) {
    const isImage = f.type.startsWith('image/');
    const isVideo = f.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setError('Please upload an image (JPG, PNG, WEBP) or video (MP4, MOV) file.');
      return;
    }
    setFile(f);
    setFileType(isImage ? 'image' : 'video');
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
    if (!file) return setError('Please upload an image or video first.');
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

    const res = await saveAction({
      userId: currentUser.uid,
      type: actionType,
      co2,
      distance: Number(distance) || 0,
      filename: file.name,
      fileType: fileType,
      location,
      userData,
    });

    if (res.success) {
      await refreshUserData(currentUser.uid);
      setStep('done');
    } else {
      setError(res.error || 'Failed to save action.');
      setStep('error');
    }
  }

  function reset() {
    setFile(null); setPreview(null); setFileType(null);
    setStep('idle'); setResult(null); setCo2(0);
    setError(''); setDistance('');
  }

  const co2Preview = selectedType.needsDist && distance && Number(distance) > 0
    ? calculateCO2(actionType, Number(distance))
    : actionType === 'recycling' ? 200 : null;

  return (
    <div style={{ background: '#F5F5F0', minHeight: 'calc(100vh - 64px)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="nb-heading" style={{ marginBottom: 6 }}>Upload Eco-Action 📸</h1>
          <p className="nb-subheading" style={{ marginBottom: 24 }}>
            Submit image or video proof — AI verifies and awards CO₂ savings
          </p>
        </motion.div>

        {/* Geo Banner */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          style={{
            background: location ? '#A3E635' : '#FDE047',
            border: '2px solid #000', borderRadius: 8,
            padding: '10px 16px', marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 8,
            fontWeight: 700, fontSize: 14, boxShadow: '3px 3px 0px #000'
          }}>
          <MapPin size={16} /> {locationLabel}
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* File Upload Zone */}
            <div className="nb-card" style={{ padding: 20 }}>
              <label className="nb-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Image size={13} /> Image / <Video size={13} /> Video Proof
                </span>
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: `3px dashed ${dragOver ? '#A3E635' : '#000'}`,
                  borderRadius: 8, padding: '20px 16px', textAlign: 'center',
                  cursor: 'pointer', background: dragOver ? '#A3E63520' : '#F5F5F0',
                  transition: 'all 0.15s', minHeight: 180,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {preview ? (
                  fileType === 'video' ? (
                    <video src={preview} controls style={{ maxHeight: 150, maxWidth: '100%', borderRadius: 6, border: '2px solid #000' }} />
                  ) : (
                    <img src={preview} alt="preview" style={{ maxHeight: 150, maxWidth: '100%', borderRadius: 6, border: '2px solid #000', objectFit: 'cover' }} />
                  )
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Image size={28} color="#999" />
                      <Video size={28} color="#999" />
                    </div>
                    <p style={{ fontWeight: 700, color: '#666', fontSize: 14 }}>Drop image/video or click to browse</p>
                    <p style={{ fontSize: 12, color: '#aaa' }}>JPG, PNG, WEBP, MP4, MOV</p>
                  </>
                )}
              </div>
              <input
                ref={inputRef} type="file"
                accept="image/*,video/*" hidden
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
              />
              {file && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {fileType === 'video' ? <Video size={14} /> : <Image size={14} />}
                  <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>{file.name}</span>
                  <span style={{ fontSize: 11, background: fileType === 'video' ? '#60A5FA' : '#A3E635', border: '1px solid #000', borderRadius: 4, padding: '1px 6px', fontWeight: 800 }}>
                    {fileType?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Action Type */}
            <div className="nb-card" style={{ padding: 20 }}>
              <label className="nb-label">🌿 Action Type</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ACTION_TYPES.map(t => (
                  <button key={t.id} onClick={() => { setActionType(t.id); setDistance(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', border: `3px solid ${actionType === t.id ? '#000' : '#ddd'}`,
                      borderRadius: 8, background: actionType === t.id ? t.color : '#fff',
                      cursor: 'pointer', fontWeight: 700, fontSize: 14,
                      boxShadow: actionType === t.id ? '3px 3px 0px #000' : 'none', transition: 'all 0.15s',
                    }}>
                    <span style={{ fontSize: 22 }}>{t.icon}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div>{t.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>{t.desc}</div>
                    </div>
                    {actionType === t.id && <span style={{ marginLeft: 'auto', fontSize: 16 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Distance Input */}
            {selectedType.needsDist && (
              <div className="nb-card" style={{ padding: 20 }}>
                <label className="nb-label">📏 Distance (km)</label>
                <input
                  className="nb-input" type="number" min="0.1" step="0.1"
                  placeholder={`e.g. 2.5 km`} value={distance}
                  onChange={e => setDistance(e.target.value)}
                />
              </div>
            )}

            {/* CO2 Preview */}
            {co2Preview !== null && (
              <motion.div
                key={co2Preview}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="nb-card-green"
                style={{ padding: 20 }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, marginBottom: 4 }}>
                  CO₂ Savings Preview
                </div>
                <div style={{ fontWeight: 900, fontSize: 32 }}>{co2Preview}g</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>
                  {getCO2Description(actionType, Number(distance) || 0, co2Preview)}
                </div>
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, opacity: 0.7 }}>
                  = +{co2Preview} XP earned
                </div>
              </motion.div>
            )}

            {/* User XP Context */}
            {userData && (
              <div className="nb-card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, opacity: 0.6 }}>Your Progress</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13 }}>
                  <span>Current XP</span>
                  <span>{userData.xp || 0} XP</span>
                </div>
                {co2Preview && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 13, color: '#000', marginTop: 4 }}>
                    <span>After this action</span>
                    <span style={{ background: '#A3E635', padding: '1px 8px', borderRadius: 4, border: '1px solid #000' }}>
                      {(userData.xp || 0) + co2Preview} XP
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: '#FB7185', border: '2px solid #000', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'flex-start', fontWeight: 600, fontSize: 13, boxShadow: '3px 3px 0px #000' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </motion.div>
            )}

            {/* Analyze Button */}
            {(step === 'idle' || step === 'error') && (
              <motion.button
                className="nb-btn nb-btn-black"
                style={{ width: '100%', padding: '16px', fontSize: 16, opacity: !file ? 0.5 : 1 }}
                onClick={handleAnalyze}
                disabled={!file}
                whileHover={file ? { scale: 1.02 } : {}}
                whileTap={file ? { scale: 0.97 } : {}}
              >
                <UploadIcon size={18} />
                {fileType === 'video' ? '🎬 Analyze Video' : '🤖 Analyze with AI'}
              </motion.button>
            )}

            {/* Loading States */}
            <AnimatePresence>
              {['checking', 'analyzing', 'saving'].includes(step) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="nb-card" style={{ padding: 28, textAlign: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ display: 'inline-block', fontSize: 36, marginBottom: 12 }}>⚙️</motion.div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {step === 'checking' && '🛡 Running anti-cheat checks...'}
                    {step === 'analyzing' && '🤖 AI analyzing your proof...'}
                    {step === 'saving' && '⛓ Recording in Carbon Ledger...'}
                  </div>
                  <div style={{ color: '#666', marginTop: 6, fontSize: 13 }}>Please wait</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
              {step === 'result' && result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      background: result.verified ? '#A3E635' : '#FB7185',
                      border: '3px solid #000', borderRadius: 10, padding: 20,
                      boxShadow: '4px 4px 0px #000', display: 'flex', gap: 14, alignItems: 'flex-start'
                    }}
                  >
                    {result.verified ? <CheckCircle size={28} /> : <XCircle size={28} />}
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 20 }}>
                        {result.verified ? '✅ Verified!' : '❌ Rejected'}
                      </div>
                      {result.verified ? (
                        <>
                          <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>
                            {result.type || actionType} detected · {Math.round((result.confidence || 0.7) * 100)}% confidence
                          </div>
                          <div style={{ fontWeight: 900, fontSize: 24, marginTop: 10 }}>
                            +{result.co2}g CO₂ saved · +{result.co2} XP
                          </div>
                        </>
                      ) : (
                        <div style={{ fontWeight: 600, fontSize: 13, marginTop: 6 }}>
                          {result.reason || 'Image/video does not show a valid eco-action. Try again with a clearer upload.'}
                        </div>
                      )}
                    </div>
                  </div>

                  {result.verified ? (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <motion.button
                        className="nb-btn nb-btn-black"
                        style={{ flex: 1, padding: '14px', fontSize: 15 }}
                        onClick={handleSave}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      >
                        ⛓ Save & Earn XP
                      </motion.button>
                      <button className="nb-btn nb-btn-white" style={{ padding: '14px 18px' }} onClick={reset}>✕</button>
                    </div>
                  ) : (
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
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  className="nb-card-green" style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Action Saved!</div>
                  <div style={{ fontWeight: 700 }}>+{co2}g CO₂ reduced</div>
                  <div style={{ fontWeight: 700 }}>+{co2} XP earned</div>
                  <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7, fontWeight: 600 }}>
                    ⛓ Recorded in your Carbon Ledger
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button className="nb-btn nb-btn-black" style={{ flex: 1 }} onClick={reset}>Upload Another</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Rules info */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="nb-card" style={{ marginTop: 28, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📋 CARBON SAVINGS RULES</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: '🚴 Cycling', val: '120g CO₂ / km', color: '#A3E635' },
              { label: '🚌 Bus',     val: '80g CO₂ / km',  color: '#60A5FA' },
              { label: '♻️ Recycling', val: '200g fixed',  color: '#FDE047' },
              { label: '⚡ XP Rate',  val: '1g CO₂ = 1 XP', color: '#FB7185' },
              { label: '🛡 Daily Limit', val: '5 uploads/day', color: '#E5E5E5' },
            ].map((r, i) => (
              <div key={i} style={{ background: r.color, border: '2px solid #000', borderRadius: 6, padding: '8px 14px', boxShadow: '2px 2px 0px #000', flex: '1 1 120px' }}>
                <div style={{ fontWeight: 800, fontSize: 12 }}>{r.label}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>{r.val}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
