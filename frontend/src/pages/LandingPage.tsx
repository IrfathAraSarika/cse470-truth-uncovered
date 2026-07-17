import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import zkPadlock from '../assets/zk_padlock.png';

interface MetadataItem {
  key: string;
  original: string;
  scrubbed: string;
  status: 'pending' | 'scrubbing' | 'scrubbed';
}

export default function LandingPage() {
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

  return (
    <div className="min-h-screen bg-[#080808] text-[#e5e2e1] font-sans antialiased selection:bg-[#ff5634]/30 selection:text-[#ffb4a4] overflow-x-hidden">
      
      {/* Background radial gradient glow for atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,86,52,0.08)_0%,transparent_70%)] rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,172,180,0.05)_0%,transparent_70%)] rounded-full blur-[80px]" />
      </div>

      {/* Header / Navbar */}
      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-md bg-[#080808]/60 sticky top-0">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-[#ff5634]/40 bg-[#ff5634]/10">
              <span className="absolute w-5 h-5 rounded-full border border-[#ff5634] animate-ping opacity-45" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5634]" />
            </div>
            <span className="font-['Sora'] font-bold text-lg tracking-tight text-white">
              Truth <span className="text-[#ffb4a4]">Uncovered</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-10 text-base font-semibold text-gray-400">
            <a href="#platform" className="hover:text-white transition-colors duration-200">Platform</a>
            <a href="#data-map" className="hover:text-white transition-colors duration-200">Data Map</a>
            <a href="#impact" className="hover:text-white transition-colors duration-200">Impact</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-base font-bold text-gray-300 hover:text-white transition-colors">
              Login
            </Link>
            <Link 
              to="/signup" 
              className="bg-[#ff5634] hover:bg-[#ff4320] text-white text-sm font-bold px-5 py-2.5 rounded-[4px] transition-all duration-200 shadow-md shadow-[#ff5634]/10 hover:shadow-[#ff5634]/20"
            >
              Sign Up
            </Link>
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

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/submit-report" 
              className="w-full sm:w-auto bg-[#ff5634] hover:bg-[#ff4320] text-white font-medium px-6 py-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2 group"
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Security Protocol
            </a>
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

        {/* THE PLATFORM ARCHITECTURE */}
        <section id="platform" className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-['Sora'] text-4xl font-bold text-white mb-4 tracking-tight">The Platform Architecture</h2>
            <p className="text-base text-gray-400 leading-relaxed font-['Inter']">
              Five core modules designed for absolute anonymity, ironclad security, and systemic accountability.
            </p>
          </div>

          {/* Grid Layout matching reference layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Card 1 */}
            <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
              <div className="h-full rounded-xl bg-[#131313]/25 border border-white/[0.03] p-8 flex flex-col justify-between hover:border-[#ff5634]/30 hover:bg-[#131313]/40 transition-all duration-300 group">
                <div>
                  <div className="w-10 h-10 rounded-[8px] bg-[#ff5634]/10 border border-[#ff5634]/20 flex items-center justify-center mb-6">
                    <svg className="w-5 h-5 text-[#ff5634]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-['Sora'] text-xl font-semibold text-white mb-3">Structured Incident Report Builder</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    Guide-driven data collection ensuring reports are legally actionable and systemically categorised for maximum impact.
                  </p>
                </div>
                <Link to="/submit-report" className="text-xs font-bold text-[#ffb4a4] tracking-widest uppercase flex items-center gap-1 hover:text-white transition-colors duration-200 mt-auto">
                  Explore Module
                  <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
              <div className="h-full rounded-xl bg-[#131313]/25 border border-white/[0.03] p-8 flex flex-col justify-between hover:border-[#00ADB5]/30 hover:bg-[#131313]/40 transition-all duration-300 group">
                <div>
                  <div className="w-10 h-10 rounded-[8px] bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center mb-6">
                    <svg className="w-5 h-5 text-[#00ADB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <h3 className="font-['Sora'] text-xl font-semibold text-white mb-3">Encrypted Evidence Vault Uploader</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    Secure multi-format file uploads protected by zero-knowledge encryption and automatic metadata scrubbing.
                  </p>
                </div>
                <Link to="/evidence-vault" className="text-xs font-bold text-[#00ADB5] tracking-widest uppercase flex items-center gap-1 hover:text-white transition-colors duration-200 mt-auto">
                  Secure Upload
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 3 */}
            <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent relative overflow-hidden">
              <div className="h-full rounded-xl bg-[#131313]/25 border border-white/[0.03] p-6 hover:border-[#00ADB5]/30 hover:bg-[#131313]/40 transition-all duration-300 flex flex-col justify-between min-h-[220px] relative z-10">
                <div>
                  <div className="w-8 h-8 rounded-[6px] bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center mb-4">
                    <svg className="w-4 h-4 text-[#00ADB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="font-['Sora'] text-base font-semibold text-white mb-2">Anonymous Submission Mode</h3>
                  <p className="text-[13px] text-gray-400 leading-relaxed">
                    IP obfuscation and burner credentials protect your physical identity during the entire process.
                  </p>
                </div>
                <Link to="/submit-anonymous" className="text-xs font-bold text-[#00ADB5] uppercase mt-4">Open Anonymous Mode</Link>
                {/* Watermark */}
                <div className="absolute right-[-20px] bottom-[-20px] text-[40px] font-black tracking-widest text-white/[0.015] select-none pointer-events-none font-sans uppercase">
                  Incognito
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
              <div className="h-full rounded-xl bg-[#131313]/25 border border-white/[0.03] p-6 hover:border-[#00ADB5]/30 hover:bg-[#131313]/40 transition-all duration-300 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="w-8 h-8 rounded-[6px] bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center mb-4">
                    <svg className="w-4 h-4 text-[#00ADB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-['Sora'] text-base font-semibold text-white mb-2">Structured Case Lifecycle Tracker</h3>
                  <p className="text-[13px] text-gray-400 leading-relaxed">
                    Real-time status updates on report verification, media handoff, and legal escalation stages.
                  </p>
                </div>
                <Link to="/case-tracker" className="text-xs font-bold text-[#00ADB5] uppercase mt-4">Track a Case</Link>
              </div>
            </div>

            {/* Card 5 */}
            <div className="rounded-xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
              <div className="h-full rounded-xl bg-[#131313]/25 border border-white/[0.03] p-6 hover:border-[#00ADB5]/30 hover:bg-[#131313]/40 transition-all duration-300 flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="w-8 h-8 rounded-[6px] bg-[#00ADB5]/10 border border-[#00ADB5]/20 flex items-center justify-center mb-4">
                    <svg className="w-4 h-4 text-[#00ADB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="font-['Sora'] text-base font-semibold text-white mb-2">Multi-Admin Verification Panel</h3>
                  <p className="text-[13px] text-gray-400 leading-relaxed">
                    Decentralized verification by Independent NGOs to prevent single points of failure or corruption.
                  </p>
                </div>
                <Link to="/admin/verification" className="text-xs font-bold text-[#00ADB5] uppercase mt-4">Open Admin Panel</Link>
              </div>
            </div>
          </div>
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
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full border border-[#ff5634]/40 bg-[#ff5634]/10">
                  <span className="w-2 h-2 rounded-full bg-[#ff5634]" />
                </div>
                <span className="font-['Sora'] font-bold text-md tracking-tight text-white">
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
