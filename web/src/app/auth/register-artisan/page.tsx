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

  const [faceResult, setFaceResult] = useState<'idle' | 'matching' | 'match' | 'mismatch' | 'no_face' | 'manual_review'>('idle');
  const [faceMessage, setFaceMessage] = useState<string>('');

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
  const [camReady, setCamReady] = useState(false);
  const [camFacing, setCamFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string>('');

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
        if (selfie) {
          void triggerFaceMatch(selfie, compressed);
        }
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

  // Ensure the live video element receives the MediaStream as soon as it mounts
  useEffect(() => {
    let isCancelled = false;

    if (camOn && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;

      const markReady = () => {
        if (!isCancelled) setCamReady(true);
      };

      video.addEventListener('playing', markReady);
      video.addEventListener('canplay', markReady);
      video.addEventListener('loadedmetadata', markReady);

      video.play().then(() => {
        markReady();
      }).catch((err) => {
        console.warn('Video play warning:', err);
      });

      return () => {
        isCancelled = true;
        video.removeEventListener('playing', markReady);
        video.removeEventListener('canplay', markReady);
        video.removeEventListener('loadedmetadata', markReady);
      };
    } else if (!camOn) {
      setCamReady(false);
    }
  }, [camOn]);

  // Clean up media tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  async function startCamera(facing?: 'user' | 'environment') {
    const targetFacing: 'user' | 'environment' =
      facing === 'user' || facing === 'environment' ? facing : camFacing;
    setError('');
    setCameraError('');
    setCamReady(false);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support live camera access. Please upload a selfie file instead.');
      }

      let stream: MediaStream;
      try {
        // First try with desired facing mode & ideal resolution
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: targetFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback: generic video constraint for webcams that reject facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCamFacing(targetFacing);
      setCamOn(true);

      // If video ref is already mounted in the DOM, attach immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
          setCamReady(true);
        }).catch(() => {});
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      stopCamera();
      const msg = err instanceof Error ? err.message : '';
      let formatted = 'Unable to access camera. Please check camera permissions or upload a selfie file.';
      if (msg.includes('Permission') || msg.includes('NotAllowedError') || msg.includes('PermissionDeniedError')) {
        formatted = 'Camera permission was blocked. Please grant camera access in your browser address bar or upload a selfie file.';
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFoundError')) {
        formatted = 'No camera device detected. Please attach a camera or upload a selfie file.';
      }
      setCameraError(formatted);
      setError(formatted);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCamOn(false);
    setCamReady(false);
  }

  function flipCamera() {
    const nextFacing = camFacing === 'user' ? 'environment' : 'user';
    void startCamera(nextFacing);
  }

  async function triggerFaceMatch(file: File, idFrontFile: File | null = idFront) {
    if (!idFrontFile) {
      setFaceResult('idle');
      setFaceMessage('✓ Selfie captured. (Attach ID front to compare with face.)');
      return;
    }

    setFaceResult('matching');
    setFaceMessage('🔍 Analyzing face and comparing with ID photo…');

    try {
      const fd = new FormData();
      fd.append('id_image', idFrontFile);
      fd.append('selfie', file);
      const res = await fetch('/api/auth/face-preview', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.skipped) {
        setFaceResult('manual_review');
        setFaceMessage(data.message || 'ℹ️ Automated face service unavailable. Your photo will be manually verified by admin.');
      } else if (data.no_face) {
        setFaceResult('no_face');
        setFaceMessage(data.message || '⚠️ No face detected in the photo. Please look directly at the camera with clear lighting.');
      } else if (data.match) {
        setFaceResult('match');
        setFaceMessage(data.message || '✅ Face matched your ID photo!');
      } else {
        setFaceResult('mismatch');
        setFaceMessage(data.message || '⚠️ Face did not match ID photo. You may retake or proceed with manual admin verification.');
      }
    } catch {
      setFaceResult('manual_review');
      setFaceMessage('ℹ️ Automatic face check could not complete. Photo saved for manual admin review.');
    }
  }

  async function captureSelfie(matchAgainstId: boolean) {
    setError('');
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera is not ready yet. Please wait a moment.');
      return;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      setError('Camera feed is still loading. Please wait for the live video to appear.');
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Sanity check: Ensure the captured frame is not pitch black / blank
    const sample = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
    let sumBrightness = 0;
    for (let i = 0; i < sample.data.length; i += 4) {
      sumBrightness += sample.data[i] + sample.data[i + 1] + sample.data[i + 2];
    }
    const avgBrightness = sumBrightness / ((sample.data.length / 4) * 3);
    if (avgBrightness < 3) {
      setError('Captured photo appears completely dark or blank. Please check camera lens/lighting and try again.');
      return;
    }

    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.92));
    if (!blob) {
      setError('Failed to capture photo. Please try again.');
      return;
    }

    const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
    const dataUrl = await fileToDataUrl(file);
    setSelfie(file);
    setSelfiePreview(dataUrl);
    stopCamera();

    if (matchAgainstId && idFront) {
      await triggerFaceMatch(file);
    } else {
      setFaceResult('idle');
      setFaceMessage('✓ Selfie captured.');
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
      <div className="mb-2">
        <Link href="/" className="text-xs font-semibold text-stone-500 hover:text-crimson-700">
          ← Return to Storefront
        </Link>
      </div>

      <h1 className="font-sculpted text-3xl font-bold text-charcoal-900">
        Enroll as a Master Artisan
      </h1>
      <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
        Join the cultural custodians of Agusan del Sur. Showcase your living heritage, traditional weaves, and hands-on workshops with patrons worldwide.
      </p>

      {/* Accidental Refresh Recovery Banner */}
      {draftRestored && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-ochre-50 p-3.5 border border-ochre-200 text-xs text-charcoal-900">
          <div className="flex items-center gap-2">
            <span>📋</span>
            <span><b>Draft restored:</b> Your previous progress and uploaded photos were recovered.</span>
          </div>
          <button
            type="button"
            onClick={clearDraft}
            className="text-ochre-800 underline font-semibold hover:text-crimson-700 ml-2 whitespace-nowrap"
          >
            Start fresh
          </button>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mt-6 flex items-center gap-2 text-xs">
        <span className={`badge ${step === 'details' ? 'bg-crimson-600 text-white font-bold' : 'bg-ochre-100 text-ochre-800'}`}>
          1. Lineage & ID
        </span>
        <span className="text-stone-300">→</span>
        <span className={`badge ${step === 'verify' ? 'bg-crimson-600 text-white font-bold' : 'bg-stone-100 text-stone-400'}`}>
          2. Biometrics & Craft
        </span>
        <span className="text-stone-300">→</span>
        <span className={`badge ${step === 'done' ? 'bg-ochre-700 text-white font-bold' : 'bg-stone-100 text-stone-400'}`}>
          3. Curated Review
        </span>
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
              <span className="badge bg-ochre-100 text-ochre-900 border border-ochre-300 text-[10px] uppercase font-bold shrink-0">
                Fast OCR
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Front ID */}
              <div className="rounded-lg border-2 border-dashed border-brand-300 bg-white p-3 text-center transition hover:border-brand-500">
                {idFrontPreview ? (
                  <div>
                    <img src={idFrontPreview} alt="ID Front" className="mx-auto h-20 rounded object-cover" />
                    <p className="mt-1 text-[11px] font-semibold text-ochre-800">✓ Front Attached</p>
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
                    <p className="mt-1 text-[11px] font-semibold text-ochre-800">✓ Back Attached</p>
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
              <p className="text-xs text-ochre-800 font-semibold bg-ochre-50 p-2.5 rounded-lg border border-ochre-200">
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
                    <p className="mt-1 text-xs text-ochre-800 font-semibold">✓ Front attached</p>
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
                    <p className="mt-1 text-xs text-ochre-800 font-semibold">✓ Back attached</p>
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
                <div className="space-y-3">
                  <div className="relative mx-auto w-36 h-36 rounded-2xl overflow-hidden border-2 border-stone-200 shadow-sm bg-stone-100">
                    <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
                  </div>

                  {/* Status badge */}
                  <div className="mx-auto max-w-sm rounded-xl text-xs text-left">
                    {faceResult === 'matching' && (
                      <div className="flex items-center gap-2.5 text-primary-700 bg-primary-50 border border-primary-200 p-3 rounded-xl">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600 shrink-0" />
                        <span>{faceMessage || 'Matching with ID photo…'}</span>
                      </div>
                    )}
                    {faceResult === 'match' && (
                      <div className="flex items-start gap-2.5 text-charcoal-900 bg-ochre-50 border border-ochre-300 p-3 rounded-xl">
                        <span className="text-base leading-none">✅</span>
                        <div>
                          <p className="font-semibold">Face matched your ID!</p>
                          <p className="text-[11px] text-ochre-800 mt-0.5">{faceMessage || 'Biometric verification passed successfully.'}</p>
                        </div>
                      </div>
                    )}
                    {faceResult === 'mismatch' && (
                      <div className="flex items-start gap-2.5 text-charcoal-900 bg-ochre-50 border border-ochre-300 p-3 rounded-xl">
                        <span className="text-base leading-none">⚠️</span>
                        <div>
                          <p className="font-semibold">Face match score below threshold</p>
                          <p className="text-[11px] text-ochre-800 mt-0.5">{faceMessage || 'You can retake photo or submit anyway for manual admin review.'}</p>
                        </div>
                      </div>
                    )}
                    {faceResult === 'no_face' && (
                      <div className="flex items-start gap-2.5 text-charcoal-900 bg-ochre-50 border border-ochre-300 p-3 rounded-xl">
                        <span className="text-base leading-none">👤</span>
                        <div>
                          <p className="font-semibold">No face detected</p>
                          <p className="text-[11px] text-ochre-800 mt-0.5">{faceMessage || 'Please retake with your face clearly centered in good lighting.'}</p>
                        </div>
                      </div>
                    )}
                    {faceResult === 'manual_review' && (
                      <div className="flex items-start gap-2.5 text-stone-700 bg-stone-100 border border-stone-200 p-3 rounded-xl">
                        <span className="text-base leading-none">ℹ️</span>
                        <div>
                          <p className="font-semibold">Pending Admin Review</p>
                          <p className="text-[11px] text-stone-600 mt-0.5">{faceMessage || 'Selfie saved. An admin will review your photo during application approval.'}</p>
                        </div>
                      </div>
                    )}
                    {faceResult === 'idle' && (
                      <div className="text-center text-ochre-800 font-semibold py-1">
                        {faceMessage || '✓ Selfie captured'}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-medium underline"
                    onClick={() => {
                      setSelfie(null);
                      setSelfiePreview('');
                      setFaceResult('idle');
                      setFaceMessage('');
                    }}
                  >
                    Retake selfie
                  </button>
                </div>
              ) : camOn ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-sm aspect-[3/4] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-stone-900 shadow-lg border border-stone-700">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={() => setCamReady(true)}
                      onCanPlay={() => setCamReady(true)}
                      onPlaying={() => setCamReady(true)}
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Face oval alignment guide */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-4">
                      <div className="w-40 h-52 sm:w-44 sm:h-56 rounded-[50%] border-2 border-dashed border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                      <span className="mt-2 text-[11px] font-medium text-white/90 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                        Align your face inside oval
                      </span>
                    </div>

                    {/* Camera starting / loading indicator */}
                    {!camReady && (
                      <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center gap-2 text-white">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <p className="text-xs font-medium">Starting camera feed…</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={!camReady}
                      className="btn-primary text-xs py-2 px-4 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => captureSelfie(Boolean(idFront))}
                    >
                      📸 Capture Photo
                    </button>
                    <button
                      type="button"
                      className="btn-outline text-xs py-2 px-3"
                      onClick={flipCamera}
                      title="Flip camera"
                    >
                      🔄 Flip
                    </button>
                    <button
                      type="button"
                      className="btn-outline text-xs py-2 px-3 text-stone-500 hover:text-stone-800"
                      onClick={stopCamera}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl text-stone-600 mb-3">
                    🤳
                  </div>
                  <p className="text-xs text-stone-600 font-medium mb-3">
                    Take a quick selfie or upload a photo of your face
                  </p>

                  {cameraError && (
                    <div className="mx-auto mb-3 max-w-sm rounded-xl border border-ochre-300 bg-ochre-50 p-2.5 text-xs text-charcoal-900 text-left flex items-start gap-2">
                      <span className="text-sm shrink-0">⚠️</span>
                      <p className="leading-snug text-ochre-900">{cameraError}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      className="btn-primary text-xs py-2 px-4 shadow-sm"
                      onClick={() => void startCamera()}
                    >
                      📷 Open Camera
                    </button>
                    <button
                      type="button"
                      className="btn-outline text-xs py-2 px-3"
                      onClick={() => selfieFileRef.current?.click()}
                    >
                      📁 Upload File
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
                        if (idFront) {
                          await triggerFaceMatch(compressed);
                        } else {
                          setFaceResult('idle');
                          setFaceMessage('✓ Selfie attached. (Attach ID front to compare with face.)');
                        }
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
                      <p className="mt-1 text-xs text-ochre-800 font-bold">✓</p>
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
