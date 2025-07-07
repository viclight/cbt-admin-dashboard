import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublishedQuestions, saveTestSession } from '@/lib/database';

const Test = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(new Date().toISOString());

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(user);
    setCurrentUser(userData);
    // Load published questions from online admin, filtered by subject if available
    (async () => {
      try {
        const publishedQuestions = await getPublishedQuestions(subject, 20);
        console.log('Fetched questions for subject', subject, publishedQuestions);
        setQuestions(Array.isArray(publishedQuestions) ? publishedQuestions : []);
      } catch (err) {
        console.error('Error fetching published questions:', err);
        setQuestions([]);
      }
    })();
  }, [navigate, subject]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });
    return correctAnswers;
  };

  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const score = calculateScore();
    const timeSpent = (30 * 60) - timeRemaining; // in seconds
    const payload = {
      user_id: currentUser.id,
      subject: subject || '',
      score,
      total_questions: questions.length,
      time_spent: timeSpent,
      completed_at: new Date().toISOString()
    };
    try {
      console.log('Submitting test payload:', payload);
      await saveTestSession(
        currentUser.id,
        subject || '',
        score,
        questions.length,
        timeSpent,
        startTime
      );
      navigate('/results', {
        state: {
          score,
          totalQuestions: questions.length,
          timeSpent,
          subject,
          selectedAnswers,
          questions
        }
      });
      // Save result to localStorage for persistence
      localStorage.setItem('lastTestResult', JSON.stringify({
        score,
        totalQuestions: questions.length,
        timeSpent,
        subject,
        selectedAnswers,
        questions
      }));
    } catch (error) {
      console.error('Error saving test session:', error);
      alert('Failed to submit test: ' + (error?.message || error));
    }
    setIsSubmitting(false);
  };

  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length;
  };

  if (!currentUser || questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold capitalize">
                {subject} Test
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-lg font-semibold">
                  <Clock className="w-5 h-5 mr-2 text-red-500" />
                  <span className={timeRemaining < 300 ? 'text-red-500' : 'text-gray-700'}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{getAnsweredCount()} answered</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>
        </Card>

        {/* Question */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-6 leading-relaxed">
              {currentQuestion.question_text}
            </h2>
            
            <div className="space-y-4">
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionText = currentQuestion[`option_${option.toLowerCase()}`];
                const isSelected = selectedAnswers[currentQuestionIndex] === option;
                
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 text-sm font-semibold ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 text-gray-500'
                      }`}>
                        {option}
                      </span>
                      <span className="text-lg">{optionText}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex space-x-4">
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmitTest}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Test'}
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
            
            {getAnsweredCount() < questions.length && (
              <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-700">
                  You have {questions.length - getAnsweredCount()} unanswered questions remaining.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Test;
