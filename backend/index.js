import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import { syncQuestions } from './syncQuestions.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Initialize SQLite database
const db = new sqlite3.Database('./cbt.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    db.run('PRAGMA foreign_keys = ON'); // Enforce foreign key constraints
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      full_name TEXT,
      class_name TEXT,
      role TEXT,
      photo TEXT,
      created_at TEXT,
      reset_token TEXT,
      reset_token_expires INTEGER
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      subject TEXT,
      score INTEGER,
      total_questions INTEGER,
      time_spent INTEGER,
      completed_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      questions TEXT,
      class_name TEXT,
      student_id INTEGER,
      published INTEGER DEFAULT 0
    )`);
    // Add Millionaire leaderboard table
    db.run(`CREATE TABLE IF NOT EXISTS millionaire_leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      score INTEGER,
      achieved_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
  }
});

// Sync questions from online admin on server startup
db.serialize(async () => {
  try {
    await syncQuestions();
    console.log('Questions synced from online admin on startup.');
  } catch (err) {
    console.error('Failed to sync questions on startup:', err);
  }
});

// Example: Register user
app.post('/api/register', (req, res) => {
  console.log('Raw body received at /api/register:', req.body);
  if (!req.body || Object.keys(req.body).length === 0) {
    let rawData = '';
    req.on('data', chunk => { rawData += chunk; });
    req.on('end', () => {
      console.log('Raw data (as text):', rawData);
      res.status(400).json({ error: 'No JSON body received', raw: rawData });
    });
    return;
  }
  const { username, password, full_name, class_name, role, photo } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const createdAt = new Date().toISOString();
  db.run(
    'INSERT INTO users (username, password, full_name, class_name, role, photo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [username, hashedPassword, full_name || '', class_name || '', role || '', photo || '', createdAt],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'User already exists' });
      }
      res.json({ id: this.lastID, username, full_name, class_name, role, photo, created_at: createdAt });
    }
  );
});

// Example: Login user
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    (err, row) => {
      if (err || !row) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const isMatch = bcrypt.compareSync(password, row.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.json({ id: row.id, username: row.username });
    }
  );
});

// Save result (with all fields)
app.post('/api/results', (req, res) => {
  const { user_id, subject, score, total_questions, time_spent, completed_at } = req.body;
  console.log('Received /api/results payload:', req.body);
  console.log('Types:', {
    user_id: typeof user_id,
    subject: typeof subject,
    score: typeof score,
    total_questions: typeof total_questions,
    time_spent: typeof time_spent,
    completed_at: typeof completed_at
  });
  db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err) {
      console.error('Error querying user:', err);
      return res.status(400).json({ error: 'Database error', details: err.message });
    }
    if (!user) {
      console.error('User not found for user_id:', user_id);
      return res.status(400).json({ error: 'User does not exist', user_id });
    }
    db.run(
      'INSERT INTO results (user_id, subject, score, total_questions, time_spent, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, subject, score, total_questions, time_spent, completed_at],
      function (err2) {
        if (err2) {
          console.error('SQLite error on /api/results:', err2);
          return res.status(400).json({ error: 'Failed to save result', details: err2.message });
        }
        res.json({ id: this.lastID });
      }
    );
  });
});

// Get user results (with all fields)
app.get('/api/results/:user_id', (req, res) => {
  const { user_id } = req.params;
  db.all(
    'SELECT * FROM results WHERE user_id = ?',
    [user_id],
    (err, rows) => {
      if (err) {
        return res.status(400).json({ error: 'Failed to fetch results' });
      }
      res.json(rows);
    }
  );
});

// Create a new test
app.post('/api/tests', (req, res) => {
  const { title, questions, class_name, student_id } = req.body;
  db.run(
    'INSERT INTO tests (title, questions, class_name, student_id) VALUES (?, ?, ?, ?)',
    [title, JSON.stringify(questions), class_name || '', student_id || null],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to create test' });
      }
      res.json({ id: this.lastID });
    }
  );
});

// Get all tests
app.get('/api/tests', (req, res) => {
  db.all('SELECT * FROM tests', [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: 'Failed to fetch tests' });
    }
    // Parse questions JSON before sending
    const tests = rows.map(test => ({ ...test, questions: JSON.parse(test.questions) }));
    res.json(tests);
  });
});

