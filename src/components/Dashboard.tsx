import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  TrendingUp, 
  User, 
  LogOut,
  Play,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserStats, getUserTestHistory, getPublishedTests } from '@/lib/database';

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userStats, setUserStats] = useState({
    total_tests: 0,
    average_score: 0,
    best_score: 0,
    total_time_spent: 0
  });
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(user);
    setCurrentUser(userData);
    // Load user stats and recent tests from backend
    (async () => {
      try {
        const history = await getUserTestHistory(userData.id);
        const tests = Array.isArray(history) ? history : [];
        setRecentTests(tests.slice(0, 3));
        // Calculate stats
        const total_tests = tests.length;
        const validTests = tests.filter(t => t.total_questions > 0);
        const average_score = validTests.length > 0 ? validTests.reduce((sum, t) => sum + ((Number(t.score) / Number(t.total_questions)) * 100), 0) / validTests.length : 0;
        const best_score = validTests.length > 0 ? Math.max(...validTests.map(t => (Number(t.score) / Number(t.total_questions) * 100))) : 0;
        const total_time_spent = validTests.reduce((sum, t) => sum + (Number(t.time_spent) || 0), 0);
        setUserStats({ total_tests, average_score, best_score, total_time_spent });
      } catch (err) {
        setRecentTests([]);
        setUserStats({ total_tests: 0, average_score: 0, best_score: 0, total_time_spent: 0 });
      }
      // Fetch published tests for subjects
      try {
        const publishedTests = await getPublishedTests();
        setSubjects(publishedTests.map((test: any) => ({
          name: test.title,
          questions: test.questions.length,
          difficulty: test.questions[0]?.difficulty || 'Medium',
          color: 'bg-blue-500',
        })));
      } catch (err) {
        setSubjects([]);
      }
    })();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleStartTest = (subject: string) => {
    navigate(`/test/${subject.toLowerCase()}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">CBT Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600">
                <User className="w-4 h-4 mr-2" />
                <span className="text-sm">{currentUser.fullName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 opacity-80" />
                <div className="ml-4">
                  <p className="text-blue-100">Total Tests</p>
                  <p className="text-2xl font-bold">{userStats.total_tests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="w-8 h-8 opacity-80" />
                <div className="ml-4">
                  <p className="text-green-100">Average Score</p>
                  <p className="text-2xl font-bold">{isNaN(userStats.average_score) ? 0 : Math.round(userStats.average_score)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <div className="ml-4">
                  <p className="text-purple-100">Best Score</p>
                  <p className="text-2xl font-bold">{isNaN(userStats.best_score) ? 0 : Math.round(userStats.best_score)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 opacity-80" />
                <div className="ml-4">
                  <p className="text-orange-100">Time Spent</p>
                  <p className="text-2xl font-bold">{Math.floor(userStats.total_time_spent / 60)}m {userStats.total_time_spent % 60}s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Subjects */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Available Subjects
                </CardTitle>
                <CardDescription>
                  Choose a subject to start your test
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.map((subject, index) => (
                    <div 
                      key={subject.name}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${subject.color} mr-3`}></div>
                          <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                        </div>
                        <Badge className={getDifficultyColor(subject.difficulty)}>
                          {subject.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {subject.questions} questions available
                      </p>
                      <Button 
                        className="w-full group-hover:bg-blue-700 transition-colors"
                        size="sm"
                        onClick={() => handleStartTest(subject.name)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Test
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Test History */}
          <div>
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                  Recent Tests
                </CardTitle>
                <CardDescription>
                  Your latest test performances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTests.length > 0 ? (
                    recentTests.map((test, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{test.subject}</p>
                          <p className="text-sm text-gray-600">{test.completed_at ? new Date(test.completed_at).toLocaleDateString() : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">{test.total_questions ? Math.round((test.score / test.total_questions) * 100) : 0}%</p>
                          <p className="text-sm text-gray-600">{test.time_spent ? Math.round(test.time_spent / 60) : 0}min</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No tests taken yet</p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate('/history')}
                >
                  View All History
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
