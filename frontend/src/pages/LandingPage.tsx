import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogoIcon, ShieldIcon, LockIcon } from '../components/AppIcons';
import zkPadlock from '../assets/zk_padlock.png';
import { login, signup } from '../services/authApi';

interface MetadataItem {
  key: string;
  original: string;
  scrubbed: string;
  status: 'pending' | 'scrubbing' | 'scrubbed';
}

interface StoredUser {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

export default function LandingPage() {
  // Auth & Session State
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Auth Form State (for unauthenticated visitors)
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  
  // Login Form
  const [loginMode, setLoginMode] = useState<'citizen' | 'admin'>('citizen');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup Form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState('citizen');
  const [signupAffiliation, setSignupAffiliation] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  // Role feature filter: 'permitted' (default) or 'all'
  const [featureViewFilter, setFeatureViewFilter] = useState<'permitted' | 'all'>('permitted');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const data = await login(loginEmail, loginPassword);
      if (loginMode === 'admin' && data.user.role !== 'admin') {
        setLoginError('This account does not have admin privileges. Please switch to Citizen sign-in.');
        return;
      }
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.citizen) localStorage.setItem('citizen', JSON.stringify(data.citizen));
      setCurrentUser(data.user);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Sign-in failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    setSignupLoading(true);

