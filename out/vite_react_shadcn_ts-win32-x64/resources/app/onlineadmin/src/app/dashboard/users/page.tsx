"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  _id?: string;
  name: string;
  email: string;
  className: string;
  role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ className: "", role: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  const filtered = users.filter(u =>
    (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (!filter.className || u.className === filter.className) &&
    (!filter.role || u.role === filter.role)
  );
  const uniqueClasses = Array.from(new Set(users.map(u => u.className)));
  const uniqueRoles = Array.from(new Set(users.map(u => u.role)));

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
          placeholder="Search by name or email..."
          className="border p-2 rounded shadow"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border p-2 rounded shadow"
          value={filter.className}
          onChange={e => setFilter(f => ({ ...f, className: e.target.value }))}
        >
          <option value="">All Classes</option>
          {uniqueClasses.map(c => <option key={c}>{c}</option>)}
        </select>
        <select
          className="border p-2 rounded shadow"
          value={filter.role}
          onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}
        >
          <option value="">All Roles</option>
          {uniqueRoles.map(r => <option key={r}>{r}</option>)}
        </select>
        <button className="ml-auto text-sm underline" onClick={fetchUsers}>Refresh</button>
      </div>
      {loading ? (
        <div className="text-center text-lg text-gray-500 py-8">Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm rounded-lg overflow-hidden shadow-lg bg-white">
            <thead>
              <tr className="bg-indigo-100 text-indigo-800">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Class</th>
                <th className="p-2 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} className="border-t hover:bg-indigo-50 transition-colors">
                  <td className="p-2 font-medium">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.className}</td>
                  <td className="p-2 capitalize">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
