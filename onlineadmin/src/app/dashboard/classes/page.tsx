"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ClassItem {
  _id?: string;
  name: string;
  description?: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    setLoading(true);
    const res = await fetch("/api/classes");
    const data = await res.json();
    setClasses(data.classes || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { id: editingId, ...form } : form;
    const res = await fetch("/api/classes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setForm({ name: "", description: "" });
      setEditingId(null);
      fetchClasses();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this class?")) return;
    await fetch("/api/classes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchClasses();
  }

  function startEdit(c: ClassItem) {
    setEditingId(c._id!);
    setForm({ name: c.name, description: c.description || "" });
  }

  return (
    <main className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <Link href="/dashboard">
        <button className="bg-indigo-500 text-white px-4 py-2 rounded font-semibold hover:bg-indigo-700 shadow mb-4">
          ← Back to Dashboard
        </button>
      </Link>
      <h1 className="text-2xl font-bold mb-4">Classes Management</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-lg mb-6 max-w-xl border border-indigo-100">
        <h2 className="text-lg font-bold mb-4 text-indigo-700">{editingId ? "Edit" : "Add"} Class</h2>
        <div className="mb-2">
          <input
            className="border p-2 rounded w-full shadow"
            name="name"
            placeholder="Class name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div className="mb-2">
          <input
            className="border p-2 rounded w-full shadow"
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 shadow">
            {editingId ? "Update" : "Add"}
          </button>
          <button type="button" className="bg-gray-300 px-4 py-2 rounded shadow" onClick={() => { setEditingId(null); setForm({ name: "", description: "" }); }}>
            Cancel
          </button>
        </div>
      </form>
      {loading ? (
        <div className="text-center text-lg text-gray-500 py-8">Loading classes...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm rounded-lg overflow-hidden shadow-lg bg-white">
            <thead>
              <tr className="bg-indigo-100 text-indigo-800">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(c => (
                <tr key={c._id} className="border-t hover:bg-indigo-50 transition-colors">
                  <td className="p-2 font-medium">{c.name}</td>
                  <td className="p-2">{c.description}</td>
                  <td className="p-2">
                    <button className="text-blue-600 hover:underline mr-2 font-semibold" onClick={() => startEdit(c)}>Edit</button>
                    <button className="text-red-600 hover:underline font-semibold" onClick={() => handleDelete(c._id!)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