    try {
      await signup(signupName, signupEmail, signupPassword, signupRole, signupAffiliation);
      try {
        const data = await login(signupEmail, signupPassword);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.citizen) localStorage.setItem('citizen', JSON.stringify(data.citizen));
        setCurrentUser(data.user);
      } catch {
        setSignupSuccess('Account created successfully! Please sign in with your credentials.');
        setAuthTab('login');
        setLoginEmail(signupEmail);
      }
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('citizen');
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
  };

  const fillDemoAdmin = () => {
    setLoginMode('admin');
    setLoginEmail('admin@truthuncovered.dev');
    setLoginPassword('admin1234');
    setLoginError('');
  };

  const roleLabel = (role: string) => {
    return role.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Simulator State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const [metadata, setMetadata] = useState<MetadataItem[]>([
    { key: 'Device Model', original: 'Apple iPhone 15 Pro Max', scrubbed: '•••••••••••••••••••••', status: 'pending' },
    { key: 'GPS Coordinates', original: '23.8103° N, 90.4125° E (Dhaka, Bangladesh)', scrubbed: '•••••••••••••••••••••••••••••••••••••', status: 'pending' },
    { key: 'Capture Timestamp', original: '2026-07-10 14:32:15 GMT+6', scrubbed: '•••••••••••••••••••••••••', status: 'pending' },
    { key: 'Camera Settings', original: 'f/1.78, 1/120s, ISO 80, 24mm', scrubbed: '••••••••••••••••••••••••••••', status: 'pending' },
    { key: 'Software Version', original: 'iOS 17.5.1 (21F90)', scrubbed: '•••••••••••••••••••', status: 'pending' },
    { key: 'Owner / Author', original: 'Sarika Aiman', scrubbed: '••••••••••••••••', status: 'pending' },
  ]);

  const simulationSteps = [
    'Parsing file header and extracting metadata streams...',
    'Locating EXIF, IPTC, and XMP data segments...',
    'Wiping GPS coordinates and geo-location tags...',
    'Scrubbing device manufacturer and camera profiles...',
    'Stripping timestamps and author identification...',
    'Applying local zero-knowledge encryption key...',
    'Generating decentralized hash digest for secure submission...',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      resetSimulator();
    }
  };

  const resetSimulator = () => {
    setIsSimulating(false);
    setProgress(0);
    setActiveStep(0);
    setShowResult(false);
    setMetadata(prev => prev.map(item => ({ ...item, status: 'pending' })));
  };

  const startSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setProgress(0);
    setActiveStep(0);
    setShowResult(false);
    
    // Reset metadata status
    setMetadata(prev => prev.map(item => ({ ...item, status: 'pending' })));
  };

  useEffect(() => {
    if (!isSimulating) return;

    const intervalTime = 40; // total duration approx 4 seconds
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(timer);
          setIsSimulating(false);
          setShowResult(true);
          setMetadata(prevMeta => prevMeta.map(item => ({ ...item, status: 'scrubbed' })));
          return 100;
        }

        // Update active step based on progress
        const stepIndex = Math.floor((next / 100) * simulationSteps.length);
        if (stepIndex !== activeStep && stepIndex < simulationSteps.length) {
          setActiveStep(stepIndex);
        }

        // Gradually scrub metadata items based on progress milestones
        const itemToScrubIndex = Math.floor((next / 100) * metadata.length);
        if (itemToScrubIndex >= 0 && itemToScrubIndex < metadata.length) {
          setMetadata(prevMeta => {
            return prevMeta.map((item, idx) => {
              if (idx < itemToScrubIndex) return { ...item, status: 'scrubbed' };
              if (idx === itemToScrubIndex) return { ...item, status: 'scrubbing' };
              return item;
            });
          });
        }

        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isSimulating, activeStep, metadata.length, simulationSteps.length]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#e5e2e1] font-sans antialiased selection:bg-[#ff5634]/30 selection:text-[#ffb4a4] flex flex-col justify-between overflow-x-hidden">
        {/* Background radial glow */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,86,52,0.1)_0%,transparent_70%)] rounded-full blur-[80px]" />
          <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,172,180,0.06)_0%,transparent_70%)] rounded-full blur-[80px]" />
        </div>

        {/* Top Navbar */}
        <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-md bg-[#080808]/70 sticky top-0">
          <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <LogoIcon />
              <span className="font-['Sora'] font-bold text-lg tracking-tight text-white">
                Truth <span className="text-[#ffb4a4]">Uncovered</span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Supabase Database Connected</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00ADB5] border border-[#00ADB5]/30 bg-[#00ADB5]/10 px-3 py-1 rounded-md">
                Role-Based Portal
              </span>
            </div>
          </div>
        </header>

        {/* Main Auth View */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg">
            
            {/* Header copy */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff5634]/10 border border-[#ff5634]/20 text-[#ffb4a4] text-xs font-bold tracking-widest uppercase mb-4">
                <span className="w-2 h-2 rounded-full bg-[#ff5634] animate-ping" />
                Secure Whistleblower & Authority Portal
              </div>
              <h1 className="font-['Sora'] text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Welcome to <span className="text-[#ffb4a4]">Truth Uncovered</span>
              </h1>
              <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                Sign in or create an account to access role-permitted whistleblowing and verification features.
              </p>
            </div>

            {/* Auth Card */}
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent shadow-2xl">
              <div className="rounded-2xl bg-[#121212]/90 backdrop-blur-2xl border border-white/[0.06] p-7 sm:p-9">
                
                {/* Switcher tabs */}
                <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-black/60 border border-white/10 mb-7">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setLoginError(''); setSignupSuccess(''); }}
                    className={`py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                      authTab === 'login'
                        ? 'bg-[#ff5634] text-white shadow-md shadow-[#ff5634]/20'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('signup'); setSignupError(''); setLoginError(''); }}
                    className={`py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                      authTab === 'signup'
                        ? 'bg-[#00ADB5] text-white shadow-md shadow-[#00ADB5]/20'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {signupSuccess && (
                  <div className="mb-5 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-medium">
                    {signupSuccess}
                  </div>
                )}

                {authTab === 'login' ? (
                  /* SIGN IN FORM */
                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    <div className="flex items-center justify-between gap-2 p-1 rounded-lg bg-black/40 border border-white/5 mb-4">
                      <button
                        type="button"
                        onClick={() => { setLoginMode('citizen'); setLoginError(''); }}
                        className={`flex-1 py-2 rounded text-xs font-bold uppercase transition-colors ${
                          loginMode === 'citizen'
                            ? 'bg-[#00ADB5]/20 text-[#00ADB5] border border-[#00ADB5]/40'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        Citizen Access
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLoginMode('admin'); setLoginError(''); }}
                        className={`flex-1 py-2 rounded text-xs font-bold uppercase transition-colors ${
                          loginMode === 'admin'
                            ? 'bg-[#ff5634]/20 text-[#ffb4a4] border border-[#ff5634]/40'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        Admin Access
                      </button>
                    </div>

                    {loginMode === 'admin' && (
                      <div className="p-3 rounded-lg bg-[#ff5634]/10 border border-[#ff5634]/20 flex items-center justify-between text-xs text-gray-300">
                        <div>
                          <p className="font-semibold text-white">Admin Demo Access</p>
                          <p className="text-[11px] text-gray-400">admin@truthuncovered.dev / admin1234</p>
                        </div>
                        <button
                          type="button"
                          onClick={fillDemoAdmin}
                          className="px-2.5 py-1 bg-[#ff5634] hover:bg-[#ff4320] text-white rounded text-[11px] font-bold transition-colors"
                        >
                          Auto Fill
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00ADB5]/60 transition-colors text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00ADB5]/60 transition-colors text-sm"
                      />
                    </div>

                    {loginError && (
                      <p className="text-xs text-[#ff5634] bg-[#ff5634]/10 border border-[#ff5634]/20 p-2.5 rounded text-center">
                        {loginError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3.5 bg-[#ff5634] hover:bg-[#ff4320] text-white font-bold rounded-lg text-sm transition-all shadow-lg shadow-[#ff5634]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loginLoading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <LockIcon className="w-4 h-4" />
                          {loginMode === 'admin' ? 'Sign In as Admin Authority' : 'Sign In as Citizen'}
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* SIGN UP FORM */
                  <form onSubmit={handleSignupSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                        Account Role
                      </label>
                      <select
                        value={signupRole}
                        onChange={(e) => setSignupRole(e.target.value)}
                        className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00ADB5]/60"
                      >
                        <option value="citizen">Citizen (Whistleblower)</option>
                        <option value="ngo_partner">NGO Partner</option>
                        <option value="government_officer">Government Officer</option>
                        <option value="admin">Admin Authority</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00ADB5]/60 text-sm"
                      />
                    </div>

                    {signupRole !== 'citizen' && (
                      <div>
                        <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                          {signupRole === 'ngo_partner' ? 'Organization Name' : signupRole === 'admin' ? 'Employee ID / Agency' : 'Department'}
                        </label>
                        <input
                          type="text"
                          value={signupAffiliation}
                          onChange={(e) => setSignupAffiliation(e.target.value)}
                          placeholder="Organization or department identifier"
                          required
                          className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00ADB5]/60 text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00ADB5]/60 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                          Password
                        </label>
                        <input
                          type="password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Min 8 chars"
                          required
                          minLength={8}
                          className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00ADB5]/60 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold tracking-wider uppercase text-gray-400 mb-1.5">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          placeholder="Re-type password"
                          required
                          className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00ADB5]/60 text-sm"
                        />
                      </div>
                    </div>

                    {signupError && (
                      <p className="text-xs text-[#ff5634] bg-[#ff5634]/10 border border-[#ff5634]/20 p-2.5 rounded text-center">
                        {signupError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={signupLoading}
                      className="w-full py-3.5 bg-[#00ADB5] hover:bg-[#009ca4] text-white font-bold rounded-lg text-sm transition-all shadow-lg shadow-[#00ADB5]/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                      {signupLoading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShieldIcon className="w-4 h-4" />
                          Create Account &amp; Enter Portal
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>
            </div>

            {/* Role Features Preview */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-400">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-2 font-bold text-[#ffb4a4] uppercase mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#ff5634]" />
                  Citizen Whistleblower
                </div>
                <p className="leading-relaxed text-gray-400">
                  Incident reports, encrypted evidence vault, anonymous burner token mode, and offline drafts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-2 font-bold text-[#00ADB5] uppercase mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#00ADB5]" />
                  Admin Authority
                </div>
                <p className="leading-relaxed text-gray-400">
                  Multi-admin report verification, AI duplicate detection, automated fraud quarantine, and oversight analytics.
                </p>
              </div>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] bg-[#0c0c0c] py-6 text-xs text-gray-500 text-center relative z-10">
          <p>© 2026 Truth Uncovered. Secure Whistleblowing &amp; Anti-Corruption Ecosystem in Bangladesh.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#e5e2e1] font-sans antialiased selection:bg-[#ff5634]/30 selection:text-[#ffb4a4] overflow-x-hidden">
      
      {/* Background radial gradient glow for atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,86,52,0.08)_0%,transparent_70%)] rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,172,180,0.05)_0%,transparent_70%)] rounded-full blur-[80px]" />
      </div>

      {/* Header / Navbar */}
      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-md bg-[#080808]/70 sticky top-0">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-['Sora'] font-bold text-lg tracking-tight text-white">
              Truth <span className="text-[#ffb4a4]">Uncovered</span>
            </span>
          </Link>

          {/* Role-Based Permitted Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-gray-400">
            {currentUser.role === 'admin' ? (
              <>
                <Link to="/admin/verification" className="hover:text-white transition-colors text-[#00ADB5]">Verifications</Link>
                <Link to="/admin/duplicate-detection" className="hover:text-white transition-colors">Duplicate Detection</Link>
                <Link to="/admin/fraud-moderation" className="hover:text-white transition-colors">Moderation</Link>
                <Link to="/flagged-items" className="hover:text-white transition-colors">Flag Watch</Link>
                <Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link>
                <Link to="/heatmap" className="hover:text-white transition-colors">Heat Map</Link>
                <Link to="/repository" className="hover:text-white transition-colors">Repository</Link>
                <Link to="/articles" className="hover:text-white transition-colors">Knowledge Hub</Link>
                <Link to="/impact-stories" className="hover:text-white transition-colors">Impact</Link>
              </>
            ) : currentUser.role === 'citizen' ? (
              <>
                <Link to="/submit-report" className="hover:text-white transition-colors text-[#ffb4a4]">Report Incident</Link>
                <Link to="/evidence-vault" className="hover:text-white transition-colors">Evidence Vault</Link>
                <Link to="/submit-anonymous" className="hover:text-white transition-colors">Anonymous Mode</Link>
                <Link to="/my-reports" className="hover:text-white transition-colors">My Reports</Link>
                <Link to="/case-tracker" className="hover:text-white transition-colors">Track Case</Link>
                <Link to="/offline-drafts" className="hover:text-white transition-colors">Offline Drafts</Link>
                <Link to="/flagged-items" className="hover:text-white transition-colors">Flag Watch</Link>
                <Link to="/articles" className="hover:text-white transition-colors">Knowledge Hub</Link>
                <Link to="/heatmap" className="hover:text-white transition-colors">Heat Map</Link>
                <Link to="/impact-stories" className="hover:text-white transition-colors">Impact</Link>
              </>
            ) : (
              <>
                <Link to="/articles" className="hover:text-white transition-colors text-[#00ADB5]">Knowledge Hub</Link>
                <Link to="/case-tracker" className="hover:text-white transition-colors">Track Case</Link>
                <Link to="/trust-scores" className="hover:text-white transition-colors">Trust Scores</Link>
                <Link to="/repository" className="hover:text-white transition-colors">Repository</Link>
                <Link to="/heatmap" className="hover:text-white transition-colors">Heat Map</Link>
                <Link to="/impact-stories" className="hover:text-white transition-colors">Impact</Link>
              </>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                currentUser.role === 'admin'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : currentUser.role === 'citizen'
                  ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {roleLabel(currentUser.role)}
              </span>
              <span className="hidden sm:inline text-xs font-semibold text-gray-300">
                {currentUser.name}
              </span>
            </div>

            <Link
              to="/dashboard"
              className="text-xs font-bold text-gray-400 hover:text-white transition-colors border border-white/10 hover:border-white/20 px-3 py-1.5 rounded"
            >
              Dashboard
            </Link>

            <button
              onClick={handleSignOut}
              className="bg-white/[0.06] hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 text-white text-xs font-bold px-3 py-1.5 rounded transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-[1200px] mx-auto px-6 pt-10 md:pt-14 pb-16">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto mb-12">
          {/* Active Banner */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff5634]"></span>
            </span>
            <span className="text-xs tracking-widest font-bold uppercase text-gray-400">
              Live Monitoring Active
            </span>
          </div>

          {/* Title */}
          <h1 className="font-['Sora'] text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            The Truth <span className="text-[#ffb4a4] relative inline-block">Cannot<span className="absolute bottom-1 left-0 w-full h-[3px] bg-[#ff5634]/30 rounded-full" /></span> Be Buried.
          </h1>

          {/* Subtitle */}
          <p className="font-['Inter'] text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed">
            A secure, verified, and anonymous ecosystem to report corruption and demand accountability in Bangladesh. Speak your truth without fear.
          </p>

          {/* CTA Buttons based on role */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {currentUser.role === 'admin' ? (
              <>
                <Link 
                  to="/admin/verification" 
                  className="w-full sm:w-auto bg-[#ff5634] hover:bg-[#ff4320] text-white font-medium px-6 py-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-[#ff5634]/20"
                >
                  Admin Verification Panel
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link 
                  to="/admin/fraud-moderation" 
                  className="w-full sm:w-auto border border-[#00ADB5] hover:bg-[#00ADB5]/10 text-[#00ADB5] font-medium px-6 py-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ShieldIcon className="w-4 h-4" />
                  Fraud &amp; Spam Moderation
                </Link>
                <a 
                  href="#protocol" 
                  className="w-full sm:w-auto border border-white/15 hover:bg-white/[0.04] text-gray-300 font-medium px-5 py-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Security Protocol
                </a>
              </>
            ) : currentUser.role === 'citizen' ? (
              <>
                <Link 
                  to="/submit-report" 
                  className="w-full sm:w-auto bg-[#ff5634] hover:bg-[#ff4320] text-white font-medium px-6 py-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-[#ff5634]/20"
                >
                  Report an Incident
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <a 
                  href="#protocol" 
                  className="w-full sm:w-auto border border-[#00ADB5] hover:bg-[#00ADB5]/5 text-[#00ADB5] font-medium px-6 py-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ShieldIcon className="w-4 h-4" />
                  Security Protocol
                </a>
                <Link 
                  to="/my-reports" 
                  className="w-full sm:w-auto border border-white/15 hover:bg-white/[0.04] text-gray-300 font-medium px-5 py-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
                >
                  My Reports
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/articles" 
                  className="w-full sm:w-auto bg-[#ff5634] hover:bg-[#ff4320] text-white font-medium px-6 py-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-[#ff5634]/20"
                >
                  Knowledge Hub
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <a 
                  href="#protocol" 
                  className="w-full sm:w-auto border border-[#00ADB5] hover:bg-[#00ADB5]/5 text-[#00ADB5] font-medium px-6 py-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ShieldIcon className="w-4 h-4" />
                  Security Protocol
                </a>
              </>
            )}
          </div>
        </section>

        {/* HERO IMAGE CONTAINER (GLASSMORPHIC CARD) */}
        <section className="mb-16 max-w-5xl mx-auto">
          <div className="relative group rounded-xl p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent">
            <div className="relative rounded-xl overflow-hidden bg-[#131313]/40 backdrop-blur-3xl border border-white/[0.04] p-4 md:p-6 shadow-2xl">
              
              {/* Image with subtle hover zoom */}
              <div className="relative overflow-hidden rounded-lg aspect-[16/9] md:aspect-[21/9] bg-[#0c0c0c] border border-white/[0.06] flex items-center justify-center">
                <img 
                  src={zkPadlock} 
                  alt="Zero Knowledge Encryption Interface" 
                  className="w-full h-full object-cover opacity-90 group-hover:scale-[1.01] transition-transform duration-700" 
                />
                
                {/* Badge Top Right */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded bg-[#00ADB5]/15 border border-[#00ADB5]/30 backdrop-blur-md">
                  <svg className="w-3.5 h-3.5 text-[#00ADB5] animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs tracking-wider uppercase font-bold text-[#00ADB5]">Secured by ZKP</span>
                </div>

                {/* Info Bottom Left */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-16 flex flex-col justify-end">
                  <span className="text-xs tracking-widest font-bold uppercase text-[#00ADB5] mb-1">Decentralized Security</span>
                  <h3 className="font-['Sora'] text-xl sm:text-2xl font-bold text-white mb-0.5 tracking-tight uppercase">Zero-Knowledge Encryption</h3>
                  <p className="text-sm text-gray-400 uppercase tracking-wider">Secure Whistleblowing Portal</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ROLE-PERMITTED PLATFORM FEATURES */}
        <section id="platform" className="mb-16">
          <div className="text-center max-w-3xl mx-auto mb-10">
            {/* Active Role Indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-4">
              <span className={`w-2 h-2 rounded-full ${currentUser.role === 'admin' ? 'bg-[#ff5634]' : 'bg-[#00ADB5]'} animate-pulse`} />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Authorized Role: <span className={currentUser.role === 'admin' ? 'text-[#ffb4a4]' : 'text-[#00ADB5]'}>{roleLabel(currentUser.role)}</span>
              </span>
            </div>

            <h2 className="font-['Sora'] text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              Platform Features &amp; Permissions
            </h2>
            <p className="text-sm md:text-base text-gray-400 leading-relaxed font-['Inter']">
              Features are dynamically authorized according to your role in the Supabase database.
            </p>

            {/* View Mode Switcher */}
            <div className="inline-flex items-center p-1 rounded-lg bg-white/[0.03] border border-white/[0.08] mt-6 gap-1">
              <button
                type="button"
                onClick={() => setFeatureViewFilter('permitted')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  featureViewFilter === 'permitted'
                    ? 'bg-[#ff5634] text-white shadow-md shadow-[#ff5634]/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Permitted for Me ({currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'citizen' ? 'Citizen' : roleLabel(currentUser.role)})
              </button>
              <button
                type="button"
                onClick={() => setFeatureViewFilter('all')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  featureViewFilter === 'all'
                    ? 'bg-white/[0.1] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Platform Modules (With Status)
              </button>
            </div>
          </div>

          {/* ADMIN PERMITTED FEATURES (Shown when Admin or when View All is selected) */}
          {(currentUser.role === 'admin' || featureViewFilter === 'all') && (
            <div className="mb-10">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5634]" />
                  <h3 className="font-['Sora'] text-lg font-bold text-white tracking-tight">
                    Admin Authority Modules
                  </h3>
                </div>
                <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-[#ff5634]/10 text-[#ffb4a4] border border-[#ff5634]/20">
                  {currentUser.role === 'admin' ? '✓ Permitted for You' : 'Restricted: Admin Only'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Admin Card 1: Multi-Admin Verification Panel */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#ff5634]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#ff5634]/10 border border-[#ff5634]/20 flex items-center justify-center text-[#ff5634]">
                          <ShieldIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb4a4] bg-[#ff5634]/10 border border-[#ff5634]/20 px-2 py-0.5 rounded">
                          Admin Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Multi-Admin Verification Panel
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Decentralized verification of submitted whistleblower reports, NID identity verifications, and cross-NGO assignments.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/admin/verification" className="text-xs font-bold text-[#ffb4a4] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Launch Verification
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/admin/verification</span>
                    </div>
                  </div>
                </div>

                {/* Admin Card 2: AI Duplicate Report Detector */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#00ADB5]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center text-[#00ADB5]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ADB5] bg-[#00ADB5]/10 border border-[#00ADB5]/20 px-2 py-0.5 rounded">
                          Admin Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        AI Duplicate Report Detector
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Intelligent cosine similarity scoring across report descriptions, location coordinates, and timestamps to merge duplicates.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/admin/duplicate-detection" className="text-xs font-bold text-[#00ADB5] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Launch Detector
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/admin/duplicate</span>
                    </div>
                  </div>
                </div>

                {/* Admin Card 3: Fraud & Spam Auto-Moderation */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#ff5634]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#ff5634]/10 border border-[#ff5634]/20 flex items-center justify-center text-[#ff5634]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb4a4] bg-[#ff5634]/10 border border-[#ff5634]/20 px-2 py-0.5 rounded">
                          Admin Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Fraud &amp; Spam Auto-Moderation
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Automatic keyword risk analysis and malicious submission quarantine to protect investigative queue integrity.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/admin/fraud-moderation" className="text-xs font-bold text-[#ffb4a4] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Open Quarantine Queue
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/admin/moderation</span>
                    </div>
                  </div>
                </div>

                {/* Admin Card 4: Accountability, Appeals & Alerts */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#00ADB5]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center text-[#00ADB5]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ADB5] bg-[#00ADB5]/10 border border-[#00ADB5]/20 px-2 py-0.5 rounded">
                          Admin Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Appeals, Alerts &amp; Witness Oversight
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Manage urgent whistleblower danger alerts, adjudicate citizen case appeals, and review protected witness depositions.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/admin/accountability" className="text-xs font-bold text-[#00ADB5] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Review Alerts &amp; Appeals
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/admin/accountability</span>
                    </div>
                  </div>
                </div>

                {/* Admin Card 5: Case Follow-Ups Manager */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#ff5634]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#ff5634]/10 border border-[#ff5634]/20 flex items-center justify-center text-[#ff5634]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb4a4] bg-[#ff5634]/10 border border-[#ff5634]/20 px-2 py-0.5 rounded">
                          Admin Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Official Case Follow-Ups
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Publish official investigative updates, track stage progressions, and attach legal sanction notifications.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/case-follow-ups" className="text-xs font-bold text-[#ffb4a4] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Post Case Follow-Up
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/case-follow-ups</span>
                    </div>
                  </div>
                </div>

                {/* Admin Card 6: National Intelligence & Analytics */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#00ADB5]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center text-[#00ADB5]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ADB5] bg-[#00ADB5]/10 border border-[#00ADB5]/20 px-2 py-0.5 rounded">
                          Admin Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        National Intelligence Analytics
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Macro trends, departmental corruption indices, divisional heat comparisons, and resolution benchmarks.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/analytics" className="text-xs font-bold text-[#00ADB5] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        View Intelligence
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CITIZEN / USER PERMITTED FEATURES (Shown when Citizen or when View All is selected) */}
          {(currentUser.role === 'citizen' || featureViewFilter === 'all') && (
            <div className="mb-10">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00ADB5]" />
                  <h3 className="font-['Sora'] text-lg font-bold text-white tracking-tight">
                    Citizen &amp; Whistleblower Modules
                  </h3>
                </div>
                <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-[#00ADB5]/10 text-[#00ADB5] border border-[#00ADB5]/20">
                  {currentUser.role === 'citizen' ? '✓ Permitted for You' : 'Citizen Accessible'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Citizen Card 1: Structured Incident Report Builder */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#ff5634]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#ff5634]/10 border border-[#ff5634]/20 flex items-center justify-center text-[#ff5634]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb4a4] bg-[#ff5634]/10 border border-[#ff5634]/20 px-2 py-0.5 rounded">
                          Citizen Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Structured Incident Report Builder
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Guide-driven data collection ensuring reports are legally actionable and categorised for maximum civic accountability.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/submit-report" className="text-xs font-bold text-[#ffb4a4] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        File an Incident Report
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/submit-report</span>
                    </div>
                  </div>
                </div>

                {/* Citizen Card 2: Encrypted Evidence Vault */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#00ADB5]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center text-[#00ADB5]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ADB5] bg-[#00ADB5]/10 border border-[#00ADB5]/20 px-2 py-0.5 rounded">
                          Citizen Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Encrypted Evidence Vault
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Secure multi-format file uploads protected by client-side metadata stripping and zero-knowledge storage.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/evidence-vault" className="text-xs font-bold text-[#00ADB5] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Upload to Secure Vault
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/evidence-vault</span>
                    </div>
                  </div>
                </div>

                {/* Citizen Card 3: Anonymous Mode */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#00ADB5]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center text-[#00ADB5]">
                          <LockIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ADB5] bg-[#00ADB5]/10 border border-[#00ADB5]/20 px-2 py-0.5 rounded">
                          Citizen Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Anonymous Burner Submission
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        IP obfuscation and burner token authentication isolate your physical identity during the entire submission process.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/submit-anonymous" className="text-xs font-bold text-[#00ADB5] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Launch Burner Mode
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/submit-anonymous</span>
                    </div>
                  </div>
                </div>

                {/* Citizen Card 4: Case Lifecycle Tracker */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#ff5634]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#ff5634]/10 border border-[#ff5634]/20 flex items-center justify-center text-[#ff5634]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb4a4] bg-[#ff5634]/10 border border-[#ff5634]/20 px-2 py-0.5 rounded">
                          Citizen Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Case Lifecycle Tracker
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Real-time status tracking on report verification, media disclosures, and official legal escalation stages.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/case-tracker" className="text-xs font-bold text-[#ffb4a4] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Lookup Case Tracker
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/case-tracker</span>
                    </div>
                  </div>
                </div>

                {/* Citizen Card 5: Offline Progressive Web App */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#00ADB5]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center text-[#00ADB5]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ADB5] bg-[#00ADB5]/10 border border-[#00ADB5]/20 px-2 py-0.5 rounded">
                          Citizen Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Offline PWA Drafts &amp; Auto-Sync
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Submit incident reports without connectivity. Drafts are preserved locally and sync securely upon reconnection.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/offline-drafts" className="text-xs font-bold text-[#00ADB5] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Manage Saved Drafts
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/offline-drafts</span>
                    </div>
                  </div>
                </div>

                {/* Citizen Card 6: My Reports Dashboard */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#ff5634]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#ff5634]/10 border border-[#ff5634]/20 flex items-center justify-center text-[#ff5634]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb4a4] bg-[#ff5634]/10 border border-[#ff5634]/20 px-2 py-0.5 rounded">
                          Citizen Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        My Submitted Reports
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        View your report history, track status changes from authorities, and review reviewer comments securely.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/my-reports" className="text-xs font-bold text-[#ffb4a4] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        View My History
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/my-reports</span>
                    </div>
                  </div>
                </div>

                {/* Citizen Card 7: Citizen Verification Badge */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#00ADB5]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center text-[#00ADB5]">
                          <ShieldIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ADB5] bg-[#00ADB5]/10 border border-[#00ADB5]/20 px-2 py-0.5 rounded">
                          Citizen Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Citizen Identity &amp; NID Verification
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Verify your national ID with encrypted credentials to earn the trusted whistleblower badge and elevate report priority.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/verification" className="text-xs font-bold text-[#00ADB5] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Request Verified Badge
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/verification</span>
                    </div>
                  </div>
                </div>

                {/* Citizen Card 8: Community Flag Watch */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#ff5634]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#ff5634]/10 border border-[#ff5634]/20 flex items-center justify-center text-[#ff5634]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb4a4] bg-[#ff5634]/10 border border-[#ff5634]/20 px-2 py-0.5 rounded">
                          Citizen Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Community Flag Watch
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Flag suspicious reports, fake news, or harassment to crowd-protect database reliability and aid moderation.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/flagged-items" className="text-xs font-bold text-[#ffb4a4] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        View Flagged Queue
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/flagged-items</span>
                    </div>
                  </div>
                </div>

                {/* Citizen Card 9: Awareness & Legal Rights */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#00ADB5]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center text-[#00ADB5]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ADB5] bg-[#00ADB5]/10 border border-[#00ADB5]/20 px-2 py-0.5 rounded">
                          Citizen Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Awareness &amp; Whistleblower Rights
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Access constitutional protections, reporting guides, legal definitions, and safety handbooks for Bangladeshi citizens.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/articles" className="text-xs font-bold text-[#00ADB5] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Visit Knowledge Hub
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/articles</span>
                    </div>
                  </div>
                </div>

                {/* Citizen Card 10: Corruption Heatmap & Transparency */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#ff5634]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#ff5634]/10 border border-[#ff5634]/20 flex items-center justify-center text-[#ff5634]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb4a4] bg-[#ff5634]/10 border border-[#ff5634]/20 px-2 py-0.5 rounded">
                          Citizen Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        National Corruption Heatmap
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Public interactive map showing verified incident density and hot zones across all 8 divisions of Bangladesh.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/corruption-heatmap" className="text-xs font-bold text-[#ffb4a4] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Explore Geographic Map
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/corruption-heatmap</span>
                    </div>
                  </div>
                </div>

                {/* Citizen Card 11: Institutional Trust Scores */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#00ADB5]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center text-[#00ADB5]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ADB5] bg-[#00ADB5]/10 border border-[#00ADB5]/20 px-2 py-0.5 rounded">
                          Citizen Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Institutional Trust Scores &amp; Rankings
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Public accountability index ranking ministries, departments, and public utilities by verified corruption red flags.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/trust-scores" className="text-xs font-bold text-[#00ADB5] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        View Trust Scores
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/trust-scores</span>
                    </div>
                  </div>
                </div>

                {/* Citizen Card 12: Whistleblower Impact Stories */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-[#ff5634]/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-[#ff5634]/10 border border-[#ff5634]/20 flex items-center justify-center text-[#ff5634]">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#ffb4a4] bg-[#ff5634]/10 border border-[#ff5634]/20 px-2 py-0.5 rounded">
                          Citizen Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Whistleblower Impact Stories
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Documented victories showing real instances where citizen bravery produced tangible institutional accountability.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/impact-stories" className="text-xs font-bold text-[#ffb4a4] group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Read Impact Stories
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/impact-stories</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NGO / GOV OFFICER PERMITTED FEATURES (When role is not admin and not citizen) */}
          {currentUser.role !== 'admin' && currentUser.role !== 'citizen' && featureViewFilter === 'permitted' && (
            <div className="mb-10">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <h3 className="font-['Sora'] text-lg font-bold text-white tracking-tight">
                    Institutional Partner Modules
                  </h3>
                </div>
                <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  ✓ Permitted for {roleLabel(currentUser.role)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Partner Card 1: Knowledge Hub Authoring */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-amber-400/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                          Partner Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Educational Article Authoring
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Author, edit, and submit legal and anti-corruption awareness articles to empower the general public.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/dashboard" className="text-xs font-bold text-amber-300 group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Author in Dashboard
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/dashboard</span>
                    </div>
                  </div>
                </div>

                {/* Partner Card 2: Public Evidence Repository */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-amber-400/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                          Partner Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Public Document Repository
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Access reference public records, official government gazettes, and audit reports for transparency.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/repository" className="text-xs font-bold text-amber-300 group-hover:text-white flex items-center gap-1.5 transition-colors">
                        Browse Repository
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/repository</span>
                    </div>
                  </div>
                </div>

                {/* Partner Card 3: Institutional Trust Scores */}
                <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
                  <div className="h-full rounded-xl bg-[#131313]/30 border border-white/[0.04] p-6 hover:border-amber-400/40 hover:bg-[#131313]/50 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                          Partner Permitted
                        </span>
                      </div>
                      <h4 className="font-['Sora'] text-base font-semibold text-white mb-2">
                        Institutional Trust Scores
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Track institutional integrity benchmarks, verified civic red flags, and public trust scores.
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                      <Link to="/trust-scores" className="text-xs font-bold text-amber-300 group-hover:text-white flex items-center gap-1.5 transition-colors">
                        View Trust Rankings
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <span className="text-[10px] text-gray-500 font-mono">/trust-scores</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* LIVE INTERACTIVE DEMO (IDENTITY PROTECTION MODULE) */}
        <section className="mb-16 max-w-5xl mx-auto">
          <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
            <div className="rounded-xl bg-[#131313]/30 backdrop-blur-3xl border border-white/[0.04] p-8 md:p-12 shadow-xl">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Left description */}
                <div className="text-left">
                  <span className="text-xs tracking-widest font-bold uppercase text-[#00ADB5] mb-2 block font-sans">
                    Live Interactive Demo
                  </span>
                  <h3 className="font-['Sora'] text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">
                    Identity Protection Module
                  </h3>
                  <p className="text-sm md:text-base text-gray-400 mb-6 leading-relaxed font-['Inter']">
                    Watch metadata scrubbing in action. When you select a file to report corruption, our client-side uploader wipes EXIF data, device signatures, location tags, and author info before the file ever reaches our secure network.
                  </p>

                  <ul className="space-y-3.5">
                    <li className="flex items-center gap-2.5 text-sm text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ADB5]" />
                      Zero-knowledge encryption key generated locally
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ADB5]" />
                      EXIF metadata scrubbing in the browser
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ADB5]" />
                      Multi-pass encryption layer
                    </li>
                  </ul>
                </div>

                {/* Right Interactive Area */}
                <div className="flex flex-col gap-4">
                  <div className="relative rounded-xl border border-dashed border-white/[0.12] bg-[#0c0c0c]/80 p-6 flex flex-col items-center justify-center min-h-[280px] overflow-hidden">
                    
                    {/* Background glows during scrubbing */}
                    {isSimulating && (
                      <div className="absolute inset-0 bg-[#00ADB5]/[0.02] animate-pulse" />
                    )}

                    {/* Progress details */}
                    {!selectedFile && !isSimulating ? (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4 text-gray-400">
                          <svg className="w-6 h-6 text-[#00ADB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <h4 className="text-base font-semibold text-white mb-1">Click to Upload Evidence</h4>
                        <p className="text-xs text-gray-500 mb-4">Supports PDF, MP3, MP4, PNG up to 1GB</p>
                        
                        <label className="bg-[#131313] hover:bg-white/[0.06] text-white border border-white/[0.12] text-sm font-semibold px-4 py-2.5 rounded-md cursor-pointer transition-colors duration-200">
                          Select Mock File
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={handleFileChange} 
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col h-full justify-between">
                        
                        {/* File detail header */}
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#ff5634]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium text-white truncate max-w-[200px]">
                              {selectedFile?.name || 'evidence_leak_source.png'}
                            </span>
                          </div>
                          <button 
                            onClick={resetSimulator}
                            className="text-xs text-gray-500 hover:text-white transition-colors"
                          >
                            Reset
                          </button>
                        </div>

                        {/* Metadata Shredder View */}
                        <div className="space-y-2 mb-4 font-mono text-[11px]">
                          {metadata.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-[#131313]/40 px-3 py-1.5 rounded border border-white/[0.02]">
                              <span className="text-gray-500">{item.key}:</span>
                              {item.status === 'scrubbed' ? (
                                <span className="text-[#00ADB5] font-semibold bg-[#00ADB5]/10 px-1.5 py-0.5 rounded">WIPED</span>
                              ) : item.status === 'scrubbing' ? (
                                <span className="text-[#ffb4a4] animate-pulse">scrubbing...</span>
                              ) : (
                                <span className="text-gray-300 truncate max-w-[180px]">{item.original}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Logs */}
                        {isSimulating && (
                          <div className="text-xs text-[#00ADB5] font-mono text-left mb-4 min-h-[16px] animate-pulse">
                            &gt; {simulationSteps[activeStep]}
                          </div>
                        )}

                        {showResult && (
                          <div className="text-xs text-emerald-400 font-mono text-center mb-4 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                            ✓ Local Cryptographic Vault Seal Complete (Zero-Knowledge Verified)
                          </div>
                        )}

                        {/* Progress Bar (Teal) */}
                        <div className="mt-auto">
                          <div className="flex justify-between text-xs text-gray-500 mb-1 font-mono">
                            <span>Metadata Wiping Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#00ADB5] transition-all duration-75 rounded-full" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* Simulate Trigger Button */}
                  <button
                    onClick={startSimulation}
                    disabled={!selectedFile || isSimulating}
                    className={`w-full text-sm font-semibold py-3.5 rounded-md transition-all duration-200 ${
                      !selectedFile
                        ? 'bg-white/[0.04] text-gray-500 border border-white/[0.08] cursor-not-allowed'
                        : isSimulating
                        ? 'bg-[#00ADB5]/20 text-[#00ADB5] border border-[#00ADB5]/40 cursor-wait'
                        : 'bg-[#00ADB5] hover:bg-[#009ca4] text-white shadow-md shadow-[#00ADB5]/10 hover:shadow-[#00ADB5]/20'
                    }`}
                  >
                    {isSimulating ? 'Scrubbing EXIF & Encrypting...' : selectedFile ? 'Simulate Secure Upload' : 'Upload a Mock File to Begin'}
                  </button>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* JOIN THE MOVEMENT CARD */}
        <section className="mb-12 max-w-4xl mx-auto">
          <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#1a1a1a]/80 to-[#0e0e0e]/80 border border-white/[0.05] p-10 md:p-14 text-center">
              
              {/* Grid Background Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />

              <h2 className="font-['Sora'] text-3xl md:text-5xl font-bold text-white mb-4 relative z-10">
                Join the movement for a<br />transparent Bangladesh.
              </h2>
              
              <p className="text-sm md:text-base text-gray-400 mb-6 relative z-10 font-['Inter']">
                Join 100,000+ citizens protecting our future.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                <Link 
                  to="/submit-report" 
                  className="w-full sm:w-auto bg-[#ff5634] hover:bg-[#ff4320] text-white text-sm font-bold px-7 py-4 rounded-md transition-all duration-200 shadow-lg shadow-[#ff5634]/15"
                >
                  Report an Incident
                </Link>
                <Link 
                  to="/support" 
                  className="w-full sm:w-auto border border-white/[0.12] hover:bg-white/[0.04] text-white text-sm font-bold px-7 py-4 rounded-md transition-all duration-200"
                >
                  Support the Cause
                </Link>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] bg-[#0c0c0c] py-16 text-left relative z-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
            {/* Logo and Name */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <LogoIcon />
                <span className="font-['Sora'] font-bold text-lg tracking-tight text-white">
                  Truth <span className="text-[#ffb4a4]">Uncovered</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 font-['Inter'] max-w-[280px]">
                © 2026 Truth Uncovered. Secure & Anonymous Whistleblowing. All rights reserved.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-gray-400 font-['Inter']">
              <a href="#rights" className="hover:text-white transition-colors">Legal Rights</a>
              <a href="#privacy" className="hover:text-white transition-colors">Privacy Protocol</a>
              <a href="#partners" className="hover:text-white transition-colors">NGO Partners</a>
              <a href="#contact" className="hover:text-white transition-colors">Secure Contact</a>
            </div>
          </div>

          {/* Secure indicator icons */}
          <div className="flex items-center justify-between border-t border-white/[0.04] pt-6 text-xs text-gray-600">
            <span>Powered by Zero-Knowledge Proofs & IPFS storage networks.</span>
            <div className="flex items-center gap-3">
              {/* Globe Icon */}
              <svg className="w-4 h-4 hover:text-gray-400 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {/* Shield Icon */}
              <svg className="w-4 h-4 hover:text-gray-400 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
