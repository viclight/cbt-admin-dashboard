import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MillionaireLeaderboard() {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    axios.get('/api/millionaire/leaderboard').then(res => {
      setLeaders(res.data);
    });
  }, []);

  return (
    <div>
      <h2>Millionaire Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Score</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((l, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{l.username}</td>
              <td>{l.score}</td>
              <td>{new Date(l.achieved_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
