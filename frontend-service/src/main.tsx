import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AnonymousSubmission from './annynomous.tsx'
import './index.css'
import App from './App.tsx'
import Login from './login.tsx'
import Signup from './signup.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/report" element={<AnonymousSubmission />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)