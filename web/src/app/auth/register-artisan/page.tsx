'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

type Step = 'details' | 'verify' | 'done';

export default function ArtisanRegisterPage() {
  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', location: '', craft_type: '', business_name: '', id_number: '', dob: '',
  });
  const [services, setServices] = useState({ ocr: false, face: false, storage: false });
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrHint, setOcrHint] = useState('');
  const [faceResult, setFaceResult] = useState<'idle' | 'matching' | 'match' | 'mismatch'>('idle');

  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [proofCraft, setProofCraft] = useState<File | null>(null);
  const [sample1, setSample1] = useState<File | null>(null);
 const [sample2, setSample2] = useState<File | null>(null);
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

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    const res = await fetch('/api/auth/register-artisan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (data.status === 'success') {
      setToken(data.token);
      setServices(data.services ?? { ocr: false, face: false, storage: false });
      setStep('verify');
    } else setError(data.message || 'Registration failed.');
  }

  async function runOcr(file: File, side: 'front' | 'back') {
    if (!services.ocr) return;
    setOcrBusy(true); setOcrHint('');
    try {
      const fd = new FormData();
      fd.append('id_image', file);
      fd.append('side', side);
      fd.append('email', form.email);
      const res = await fetch('/api/auth/ocr-id', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.status === 'ok' && data.fields) {
        const f = data.fields;
        setForm((prev) => ({
          ...prev,
          id_number: prev.id_number || f.id_number || '',
          dob: prev.dob || f.dob || '',
        }));
        setOcrHint(`Auto-filled from ID: ${[f.id_number && `ID #${f.id_number}`, f.dob && `DOB ${f.dob}`].filter(Boolean).join(', ') || 'text read but no key fields found'}`);
      } else if (data.status === 'error') {
        setOcrHint(`Couldn't auto-read the ID (${data.message}). You can still continue — the fields below are optional.`);
      } else {
        setOcrHint('');
      }
    } catch {
      // Network drop / dev-server reload — never leave the UI stuck on "Reading ID…"
      setOcrHint("Couldn't reach the ID-reading service. You can still continue — the fields below are optional.");
    } finally {
      setOcrBusy(false);
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
    setSelfie(file);
    stopCamera();

    if (matchAgainstId && idFront) {
      setFaceResult('matching');
      const fd = new FormData();
      fd.append('id_image', idFront);
      fd.append('selfie', file);
      const res = await fetch('/api/auth/face-preview', { method: 'POST', body: fd });
      const data = await res.json();
      setFaceResult(data.match ? 'match' : 'mismatch');
    }
  }

  async function finalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('token', token);
      if (idFront) fd.append('id_front', idFront);
      if (idBack) fd.append('id_back', idBack);
      if (selfie) fd.append('selfie', selfie);
      if (proofCraft) fd.append('proof_of_craft', proofCraft);
      if (sample1) fd.append('product_sample_1', sample1);
      if (sample2) fd.append('product_sample_2', sample2);
      const res = await fetch('/api/auth/register-artisan/captures', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.status === 'success') {
        setDone(true);
        setStep('done');
      } else setError(data.message || 'Registration failed.');
    } catch {
      // Uploading + reading your ID can take up to ~30s; a dropped connection
      // or dev-server reload previously looked like the page silently dying.
      setError('The connection dropped while submitting. Please press Submit again — your photos are still attached.');
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

  const input = 'input w-full';
  const label = 'block text-sm font-medium text-stone-700 mt-4';

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-brand-900">Become an artisan</h1>
      <p className="mt-2 text-sm text-stone-600">Sell your crafts and workshops. Verification keeps the marketplace authentic.</p>

      <div className="mt-6 flex items-center gap-2 text-xs">
        <span className={`badge ${step === 'details' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'}`}>1. Details</span>
        <span className="text-stone-300">→</span>
        <span className={`badge ${step === 'verify' ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-400'}`}>2. ID & face</span>
        <span className="text-stone-300">→</span>
        <span className={`badge ${step === 'done' ? 'bg-leaf-500 text-white' : 'bg-stone-100 text-stone-400'}`}>3. Submitted</span>
      </div>

      {step === 'details' && (
        <form onSubmit={submitDetails} className="card mt-6 p-6">
          {[
            ['name', 'Full name', 'text', true],
            ['email', 'Email', 'email', true],
            ['password', 'Password', 'password', true],
            ['phone', 'Phone (09XX…)', 'tel', false],
            ['location', 'Location', 'text', false],
            ['craft_type', 'Craft type (e.g. weaving)', 'text', false],
            ['business_name', 'Business / shop name (optional)', 'text', false],
            ['id_number', 'Government ID number', 'text', false],
            ['dob', 'Date of birth', 'date', false],
          ].map(([k, l, t, req]) => (
            <div key={k as string}>
              <label className={label} htmlFor={k as string}>{l as string}</label>
              <input
                id={k as string}
                type={t as string}
                required={req as boolean}
                className={input}
                value={form[k as keyof typeof form]}
                onChange={(e) => set(k as keyof typeof form, e.target.value)}
              />
            </div>
          ))}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <button className="btn-primary mt-6 w-full" disabled={busy} type="submit">
            {busy ? 'Checking…' : 'Continue to ID & face verification'}
          </button>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={finalSubmit} className="card mt-6 p-6">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <h2 className="font-semibold text-stone-800">Government ID</h2>
          <p className="mt-1 text-xs text-stone-500">Photograph or scan both sides. Clear, well-lit, all corners visible.</p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {([['front', frontRef, idFront, setIdFront], ['back', backRef, idBack, setIdBack]] as const).map(([side, ref, file, setFile]) => (
              <div key={side} className="rounded-xl border-2 border-dashed border-stone-200 p-3 text-center">
                {file ? (
                  <div>
                    <img src={URL.createObjectURL(file)} alt={`ID ${side}`} className="mx-auto h-24 rounded object-cover" />
                    <p className="mt-1 text-xs text-leaf-700">✓ {side === 'front' ? 'Front' : 'Back'} attached</p>
                    <button type="button" className="mt-1 text-xs text-stone-400 underline" onClick={() => { setFile(null); if (ref.current) ref.current.value = ''; }}>Remove</button>
                  </div>
                ) : (
                  <div>
                    <div className="py-4 text-3xl">{side === 'front' ? '🪪' : '🪪'}</div>
                    <button type="button" className="btn-outline w-full text-sm" onClick={() => ref.current?.click()}>
                      Upload {side}
                    </button>
                  </div>
                )}
                <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    if (f && side === 'front') runOcr(f, side);
                  }} />
              </div>
            ))}
          </div>
          {ocrBusy && <p className="mt-2 text-xs text-stone-500">Reading ID…</p>}
          {ocrHint && <p className="mt-2 text-xs text-brand-700">{ocrHint}</p>}

          <h2 className="mt-6 font-semibold text-stone-800">Live selfie</h2>
          <p className="mt-1 text-xs text-stone-500">
            {services.face
              ? 'We compare your selfie with your ID photo automatically.'
              : 'Used by admins for manual verification (automatic comparison not configured).'}
          </p>

          <div className="mt-3 rounded-xl border-2 border-dashed border-stone-200 p-4 text-center">
            {selfie ? (
              <div>
                <img src={URL.createObjectURL(selfie)} alt="Selfie" className="mx-auto h-32 rounded object-cover" />
                <p className="mt-1 text-xs text-leaf-700">
                  {faceResult === 'match' && '✅ Face matched your ID'}
                  {faceResult === 'mismatch' && '⚠️ Did not match — submit anyway or retake'}
                  {faceResult === 'idle' && '✓ Selfie captured'}
                  {faceResult === 'matching' && 'Checking…'}
                </p>
                <button type="button" className="mt-1 text-xs text-stone-400 underline" onClick={() => { setSelfie(null); setFaceResult('idle'); }}>Retake</button>
              </div>
            ) : camOn ? (
              <div>
                <video ref={videoRef} className="mx-auto h-44 rounded-lg object-cover" muted playsInline />
                <button type="button" className="btn-primary mt-2" onClick={() => captureSelfie(Boolean(idFront))}>📸 Capture</button>
                <button type="button" className="ml-2 text-xs text-stone-400 underline" onClick={stopCamera}>Cancel</button>
              </div>
            ) : (
              <div>
                <div className="py-3 text-3xl">🤳</div>
                <button type="button" className="btn-primary" onClick={startCamera}>Open camera</button>
                <button type="button" className="btn-outline mt-2 w-full text-sm" onClick={() => selfieFileRef.current?.click()}>Upload selfie file instead</button>
                <input ref={selfieFileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f) { setSelfie(f); setFaceResult('idle'); } }} />
              </div>
            )}
          </div>

          <h2 className="mt-6 font-semibold text-stone-800">Proof of craft production</h2>
          <p className="mt-1 text-xs text-stone-500">
            A photo of you making your craft, your workshop, or your tools — evidence that you produce what you sell.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {([['proof', proofRef, proofCraft, setProofCraft, '🛠️', 'Proof'], ['sample1', s1Ref, sample1, setSample1, '🧺', 'Sample 1'], ['sample2', s2Ref, sample2, setSample2, '🏺', 'Sample 2']] as const).map(([side, ref, file, setFile, icon, label]) => (
              <div key={side} className="rounded-xl border-2 border-dashed border-stone-200 p-2 text-center">
                {file ? (
                  <div>
                    <img src={URL.createObjectURL(file)} alt={label} className="mx-auto h-16 rounded object-cover" />
                    <p className="mt-1 text-xs text-leaf-700">✓</p>
                    <button type="button" className="text-xs text-stone-400 underline" onClick={() => { setFile(null); if (ref.current) ref.current.value = ''; }}>Remove</button>
                  </div>
                ) : (
                  <div>
                    <div className="py-2 text-2xl">{icon}</div>
                    <button type="button" className="btn-outline w-full text-xs" onClick={() => ref.current?.click()}>
                      {label}
                    </button>
                  </div>
                )}
                <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); }} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-400">
            Required for verification: 2 different product samples you made. Admins review these before approval.
          </p>

          <button className="btn-primary mt-6 w-full" disabled={busy || !idFront || !idBack || !selfie || !proofCraft || !sample1 || !sample2} type="submit">
            {busy ? 'Reading your ID & checking your selfie… (up to ~30s)' : 'Submit application'}
          </button>
          <p className="mt-2 text-center text-xs text-stone-400">Images up to 8 MB each (JPEG/PNG).</p>
        </form>
      )}
    </main>
  );
}
