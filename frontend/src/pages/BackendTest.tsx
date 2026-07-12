// pages/BackendTest.tsx
import { useState, useEffect } from 'react';

const BackendTest = () => {
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    // Replace with your actual backend URL (e.g., http://localhost:5000/api/health)
    fetch('http://localhost:5000') 
      .then((res) => {
        if (res.ok) setStatus('✅ Connected to Backend Successfully!');
        else setStatus('❌ Backend responded with error.');
      })
      .catch((err) => {
        console.error(err);
        setStatus('❌ Could not connect to backend. Check console/CORS.');
      });
  }, []);

  return (
    <div className="p-4 bg-yellow-100 border-2 border-yellow-400 m-4 rounded">
      <h2 className="font-bold">Backend Connection Test</h2>
      <p>{status}</p>
    </div>
  );
};

export default BackendTest;