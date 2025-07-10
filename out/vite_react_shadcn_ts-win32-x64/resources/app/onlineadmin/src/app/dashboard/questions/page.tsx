"use client";
import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";

interface Question {
  _id?: string;
  subject: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  published?: boolean;
}

const defaultForm = {
  subject: "",
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: "A",
  difficulty: "medium",
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ subject: "", difficulty: "" });
  const [sort, setSort] = useState<{ field: string; dir: "asc" | "desc" }>({
    field: "subject",
    dir: "asc",
  });
  const [message, setMessage] = useState("");
  const [showBanner, setShowBanner] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const bannerTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    setLoading(true);
    const res = await fetch("/api/questions");
    const data = await res.json();
    setQuestions(data.questions || []);
    setLoading(false);
  }

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    idx?: number
  ) {
    if (typeof idx === "number") {
      const opts = [...form.options];
      opts[idx] = e.target.value;
      setForm({ ...form, options: opts });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  }

  function startEdit(q: Question) {
    setEditingId(q._id!);
    setForm({
      subject: q.subject,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
    });
    setShowForm(true);
  }

  function showFeedback(type: 'success' | 'error', message: string) {
    setShowBanner({ type, message });
    if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    bannerTimeout.current = setTimeout(() => setShowBanner(null), 3000);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { id: editingId, ...form } : form;
    const res = await fetch("/api/questions", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowForm(false);
      setForm(defaultForm);
      setEditingId(null);
      fetchQuestions();
      showFeedback('success', editingId ? "Question updated." : "Question added.");
    } else {
      showFeedback('error', "Error saving question.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question?")) return;
    const res = await fetch("/api/questions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchQuestions();
    if (res.ok) showFeedback('success', 'Question deleted.');
    else showFeedback('error', 'Error deleting question.');
  }

  // Bulk import/export helpers
  function handleExport() {
    const ws = XLSX.utils.json_to_sheet(questions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "questions_export.xlsx");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const imported = XLSX.utils.sheet_to_json(sheet);
      for (const q of imported) {
        await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(q),
        });
      }
      fetchQuestions();
    };
    reader.readAsBinaryString(file);
  }

  // Advanced: search, filter, sort
  const filtered = questions.filter(
    (q: Question) =>
      (!search ||
        q.questionText.toLowerCase().includes(search.toLowerCase())) &&
      (!filter.subject || q.subject === filter.subject) &&
      (!filter.difficulty || q.difficulty === filter.difficulty)
  );
  const sorted = filtered.sort((a: Question, b: Question) => {
    const valA = String(a[sort.field as keyof Question] ?? "");
    const valB = String(b[sort.field as keyof Question] ?? "");
    if (valA < valB) return sort.dir === "asc" ? -1 : 1;
    if (valA > valB) return sort.dir === "asc" ? 1 : -1;
    return 0;
  });

  const uniqueSubjects = Array.from(new Set(questions.map(q => q.subject)));
  const uniqueDifficulties = Array.from(new Set(questions.map(q => q.difficulty)));

  return (
    <main className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-indigo-800 mb-2">Manage Questions</h1>
          <p className="text-gray-600">Add, edit, publish, and manage exam questions for all subjects and classes.</p>
        </div>
        {showBanner && (
          <div className={`mb-4 px-4 py-3 rounded shadow text-white font-semibold ${showBanner.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{showBanner.message}</div>
        )}
        <div className="flex flex-wrap gap-4 mb-4 items-center bg-white p-4 rounded shadow">
          <Link href="/dashboard">
            <button className="bg-indigo-500 text-white px-4 py-2 rounded font-semibold hover:bg-indigo-700 shadow">
              ← Back to Dashboard
            </button>
          </Link>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 shadow"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(defaultForm);
            }}
          >
            Add Question
          </button>
          <input
            type="text"
            placeholder="Search questions..."
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
            {uniqueSubjects.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            className="border p-2 rounded shadow"
            value={filter.difficulty}
            onChange={e => setFilter(f => ({ ...f, difficulty: e.target.value }))}
          >
            <option value="">All Difficulties</option>
            {uniqueDifficulties.map(d => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <button
            className="ml-auto text-sm underline"
            onClick={fetchQuestions}
          >
            Refresh
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 shadow"
            onClick={handleExport}
          >
            Export XLSX
          </button>
          <label className="bg-gray-200 px-4 py-2 rounded cursor-pointer hover:bg-gray-300 shadow">
            Import XLSX
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          </label>
        </div>
        {message && <div className="mb-2 text-green-700 font-semibold">{message}</div>}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded shadow-lg mb-6 max-w-xl border border-indigo-100 mx-auto"
          >
            <h2 className="text-xl font-bold mb-4 text-indigo-700">
              {editingId ? "Edit" : "Add"} Question
            </h2>
            <div className="mb-2">
              <input
                className="border p-2 rounded w-full shadow"
                name="subject"
                placeholder="Subject (e.g. Mathematics)"
                value={form.subject}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="mb-2">
              <textarea
                className="border p-2 rounded w-full shadow"
                name="questionText"
                placeholder="Question text (e.g. What is 2 + 2?)"
                value={form.questionText}
                onChange={handleFormChange}
                required
                rows={3}
              />
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              {form.options.map((opt, idx) => (
                <input
                  key={idx}
                  className="border p-2 rounded shadow"
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  value={opt}
                  onChange={e => handleFormChange(e, idx)}
                  required
                />
              ))}
            </div>
            <div className="mb-2 flex gap-4">
              <label className="flex items-center">
                <span className="mr-2">Correct Answer:</span>
                <select
                  className="border p-2 rounded shadow"
                  name="correctAnswer"
                  value={form.correctAnswer}
                  onChange={handleFormChange}
                >
                  {form.options.map((_, idx) => (
                    <option key={idx} value={String.fromCharCode(65 + idx)}>
                      {String.fromCharCode(65 + idx)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center">
                <span className="mr-2">Difficulty:</span>
                <select
                  className="border p-2 rounded shadow"
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleFormChange}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 shadow"
              >
                {editingId ? "Update" : "Add"}
              </button>
              <button
                type="button"
                className="bg-gray-300 px-4 py-2 rounded shadow"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {loading ? (
          <div className="text-center text-lg text-gray-500 py-8">Loading questions...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
            <table className="w-full border text-sm rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-indigo-100 text-indigo-800">
                  <th
                    className="p-2 cursor-pointer text-left"
                    onClick={() =>
                      setSort(s => ({
                        field: "subject",
                        dir: s.dir === "asc" ? "desc" : "asc",
                      }))
                    }
                  >
                    Subject
                  </th>
                  <th
                    className="p-2 cursor-pointer text-left"
                    onClick={() =>
                      setSort(s => ({
                        field: "questionText",
                        dir: s.dir === "asc" ? "desc" : "asc",
                      }))
                    }
                  >
                    Question
                  </th>
                  <th className="p-2 text-left">Options</th>
                  <th className="p-2 text-left">Correct</th>
                  <th
                    className="p-2 cursor-pointer text-left"
                    onClick={() =>
                      setSort(s => ({
                        field: "difficulty",
                        dir: s.dir === "asc" ? "desc" : "asc",
                      }))
                    }
                  >
                    Difficulty
                  </th>
                  <th className="p-2 text-left">Actions</th>
                  <th className="p-2 text-left">Published</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(q => (
                  <tr key={q._id} className="border-t hover:bg-indigo-50 transition-colors">
                    <td className="p-2 font-medium">{q.subject}</td>
                    <td className="p-2 max-w-xs truncate" title={q.questionText}>
                      {q.questionText}
                    </td>
                    <td className="p-2">
                      <ul className="list-disc pl-4">
                        {q.options.map((opt, idx) => (
                          <li key={idx} className={q.correctAnswer === String.fromCharCode(65 + idx) ? "font-bold text-green-700" : ""}>
                            <span className="font-semibold mr-1">{String.fromCharCode(65 + idx)}.</span> {opt}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-2 font-bold text-green-700">{q.correctAnswer}</td>
                    <td className="p-2 capitalize">{q.difficulty}</td>
                    <td className="p-2">
                      <button
                        className="text-blue-600 hover:underline mr-2 font-semibold"
                        onClick={() => startEdit(q)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline font-semibold"
                        onClick={() => handleDelete(q._id!)}
                      >
                        Delete
                      </button>
                      {!q.published && (
                        <button
                          className="ml-2 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                          onClick={async () => {
                            await fetch(`/api/questions/${q._id}/publish`, { method: 'POST' });
                            fetchQuestions();
                            showFeedback('success', 'Question published!');
                          }}
                        >
                          Publish
                        </button>
                      )}
                    </td>
                    <td className="p-2">
                      {q.published ? (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Published</span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">Draft</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
