'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AnalyzerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const isDbMode = mode === 'db';

  const [query, setQuery] = useState('');
  const [intent, setIntent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  async function handleAnalyze() {
    if (!query.trim()) return;
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql_query: query, intent })
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setAnalyzing(false);
        return;
      }

      // Encode result and open in new tab
      sessionStorage.setItem('queryresults', JSON.stringify(data));
window.open('/results', '_blank');

    } catch (e) {
      setError('Could not reach backend. Is FastAPI running?');
    }
    setAnalyzing(false);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-mono flex flex-col">

      {/* Header */}
      <div className="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-green-400 tracking-widest uppercase">⚡ QueryMind</h1>
          <p className="text-gray-500 text-xs mt-1 tracking-wider">
            {isDbMode ? '● Database Connected' : '○ Static Mode'}
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 px-4 py-2 rounded text-xs tracking-wider transition-colors"
        >
          ← Home
        </button>
      </div>

      {/* Main — full height, no dead space */}
      <div className="flex-1 flex flex-col px-8 py-8 gap-4">

        {!isDbMode && (
          <div className="border border-yellow-800 bg-yellow-950 rounded px-4 py-2 text-yellow-400 text-xs">
            ○ Static mode — schema-aware checks disabled. Connect to a database on the home page for full analysis.
          </div>
        )}

        {error && (
          <div className="border border-red-800 bg-red-950 rounded px-4 py-2 text-red-400 text-xs">
            ⚠ {error}
          </div>
        )}

        {/* Query input — takes all remaining space */}
        <div className="flex-1 border border-gray-800 rounded-lg p-6 bg-gray-900 flex flex-col gap-4">

          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase">SQL Query</h2>
            <span className="text-xs text-gray-600">Results open in new tab</span>
          </div>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM students WHERE major='English'"
            className="flex-1 w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-sm text-green-300 focus:outline-none focus:border-green-500 transition-colors resize-none font-mono leading-relaxed"
            style={{ minHeight: '300px' }}
          />

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
              Optimization Goal
            </label>
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value="">No specific goal</option>
              <option value="Maximize query speed — prioritize index usage and avoid full table scans">Maximize Speed</option>
              <option value="Minimize memory usage — avoid sorting large datasets and unnecessary columns">Minimize Memory Usage</option>
              <option value="Optimizing for a large dataset with millions of rows">Large Dataset</option>
              <option value="Optimizing for a small dataset with few rows">Small Dataset</option>
              <option value="Read-heavy system — optimize for fast SELECT performance">Read Heavy System</option>
              <option value="Write-heavy system — minimize index overhead on writes">Write Heavy System</option>
            </select>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !query.trim()}
            className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-bold py-3 rounded text-sm tracking-wider transition-colors"
          >
            {analyzing ? 'Analyzing — this may take 10-20 seconds...' : 'Analyze Query →'}
          </button>

        </div>
      </div>
    </main>
  );
}

export default function AnalyzerPage() {
  return (
    <Suspense>
      <AnalyzerContent />
    </Suspense>
  );
}