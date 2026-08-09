import React, { useEffect, useState } from 'react';

type Flag = {
  _id: string;
  text: string;
  reason?: string;
  createdAt: string;
  duplicateMatches: { id: string; score: number; excerpt?: string }[];
  fraudSignals: string[];
  status: 'pending' | 'verified' | 'rejected';
};

export default function AdminModerationPanel() {
  const [flags, setFlags] = useState<Flag[]>([]);
  useEffect(() => { load(); }, []);
  async function load() {
    const res = await fetch('/api/moderation/flags');
    const json = await res.json();
    setFlags(json);
  }

  async function setStatus(id: string, verified: boolean) {
    await fetch(`/api/moderation/flags/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified }),
    });
    load();
  }

  return (
    <div>
      <h2>Moderation Queue</h2>
      {flags.map(f => (
        <div key={f._id} className="flag">
          <p><strong>Created:</strong> {new Date(f.createdAt).toLocaleString()}</p>
          <p>{f.text}</p>
          <p><strong>Duplicate matches:</strong> {f.duplicateMatches?.length}</p>
          <p><strong>Fraud signals:</strong> {f.fraudSignals?.join(', ')}</p>
          <div>
            <button onClick={() => setStatus(f._id, true)}>Verify</button>
            <button onClick={() => setStatus(f._id, false)}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
