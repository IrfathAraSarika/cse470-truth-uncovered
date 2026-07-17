import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AnonymousSubmissionPage from './pages/AnonymousSubmissionPage';
import LandingPage from './pages/LandingPage';
import AdminVerificationPage from './pages/AdminVerificationPage';
import UserDashboardPage from './pages/UserDashboardPage';
import ReportSubmissionPage from './pages/ReportSubmissionPage';
import EvidenceVaultPage from './pages/EvidenceVaultPage';
import CaseTrackerPage from './pages/CaseTrackerPage';
import MyReportsPage from './pages/MyReportsPage';
import OfflineDraftsPage from './pages/OfflineDraftsPage';
import VerificationPage from './pages/VerificationPage';

// Dummy page components just for the template
const Chat = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Chat Page</h1>
    <p>Real-time chat will go here.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      {/* The actual pages */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/submit-anonymous" element={<AnonymousSubmissionPage />} />
        <Route path="/submit-report" element={<ReportSubmissionPage />} />
        <Route path="/evidence-vault" element={<EvidenceVaultPage />} />
        <Route path="/case-tracker" element={<CaseTrackerPage />} />
        <Route path="/admin/verification" element={<AdminVerificationPage />} />
        <Route path="/dashboard" element={<UserDashboardPage />} />
        <Route path="/my-reports" element={<MyReportsPage />} />
        <Route path="/offline-drafts" element={<OfflineDraftsPage />} />
        <Route path="/verification" element={<VerificationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
