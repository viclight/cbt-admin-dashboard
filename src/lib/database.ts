// Browser-compatible database implementation using localStorage
import bcrypt from 'bcryptjs';

// User operations
export const createUser = async (email: string, password: string, fullName: string, className: string) => {
  const response = await fetch('http://localhost:4000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password, full_name: fullName, class_name: className }) // send class_name to backend
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Registration failed');
  }
  const user = await response.json();
  return { id: user.id, email, fullName, className };
};

export const authenticateUser = async (email: string, password: string) => {
  const response = await fetch('http://localhost:4000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Invalid email or password');
  }
  const user = await response.json();
  return {
    id: user.id,
    email: user.username,
    fullName: user.username // Adjust if your backend returns full name
  };
};

// Request password reset (backend)
export const requestPasswordReset = async (email: string) => {
  const response = await fetch('http://localhost:4000/api/request-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to request password reset');
  }
  return await response.json(); // { token }
};

// Reset password (backend)
export const resetPassword = async (email: string, token: string, newPassword: string) => {
  const response = await fetch('http://localhost:4000/api/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, token, newPassword })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to reset password');
  }
  return await response.json();
};

// Admin operations
export const createAdmin = async (email: string, password: string, fullName: string, role: string, className: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Get existing admins
  const existingAdmins = JSON.parse(localStorage.getItem('cbt_admins') || '[]');
  
  // Check if email already exists
  if (existingAdmins.find((admin: any) => admin.email === email)) {
    throw new Error('Email already exists');
  }
  
  const newAdmin = {
    id: Date.now(),
    email,
    password: hashedPassword,
    full_name: fullName,
    role,
    class_name: className,
    created_at: new Date().toISOString()
  };
  
  existingAdmins.push(newAdmin);
  localStorage.setItem('cbt_admins', JSON.stringify(existingAdmins));
  
  return { id: newAdmin.id, email, fullName, role, className };
};

export const authenticateAdmin = async (email: string, password: string) => {
  const admins = JSON.parse(localStorage.getItem('cbt_admins') || '[]');
  const admin = admins.find((a: any) => a.email === email);
  
  if (!admin) {
    throw new Error('Invalid email or password');
  }
  
  const isValidPassword = await bcrypt.compare(password, admin.password);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }
  
  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.full_name
  };
};

// Enhanced question operations for admin
export const getAllQuestions = async (publishedOnly = false) => {
  const url = publishedOnly
    ? 'http://localhost:4000/api/published-tests'
    : 'http://localhost:4000/api/tests';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch questions');
  }
  const tests = await response.json();
  // Flatten all questions from all tests, add testId and subject
  return tests.flatMap((test: any) =>
    test.questions.map((q: any, idx: number) => ({
      ...q,
      testId: test.id,
      subject: test.title,
      questionIndex: idx,
      published: test.published
    }))
  );
};

export const deleteQuestion = async (testId: number, questionIndex: number) => {
  // Fetch the test
  const response = await fetch('http://localhost:4000/api/tests');
  const tests = await response.json();
  const test = tests.find((t: any) => t.id === testId);
  if (!test) throw new Error('Test not found');
  const updatedQuestions = test.questions.filter((_: any, idx: number) => idx !== questionIndex);
  const updateRes = await fetch(`http://localhost:4000/api/tests/${testId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: test.title, questions: updatedQuestions })
  });
  if (!updateRes.ok) throw new Error('Failed to delete question');
  return await updateRes.json();
};

export const addQuestion = async (
  subject: string,
  questionText: string,
  optionA: string,
  optionB: string,
  optionC: string,
  optionD: string,
  correctAnswer: string,
  difficulty: string = 'medium',
  className?: string,
  studentId?: string
) => {
  // Fetch all tests
  const response = await fetch('http://localhost:4000/api/tests');
  const tests = await response.json();
  let test = tests.find((t: any) => t.title.toLowerCase() === subject.toLowerCase() && t.class_name === (className || ''));
  if (!test) {
    // Create new test if not exists
    const createRes = await fetch('http://localhost:4000/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: subject,
        questions: [{
          question_text: questionText,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          option_d: optionD,
          correct_answer: correctAnswer,
          difficulty
        }],
        class_name: className || '',
        student_id: studentId || null
      })
    });
    if (!createRes.ok) throw new Error('Failed to add question');
    return await createRes.json();
  } else {
    // Add to existing test
    const updatedQuestions = [
      ...test.questions,
      {
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_answer: correctAnswer,
        difficulty
      }
    ];
    const updateRes = await fetch(`http://localhost:4000/api/tests/${test.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: subject, questions: updatedQuestions, class_name: className || '', student_id: studentId || null })
    });
    if (!updateRes.ok) throw new Error('Failed to add question');
    return await updateRes.json();
  }
};

