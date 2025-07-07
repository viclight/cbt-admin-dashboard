import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Leader {
  username: string;
  score: number;
  achieved_at: string;
}

const MillionaireLeaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    axios.get('/api/millionaire/leaderboard').then(res => {
      const data = res.data as Leader[];
      setLeaders(data);
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
};

export default MillionaireLeaderboard;
