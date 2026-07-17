import ReportForm from 'frontend/src/components/Reportform.tsx';

export default function ReportSubmissionPage() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      {/* Navbar mock - replacing with actual navbar later */}
      <nav className="border-b border-gray-800 px-8 py-4 flex justify-between items-center bg-[#0f1115]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600">
             <span className="text-sm">◎</span>
          </div>
          <span className="font-semibold tracking-wide text-gray-200">Truth Uncovered</span>
        </div>
        <button className="text-sm border border-gray-700 hover:bg-gray-800 px-4 py-1.5 rounded-md text-gray-300 transition">
          Sign Out
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">Citizen</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">File a New Report</h1>
          <p className="text-gray-400 text-sm">Your voice matters. Fill out the details below securely.</p>
        </div>

        {/* The Form Component */}
        <ReportForm />
        
      </main>
    </div>
  );
}