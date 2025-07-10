import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const StudentDashboard = () => {
  const router = useRouter();
  const [hasCompleted, setHasCompleted] = useState({});
  const [studentPhoto, setStudentPhoto] = useState('');
  const [questions, setQuestions] = useState([]);
  const [syncStatus, setSyncStatus] = useState('');
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    // Listen for sync progress from Electron
    if (window.cbtAPI?.onSyncProgress) {
      window.cbtAPI.onSyncProgress((data) => {
        setSyncStatus(data.message);
        if (data.status === 'progress') setProgress(`${data.current}/${data.total}`);
        else setProgress(null);
      });
    }
    // Fetch completed subjects for the current user from backend/localStorage
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (user && user.id) {
      fetch(`/api/results/${user.id}`)
        .then(res => res.json())
        .then(results => {
          const completed = {};
          (results || []).forEach(r => { completed[r.subject] = true; });
          setHasCompleted(completed);
        });
      // Fetch user photo from backend/localStorage
      fetch(`/api/users/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.photo) setStudentPhoto(data.photo);
        });
    }
    // Fetch published questions from online admin
    fetch('http://localhost:3000/api/sync/questions') // Change port if needed
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error('Failed to fetch questions:', err));
  }, []);

  const handleSync = async () => {
    setSyncStatus('Syncing...');
    setProgress(null);
    await window.cbtAPI?.syncQuestions();
  };

  const handleRetry = async () => {
    setSyncStatus('Retrying...');
    setProgress(null);
    await window.cbtAPI?.retrySync();
  };

  return (
    <div>
      <button onClick={handleSync}>Sync Questions from Online Admin</button>
      <div>{syncStatus} {progress && <span>({progress})</span>}</div>
      {syncStatus && syncStatus.toLowerCase().includes('error') && (
        <button onClick={handleRetry} style={{ color: 'red', marginLeft: 8 }}>Retry Sync</button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        {studentPhoto && (
          <img
            src={studentPhoto}
            alt="Passport"
            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginRight: 16, border: '2px solid #ddd' }}
          />
        )}
        <h1>Welcome to the Student Dashboard</h1>
      </div>

      {/* Display fetched questions */}
      <div style={{ marginBottom: 24 }}>
        <h2>Published Questions</h2>
        {questions.length === 0 ? (
          <p>No published questions available.</p>
        ) : (
          <ul>
            {questions.map((q, idx) => (
              <li key={q._id || idx}>{q.question || JSON.stringify(q)}</li>
            ))}
          </ul>
        )}
      </div>

      {/* ...existing dashboard content... */}

      {/* New button for Millionaire Game */}
      <button onClick={() => router.push('/millionaire-game')}>
        Who Wants to Be a Millionaire
      </button>
      {/* New button for Millionaire Leaderboard */}
      <button onClick={() => router.push('/millionaire-leaderboard')} style={{ marginLeft: 8 }}>
        Millionaire Leaderboard
      </button>

      {/* New button for Past Question Game */}
      <button
        onClick={() => router.push('/ai-game')}
        style={{ marginLeft: 8 }}
        disabled={hasCompleted['Past Question Game']}
      >
        Past Question Game {hasCompleted['Past Question Game'] ? '(Completed)' : ''}
      </button>
      
      {/* New button for Compete with Robot */}
      <button onClick={() => router.push('/robot-competition')} style={{ marginLeft: 8 }}>
        Compete with Robot
      </button>
    </div>
  );
};

export default StudentDashboard;