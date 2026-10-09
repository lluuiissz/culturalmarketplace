'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { compressImage, fileToDataUrl, dataUrlToFile } from '@/lib/imageCompress';

type Step = 'details' | 'verify' | 'done';

const DRAFT_STORAGE_KEY = 'cm_artisan_reg_draft_v2';

export default function ArtisanRegisterPage() {
  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: '',
    craft_type: '',
    business_name: '',
    id_number: '',
    dob: '',
  });

  const [token, setToken] = useState('');
  const [services, setServices] = useState({ ocr: true, face: false, storage: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // OCR state
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrHint, setOcrHint] = useState('');
  const [cachedOcr, setCachedOcr] = useState<Record<string, unknown> | null>(null);

  // Files
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [proofCraft, setProofCraft] = useState<File | null>(null);
  const [sample1, setSample1] = useState<File | null>(null);
  const [sample2, setSample2] = useState<File | null>(null);

  // Previews (Data URLs, safe across page reloads)
  const [idFrontPreview, setIdFrontPreview] = useState<string>('');
  const [idBackPreview, setIdBackPreview] = useState<string>('');
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [proofPreview, setProofPreview] = useState<string>('');
  const [s1Preview, setS1Preview] = useState<string>('');
  const [s2Preview, setS2Preview] = useState<string>('');

  const [faceResult, setFaceResult] = useState<'idle' | 'matching' | 'match' | 'mismatch'>('idle');

  // Input refs
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieFileRef = useRef<HTMLInputElement>(null);
  const proofRef = useRef<HTMLInputElement>(null);
  const s1Ref = useRef<HTMLInputElement>(null);
  const s2Ref = useRef<HTMLInputElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);

  // 1. Accidental Refresh Recovery: Restore draft on initial page mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (data && typeof data === 'object') {
        if (data.form) setForm((prev) => ({ ...prev, ...data.form }));
        if (data.token) setToken(data.token);
        if (data.step && (data.step === 'details' || data.step === 'verify')) setStep(data.step);
        if (data.cachedOcr) setCachedOcr(data.cachedOcr);
        if (data.ocrHint) setOcrHint(data.ocrHint);

        // Restore image previews & rebuild File objects
        if (data.idFrontPreview) {
          setIdFrontPreview(data.idFrontPreview);
          const f = dataUrlToFile(data.idFrontPreview, 'id-front.jpg');
          if (f) setIdFront(f);
        }
        if (data.idBackPreview) {
          setIdBackPreview(data.idBackPreview);
          const f = dataUrlToFile(data.idBackPreview, 'id-back.jpg');
          if (f) setIdBack(f);
        }
        if (data.selfiePreview) {
          setSelfiePreview(data.selfiePreview);
          const f = dataUrlToFile(data.selfiePreview, 'selfie.jpg');
          if (f) setSelfie(f);
        }
        if (data.proofPreview) {
          setProofPreview(data.proofPreview);
          const f = dataUrlToFile(data.proofPreview, 'proof.jpg');
          if (f) setProofCraft(f);
        }
        if (data.s1Preview) {
          setS1Preview(data.s1Preview);
          const f = dataUrlToFile(data.s1Preview, 'sample1.jpg');
          if (f) setSample1(f);
        }
        if (data.s2Preview) {
          setS2Preview(data.s2Preview);
          const f = dataUrlToFile(data.s2Preview, 'sample2.jpg');
          if (f) setSample2(f);
        }

        setDraftRestored(true);
      }
    } catch {
      // Ignore corrupted local storage
    }
  }, []);

  // 2. Auto-save draft changes to localStorage
  useEffect(() => {
    if (step === 'done') {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }
    const timer = setTimeout(() => {
      try {
        const payload = {
          step,
          form,
          token,
          cachedOcr,
          ocrHint,
          idFrontPreview,
          idBackPreview,
          selfiePreview,
          proofPreview,
          s1Preview,
          s2Preview,
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Exceeded quota or private mode: ignore
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [step, form, token, cachedOcr, ocrHint, idFrontPreview, idBackPreview, selfiePreview, proofPreview, s1Preview, s2Preview]);

  function clearDraft() {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setForm({
      name: '', email: '', password: '', phone: '', location: '', craft_type: '', business_name: '', id_number: '', dob: '',
    });
    setToken('');
    setStep('details');
    setCachedOcr(null);
    setOcrHint('');
    setIdFront(null); setIdBack(null); setSelfie(null); setProofCraft(null); setSample1(null); setSample2(null);
    setIdFrontPreview(''); setIdBackPreview(''); setSelfiePreview(''); setProofPreview(''); setS1Preview(''); setS2Preview('');
    setDraftRestored(false);
  }

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // 3. Fast Automatic & Editable OCR Handler
  async function handleIdUpload(rawFile: File, side: 'front' | 'back') {
    setError('');
    setOcrBusy(true);
    setOcrHint('⚡ Compressing image for fast reading…');

    try {
      // Fast canvas downscale: 6MB -> ~150KB in 30ms
      const compressed = await compressImage(rawFile, 1200, 1200, 0.8);
      const dataUrl = await fileToDataUrl(compressed);

      if (side === 'front') {
        setIdFront(compressed);
        setIdFrontPreview(dataUrl);
      } else {
        setIdBack(compressed);
        setIdBackPreview(dataUrl);
      }

      setOcrHint('🔍 Reading ID with OCR…');

      // Send optimized payload to server OCR endpoint
      const fd = new FormData();
      fd.append('id_image', compressed);
      fd.append('side', side);
      fd.append('email', form.email);

      const res = await fetch('/api/auth/ocr-id', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.status === 'ok' && data.fields) {
        const f = data.fields;
        setCachedOcr((prev) => ({ ...(prev || {}), [side]: f }));

        // Format Date of Birth if detected
        let cleanDob = f.dob || '';
        if (cleanDob && !/^\d{4}-\d{2}-\d{2}$/.test(cleanDob)) {
          const parsed = Date.parse(cleanDob);
          if (!isNaN(parsed)) {
            cleanDob = new Date(parsed).toISOString().split('T')[0];
          }
        }

        // Auto-fill form values into editable inputs
        setForm((prev) => ({
          ...prev,
          name: prev.name || f.full_name || '',
          id_number: prev.id_number || f.id_number || '',
          dob: prev.dob || cleanDob || '',
          location: prev.location || f.address || '',
        }));

        const itemsFound = [
          f.full_name && 'Name',
          f.id_number && 'ID Number',
          f.dob && 'DOB',
          f.address && 'Address',
        ].filter(Boolean);

        if (itemsFound.length > 0) {
          setOcrHint(`✨ Auto-filled: ${itemsFound.join(', ')}. All fields are editable below.`);
        } else {
          setOcrHint('ID image attached. You can type or adjust your details below.');
        }
      } else if (data.status === 'error') {
        setOcrHint(`ID image attached. You may enter your details manually.`);
      } else {
        setOcrHint('ID image attached.');
      }
    } catch {
      setOcrHint('ID image attached. You can type your details below.');
    } finally {
      setOcrBusy(false);
    }
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/register-artisan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      setToken(data.token);
      setServices(data.services ?? { ocr: true, face: false, storage: false });
      setStep('verify');
    } else {
      setError(data.message || 'Registration failed.');
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamOn(true);
    } catch {
      setError('Camera unavailable. Use the upload option below instead.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }

  async function captureSelfie(matchAgainstId: boolean) {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.92));
    if (!blob) return;
    const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
    const dataUrl = await fileToDataUrl(file);
    setSelfie(file);
    setSelfiePreview(dataUrl);
    stopCamera();

    if (matchAgainstId && idFront) {
      setFaceResult('matching');
      const fd = new FormData();
      fd.append('id_image', idFront);
      fd.append('selfie', file);
      const res = await fetch('/api/auth/face-preview', { method: 'POST', body: fd }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setFaceResult(data.match ? 'match' : 'mismatch');
      } else {
        setFaceResult('idle');
      }
    }
  }

  async function finalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('token', token);
      if (idFront) fd.append('id_front', idFront);
      if (idBack) fd.append('id_back', idBack);
      if (selfie) fd.append('selfie', selfie);
      if (proofCraft) fd.append('proof_of_craft', proofCraft);
      if (sample1) fd.append('product_sample_1', sample1);
      if (sample2) fd.append('product_sample_2', sample2);

      // Pass pre-extracted OCR data to eliminate duplicate remote OCR latency
      if (cachedOcr) {
        fd.append('ocr_data', JSON.stringify(cachedOcr));
      }

      let res = await fetch('/api/auth/register-artisan/captures', { method: 'POST', body: fd });
      let data = await res.json();

      // If token expired (e.g. user was idle or refreshed past 15m), seamlessly re-register details and retry once
      if (res.status === 410 || (data.message && data.message.includes('expired'))) {
        const reReg = await fetch('/api/auth/register-artisan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const reData = await reReg.json();
        if (reData.status === 'success' && reData.token) {
          setToken(reData.token);
          fd.set('token', reData.token);
          res = await fetch('/api/auth/register-artisan/captures', { method: 'POST', body: fd });
          data = await res.json();
        }
      }

      if (data.status === 'success') {
        setDone(true);
        setStep('done');
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch {
      setError('Connection interrupted. Please press Submit again — your photos and information are preserved.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md p-8 text-center">
          <div className="text-4xl">🧵</div>
          <h1 className="mt-3 font-serif text-2xl font-bold text-brand-900">Application received</h1>
          <p className="mt-2 text-sm text-stone-600">
            Your artisan account is pending admin approval. You&apos;ll be able to sign in once approved.
          </p>
          <p className="mt-3 text-xs text-stone-400">
            {faceResult === 'match' ? '✅ Your face was automatically verified against your ID.' : 'An admin will review your documents manually.'}
          </p>
          <Link href="/" className="btn-primary mt-6 inline-block">Back to home</Link>
        </div>
      </main>
    );
  }

  const inputClass = 'input w-full';
  const labelClass = 'block text-sm font-medium text-stone-700 mt-4';

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-brand-900">Become an artisan</h1>
      <p className="mt-2 text-sm text-stone-600">Sell your crafts and workshops. Verification keeps the marketplace authentic.</p>

      {/* Accidental Refresh Recovery Banner */}
      {draftRestored && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 p-3.5 border border-brand-200 text-xs text-brand-900">
          <div className="flex items-center gap-2">
            <span>📋</span>
            <span><b>Draft restored:</b> Your previous progress and uploaded photos were recovered.</span>
          </div>
          <button
            type="button"
            onClick={clearDraft}
            className="text-brand-700 underline font-medium hover:text-brand-900 ml-2 whitespace-nowrap"
          >
            Start fresh
          </button>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mt-6 flex items-center gap-2 text-xs">
        <span className={`badge ${step === 'details' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'}`}>1. Details & ID</span>
        <span className="text-stone-300">→</span>
        <span className={`badge ${step === 'verify' ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-400'}`}>2. Face & Crafts</span>
        <span className="text-stone-300">→</span>
        <span className={`badge ${step === 'done' ? 'bg-leaf-500 text-white' : 'bg-stone-100 text-stone-400'}`}>3. Submitted</span>
      </div>

      {step === 'details' && (
        <div className="card mt-6 p-6 space-y-6">
          {/* Automatic OCR ID Upload Section (Placed right up-front) */}
          <div className="rounded-xl border-2 border-brand-200 bg-brand-50/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">🪪</span>
                  <h2 className="font-semibold text-brand-900 text-sm">
                    Upload Government ID (Instant OCR Auto-Fill)
                  </h2>
                </div>
                <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                  Upload your Philippine ID (Driver&apos;s License, PhilSys, UMID, Postal ID, Passport) to automatically extract your Name, ID Number, Birthday, and Address into the fields below.
                </p>
              </div>
              <span className="badge bg-leaf-100 text-leaf-800 text-[10px] uppercase font-bold shrink-0">
                Fast OCR
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Front ID */}
              <div className="rounded-lg border-2 border-dashed border-brand-300 bg-white p-3 text-center transition hover:border-brand-500">
                {idFrontPreview ? (
                  <div>
                    <img src={idFrontPreview} alt="ID Front" className="mx-auto h-20 rounded object-cover" />
                    <p className="mt-1 text-[11px] font-semibold text-leaf-700">✓ Front Attached</p>
                    <button
                      type="button"
                      className="mt-1 text-[11px] text-stone-400 underline hover:text-red-600"
                      onClick={() => { setIdFront(null); setIdFrontPreview(''); if (frontRef.current) frontRef.current.value = ''; }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="py-2 text-2xl">🪪</div>
                    <button
                      type="button"
                      className="btn-outline w-full text-xs py-1.5"
                      onClick={() => frontRef.current?.click()}
                    >
                      Upload ID Front
                    </button>
                  </div>
                )}
                <input
                  ref={frontRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleIdUpload(f, 'front');
                  }}
                />
              </div>

              {/* Back ID */}
              <div className="rounded-lg border-2 border-dashed border-stone-200 bg-white p-3 text-center transition hover:border-stone-400">
                {idBackPreview ? (
                  <div>
                    <img src={idBackPreview} alt="ID Back" className="mx-auto h-20 rounded object-cover" />
                    <p className="mt-1 text-[11px] font-semibold text-leaf-700">✓ Back Attached</p>
                    <button
                      type="button"
                      className="mt-1 text-[11px] text-stone-400 underline hover:text-red-600"
                      onClick={() => { setIdBack(null); setIdBackPreview(''); if (backRef.current) backRef.current.value = ''; }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="py-2 text-2xl">🪪</div>
                    <button
                      type="button"
                      className="btn-outline w-full text-xs py-1.5"
                      onClick={() => backRef.current?.click()}
                    >
                      Upload ID Back
                    </button>
                  </div>
                )}
                <input
                  ref={backRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleIdUpload(f, 'back');
                  }}
                />
              </div>
            </div>

            {/* OCR Live Status */}
            {ocrBusy && (
              <div className="flex items-center gap-2 text-xs text-brand-700 bg-white p-2.5 rounded-lg border border-brand-200">
                <span className="animate-spin text-sm">⏳</span>
                <span>{ocrHint || 'Reading ID details with OCR…'}</span>
              </div>
            )}
            {!ocrBusy && ocrHint && (
              <p className="text-xs text-leaf-700 font-medium bg-leaf-50 p-2.5 rounded-lg border border-leaf-200">
                {ocrHint}
              </p>
            )}
          </div>

          {/* Editable Details Form */}
          <form onSubmit={submitDetails}>
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">
                Personal & Craft Information
              </h2>
              <span className="text-xs text-stone-400">All fields are editable</span>
            </div>

            <div>
              <label className={labelClass} htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                required
                className={inputClass}
                placeholder="Juan Dela Cruz"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="id_number">Government ID Number</label>
                <input
                  id="id_number"
                  type="text"
                  className={inputClass}
                  placeholder="e.g. 1234-5678-9012"
                  value={form.id_number}
                  onChange={(e) => set('id_number', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="dob">Date of Birth</label>
                <input
                  id="dob"
                  type="date"
                  className={inputClass}
                  value={form.dob}
                  onChange={(e) => set('dob', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  required
                  className={inputClass}
                  placeholder="artisan@example.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  required
                  className={inputClass}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="phone">Philippine Mobile Number (09XX…)</label>
                <input
                  id="phone"
                  type="tel"
                  className={inputClass}
                  placeholder="09171234567"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="location">Location / Municipality</label>
                <input
                  id="location"
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Bunawan, Agusan del Sur"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="craft_type">Craft Specialization (e.g. Weaving, Beadwork)</label>
                <input
                  id="craft_type"
                  type="text"
                  className={inputClass}
                  placeholder="Traditional Uway Basket Weaving"
                  value={form.craft_type}
                  onChange={(e) => set('craft_type', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="business_name">Shop / Workshop Name (Optional)</label>
                <input
                  id="business_name"
                  type="text"
                  className={inputClass}
                  placeholder="Simulao Indigenous Crafts"
                  value={form.business_name}
                  onChange={(e) => set('business_name', e.target.value)}
                />
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

            <button className="btn-primary mt-6 w-full py-3 font-bold" disabled={busy} type="submit">
              {busy ? 'Validating details…' : 'Continue to Live Selfie & Craft Verification →'}
            </button>
          </form>
        </div>
      )}

      {step === 'verify' && (
        <form onSubmit={finalSubmit} className="card mt-6 p-6 space-y-6">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

          {/* ID Summary Check */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-stone-800">1. Government ID Verification</h2>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-xs text-brand-600 hover:underline"
              >
                ← Edit details or change ID
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-2 text-center">
                {idFrontPreview ? (
                  <div>
                    <img src={idFrontPreview} alt="ID Front" className="mx-auto h-20 rounded object-cover" />
                    <p className="mt-1 text-xs text-leaf-700 font-medium">✓ Front attached</p>
                  </div>
                ) : (
                  <button type="button" className="btn-outline w-full text-xs py-2 mt-4" onClick={() => setStep('details')}>
                    Upload Front ID
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-2 text-center">
                {idBackPreview ? (
                  <div>
                    <img src={idBackPreview} alt="ID Back" className="mx-auto h-20 rounded object-cover" />
                    <p className="mt-1 text-xs text-leaf-700 font-medium">✓ Back attached</p>
                  </div>
                ) : (
                  <button type="button" className="btn-outline w-full text-xs py-2 mt-4" onClick={() => setStep('details')}>
                    Upload Back ID
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Live Selfie */}
          <div className="border-t border-stone-200 pt-5">
            <h2 className="font-semibold text-stone-800">2. Live Selfie (Face Verification)</h2>
            <p className="mt-1 text-xs text-stone-500">
              Look directly into the camera in good lighting. Face verification is automatically checked against your ID.
            </p>

            <div className="mt-3 rounded-xl border-2 border-dashed border-stone-200 p-4 text-center">
              {selfiePreview ? (
                <div>
                  <img src={selfiePreview} alt="Selfie" className="mx-auto h-32 rounded object-cover" />
                  <p className="mt-1 text-xs text-leaf-700 font-medium">
                    {faceResult === 'match' && '✅ Face matched your ID!'}
                    {faceResult === 'mismatch' && '⚠️ Did not match — submit anyway for manual admin review or retake'}
                    {faceResult === 'idle' && '✓ Selfie captured'}
                    {faceResult === 'matching' && 'Matching with ID…'}
                  </p>
                  <button
                    type="button"
                    className="mt-1 text-xs text-stone-400 underline hover:text-stone-700"
                    onClick={() => { setSelfie(null); setSelfiePreview(''); setFaceResult('idle'); }}
                  >
                    Retake selfie
                  </button>
                </div>
              ) : camOn ? (
                <div>
                  <video ref={videoRef} className="mx-auto h-44 rounded-lg object-cover" muted playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="mt-3 flex justify-center gap-2">
                    <button type="button" className="btn-primary" onClick={() => captureSelfie(Boolean(idFront))}>
                      📸 Capture Photo
                    </button>
                    <button type="button" className="btn-outline text-xs" onClick={stopCamera}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="py-2 text-3xl">🤳</div>
                  <button type="button" className="btn-primary" onClick={startCamera}>
                    Open Camera
                  </button>
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn-outline text-xs"
                      onClick={() => selfieFileRef.current?.click()}
                    >
                      Or upload selfie file
                    </button>
                  </div>
                  <input
                    ref={selfieFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const compressed = await compressImage(f, 800, 800, 0.85);
                        const dataUrl = await fileToDataUrl(compressed);
                        setSelfie(compressed);
                        setSelfiePreview(dataUrl);
                        setFaceResult('idle');
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Proof of Craft Production */}
          <div className="border-t border-stone-200 pt-5">
            <h2 className="font-semibold text-stone-800">3. Proof of Craft Production & Samples</h2>
            <p className="mt-1 text-xs text-stone-500">
              Attach a photo of you crafting/workshop tools and 2 samples of your authentic products.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {([
                ['proof', proofRef, proofCraft, setProofCraft, proofPreview, setProofPreview, '🛠️', 'Proof of Making'],
                ['sample1', s1Ref, sample1, setSample1, s1Preview, setS1Preview, '🧺', 'Product Sample 1'],
                ['sample2', s2Ref, sample2, setSample2, s2Preview, setS2Preview, '🏺', 'Product Sample 2'],
              ] as const).map(([side, ref, file, setFile, preview, setPreview, icon, label]) => (
                <div key={side} className="rounded-xl border-2 border-dashed border-stone-200 p-2 text-center">
                  {preview ? (
                    <div>
                      <img src={preview} alt={label} className="mx-auto h-16 rounded object-cover" />
                      <p className="mt-1 text-xs text-leaf-700 font-semibold">✓</p>
                      <button
                        type="button"
                        className="text-[11px] text-stone-400 underline hover:text-red-600"
                        onClick={() => { setFile(null); setPreview(''); if (ref.current) ref.current.value = ''; }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="py-1 text-2xl">{icon}</div>
                      <button
                        type="button"
                        className="btn-outline w-full text-[11px] py-1 px-1"
                        onClick={() => ref.current?.click()}
                      >
                        {label}
                      </button>
                    </div>
                  )}
                  <input
                    ref={ref}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const compressed = await compressImage(f, 1200, 1200, 0.8);
                        const dataUrl = await fileToDataUrl(compressed);
                        setFile(compressed);
                        setPreview(dataUrl);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-200 pt-5">
            <button
              className="btn-primary w-full py-3 text-base font-bold shadow-md"
              disabled={busy || !idFront || !idBack || !selfie || !proofCraft || !sample1 || !sample2}
              type="submit"
            >
              {busy ? 'Submitting application… ⚡' : 'Submit Artisan Application →'}
            </button>
            <p className="mt-2 text-center text-xs text-stone-400">
              Optimized for fast processing. Your photos and progress are automatically saved if refreshed.
            </p>
          </div>
        </form>
      )}
    </main>
  );
}
