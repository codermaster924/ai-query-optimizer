'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost', user: '', password: '', database: ''
  });
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
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
        setTimeout(() => router.push('/analyzer?mode=db'), 1500);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Could not reach backend. Is FastAPI running?');
    }
    setConnecting(false);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-mono flex flex-col">

      {/* Header */}
      <div className="border-b border-gray-800 px-8 py-5">
        <h1 className="text-xl font-bold text-green-400 tracking-widest uppercase">⚡ QueryMind</h1>
        <p className="text-gray-500 text-xs mt-1 tracking-wider">AI-Powered SQL Optimizer</p>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center flex-1 px-8 py-16">
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight text-center">
          Optimize your SQL queries<br />
          <span className="text-green-400">with AI precision</span>
        </h2>
        <p className="text-gray-400 text-center max-w-xl mb-12 text-sm leading-relaxed">
          Connect to your database for full schema-aware analysis, or jump straight in for instant static analysis — no connection needed.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-4xl">

          {/* Connect to DB */}
          <div className="border border-gray-800 rounded-lg p-6 bg-gray-900">
            <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-1">
              Full Analysis
            </h3>
            <p className="text-gray-500 text-xs mb-5">
              Connect to your MySQL database for schema-aware optimization, index detection, and AI recommendations.
            </p>

            {['host', 'user', 'password', 'database'].map((field) => (
              <div key={field} className="mb-3">
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">{field}</label>
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  value={dbConfig[field]}
                  onChange={(e) => setDbConfig({ ...dbConfig, [field]: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-green-500 transition-colors"
                  placeholder={field === 'host' ? 'localhost' : field}
                />
              </div>
            ))}

            {error && (
              <p className="text-red-400 text-xs mb-3">⚠ {error}</p>
            )}

            {connected ? (
              <div className="w-full mt-2 bg-green-500 text-gray-950 font-bold py-2 rounded text-sm tracking-wider text-center">
                ✓ Connected — Redirecting...
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full mt-2 bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-bold py-2 rounded text-sm tracking-wider transition-colors"
              >
                {connecting ? 'Connecting...' : 'Connect & Analyze'}
              </button>
            )}
          </div>

          {/* Static Analysis */}
          <div className="border border-gray-800 rounded-lg p-6 bg-gray-900 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-1">
                Static Analysis
              </h3>
              <p className="text-gray-500 text-xs mb-5">
                No database needed. Instantly detect common SQL anti-patterns — SELECT *, cartesian products, NATURAL JOINs, subqueries, and more.
              </p>
              <ul className="text-gray-400 text-xs space-y-2 mb-8">
                {[
                  'SELECT * detection',
                  'NATURAL JOIN warning',
                  'Cartesian product detection',
                  'Leading wildcard LIKE',
                  'Subquery in IN clause',
                  'DISTINCT analysis',
                  'OR in WHERE clause',
                  'AI-powered rewrite'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => router.push('/analyzer?mode=static')}
              className="w-full border border-yellow-600 hover:border-yellow-400 text-yellow-400 hover:text-yellow-300 font-bold py-2 rounded text-sm tracking-wider transition-colors"
            >
              Analyze Without DB →
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}