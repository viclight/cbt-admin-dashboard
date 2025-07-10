"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Questions", href: "/dashboard/questions" },
  { name: "Results", href: "/dashboard/results" },
  { name: "Users", href: "/dashboard/users" },
  { name: "Classes", href: "/dashboard/classes" },
];

interface Admin {
  role: string;
  email: string;
  fullName: string;
}
interface Stats {
  questions: number;
  results: number;
  users: number;
  bySubject: Record<string, number>;
  byDifficulty: Record<string, number>;
}

export default function DashboardPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      window.location.href = "/";
      return;
    }
    // Decode JWT to get role
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setAdmin({ role: payload.role, email: payload.email, fullName: payload.fullName });
      setLoading(false);
    } catch {
      setAdmin(null);
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    if (!admin) return;
    async function fetchStats() {
      const [questions, results, users] = await Promise.all([
        fetch("/api/questions").then(r => r.json()),
        fetch("/api/results").then(r => r.json()),
        fetch("/api/users").then(r => r.json()),
      ]);
      setStats({
        questions: questions.questions?.length || 0,
        results: results.results?.length || 0,
        users: users.users?.length || 0,
        bySubject: groupBy(questions.questions || [], "subject"),
        byDifficulty: groupBy(questions.questions || [], "difficulty"),
      });
    }
    fetchStats();
  }, [admin]);

  function groupBy<T extends Record<string, unknown>>(arr: T[], key: keyof T) {
    return arr.reduce((acc, item) => {
      const k = item[key];
      if (typeof k === 'string') {
        acc[k] = (acc[k] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      <aside className="w-64 bg-white shadow h-screen p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-8">CBT Admin</h2>
        <nav className="flex-1 space-y-4">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="block py-2 px-4 rounded hover:bg-blue-100 font-medium">
              {item.name}
            </Link>
          ))}
        </nav>
        <button
          className="mt-8 bg-red-500 text-white py-2 rounded hover:bg-red-600"
          onClick={() => {
            localStorage.removeItem("adminToken");
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </aside>
      <section className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        {admin && (
          <div className="mb-4 text-gray-700">Role: <span className="font-semibold">{admin.role}</span></div>
        )}
        {/* Only super admin can see user management */}
        {admin?.role === 'superadmin' && (
          <div className="mb-4 p-4 bg-yellow-100 rounded">Super Admin: You have full access to all features.</div>
        )}
        {/* Only admin and superadmin can see analytics */}
        {(admin?.role === 'admin' || admin?.role === 'superadmin') && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded shadow p-6 text-center">
              <div className="text-2xl font-bold">{stats.questions}</div>
              <div className="text-gray-600">Questions</div>
            </div>
            <div className="bg-white rounded shadow p-6 text-center">
              <div className="text-2xl font-bold">{stats.results}</div>
              <div className="text-gray-600">Results</div>
            </div>
            <div className="bg-white rounded shadow p-6 text-center">
              <div className="text-2xl font-bold">{stats.users}</div>
              <div className="text-gray-600">Users</div>
            </div>
          </div>
        )}
        {/* Only editor and above can see questions management link */}
        {(admin?.role === 'editor' || admin?.role === 'admin' || admin?.role === 'superadmin') && (
          <div className="mb-4">You can manage questions.</div>
        )}
        {/* Viewer role: read-only */}
        {admin?.role === 'viewer' && (
          <div className="mb-4 text-blue-700">Viewer: You have read-only access.</div>
        )}
        {/* Analytics charts */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded shadow p-6">
              <h2 className="font-bold mb-2">Questions by Subject</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={Object.entries(stats.bySubject).map(([k, v]) => ({ name: k, value: v }))}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded shadow p-6">
              <h2 className="font-bold mb-2">Questions by Difficulty</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={Object.entries(stats.byDifficulty).map(([k, v]) => ({ name: k, value: v }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {Object.entries(stats.byDifficulty).map((entry, idx) => (
                      <Cell key={entry[0]} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
