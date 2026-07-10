import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldIcon, LogoIcon } from './App';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Signup:', { name, email, password });
      setIsLoading(false);
      navigate('/login'); // Redirect to login
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface flex flex-col font-inter selection:bg-brand-red/30 selection:text-brand-red">
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card glass-border border-b border-white/5 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-sora font-bold text-lg tracking-tight">Truth Uncovered</span>
          </Link>
          
          <Link to="/login" className="text-sm font-medium px-5 py-2 bg-brand-red text-white hover:bg-brand-red/90 rounded-lg interactive-hover font-semibold">
            Sign In
          </Link>
        </div>
      </header>

      {/* Signup Form */}
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[11px] font-bold tracking-widest uppercase mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
            Join the Movement
          </div>

          <div className="glass-card glass-border p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="font-sora text-3xl font-bold tracking-tight mb-2">Create Account</h2>
              <p className="text-on-surface/70 text-sm">Start your journey to uncover truth</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-on-surface/60 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:border-brand-teal/40 transition-colors"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-on-surface/60 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:border-brand-teal/40 transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-on-surface/60 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:border-brand-teal/40 transition-colors"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-on-surface/60 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:border-brand-teal/40 transition-colors"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-4 h-4 bg-black/40 border border-white/10 rounded focus:outline-none focus:border-brand-teal/40"
                  required
                />
                <label htmlFor="terms" className="text-xs text-on-surface/60">
                  I agree to the{' '}
                  <a href="#" className="text-brand-teal hover:text-brand-teal/80 transition-colors">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" className="text-brand-teal hover:text-brand-teal/80 transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-brand-red hover:bg-brand-red/90 text-white font-semibold rounded-lg text-sm shadow-lg shadow-brand-red/20 flex items-center justify-center gap-2 interactive-hover disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="mt-6 text-center text-sm text-on-surface/60">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-teal hover:text-brand-teal/80 font-semibold transition-colors">
                Sign in
              </Link>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link to="/" className="text-xs text-on-surface/40 hover:text-brand-teal transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-6 bg-black/40">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-on-surface/40 text-center md:text-left">
            © 2026 Truth Uncovered. Secure & Anonymous Whistleblowing.
          </p>
          <div className="flex gap-6 text-xs text-on-surface/40">
            <a href="#" className="hover:text-brand-teal transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-teal transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}