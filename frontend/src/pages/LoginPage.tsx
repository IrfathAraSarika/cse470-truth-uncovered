import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockIcon, LogoIcon, ShieldIcon } from '../components/AppIcons';
import { login, signup } from '../services/authApi';
import zkPadlock from '../assets/zk_padlock.png';

interface LoginPageProps {
  initialMode?: 'login' | 'signup';
}

export default function LoginPage({ initialMode = 'login' }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'citizen' | 'admin'>('citizen');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const data = await login(loginEmail, loginPassword);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match!');
      return;
    }

    setIsLoading(true);

    try {
      await signup(signupName, signupEmail, signupPassword, signupRole);
      setSuccessMessage('Account created successfully! Please sign in below.');
      setMode('login');
      setLoginEmail(signupEmail);
      setLoginPassword('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#e5e2e1] flex flex-col font-inter selection:bg-brand-red/30 selection:text-brand-red">
      {/* Atmosphere Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(255,86,52,0.08)_0%,transparent_70%)] rounded-full blur-[90px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[600px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(0,173,181,0.06)_0%,transparent_70%)] rounded-full blur-[90px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-md bg-[#080808]/70 sticky top-0">
        <div className="max-w-[1300px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <LogoIcon />
            <span className="font-sora font-bold text-lg tracking-tight text-white">
              Truth <span className="text-brand-red">Uncovered</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`text-xs md:text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-brand-red text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`text-xs md:text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                mode === 'signup'
                  ? 'bg-brand-red text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[1240px] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT SIDE: Picture & Hero Card */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl p-4 md:p-6 group">
              
              {/* Top Meta Bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-bold uppercase tracking-widest text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
                  Live Monitoring Active
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/30 text-[11px] font-bold uppercase tracking-widest text-brand-teal">
                  <ShieldIcon className="w-3.5 h-3.5" />
                  Secured by ZKP
                </div>
              </div>

              {/* The Picture Frame */}
              <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-[#0c0c0c] border border-white/[0.08]">
                <img
                  src={zkPadlock}
                  alt="Zero-Knowledge Encryption"
                  className="w-full h-full object-cover opacity-95 group-hover:scale-[1.02] transition-transform duration-700"
                />
                
                {/* Overlay Text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent p-6 flex flex-col justify-end">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-brand-teal mb-1">
                    Decentralized Security
                  </span>
                  <h3 className="font-sora text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                    Zero-Knowledge Encryption
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1">
                    Secure Whistleblowing Portal • Speak your truth without fear
                  </p>
                </div>
              </div>

              {/* Feature Highlights beneath picture */}
              <div className="mt-5 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-red">Ecosystem</p>
                  <p className="text-sm font-semibold text-white mt-1">The Truth Cannot Be Buried</p>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-teal">Roles Supported</p>
                  <p className="text-sm font-semibold text-white mt-1">Citizen & Administrator</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Log In or Sign Up Form */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl p-6 sm:p-8">
              
              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-brand-red text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-brand-red text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Status messages */}
              {errorMessage && (
                <div className="mb-5 p-3 rounded-lg bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-semibold text-center">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="mb-5 p-3 rounded-lg bg-brand-teal/10 border border-brand-teal/30 text-brand-teal text-xs font-semibold text-center">
                  {successMessage}
                </div>
              )}

              {/* --- LOGIN FORM --- */}
              {mode === 'login' ? (
                <div>
                  <div className="mb-6">
                    <h2 className="font-sora text-2xl font-bold tracking-tight text-white mb-1">
                      Welcome Back
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Sign in to access your role-permitted dashboard
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand-teal transition-colors"
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400">
                          Password
                        </label>
                        <a href="#" className="text-[11px] text-brand-teal hover:underline">
                          Forgot password?
                        </a>
                      </div>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand-teal transition-colors"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 mt-2 bg-brand-red hover:bg-brand-red/90 text-white font-semibold rounded-lg text-sm shadow-lg shadow-brand-red/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <LockIcon className="w-4 h-4" /> Sign In
                        </>
                      )}
                    </button>
                  </form>

                  <p className="mt-5 text-center text-xs text-gray-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setErrorMessage(''); }}
                      className="text-brand-teal hover:underline font-semibold"
                    >
                      Create one now
                    </button>
                  </p>
                </div>
              ) : (
                /* --- SIGNUP FORM --- */
                <div>
                  <div className="mb-6">
                    <h2 className="font-sora text-2xl font-bold tracking-tight text-white mb-1">
                      Create Account
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Join the movement to uncover truth
                    </p>
                  </div>

                  <form onSubmit={handleSignupSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">
                        Account Role
                      </label>
                      <select
                        value={signupRole}
                        onChange={(e) => setSignupRole(e.target.value as 'citizen' | 'admin')}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-teal transition-colors cursor-pointer"
                      >
                        <option value="citizen">Citizen</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand-teal transition-colors"
                        placeholder="Your full name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand-teal transition-colors"
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">
                          Password
                        </label>
                        <input
                          type="password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand-teal transition-colors"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">
                          Confirm
                        </label>
                        <input
                          type="password"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand-teal transition-colors"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 mt-2 bg-brand-red hover:bg-brand-red/90 text-white font-semibold rounded-lg text-sm shadow-lg shadow-brand-red/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShieldIcon className="w-4 h-4" /> Create Account
                        </>
                      )}
                    </button>
                  </form>

                  <p className="mt-5 text-center text-xs text-gray-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setErrorMessage(''); }}
                      className="text-brand-teal hover:underline font-semibold"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-4 px-6 bg-black/40">
        <div className="max-w-[1300px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© 2026 Truth Uncovered. Secure & Anonymous Whistleblowing.</p>
          <div className="flex gap-4">
            <Link to="/landing" className="hover:text-brand-teal transition-colors">About Platform</Link>
            <a href="#" className="hover:text-brand-teal transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-teal transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

