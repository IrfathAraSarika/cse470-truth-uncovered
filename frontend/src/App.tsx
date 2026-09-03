import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AnonymousSubmissionPage from './pages/AnonymousSubmissionPage';
import LandingPage from './pages/LandingPage';
import AdminVerificationPage from './pages/AdminVerificationPage';
import UserDashboardPage from './pages/UserDashboardPage';
import DashboardPage from './pages/DashboardPage';
import ReportSubmissionPage from './pages/ReportSubmissionPage';
import EvidenceVaultPage from './pages/EvidenceVaultPage';
import CaseTrackerPage from './pages/CaseTrackerPage';
import MyReportsPage from './pages/MyReportsPage';
import OfflineDraftsPage from './pages/OfflineDraftsPage';
import VerificationPage from './pages/VerificationPage';
import DuplicateDetectionPage from './pages/DuplicateDetectionPage';
import FraudModerationPage from './pages/FraudModerationPage';
import FlaggedItemsPage from './pages/FlaggedItemsPage';
import ArticlesDirectoryPage from './pages/ArticlesDirectoryPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import HeatMapPage from './pages/HeatMapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RepositoryPage from './pages/RepositoryPage';

const FollowUpReportsPage = lazy(() => import('./pages/FollowUpReportsPage'));
const CorruptionHeatmapPage = lazy(() => import('./pages/CorruptionHeatmapPage'));
const InstitutionRankingsPage = lazy(() => import('./pages/InstitutionRankingsPage'));
const FameShamePage = lazy(() => import('./pages/FameShamePage'));
const AccountabilityPage = lazy(() => import('./pages/AccountabilityPage'));
const AdminAccountabilityPage = lazy(() => import('./pages/AdminAccountabilityPage'));

// Root route: show login at first if not logged in, otherwise show role-based dashboard
function RootRoute() {
  const userRaw = localStorage.getItem('user');
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw);
      if (user?.role) {
        return <DashboardPage />;
      }
    } catch {
      localStorage.removeItem('user');
    }
  }
  return <LoginPage />;
}

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
      <Suspense fallback={<div className="min-h-screen bg-bg-dark text-on-surface grid place-items-center text-sm font-bold">Loading feature...</div>}>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/repository" element={<RepositoryPage />} />
        <Route path="/heatmap" element={<HeatMapPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/submit-anonymous" element={<AnonymousSubmissionPage />} />
        <Route path="/submit-report" element={<ReportSubmissionPage />} />
        <Route path="/evidence-vault" element={<EvidenceVaultPage />} />
        <Route path="/case-tracker" element={<CaseTrackerPage />} />
        <Route path="/admin/verification" element={<AdminVerificationPage />} />
        <Route path="/admin/duplicate-detection" element={<DuplicateDetectionPage />} />
        <Route path="/admin/fraud-moderation" element={<FraudModerationPage />} />
        <Route path="/flagged-items" element={<FlaggedItemsPage />} />
        <Route path="/dashboard-old" element={<UserDashboardPage />} />
        <Route path="/my-reports" element={<MyReportsPage />} />
        <Route path="/offline-drafts" element={<OfflineDraftsPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/articles" element={<ArticlesDirectoryPage />} />
        <Route path="/articles/:slug" element={<ArticleDetailPage />} />
        <Route path="/case-follow-ups" element={<FollowUpReportsPage />} />
        <Route path="/corruption-heatmap" element={<CorruptionHeatmapPage />} />
        <Route path="/institution-rankings" element={<InstitutionRankingsPage />} />
        <Route path="/fame-shame" element={<FameShamePage />} />
        <Route path="/accountability" element={<AccountabilityPage />} />
        <Route path="/admin/accountability" element={<AdminAccountabilityPage />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