// Edit a test (update questions or title)
app.put('/api/tests/:id', (req, res) => {
  const { id } = req.params;
  const { title, questions } = req.body;
  db.run(
    'UPDATE tests SET title = ?, questions = ? WHERE id = ?',
    [title, JSON.stringify(questions), id],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to update test' });
      }
      res.json({ success: true });
    }
  );
});

// Delete a test
app.delete('/api/tests/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM tests WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(400).json({ error: 'Failed to delete test' });
    }
    res.json({ success: true });
  });
});

// Publish a test (set published = 1)
app.post('/api/tests/:id/publish', (req, res) => {
  const { id } = req.params;
  console.log('Publish request for test id:', id); // Debug log
  db.run('UPDATE tests SET published = 1 WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('SQLite error during publish:', err); // Debug log
      return res.status(400).json({ error: 'Failed to publish test' });
    }
    console.log('Rows updated:', this.changes); // Debug log
    if (this.changes === 0) {
      return res.status(400).json({ error: 'No test found with this id' });
    }
    res.json({ success: true });
  });
});

// Get all published tests (for students)
app.get('/api/published-tests', (req, res) => {
  db.all('SELECT * FROM tests WHERE published = 1', [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: 'Failed to fetch published tests' });
    }
    const tests = rows.map(test => ({ ...test, questions: JSON.parse(test.questions) }));
    res.json(tests);
  });
});

// Get all users (for admin dashboard, with scores)
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, full_name, class_name, created_at FROM users', [], (err, users) => {
    if (err) {
      return res.status(400).json({ error: 'Failed to fetch users' });
    }
    // For each user, fetch their results
    const userIds = users.map(u => u.id);
    if (userIds.length === 0) return res.json([]);
    db.all('SELECT * FROM results WHERE user_id IN (' + userIds.map(() => '?').join(',') + ')', userIds, (err2, results) => {
      if (err2) {
        return res.status(400).json({ error: 'Failed to fetch results' });
      }
      // Group results by user_id
      const resultsByUser = {};
      results.forEach(r => {
        if (!resultsByUser[r.user_id]) resultsByUser[r.user_id] = [];
        resultsByUser[r.user_id].push({
          subject: r.subject,
          score: r.score,
          total_questions: r.total_questions,
          time_spent: r.time_spent,
          completed_at: r.completed_at
        });
      });
      // Map users to include their scores and class_name
      const usersWithScores = users.map(u => ({
        id: u.id,
        email: u.username,
        full_name: u.full_name || '',
        class_name: u.class_name || '',
        created_at: u.created_at || '',
        scores: resultsByUser[u.id] || []
      }));
      res.json(usersWithScores);
    });
  });
});

// Get all test sessions (for admin dashboard, with user info)
app.get('/api/results', (req, res) => {
  db.all('SELECT r.*, u.full_name, u.username FROM results r LEFT JOIN users u ON r.user_id = u.id', [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: 'Failed to fetch test sessions' });
    }
    res.json(rows);
  });
});

// Delete a user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(400).json({ error: 'Failed to delete user' });
    }
    res.json({ success: true });
  });
});

// Password reset request (send token)
app.post('/api/request-reset', (req, res) => {
  const { username } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'User not found' });
    }
    const token = Math.random().toString(36).substr(2, 8);
    const expires = Date.now() + 1000 * 60 * 30; // 30 min
    db.run('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expires, user.id], (err2) => {
      if (err2) return res.status(400).json({ error: 'Failed to set reset token' });
      // In production, send email. Here, return token for demo
      res.json({ token });
    });
  });
});

// Password reset (verify token and set new password)
app.post('/api/reset-password', (req, res) => {
  const { username, token, newPassword } = req.body;
  if (!username || !token || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'User not found' });
    if (!user.reset_token || !user.reset_token_expires || user.reset_token !== token || Date.now() > user.reset_token_expires) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.run('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashedPassword, user.id], (err2) => {
      if (err2) return res.status(400).json({ error: 'Failed to reset password' });
      res.json({ success: true });
    });
  });
});

// --- AI Question Generation & Game Endpoints ---

// Mock subjects and classes for WAEC
const waecSubjects = [
  "Mathematics", "English Language", "Biology", "Chemistry", "Physics",
  "Economics", "Government", "Literature in English", "Geography", "Agricultural Science"
];
const waecClasses = ["SS1", "SS2", "SS3"];

