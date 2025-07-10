import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Calendar, Clock, Trophy, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserTestHistory } from '@/lib/database';

const TestHistory = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(user);
    setCurrentUser(userData);
    // Load test history from backend
    (async () => {
      try {
        const history = await getUserTestHistory(userData.id);
        setTestHistory(Array.isArray(history) ? history : []);
      } catch (err) {
        setTestHistory([]);
      }
    })();
  }, [navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Format time spent as mm:ss
  const formatTimeSpent = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="w-6 h-6 mr-3 text-blue-600" />
                <CardTitle className="text-2xl font-bold">Test History</CardTitle>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Test History List */}
        <div className="space-y-4">
          {testHistory.length > 0 ? (
            testHistory.map((test, index) => {
              const percentage = test.total_questions > 0 ? Math.round((Number(test.score) / Number(test.total_questions)) * 100) : 0;
              return (
                <Card key={index} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 capitalize">
                          {test.subject}
                        </h3>
                        <div className="flex items-center text-gray-600 text-sm mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(test.completed_at)}
                        </div>
                      </div>
                      <div className="text-center">
                        <Badge className={getScoreColor(percentage)}>
                          {percentage}%
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {test.score}/{test.total_questions} correct
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center text-gray-700">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="font-medium">{formatTimeSpent(Number(test.time_spent))}</span>
                        </div>
                        <p className="text-sm text-gray-600">Time spent</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center">
                          <Trophy className={`w-5 h-5 mr-1 ${
                            percentage >= 80 ? 'text-yellow-500' : 'text-gray-400'
                          }`} />
                          <span className="font-medium text-gray-700">
                            {percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Fair'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="shadow-lg border-0">
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Tests Taken Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start taking tests to see your history and track your progress.
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Start Your First Test
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestHistory;
