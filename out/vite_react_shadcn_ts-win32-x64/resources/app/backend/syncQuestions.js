const fetch = require('node-fetch');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = './cbt.db';

async function fetchQuestionsFromOnlineAdmin() {
  try {
    const response = await fetch('https://cbt-admin-dashboard-3.onrender.com/api/sync/questions');
    if (!response.ok) throw new Error('Failed to fetch questions');
    return await response.json();
  } catch (err) {
    throw new Error('Network error: ' + (err.message || err));
  }
}

function getLocalQuestionsHash(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT id FROM questions', (err, rows) => {
      if (err) return reject(new Error('DB error: ' + err.message));
      // Create a simple hash based on IDs
      const hash = rows.map(r => `${r.id}`).join('|');
      resolve(hash);
    });
  });
}

async function syncQuestions(progressCallback) {
  const db = new sqlite3.Database(DB_PATH);
  try {
    const onlineQuestions = await fetchQuestionsFromOnlineAdmin();
    const localHash = await getLocalQuestionsHash(db);
    const onlineHash = onlineQuestions.map(q => `${q._id}`).join('|');
    if (localHash === onlineHash) {
      db.close();
      if (progressCallback) progressCallback({ status: 'done', message: 'Questions already up to date.' });
      return 'Already up to date';
    }
    db.serialize(() => {
      db.run('DELETE FROM questions');
      const stmt = db.prepare('INSERT INTO questions (id, question, subject) VALUES (?, ?, ?)');
      onlineQuestions.forEach((q, idx) => {
        stmt.run(q._id, q.question, q.subject);
        if (progressCallback && (idx + 1) % 10 === 0) {
          progressCallback({ status: 'progress', current: idx + 1, total: onlineQuestions.length });
        }
      });
      stmt.finalize();
    });
    db.close();
    if (progressCallback) progressCallback({ status: 'done', message: 'Questions synced!' });
    return 'Questions synced!';
  } catch (err) {
    db.close();
    if (progressCallback) progressCallback({ status: 'error', message: err.message, canRetry: true });
    throw err;
  }
}

if (require.main === module) {
  syncQuestions();
}

module.exports = { syncQuestions };
