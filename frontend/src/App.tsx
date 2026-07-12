import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AnonymousSubmissionPage from './pages/AnonymousSubmissionPage';
import LandingPage from './pages/LandingPage';
import AdminVerificationPage from './pages/AdminVerificationPage';
import UserDashboardPage from './pages/UserDashboardPage';

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
        <Route path="/submit-report" element={<AnonymousSubmissionPage />} />
        <Route path="/admin/verification" element={<AdminVerificationPage />} />
        <Route path="/dashboard" element={<UserDashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
