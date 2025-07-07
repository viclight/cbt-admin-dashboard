import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const StudentDashboard = () => {
  const router = useRouter();
  const [hasCompleted, setHasCompleted] = useState({});
  const [studentPhoto, setStudentPhoto] = useState('');

  useEffect(() => {
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
  }, []);

  return (
    <div>
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
      
      {/* ...existing code... */}
    </div>
  );
};

export default StudentDashboard;