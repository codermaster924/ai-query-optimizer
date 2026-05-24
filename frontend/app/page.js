'use client';
import { useState } from 'react';

export default function Home() {
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    user: '',
    password: '',
    database: ''
  });
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [query, setQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/connect-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig)
      });
      const data = await res.json();
      if (data.success) {
        setConnected(true);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Could not reach backend. Is FastAPI running?');
    }
    setConnecting(false);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql_query: query })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError('Analysis failed. Is FastAPI running?');
    }
    setAnalyzing(false);
  }

  async function handleClearCache() {
    await fetch('http://localhost:8000/clear-cache', { method: 'POST' });
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-mono">

      {/* Header */}
      <div className="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-green-400 tracking-widest uppercase">
            ⚡ QueryMind
          </h1>
          <p className="text-gray-500 text-xs mt-1 tracking-wider">
            AI-Powered SQL Optimizer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">
            {connected ? 'Database Connected' : 'Not Connected'}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Panel — DB Connection */}
        <div className="lg:col-span-1">
          <div className="border border-gray-800 rounded-lg p-5 bg-gray-900">
            <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">
              Database Connection
            </h2>

            {['host', 'user', 'password', 'database'].map((field) => (
              <div key={field} className="mb-3">
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                  {field}
                </label>
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  value={dbConfig[field]}
                  onChange={(e) => setDbConfig({ ...dbConfig, [field]: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder={field === 'host' ? 'localhost' : field}
                />
              </div>
            ))}

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full mt-2 bg-green-500 hover:bg-green-400 disabled:bg-gray-700 text-gray-950 font-bold py-2 rounded text-sm tracking-wider transition-colors"
            >
              {connecting ? 'Connecting...' : connected ? '✓ Connected' : 'Connect'}
            </button>

            {connected && (
              <button
                onClick={handleClearCache}
                className="w-full mt-2 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 py-2 rounded text-xs tracking-wider transition-colors"
              >
                Clear Schema Cache
              </button>
            )}
          </div>
        </div>

        {/* Right Panel — Query + Results */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Query Input */}
          <div className="border border-gray-800 rounded-lg p-5 bg-gray-900">
            <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">
              SQL Query
            </h2>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={5}
              placeholder="SELECT * FROM students WHERE major='English'"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-green-300 focus:outline-none focus:border-green-500 transition-colors resize-none font-mono"
            />
            <button
              onClick={handleAnalyze}
              disabled={!connected || analyzing || !query}
              className="mt-3 bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-bold px-6 py-2 rounded text-sm tracking-wider transition-colors"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Query'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="border border-red-800 rounded-lg p-4 bg-red-950 text-red-400 text-sm">
              ⚠ {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="border border-gray-800 rounded-lg p-5 bg-gray-900 flex flex-col gap-5">
              <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                Analysis Results
              </h2>

              {/* Issues */}
              {result.issues && result.issues.length > 0 && (
                <div>
                  <h3 className="text-xs text-yellow-400 uppercase tracking-wider mb-2">
                    ⚠ Issues Detected
                  </h3>
                  {result.issues.map((issue, i) => (
                    <div key={i} className="border border-yellow-900 bg-yellow-950 rounded p-3 mb-2">
                      <p className="text-yellow-300 text-sm font-bold">{issue.issue}</p>
                      {issue.table && (
                        <p className="text-gray-400 text-xs mt-1">Table: {issue.table}</p>
                      )}
                      <p className="text-gray-300 text-xs mt-1">{issue.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* No issues */}
              {result.message && (
                <div className="border border-green-900 bg-green-950 rounded p-3 text-green-400 text-sm">
                  ✓ {result.message}
                </div>
              )}

              {/* AI Recommendation */}
              {result.ai_recommendations && (
                <div>
                  <h3 className="text-xs text-green-400 uppercase tracking-wider mb-2">
                    ⚡ AI Recommendation
                  </h3>
                  <div className="bg-gray-800 rounded p-4 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {result.ai_recommendations}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}