export const editQuestion = async (testId: number, questionIndex: number, updatedQuestion: any) => {
  // Fetch the test
  const response = await fetch('http://localhost:4000/api/tests');
  const tests = await response.json();
  const test = tests.find((t: any) => t.id === testId);
  if (!test) throw new Error('Test not found');
  const updatedQuestions = test.questions.map((q: any, idx: number) => idx === questionIndex ? updatedQuestion : q);
  const updateRes = await fetch(`http://localhost:4000/api/tests/${testId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: test.title, questions: updatedQuestions })
  });
  if (!updateRes.ok) throw new Error('Failed to edit question');
  return await updateRes.json();
};

// Test session operations
export const saveTestSession = async (userId: number, subject: string, score: number, totalQuestions: number, timeSpent: number, startedAt: string) => {
  // Always send all required fields to backend
  const completedAt = new Date().toISOString();
  const response = await fetch('http://localhost:4000/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      subject,
      score,
      total_questions: totalQuestions,
      time_spent: timeSpent, // send as seconds
      completed_at: completedAt
    })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to save test result');
  }
  return await response.json();
};

export const getUserTestHistory = async (userId: number) => {
  const response = await fetch(`http://localhost:4000/api/results/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch test history');
  }
  return await response.json();
};

export const getUserStats = (userId: number) => {
  const sessions = JSON.parse(localStorage.getItem('cbt_test_sessions') || '[]');
  const userSessions = sessions.filter((s: any) => s.user_id === userId);
  
  if (userSessions.length === 0) {
    return {
      total_tests: 0,
      average_score: 0,
      best_score: 0,
      total_time_spent: 0
    };
  }
  
  const totalTests = userSessions.length;
  const averageScore = userSessions.reduce((sum: number, s: any) => sum + (s.score / s.total_questions * 100), 0) / totalTests;
  const bestScore = Math.max(...userSessions.map((s: any) => (s.score / s.total_questions * 100)));
  const totalTimeSpent = userSessions.reduce((sum: number, s: any) => sum + s.time_spent, 0);
  
  return {
    total_tests: totalTests,
    average_score: averageScore,
    best_score: bestScore,
    total_time_spent: totalTimeSpent
  };
};

// Create test
export const createTest = async (title: string, questions: any[]) => {
  const response = await fetch('http://localhost:4000/api/tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, questions })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to create test');
  }
  return await response.json();
};

