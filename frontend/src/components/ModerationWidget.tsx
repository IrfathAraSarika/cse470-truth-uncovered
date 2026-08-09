import React, { useState } from 'react';

type CheckResult = {
  flagged: boolean;
  flagId?: string;
  duplicateMatches: { id: string; score: number; excerpt?: string }[];
  fraudSignals: string[];
};

export default function ModerationWidget() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/moderation/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      console.error(err);
      alert('Error checking content');
    } finally {
      setLoading(false);
    }
  }

  async function handleReport() {
    setLoading(true);
    try {
      const res = await fetch('/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, reason: 'User report from landing' }),
      });
      const json = await res.json();
      setResult(json);
      alert('Reported — an admin will review it.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="moderation-widget card">
      <h3>Check for duplicates / report fraud</h3>
      <form onSubmit={handleCheck}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={6} />
        <div>
          <button type="submit" disabled={loading}>Check</button>
          <button type="button" disabled={loading} onClick={handleReport}>Report</button>
        </div>
      </form>

      {result && (
        <div className="result">
          <p>Flagged: {result.flagged ? 'Yes' : 'No'}</p>
          {result.duplicateMatches?.length > 0 && (
            <>
              <h4>Duplicates</h4>
              <ul>
                {result.duplicateMatches.map(m => (
                  <li key={m.id}>{m.score.toFixed(2)} — {m.excerpt}</li>
                ))}
              </ul>
            </>
          )}
          {result.fraudSignals?.length > 0 && (
            <>
              <h4>Fraud signals</h4>
              <ul>{result.fraudSignals.map(s => <li key={s}>{s}</li>)}</ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
