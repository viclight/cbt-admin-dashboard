import { useState, useEffect } from 'react';
import axios from 'axios';

export default function RobotCompetition() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [robotScore, setRobotScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [robotOption, setRobotOption] = useState('');
  const [robotCorrect, setRobotCorrect] = useState(null);

  useEffect(() => {
    axios.get('/api/ai-questions/subjects').then(res => {
      setSubjects(res.data.subjects);
      setClasses(res.data.classes);
    });
  }, []);

  const startGame = async () => {
    const res = await axios.post('/api/robot/start', { subject, className });
    setQuestions(res.data.questions);
    setStep(0);
    setUserScore(0);
    setRobotScore(0);
    setShowResult(false);
    setRobotOption('');
    setRobotCorrect(null);
  };

  const answer = async (option) => {
    const res = await axios.post('/api/robot/answer', {
      session_id: 'demo', // For now, not used
      question_id: questions[step].id,
      user_option: option
    });
    if (res.data.user_correct) setUserScore(userScore + 1);
    if (res.data.robot_correct) setRobotScore(robotScore + 1);
    setRobotOption(res.data.robot_option);
    setRobotCorrect(res.data.robot_correct);
    setTimeout(() => {
      setRobotOption('');
      setRobotCorrect(null);
      if (step + 1 < questions.length) setStep(step + 1);
      else setShowResult(true);
    }, 1000);
  };

  if (!questions.length) {
    return (
      <div>
        <h2>Compete with Robot</h2>
        <select value={subject} onChange={e => setSubject(e.target.value)}>
          <option value="">Select Subject</option>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={className} onChange={e => setClassName(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map(c => <option key={c}>{c}</option>)}
        </select>
        <button disabled={!subject || !className} onClick={startGame}>Start Competition</button>
      </div>
    );
  }

  if (showResult) {
    return (
      <div>
        <h2>Competition Over</h2>
        <p>Your Score: {userScore}</p>
        <p>Robot Score: {robotScore}</p>
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
      <p>Your Score: {userScore} | Robot Score: {robotScore}</p>
      {robotOption && (
        <div>
          <p>Robot chose: <b>{robotOption}</b> ({robotCorrect ? 'Correct' : 'Wrong'})</p>
        </div>
      )}
    </div>
  );
}