// Initialize with comprehensive sample questions
export const initializeSampleData = () => {
  const existingQuestions = localStorage.getItem('cbt_questions');
  if (!existingQuestions) {
    const sampleQuestions = [
      // Mathematics Questions
      {
        id: 1,
        subject: 'Mathematics',
        question_text: 'What is the result of 15 + 27?',
        option_a: '42',
        option_b: '41',
        option_c: '43',
        option_d: '40',
        correct_answer: 'A',
        difficulty: 'easy',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        subject: 'Mathematics',
        question_text: 'If x = 5, what is the value of 3x + 2?',
        option_a: '15',
        option_b: '17',
        option_c: '13',
        option_d: '19',
        correct_answer: 'B',
        difficulty: 'medium',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        subject: 'Mathematics',
        question_text: 'What is the square root of 144?',
        option_a: '11',
        option_b: '13',
        option_c: '12',
        option_d: '14',
        correct_answer: 'C',
        difficulty: 'easy',
        created_at: new Date().toISOString()
      },
      {
        id: 4,
        subject: 'Mathematics',
        question_text: 'Solve for y: 2y - 8 = 10',
        option_a: '9',
        option_b: '8',
        option_c: '7',
        option_d: '6',
        correct_answer: 'A',
        difficulty: 'medium',
        created_at: new Date().toISOString()
      },
      {
        id: 5,
        subject: 'Mathematics',
        question_text: 'What is 25% of 80?',
        option_a: '15',
        option_b: '20',
        option_c: '25',
        option_d: '30',
        correct_answer: 'B',
        difficulty: 'easy',
        created_at: new Date().toISOString()
      },
      
      // English Questions
      {
        id: 6,
        subject: 'English',
        question_text: 'Which of the following is a noun?',
        option_a: 'Run',
        option_b: 'Beautiful',
        option_c: 'House',
        option_d: 'Quickly',
        correct_answer: 'C',
        difficulty: 'easy',
        created_at: new Date().toISOString()
      },
      {
        id: 7,
        subject: 'English',
        question_text: 'Choose the correct sentence:',
        option_a: 'She are going to school',
        option_b: 'She is going to school',
        option_c: 'She am going to school',
        option_d: 'She were going to school',
        correct_answer: 'B',
        difficulty: 'easy',
        created_at: new Date().toISOString()
      },
      {
        id: 8,
        subject: 'English',
        question_text: 'What is the past tense of "write"?',
        option_a: 'Written',
        option_b: 'Wrote',
        option_c: 'Writing',
        option_d: 'Writes',
        correct_answer: 'B',
        difficulty: 'medium',
        created_at: new Date().toISOString()
      },
      {
        id: 9,
        subject: 'English',
        question_text: 'Which word is spelled correctly?',
        option_a: 'Recieve',
        option_b: 'Receive',
        option_c: 'Receve',
        option_d: 'Receave',
        correct_answer: 'B',
        difficulty: 'medium',
        created_at: new Date().toISOString()
      },
      {
        id: 10,
        subject: 'English',
        question_text: 'What type of word is "quickly"?',
        option_a: 'Noun',
        option_b: 'Verb',
        option_c: 'Adjective',
        option_d: 'Adverb',
        correct_answer: 'D',
        difficulty: 'medium',
        created_at: new Date().toISOString()
      },
      
      // Science Questions
      {
        id: 11,
        subject: 'Science',
        question_text: 'What is the chemical symbol for water?',
        option_a: 'H2O',
        option_b: 'HO2',
        option_c: 'H3O',
        option_d: 'HO',
        correct_answer: 'A',
        difficulty: 'easy',
        created_at: new Date().toISOString()
      },
      {
        id: 12,
        subject: 'Science',
        question_text: 'Which planet is closest to the Sun?',
        option_a: 'Venus',
        option_b: 'Earth',
        option_c: 'Mercury',
        option_d: 'Mars',
        correct_answer: 'C',
        difficulty: 'easy',
        created_at: new Date().toISOString()
      },
      {
        id: 13,
        subject: 'Science',
        question_text: 'What gas do plants absorb from the atmosphere during photosynthesis?',
        option_a: 'Oxygen',
        option_b: 'Nitrogen',
        option_c: 'Carbon Dioxide',
        option_d: 'Hydrogen',
        correct_answer: 'C',
        difficulty: 'medium',
        created_at: new Date().toISOString()
      },
      {
        id: 14,
        subject: 'Science',
        question_text: 'What is the hardest natural substance on Earth?',
        option_a: 'Gold',
        option_b: 'Iron',
        option_c: 'Diamond',
        option_d: 'Silver',
        correct_answer: 'C',
        difficulty: 'medium',
        created_at: new Date().toISOString()
      },
      {
        id: 15,
        subject: 'Science',
        question_text: 'How many bones are in the adult human body?',
        option_a: '196',
        option_b: '206',
        option_c: '216',
        option_d: '186',
        correct_answer: 'B',
        difficulty: 'hard',
        created_at: new Date().toISOString()
      },
      
      // History Questions
      {
        id: 16,
        subject: 'History',
        question_text: 'In which year did World War II end?',
        option_a: '1944',
        option_b: '1945',
        option_c: '1946',
        option_d: '1943',
        correct_answer: 'B',
        difficulty: 'medium',
        created_at: new Date().toISOString()
      },
      {
        id: 17,
        subject: 'History',
        question_text: 'Who was the first President of the United States?',
        option_a: 'Thomas Jefferson',
        option_b: 'John Adams',
        option_c: 'George Washington',
        option_d: 'Benjamin Franklin',
        correct_answer: 'C',
        difficulty: 'easy',
        created_at: new Date().toISOString()
      },
      {
        id: 18,
        subject: 'History',
        question_text: 'The Great Wall of China was built to protect against invasions from which direction?',
        option_a: 'South',
        option_b: 'East',
        option_c: 'West',
        option_d: 'North',
        correct_answer: 'D',
        difficulty: 'medium',
        created_at: new Date().toISOString()
      },
      {
        id: 19,
        subject: 'History',
        question_text: 'Which ancient civilization built the pyramids?',
        option_a: 'Romans',
        option_b: 'Greeks',
        option_c: 'Egyptians',
        option_d: 'Babylonians',
        correct_answer: 'C',
        difficulty: 'easy',
        created_at: new Date().toISOString()
      },
      {
        id: 20,
        subject: 'History',
        question_text: 'In which year did the Berlin Wall fall?',
        option_a: '1987',
        option_b: '1989',
        option_c: '1991',
        option_d: '1985',
        correct_answer: 'B',
        difficulty: 'medium',
        created_at: new Date().toISOString()
      }
    ];
    
    localStorage.setItem('cbt_questions', JSON.stringify(sampleQuestions));
  }
};

