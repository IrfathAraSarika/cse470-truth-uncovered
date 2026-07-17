import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogoIcon, ShieldIcon } from '../components/AppIcons';
import { getMyVerification, submitMyVerification, type VerificationStatus } from '../services/verificationApi';

interface StoredUser { name: string; email: string; role: string }
function readStoredUser(): StoredUser | null {
  try { return JSON.parse(localStorage.getItem('user') ?? 'null'); } catch { return null; }
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const STATUS_META: Record<string, { label: string; className: string; description: string }> = {
  not_submitted: {
    label: 'Not Verified',
    className: 'text-on-surface/70 bg-white/5 border-white/15',
    description: 'You have not submitted your NID for verification yet.',
  },
  pending: {
    label: 'Pending Review',
    className: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    description: 'Your NID has been submitted and is awaiting an admin review.',
  },
  verified: {
    label: 'Verified',
    className: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    description: 'Your identity has been verified. A verified badge now appears on your dashboard.',
  },
  rejected: {
    label: 'Rejected',
    className: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
    description: 'Your verification request was rejected. You can review the reason below and submit again.',
  },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function VerificationPage() {
  const navigate = useNavigate();
  const user = readStoredUser();

  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    getMyVerification()
      .then((data) => { setVerification(data); setError(''); })
      .catch((requestError) => {
        if (requestError instanceof Error && /Authentication|Session/.test(requestError.message)) navigate('/login', { replace: true });
        else setError(requestError instanceof Error ? requestError.message : 'Could not load your verification status.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'citizen') return <Navigate to="/dashboard" replace />;

  const onSelectPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose an image file (JPG or PNG).'); return; }
    if (file.size > MAX_FILE_BYTES) { setError('The image is too large. Please choose a file under 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setPhoto(String(reader.result)); setPhotoName(file.name); };
    reader.onerror = () => setError('Could not read the selected file.');
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (nidNumber.trim().length < 6) { setError('Enter a valid NID number.'); return; }
    if (!photo) { setError('Upload a photo of your NID.'); return; }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await submitMyVerification(nidNumber.trim(), photo);
      setNidNumber('');
      setPhoto('');
      setPhotoName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setNotice('Your NID has been submitted for verification.');
      load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not submit your verification request.');
    } finally {
      setSaving(false);
    }
  };

  const status = verification?.status ?? 'not_submitted';
  const meta = STATUS_META[status] ?? STATUS_META.not_submitted;
  const canSubmit = status === 'not_submitted' || status === 'rejected';

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface font-inter">
      <header className="border-b border-white/10 bg-bg-dark/95">
        <div className="max-w-[1000px] mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><LogoIcon /><span className="font-sora font-bold">Truth Uncovered</span></Link>
          <Link to="/dashboard" className="px-4 py-2 text-xs font-bold border border-white/10 rounded-lg hover:border-brand-teal/40 text-on-surface/60 hover:text-brand-teal transition-colors">Dashboard</Link>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-6 py-14">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center">
            <ShieldIcon className="w-5 h-5 text-brand-teal" />
          </div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-white">Account Verification</h1>
        </div>
        <p className="text-sm text-on-surface/50 ml-[52px]">Verify your identity with your National ID to earn a verified badge.</p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-on-surface/50">Loading your verification status…</p>
          </div>
        ) : (
          <>
            {/* Status card */}
            <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="font-sora text-lg font-bold text-white">Verification Status</h2>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${meta.className}`}>
                  {status === 'verified' && <ShieldIcon className="w-3.5 h-3.5" />}
                  {meta.label}
                </span>
              </div>
              <p className="text-sm text-on-surface/60 mt-3">{meta.description}</p>

              {verification && status !== 'not_submitted' && (
                <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                    <p className="uppercase text-on-surface/40">Submitted</p>
                    <p className="text-on-surface/80 mt-1">{formatDate(verification.submitted_at)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                    <p className="uppercase text-on-surface/40">Reviewed</p>
                    <p className="text-on-surface/80 mt-1">{formatDate(verification.reviewed_at)}</p>
                  </div>
                </div>
              )}

              {status === 'rejected' && verification?.notes && (
                <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/5 px-4 py-3">
                  <p className="text-xs font-bold uppercase text-rose-400">Reason for rejection</p>
                  <p className="text-sm text-on-surface/80 mt-1">{verification.notes}</p>
                </div>
              )}
            </section>

            {notice && (
              <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-5 py-4 text-sm text-emerald-400">
                {notice}
              </div>
            )}

            {/* Submission form */}
            {canSubmit ? (
              <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="font-sora text-lg font-bold text-white mb-1">
                  {status === 'rejected' ? 'Re-submit Your NID' : 'Submit Your NID'}
                </h2>
                <p className="text-sm text-on-surface/50 mb-5">Provide your National ID number and a clear photo of your NID card.</p>

                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface/50 mb-2">NID Number</label>
                <input
                  value={nidNumber}
                  onChange={(event) => setNidNumber(event.target.value)}
                  placeholder="e.g. 1990123456789"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-brand-teal/40 mb-5"
                />

                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface/50 mb-2">NID Photo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onSelectPhoto}
                  className="block w-full text-sm text-on-surface/60 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-teal/10 file:text-brand-teal hover:file:bg-brand-teal/20"
                />
                {photo && (
                  <div className="mt-4">
                    <p className="text-xs text-on-surface/50 mb-2">Preview: {photoName}</p>
                    <img src={photo} alt="NID preview" className="max-h-56 rounded-lg border border-white/10" />
                  </div>
                )}

                {error && <p className="text-xs text-brand-red mt-4">{error}</p>}

                <button
                  disabled={saving}
                  onClick={submit}
                  className="mt-5 px-6 py-3 bg-brand-teal text-black rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {saving ? 'Submitting…' : status === 'rejected' ? 'Re-submit for Verification' : 'Submit for Verification'}
                </button>
              </section>
            ) : (
              error && <p className="text-xs text-brand-red mt-4">{error}</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
