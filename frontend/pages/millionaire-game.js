import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MillionaireGame() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    axios.get('/api/ai-questions/subjects').then(res => {
      setSubjects(res.data.subjects);
      setClasses(res.data.classes);
    });
  }, []);

  const startGame = async () => {
    const res = await axios.post('/api/millionaire/start', { subject, className });
    setQuestions(res.data.questions);
    setStep(0);
    setScore(0);
    setShowResult(false);
  };

  const answer = (option) => {
    if (option === questions[step].answer) setScore(score + 1);
    if (step + 1 < questions.length) setStep(step + 1);
    else setShowResult(true);
  };

  if (!questions.length) {
    return (
      <div>
        <h2>Who Wants to Be a Millionaire</h2>
        <select value={subject} onChange={e => setSubject(e.target.value)}>
          <option value="">Select Subject</option>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={className} onChange={e => setClassName(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map(c => <option key={c}>{c}</option>)}
        </select>
        <button disabled={!subject || !className} onClick={startGame}>Start Game</button>
      </div>
    );
  }

  if (showResult) {
    return (
      <div>
        <h2>Game Over</h2>
        <p>Your Score: {score} / {questions.length}</p>
        {score === 50 && (
          <div>
            <h3>🏆 You win a trophy and $100,000,000!</h3>
          </div>
        )}
        <button onClick={() => setQuestions([])}>Play Again</button>
      </div>
    );
  }

  const q = questions[step];
  return (
    <div>
      <h2>Question {step + 1} / {questions.length}</h2>
      <p>{q.question}</p>
      {q.options.map(opt => (
        <button key={opt} onClick={() => answer(opt)} style={{ display: 'block', margin: '8px 0' }}>{opt}</button>
      ))}
      <p>Score: {score}</p>
    </div>
  );
}