// Call this when the app starts
initializeSampleData();

export const getQuestionsBySubject = async (subject: string, limit: number = 20) => {
  const response = await fetch('http://localhost:4000/api/tests');
  if (!response.ok) {
    throw new Error('Failed to fetch tests');
  }
  const tests = await response.json();
  // Find the test by subject (title)
  const test = tests.find((t: any) => t.title.toLowerCase() === subject.toLowerCase());
  if (!test) return [];
  // Shuffle and limit questions
  const shuffled = test.questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, limit);
};

export const getAllTestSessions = async () => {
  const response = await fetch('http://localhost:4000/api/results');
  if (!response.ok) {
    throw new Error('Failed to fetch test sessions');
  }
  return await response.json();
};

export const getAllUsers = async () => {
  const response = await fetch('http://localhost:4000/api/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return await response.json();
};

export const publishTest = async (testId: number) => {
  const response = await fetch(`http://localhost:4000/api/tests/${testId}/publish`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to publish test');
  }
  return await response.json();
};

export const getPublishedTests = async () => {
  const response = await fetch('http://localhost:4000/api/published-tests');
  if (!response.ok) {
    throw new Error('Failed to fetch published tests');
  }
  return await response.json();
};

export const getPublishedQuestions = async (subject?: string, limit: number = 20) => {
  let url = 'https://cbt-admin-dashboard-6.onrender.com/api/sync/questions';
  if (subject) {
    url += `?subject=${encodeURIComponent(subject)}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch published questions');
  }
  const questions = await response.json();
  // Shuffle and limit questions
  const shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, limit);
};
