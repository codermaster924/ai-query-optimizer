'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ResultsContent() {
  const [result, setResult] = useState(null);
const [copied, setCopied] = useState(false);

useEffect(() => {
  try {
    const stored = sessionStorage.getItem('queryresults');
    if (stored) setResult(JSON.parse(stored));
  } catch {
    setResult(null);
  }
}, []);

  function handleCopy() {
    if (result?.optimized_query) {
      navigator.clipboard.writeText(result.optimized_query);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!result) {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 font-mono flex items-center justify-center">
        <p className="text-gray-500">No results found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-mono">

      {/* Header */}
      <div className="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-green-400 tracking-widest uppercase">⚡ QueryMind</h1>
          <p className="text-gray-500 text-xs mt-1 tracking-wider">Analysis Results</p>
        </div>
        <button
          onClick={() => window.close()}
          className="border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 px-4 py-2 rounded text-xs tracking-wider transition-colors"
        >
          ✕ Close
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 flex flex-col gap-6">

        {/* Original Query */}
        <div className="border border-gray-800 rounded-lg p-5 bg-gray-900">
          <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">Original Query</h2>
          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">{result.orginal_query}</pre>
        </div>

        {/* Issues */}
        {result.issues && result.issues.length > 0 && (
          <div className="border border-gray-800 rounded-lg p-5 bg-gray-900">
            <h2 className="text-xs font-bold tracking-widest text-yellow-400 uppercase mb-3">
              ⚠ Issues Detected ({result.issues.length})
            </h2>
            <div className="flex flex-col gap-2">
              {result.issues.map((issue, i) => (
                <div key={i} className="border border-yellow-900 bg-yellow-950 rounded p-3">
                  <p className="text-yellow-300 text-sm font-bold">{issue.issue}</p>
                  {issue.table && (
                    <p className="text-gray-400 text-xs mt-1">Table: {issue.table}</p>
                  )}
                  <p className="text-gray-300 text-xs mt-1">{issue.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No issues */}
        {result.message && (
          <div className="border border-green-900 bg-green-950 rounded-lg p-4 text-green-400 text-sm">
            ✓ {result.message}
          </div>
        )}

        {/* Optimized Query */}
        {result.optimized_query && (
          <div className="border border-gray-800 rounded-lg p-5 bg-gray-900">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold tracking-widest text-green-400 uppercase">
                ⚡ Optimized Query
              </h2>
              <button
                onClick={handleCopy}
                className="border border-gray-700 hover:border-green-500 text-gray-400 hover:text-green-400 px-3 py-1 rounded text-xs tracking-wider transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy Query'}
              </button>
            </div>
            <pre className="bg-gray-800 rounded p-4 text-sm text-green-300 font-mono whitespace-pre-wrap overflow-x-auto">
              {result.optimized_query}
            </pre>
          </div>
        )}

        {/* Explanation */}
        {result.explanation && (
          <div className="border border-gray-800 rounded-lg p-5 bg-gray-900">
            <h2 className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-3">
              Explanation
            </h2>
            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {result.explanation}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsContent />
    </Suspense>
  );
}