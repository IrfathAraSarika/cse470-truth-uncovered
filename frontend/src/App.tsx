import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/login';
import Signup from './pages/signup';
import AnonymousSubmissionPage from './pages/annynomous';

// Dummy page components just for the template
const Home = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Home Page</h1>
    <p>Welcome to the app!</p>
  </div>
);

const Chat = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Chat Page</h1>
    <p>Real-time chat will go here.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      {/* A simple navigation bar for your team to see routing in action */}
      <nav className="p-4 bg-gray-200 flex gap-4">
        <Link to="/" className="text-blue-600 hover:underline">Home</Link>
        <Link to="/chat" className="text-blue-600 hover:underline">Chat</Link>
      </nav>

      {/* The actual pages */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/submit-anonymous" element={<AnonymousSubmissionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;