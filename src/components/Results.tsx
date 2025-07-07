import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Target, Home, CheckCircle, XCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  let { score, totalQuestions, timeSpent, subject, selectedAnswers, questions } = location.state || {};

  // If state is missing, try to load from localStorage
  if (score === undefined) {
    const lastResult = localStorage.getItem('lastTestResult');
    if (lastResult) {
      const parsed = JSON.parse(lastResult);
      score = parsed.score;
      totalQuestions = parsed.totalQuestions;
      timeSpent = parsed.timeSpent;
      subject = parsed.subject;
      selectedAnswers = parsed.selectedAnswers;
      questions = parsed.questions;
    }
  }

  if (score === undefined) {
    navigate('/dashboard');
    return null;
  }

  const percentage = Math.round((score / totalQuestions) * 100);
  
  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = () => {
    if (percentage >= 80) return { text: 'Excellent', color: 'bg-green-500' };
    if (percentage >= 60) return { text: 'Good', color: 'bg-yellow-500' };
    return { text: 'Needs Improvement', color: 'bg-red-500' };
  };

  const badge = getScoreBadge();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Results Header */}
        <Card className="mb-6 shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-10 h-10 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Test Completed!
            </CardTitle>
            <p className="text-gray-600 capitalize text-lg">{subject} Test Results</p>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className={`text-4xl font-bold ${getScoreColor()}`}>
                  {percentage}%
                </div>
                <p className="text-gray-600">Overall Score</p>
                <Badge className={`${badge.color} text-white`}>
                  {badge.text}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-gray-700 flex items-center justify-center">
                  <Target className="w-6 h-6 mr-2" />
                  {score}/{totalQuestions}
                </div>
                <p className="text-gray-600">Correct Answers</p>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-gray-700 flex items-center justify-center">
                  <Clock className="w-6 h-6 mr-2" />
                  {timeSpent}m
                </div>
                <p className="text-gray-600">Time Spent</p>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4 pt-6">
              <Button onClick={() => navigate('/dashboard')} className="px-8">
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Question Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions?.map((question: any, index: number) => {
                const userAnswer = selectedAnswers?.[index];
                const isCorrect = userAnswer === question.correct_answer;
                
                return (
                  <div key={index} className={`p-4 rounded-lg border ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Question {index + 1}
                      </h3>
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-3">{question.question_text}</p>
                    
                    <div className="space-y-1 text-sm">
                      <div className={`flex items-center ${
                        userAnswer ? (isCorrect ? 'text-green-700' : 'text-red-700') : 'text-yellow-700'
                      }`}>
                        <span className="font-medium mr-2">Your answer:</span>
                        {userAnswer ? (
                          <>
                            <span className="mr-2">{userAnswer}.</span>
                            <span>{question[`option_${userAnswer.toLowerCase()}`]}</span>
                          </>
                        ) : (
                          <span>No answer selected</span>
                        )}
                      </div>
                      
                      {!isCorrect && (
                        <div className="text-green-700">
                          <span className="font-medium mr-2">Correct answer:</span>
                          <span className="mr-2">{question.correct_answer}.</span>
                          <span>{question[`option_${question.correct_answer.toLowerCase()}`]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;
