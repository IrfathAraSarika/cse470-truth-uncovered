// React hooks and local asset imports
import { useState, useEffect } from 'react';
import zkPadlock from './assets/zk_padlock.png';

// Custom SVG Icons to avoid external dependencies and ensure fast compilation

const LogoIcon = () => (
  <svg className="w-8 h-8 text-brand-red animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

const ShieldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ShieldCheckIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 11 2 2 4-4" />
  </svg>
);

const LockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const DocIcon = () => (
  <svg className="w-6 h-6 text-brand-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const CloudIcon = () => (
  <svg className="w-6 h-6 text-brand-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a5 5 0 0 0-4.66-7A8 8 0 1 0 3 13.78A4 4 0 0 0 5.13 21h13.75A5 5 0 0 0 22 19z" />
    <polyline points="16 12 12 8 8 12" />
    <line x1="12" y1="8" x2="12" y2="17" />
  </svg>
);

const IncognitoIcon = () => (
  <svg className="w-6 h-6 text-brand-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 0 10 0 5 5 0 0 0 5-5H2z" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="12" r="3" />
    <line x1="6" y1="9" x2="18" y2="9" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6 text-brand-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6 text-brand-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4 ml-1 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-5 h-5 opacity-70 hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// Main Application component hosting all features
export default function App() {
  // Identity Protection Upload Demo State (tracks file selection, progress, and redacted fields)
  const [file, setFile] = useState<File | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const [scrubProgress, setScrubProgress] = useState(0);
  const [scrubbedFields, setScrubbedFields] = useState<string[]>([]);
  const [isScrubComplete, setIsScrubComplete] = useState(false);

  const mockMetadata = [
    { key: 'Device Info', value: 'iPhone 15 Pro Max' },
    { key: 'GPS Location', value: '23.8103° N, 90.4125° E (Dhaka)' },
    { key: 'Software Version', value: 'iOS 17.5.1' },
    { key: 'Author Identity', value: 'Tanvir Rahman' },
  ];

  const handleMockUpload = () => {
    // Reset state
    setFile({ name: 'evidence_corruption_defense_force.pdf' } as File);
    setIsScrubbing(true);
    setScrubProgress(0);
    setScrubbedFields([]);
    setIsScrubComplete(false);
  };

  // Effect simulating step-by-step EXIF & metadata scrubbing animation in the browser
  useEffect(() => {
    if (isScrubbing) {

      const interval = setInterval(() => {
        setScrubProgress((prev) => {
          const next = prev + 2.5;
          if (next >= 100) {
            clearInterval(interval);
            setIsScrubbing(false);
            setIsScrubComplete(true);
            return 100;
          }

          // Shred metadata sequentially based on progress
          if (next > 25 && !scrubbedFields.includes('Author Identity')) {
            setScrubbedFields((f) => [...f, 'Author Identity']);
          }
          if (next > 50 && !scrubbedFields.includes('GPS Location')) {
            setScrubbedFields((f) => [...f, 'GPS Location']);
          }
          if (next > 75 && !scrubbedFields.includes('Device Info')) {
            setScrubbedFields((f) => [...f, 'Device Info']);
          }
          if (next > 90 && !scrubbedFields.includes('Software Version')) {
            setScrubbedFields((f) => [...f, 'Software Version']);
          }

          return next;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isScrubbing, scrubbedFields]);

  return (
    <div className="min-h-screen bg-bg-dark text-on-surface flex flex-col font-inter selection:bg-brand-red/30 selection:text-brand-red">
      
      {/* Header: Contains logo, navigation links, and auth action buttons */}
      <header className="sticky top-0 z-50 glass-card glass-border border-b border-white/5 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-sora font-bold text-lg tracking-tight">Truth Uncovered</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#platform" className="hover:text-brand-teal transition-colors">Platform</a>
            <a href="#uploader" className="hover:text-brand-teal transition-colors">Data Map</a>
            <a href="#impact" className="hover:text-brand-teal transition-colors">Impact</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="text-sm font-medium px-4 py-2 text-on-surface hover:bg-white/5 rounded-lg interactive-hover">
              Citizen Login
            </button>
            <button className="text-sm font-medium px-5 py-2 bg-brand-red text-white hover:bg-brand-red/90 rounded-lg interactive-hover font-semibold">
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: Introduces platform value proposition and highlights secure whistleblowing */}
      <section className="relative pt-20 pb-16 px-6 max-w-[1200px] mx-auto text-center flex flex-col items-center">
        
        {/* Live Active Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-[11px] font-bold tracking-widest uppercase mb-8">
          <span className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
          Live Monitoring Active
        </div>

        {/* Hero Title */}
        <h1 className="font-sora text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1] mb-6">
          The Truth <span className="text-primary">Cannot</span> Be Buried.
        </h1>

        {/* Subtitle */}
        <p className="text-on-surface/70 text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
          A secure, verified, and anonymous ecosystem to report corruption and demand accountability in Bangladesh. Speak your truth without fear.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <a 
            href="#uploader"
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-red hover:bg-brand-red/90 text-white font-semibold rounded-lg text-base shadow-lg shadow-brand-red/20 flex items-center justify-center gap-2 interactive-hover"
          >
            Report an Incident <ArrowRightIcon />
          </a>
          <button className="w-full sm:w-auto px-8 py-3.5 bg-white/5 border border-white/10 hover:border-brand-teal/40 text-on-surface font-semibold rounded-lg text-base flex items-center justify-center gap-2 interactive-hover">
            <ShieldIcon className="w-5 h-5 text-brand-teal" /> Security Protocol
          </button>
        </div>

        {/* Hero Illustration / ZK Padlock */}
        <div className="w-full max-w-[800px] rounded-2xl overflow-hidden glass-card glass-border p-3 mb-24 interactive-hover">
          <div className="relative rounded-xl overflow-hidden bg-black/40 flex items-center justify-center border border-white/5 aspect-[16/9]">
            <img 
              src={zkPadlock} 
              alt="Zero-Knowledge Encryption padlock mockup" 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            {/* Visual HUD overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 pointer-events-none" />
            <div className="absolute bottom-8 left-8 text-left z-10">
              <span className="text-[10px] text-brand-teal font-bold tracking-widest uppercase block mb-1">Decentralized Security</span>
              <h3 className="font-sora text-xl font-bold tracking-tight text-white">ZERO-KNOWLEDGE ENCRYPTION</h3>
              <p className="text-xs text-on-surface/50">SECURE WHISTLEBLOWING PORTAL</p>
            </div>
            <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 rounded bg-brand-teal/15 border border-brand-teal/20 text-brand-teal text-[9px] font-bold tracking-wider uppercase">
              <ShieldIcon className="w-3 h-3" /> SECURED BY ZKP
            </div>
          </div>
        </div>

      </section>

      {/* Platform Architecture: Grid section detailing the five core secure architecture modules */}
      <section id="platform" className="py-20 bg-black/20 border-t border-white/5 px-6">
        <div className="max-w-[1200px] mx-auto">
          
          <div className="text-center mb-16">
            <h2 className="font-sora text-3xl md:text-4xl font-bold tracking-tight mb-4">
              The Platform Architecture
            </h2>
            <p className="text-on-surface/70 text-base max-w-2xl mx-auto">
              Five core modules designed for absolute anonymity, ironclad security, and systemic accountability.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Card 1 */}
            <div className="glass-card glass-border p-8 flex flex-col justify-between interactive-hover min-h-[220px]">
              <div>
                <div className="w-12 h-12 rounded-lg bg-brand-red/10 flex items-center justify-center mb-6 border border-brand-red/20">
                  <DocIcon />
                </div>
                <h3 className="font-sora text-xl font-bold mb-3 text-white">Structured Incident Report Builder</h3>
                <p className="text-on-surface/70 text-sm leading-relaxed mb-6">
                  Guide-driven data collection ensuring reports are legally actionable and systemically categorised for maximum impact.
                </p>
              </div>
              <a href="#report-demo" className="text-brand-red text-xs font-bold tracking-widest uppercase hover:underline flex items-center gap-1">
                Explore Module <ArrowRightIcon />
              </a>
            </div>

            {/* Card 2 */}
            <div className="glass-card glass-border p-8 flex flex-col justify-between interactive-hover min-h-[220px]">
              <div>
                <div className="w-12 h-12 rounded-lg bg-brand-teal/10 flex items-center justify-center mb-6 border border-brand-teal/20">
                  <CloudIcon />
                </div>
                <h3 className="font-sora text-xl font-bold mb-3 text-white">Encrypted Evidence Vault Uploader</h3>
                <p className="text-on-surface/70 text-sm leading-relaxed mb-6">
                  Secure multi-format file uploads protected by zero-knowledge encryption and automatic metadata scrubbing.
                </p>
              </div>
              <a href="#uploader" className="text-brand-teal text-xs font-bold tracking-widest uppercase hover:underline flex items-center gap-1.5">
                Secure Upload <LockIcon className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 3 */}
            <div className="relative glass-card glass-border p-8 flex flex-col justify-between overflow-hidden interactive-hover min-h-[220px]">
              {/* Background watermark watermark watermark */}
              <div className="absolute right-[-20px] bottom-[-10px] text-white/5 font-sora font-black text-6xl select-none pointer-events-none tracking-widest">
                INCOGNITO
              </div>
              <div>
                <div className="w-11 h-11 rounded-lg bg-brand-teal/10 flex items-center justify-center mb-5 border border-brand-teal/20">
                  <IncognitoIcon />
                </div>
                <h3 className="font-sora text-lg font-bold mb-2.5 text-white">Anonymous Submission Mode</h3>
                <p className="text-on-surface/70 text-xs leading-relaxed">
                  IP obfuscation and burner credentials protect your physical identity during the entire process.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="glass-card glass-border p-8 flex flex-col justify-between interactive-hover min-h-[220px]">
              <div>
                <div className="w-11 h-11 rounded-lg bg-brand-teal/10 flex items-center justify-center mb-5 border border-brand-teal/20">
                  <ChartIcon />
                </div>
                <h3 className="font-sora text-lg font-bold mb-2.5 text-white">Structured Case Lifecycle Tracker</h3>
                <p className="text-on-surface/70 text-xs leading-relaxed">
                  Real-time status updates on report verification, media handoff, and legal escalation stages.
                </p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="glass-card glass-border p-8 flex flex-col justify-between interactive-hover min-h-[220px]">
              <div>
                <div className="w-11 h-11 rounded-lg bg-brand-teal/10 flex items-center justify-center mb-5 border border-brand-teal/20">
                  <SettingsIcon />
                </div>
                <h3 className="font-sora text-lg font-bold mb-2.5 text-white">Multi-Admin Verification Panel</h3>
                <p className="text-on-surface/70 text-xs leading-relaxed">
                  Decentralized verification by independent NGOs to prevent single points of failure or corruption.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Identity Protection Demo: Interactive client-side metadata scrubber and file uploader simulator */}
      <section id="uploader" className="py-20 px-6 max-w-[1200px] mx-auto">
        <div className="glass-card glass-border glass-glow p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 text-left">
              <span className="text-xs text-brand-teal font-bold tracking-widest uppercase block mb-3">Live Interactive Demo</span>
              <h2 className="font-sora text-3xl font-bold tracking-tight mb-4">
                Identity Protection Module
              </h2>
              <p className="text-on-surface/70 text-sm leading-relaxed mb-6">
                Watch metadata scrubbing in action. When you select a file to report corruption, our client-side uploader wipes EXIF data, device signatures, location tags, and author info before the file ever reaches our secure network.
              </p>
              <ul className="space-y-3.5 text-xs text-on-surface/80">
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" /> Zero-knowledge encryption key generated locally
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" /> EXIF metadata scrubbing in the browser
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" /> Multi-pass encryption layer
                </li>
              </ul>
            </div>

            {/* Interactive Widget Box */}
            <div className="lg:col-span-7 bg-black/40 border border-white/5 rounded-xl p-6 md:p-8 flex flex-col justify-center min-h-[350px]">
              {!file ? (
                // Dropzone UI
                <div 
                  onClick={handleMockUpload}
                  className="border-2 border-dashed border-white/10 hover:border-brand-teal/40 rounded-xl p-8 text-center cursor-pointer transition-colors duration-300 flex flex-col items-center justify-center gap-4 bg-white/[0.01] hover:bg-white/[0.03]"
                >
                  <div className="w-14 h-14 rounded-full bg-brand-teal/5 flex items-center justify-center border border-brand-teal/20 text-brand-teal">
                    <CloudIcon />
                  </div>
                  <div>
                    <h4 className="font-sora text-base font-bold text-white mb-1">Click to Upload Evidence</h4>
                    <p className="text-xs text-on-surface/50">Supports PDF, MP3, MP4, PNG up to 1GB</p>
                  </div>
                  <button className="mt-2 text-xs font-semibold px-4 py-2 bg-brand-teal/15 border border-brand-teal/20 text-brand-teal rounded-lg hover:bg-brand-teal/25 transition-colors">
                    Simulate Secure Upload
                  </button>
                </div>
              ) : (
                // Scrubbing Flow UI
                <div className="space-y-6">
                  {/* File Metadata Header */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red">
                        <DocIcon />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-white max-w-[200px] md:max-w-md truncate">{file.name}</h4>
                        <p className="text-[10px] text-on-surface/50">Prepared for ZK Transmission</p>
                      </div>
                    </div>
                    {isScrubComplete && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-teal/15 border border-brand-teal/25 text-brand-teal text-[10px] font-bold uppercase tracking-wider">
                        <ShieldCheckIcon className="w-3.5 h-3.5" /> Secured
                      </span>
                    )}
                  </div>

                  {/* Metadata fields list */}
                  <div className="space-y-3">
                    <div className="text-left text-[10px] text-on-surface/40 uppercase font-bold tracking-widest">Metadata Scrubbing Protocol</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mockMetadata.map((field) => {
                        const isScrubbed = scrubbedFields.includes(field.key);
                        return (
                          <div key={field.key} className="p-3 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs transition-all duration-500">
                            <span className="text-on-surface/60">{field.key}</span>
                            <span className={`font-mono transition-all duration-700 ${
                              isScrubbed 
                                ? 'text-brand-teal font-semibold blur-[3px] select-none scale-95 opacity-50' 
                                : 'text-brand-red font-semibold'
                            }`}>
                              {isScrubbed ? '[REDACTED]' : field.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-on-surface/60">
                        {isScrubbing ? 'Scrubbing and encrypting file headers...' : 'Encryption verified.'}
                      </span>
                      <span className="text-brand-teal font-bold">{Math.round(scrubProgress)}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-brand-teal h-full transition-all duration-300 rounded-full"
                        style={{ width: `${scrubProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 justify-end pt-2">
                    <button 
                      onClick={() => setFile(null)} 
                      className="px-4 py-2 border border-white/10 hover:border-white/20 text-xs font-semibold rounded-lg text-on-surface transition-colors"
                    >
                      Clear File
                    </button>
                    {!isScrubComplete && (
                      <div className="text-xs text-brand-teal animate-pulse">Scrubbing in progress...</div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* CTA Box: Encourages user conversion and active participation in the movement */}
      <section id="impact" className="py-12 px-6 max-w-[1200px] mx-auto w-full">
        <div className="glass-card glass-border p-8 md:p-12 text-center flex flex-col items-center bg-gradient-to-b from-white/[0.04] to-transparent">
          <h2 className="font-sora text-3xl md:text-4xl font-bold tracking-tight mb-4 max-w-xl">
            Join the movement for a transparent Bangladesh.
          </h2>
          <p className="text-on-surface/60 text-sm mb-8 max-w-md">
            Join 100,000+ citizens protecting our future.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button className="w-full sm:w-auto px-8 py-3 bg-brand-red hover:bg-brand-red/90 text-white font-semibold rounded-lg text-sm interactive-hover">
              Report an Incident
            </button>
            <button className="w-full sm:w-auto px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-on-surface font-semibold rounded-lg text-sm interactive-hover">
              Support the Cause
            </button>
          </div>
        </div>
      </section>

      {/* Footer: Legal rights, partner details, and global security links */}
      <footer className="mt-auto border-t border-white/5 py-12 px-6 bg-black/40">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <LogoIcon />
              <span className="font-sora font-bold text-lg tracking-tight text-white">Truth Uncovered</span>
            </div>
            <p className="text-xs text-on-surface/40 text-center md:text-left max-w-xs">
              © 2026 Truth Uncovered. Secure & Anonymous Whistleblowing. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-xs text-on-surface/70">
            <a href="#rights" className="hover:text-brand-teal transition-colors">Legal Rights</a>
            <a href="#privacy" className="hover:text-brand-teal transition-colors">Privacy Protocol</a>
            <a href="#partners" className="hover:text-brand-teal transition-colors">NGO Partners</a>
            <a href="#contact" className="hover:text-brand-teal transition-colors">Secure Contact</a>
          </div>

          <div className="flex items-center gap-4 text-on-surface/50">
            <GlobeIcon />
            <ShieldIcon className="w-5 h-5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
          </div>

        </div>
      </footer>

    </div>
  );
}