// Mock AI question generator (replace with real AI later)
function generateAIQuestions(subject, className, count = 50) {
  return Array.from({ length: count }).map((_, i) => ({
    id: i + 1,
    question: `(${subject} - ${className}) AI-generated Question #${i + 1}`,
    options: [
      "Option A", "Option B", "Option C", "Option D"
    ],
    answer: "Option A"
  }));
}

// Get available WAEC subjects and classes
app.get('/api/ai-questions/subjects', (req, res) => {
  res.json({ subjects: waecSubjects, classes: waecClasses });
});

// Get 50 AI-generated questions for a subject/class
app.post('/api/ai-questions', (req, res) => {
  const { subject, className } = req.body;
  if (!waecSubjects.includes(subject) || !waecClasses.includes(className)) {
    return res.status(400).json({ error: 'Invalid subject or class' });
  }
  const questions = generateAIQuestions(subject, className, 50);
  res.json({ questions });
});

// --- Millionaire Game Endpoints ---

// Start a new Millionaire game session
app.post('/api/millionaire/start', (req, res) => {
  const { user_id, subject, className } = req.body;
  // For now, just generate questions and return session info
  const questions = generateAIQuestions(subject, className, 50);
  // In production, save session to DB
  res.json({
    session_id: Math.random().toString(36).substr(2, 9),
    questions,
    trophy: false,
    prize: 0
  });
});

// Answer a question in Millionaire game
app.post('/api/millionaire/answer', (req, res) => {
  const { session_id, question_id, selected_option } = req.body;
  // For demo, always Option A is correct
  const correct = selected_option === "Option A";
  res.json({ correct });
});

// Claim trophy and prize
app.post('/api/millionaire/claim', (req, res) => {
  const { session_id, correctCount } = req.body;
  if (correctCount === 50) {
    res.json({ trophy: true, prize: 100000000 });
  } else {
    res.json({ trophy: false, prize: 0 });
  }
});

// Save Millionaire game result to leaderboard
app.post('/api/millionaire/leaderboard', (req, res) => {
  const { user_id, username, score } = req.body;
  if (!user_id || !username || typeof score !== 'number') {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const achieved_at = new Date().toISOString();
  db.run(
    'INSERT INTO millionaire_leaderboard (user_id, username, score, achieved_at) VALUES (?, ?, ?, ?)',
    [user_id, username, score, achieved_at],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to save leaderboard entry' });
      }
      res.json({ id: this.lastID });
    }
  );
});

// Get Millionaire leaderboard (top 10 scores)
app.get('/api/millionaire/leaderboard', (req, res) => {
  db.all(
    'SELECT username, score, achieved_at FROM millionaire_leaderboard ORDER BY score DESC, achieved_at ASC LIMIT 10',
    [],
    (err, rows) => {
      if (err) {
        return res.status(400).json({ error: 'Failed to fetch leaderboard' });
      }
      res.json(rows);
    }
  );
});

// --- Compete with Robot Endpoints ---

// Start a robot competition session
app.post('/api/robot/start', (req, res) => {
  const { user_id, subject, className } = req.body;
  const questions = generateAIQuestions(subject, className, 20);
  res.json({
    session_id: Math.random().toString(36).substr(2, 9),
    questions,
    user_score: 0,
    robot_score: 0
  });
});

// Answer a question in robot competition
app.post('/api/robot/answer', (req, res) => {
  const { session_id, question_id, user_option } = req.body;
  // Robot randomly picks an option
  const robot_option = ["Option A", "Option B", "Option C", "Option D"][Math.floor(Math.random() * 4)];
  const correct_answer = "Option A";
  const user_correct = user_option === correct_answer;
  const robot_correct = robot_option === correct_answer;
  res.json({
    user_correct,
    robot_option,
    robot_correct
  });
});

// Danger: This endpoint deletes all users and results. Protect in production!
app.post('/api/admin/clear-users', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM results', [], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete results' });
      }
      db.run('DELETE FROM users', [], (err2) => {
        if (err2) {
          return res.status(500).json({ error: 'Failed to delete users' });
        }
        res.json({ message: 'All users and results deleted.' });
      });
    });
  });
});

// Get single user (with photo)
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  db.get('SELECT id, username, full_name, class_name, photo FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
