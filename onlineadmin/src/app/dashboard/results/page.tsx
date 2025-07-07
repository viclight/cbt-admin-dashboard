"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Result {
  _id?: string;
  user: string;
  subject: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ subject: "" });

  useEffect(() => {
    fetchResults();
  }, []);

  async function fetchResults() {
    setLoading(true);
    const res = await fetch("/api/results");
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  }

  const filtered = results.filter(r =>
    (!search || r.user.toLowerCase().includes(search.toLowerCase())) &&
    (!filter.subject || r.subject === filter.subject)
  );
  const uniqueSubjects = Array.from(new Set(results.map(r => r.subject)));

  return (
    <main className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <Link href="/dashboard">
          <button className="bg-indigo-500 text-white px-4 py-2 rounded font-semibold hover:bg-indigo-700 shadow">
            ← Back to Dashboard
          </button>
        </Link>
        <input
          type="text"
          placeholder="Search by user..."
          className="border p-2 rounded shadow"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border p-2 rounded shadow"
          value={filter.subject}
          onChange={e => setFilter(f => ({ ...f, subject: e.target.value }))}
        >
          <option value="">All Subjects</option>
          {uniqueSubjects.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="ml-auto text-sm underline" onClick={fetchResults}>Refresh</button>
      </div>
      {loading ? (
        <div className="text-center text-lg text-gray-500 py-8">Loading results...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm rounded-lg overflow-hidden shadow-lg bg-white">
            <thead>
              <tr className="bg-indigo-100 text-indigo-800">
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Subject</th>
                <th className="p-2 text-left">Score</th>
                <th className="p-2 text-left">Total</th>
                <th className="p-2 text-left">Time Spent (s)</th>
                <th className="p-2 text-left">Completed At</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id} className="border-t hover:bg-indigo-50 transition-colors">
                  <td className="p-2 font-medium">{r.user}</td>
                  <td className="p-2">{r.subject}</td>
                  <td className="p-2">{r.score}</td>
                  <td className="p-2">{r.totalQuestions}</td>
                  <td className="p-2">{r.timeSpent}</td>
                  <td className="p-2">{new Date(r.completedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
