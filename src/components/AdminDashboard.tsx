import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, BookOpen, Users, BarChart3, LogOut, Trash2, Edit, Download, Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addQuestion, getAllQuestions, deleteQuestion, getAllUsers, getAllTestSessions, editQuestion, publishTest } from '@/lib/database';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [questions, setQuestions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [testSessions, setTestSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Question form state
  const [questionForm, setQuestionForm] = useState({
    subject: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    difficulty: 'medium'
  });

  // Edit modal state
  const [editModal, setEditModal] = useState({ open: false, question: null });
  const [editForm, setEditForm] = useState({
    subject: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    difficulty: 'medium'
  });

  // Add class and student selection to the Add Question form
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    const admin = localStorage.getItem('currentAdmin');
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    const adminData = JSON.parse(admin);
    setCurrentAdmin(adminData);
    (async () => { await loadData(); })();
  }, [navigate]);

  const loadData = async () => {
    try {
      const questionsData = await getAllQuestions();
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
    } catch {
      setQuestions([]);
    }
    try {
      const users = await getAllUsers();
      setUsers(Array.isArray(users) ? users : []);
    } catch {
      setUsers([]);
    }
    try {
      const sessions = await getAllTestSessions();
      setTestSessions(Array.isArray(sessions) ? sessions : []);
    } catch {
      setTestSessions([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentAdmin');
    navigate('/admin/login');
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await addQuestion(
        questionForm.subject,
        questionForm.questionText,
        questionForm.optionA,
        questionForm.optionB,
        questionForm.optionC,
        questionForm.optionD,
        questionForm.correctAnswer,
        questionForm.difficulty,
        selectedClass, // Pass class_name
        selectedStudent // Pass student_id (can be empty)
      );
      setQuestionForm({
        subject: '',
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        difficulty: 'medium'
      });
      setSelectedClass('');
      setSelectedStudent('');
      loadData();
      alert('Question added successfully!');
    } catch (error) {
      alert('Error adding question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (testId: number, questionIndex: number) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      await deleteQuestion(testId, questionIndex);
      loadData();
    }
  };

  const handleEditQuestion = async (testId: number, questionIndex: number, updatedQuestion: any) => {
    await editQuestion(testId, questionIndex, updatedQuestion);
    loadData();
  };

  const openEditModal = (question: any) => {
    setEditForm({
      subject: question.subject,
      questionText: question.question_text,
      optionA: question.option_a,
      optionB: question.option_b,
      optionC: question.option_c,
      optionD: question.option_d,
      correctAnswer: question.correct_answer,
      difficulty: question.difficulty
    });
    setEditModal({ open: true, question });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.question) return;
    await handleEditQuestion(
      editModal.question.testId,
      editModal.question.questionIndex,
      {
        question_text: editForm.questionText,
        option_a: editForm.optionA,
        option_b: editForm.optionB,
        option_c: editForm.optionC,
        option_d: editForm.optionD,
        correct_answer: editForm.correctAnswer,
        difficulty: editForm.difficulty
      }
    );
    setEditModal({ open: false, question: null });
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const response = await fetch(`http://localhost:4000/api/users/${userId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete user');
      await loadData();
      alert('User deleted successfully!');
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const handlePublishTest = async (testId: number) => {
    console.log('Publishing test with id:', testId); // Debug log
    try {
      await publishTest(testId);
      await loadData();
      alert('Test published successfully!');
    } catch (err) {
      alert('Failed to publish test');
    }
  };

  // Helper to clear all users and results
  const clearAllUsersAndResults = async () => {
    if (!window.confirm('Are you sure you want to delete ALL users and results? This cannot be undone!')) return;
    try {
      await fetch('http://localhost:4000/api/admin/clear-users', { method: 'POST' });
      alert('All users and results deleted.');
      // Optionally reload users
      if (typeof getAllUsers === 'function') {
        const freshUsers = await getAllUsers();
        setUsers(freshUsers);
      }
    } catch (err) {
      alert('Failed to clear users/results.');
    }
  };

  if (!currentAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const getSubjectStats = () => {
    if (!Array.isArray(questions)) return [];
    const subjects = questions.reduce((acc: any, q: any) => {
      acc[q.subject] = (acc[q.subject] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(subjects).map(([subject, count]) => ({ subject, count }));
  };

  // Default classes
  const defaultClasses = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];
  // Get unique classes from users, fallback to default if empty
  const classOptions = Array.from(new Set(users.map((u: any) => u.class_name).filter(Boolean)));
  const allClassOptions = classOptions.length > 0 ? classOptions : defaultClasses;
  const studentsInClass = users.filter((u: any) => u.class_name === selectedClass);

  // CSV export helper
  const exportStudentsToCSV = () => {
    const header = ['Name', 'Email', 'Class', 'Registered', 'User ID', 'Subjects Answered', 'Scores'];
    const rows = users.map((user) => {
      const uniqueSubjects = Array.from(new Set((user.scores || []).map((s: any) => s.subject)));
      const scores = (user.scores || []).map((s: any) => `${s.subject}: ${s.score}/${s.total_questions}`).join('; ');
      return [
        user.full_name,
        user.email,
        user.class_name || '',
        user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
        user.id,
        uniqueSubjects.length > 0 ? uniqueSubjects.join(', ') : 'None',
        scores
      ];
    });
    const csvContent = [header, ...rows].map(e => e.map(x => `"${x}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Excel export helper
  const exportStudentsToExcel = () => {
    const header = ['Name', 'Email', 'Class', 'Registered', 'User ID', 'Subjects Answered', 'Scores'];
    const rows = users.map((user) => {
      const uniqueSubjects = Array.from(new Set((user.scores || []).map((s: any) => s.subject)));
      const scores = (user.scores || []).map((s: any) => `${s.subject}: ${s.score}/${s.total_questions}`).join('; ');
      return [
        user.full_name,
        user.email,
        user.class_name || '',
        user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
        user.id,
        uniqueSubjects.length > 0 ? uniqueSubjects.join(', ') : 'None',
        scores
      ];
    });
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'students.xlsx');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-purple-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {currentAdmin.fullName}</span>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'questions', label: 'Manage Questions', icon: BookOpen },
            { id: 'users', label: 'Students', icon: Users }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Questions</p>
                    <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tests</p>
                    <p className="text-2xl font-bold text-gray-900">{testSessions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BookOpen className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Subjects</p>
                    <p className="text-2xl font-bold text-gray-900">{getSubjectStats().length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* Add Question Form */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class">Class</Label>
                      <select
                        id="class"
                        value={selectedClass}
                        onChange={e => { setSelectedClass(e.target.value); setSelectedStudent(''); }}
                        required
                        className="h-11 w-full border rounded px-3"
                      >
                        <option value="">Select class</option>
                        {allClassOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student">Student (optional)</Label>
                      <select
                        id="student"
                        value={selectedStudent}
                        onChange={e => setSelectedStudent(e.target.value)}
                        className="h-11 w-full border rounded px-3"
                        disabled={!selectedClass}
                      >
                        <option value="">All students in class</option>
                        {studentsInClass.map((stu: any) => <option key={stu.id} value={stu.id}>{stu.full_name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={questionForm.subject}
                        onChange={(e) => setQuestionForm({...questionForm, subject: e.target.value})}
                        placeholder="e.g., Mathematics, English, Science"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <select
                        id="difficulty"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={questionForm.difficulty}
                        onChange={(e) => setQuestionForm({...questionForm, difficulty: e.target.value})}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="questionText">Question</Label>
                    <Textarea
                      id="questionText"
                      value={questionForm.questionText}
                      onChange={(e) => setQuestionForm({...questionForm, questionText: e.target.value})}
                      placeholder="Enter the question text"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="optionA">Option A</Label>
                      <Input
                        id="optionA"
                        value={questionForm.optionA}
                        onChange={(e) => setQuestionForm({...questionForm, optionA: e.target.value})}
                        placeholder="Option A"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionB">Option B</Label>
                      <Input
                        id="optionB"
                        value={questionForm.optionB}
                        onChange={(e) => setQuestionForm({...questionForm, optionB: e.target.value})}
                        placeholder="Option B"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionC">Option C</Label>
                      <Input
                        id="optionC"
                        value={questionForm.optionC}
                        onChange={(e) => setQuestionForm({...questionForm, optionC: e.target.value})}
                        placeholder="Option C"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionD">Option D</Label>
                      <Input
                        id="optionD"
                        value={questionForm.optionD}
                        onChange={(e) => setQuestionForm({...questionForm, optionD: e.target.value})}
                        placeholder="Option D"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="correctAnswer">Correct Answer</Label>
                    <select
                      id="correctAnswer"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={questionForm.correctAnswer}
                      onChange={(e) => setQuestionForm({...questionForm, correctAnswer: e.target.value})}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                    {isLoading ? 'Adding...' : 'Add Question'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Questions List */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>All Questions ({questions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Correct Answer</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question) => (
                      <TableRow key={`${question.testId}-${question.questionIndex}`}>
                        <TableCell>
                          <Badge variant="outline">{question.subject}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {question.question_text}
                        </TableCell>
                        <TableCell>
                          <Badge variant={question.difficulty === 'easy' ? 'default' : question.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                            {question.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>{question.correct_answer}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(question)}
                            className="mr-2"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.testId, question.questionIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Tests Table */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>All Subjects/Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...new Set(questions.map(q => q.subject))].map(subject => {
                      const testQuestions = questions.filter(q => q.subject === subject);
                      const testId = testQuestions[0]?.testId;
                      const published = testQuestions[0]?.published;
                      return (
                        <TableRow key={testId ? `test-${testId}` : `subject-${subject}`}>
                          <TableCell>{subject}</TableCell>
                          <TableCell>{testQuestions.length}</TableCell>
                          <TableCell>{published ? 'Published' : 'Draft'}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={published || !testId}
                              onClick={() => testId && handlePublishTest(testId)}
                            >
                              {published ? 'Published' : 'Publish'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card className="shadow-lg border-0">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
              <CardTitle>Registered Students ({users.length})</CardTitle>
              <div className="flex gap-2">
                <Button onClick={exportStudentsToExcel} className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-white flex items-center">
                  <Download className="w-4 h-4 mr-2" /> Download Excel
                </Button>
                <Button onClick={clearAllUsersAndResults} className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700 text-white flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete ALL Users
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                <Table className="min-w-full divide-y divide-gray-200">
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Subjects Answered</TableHead>
                      <TableHead>Scores</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const uniqueSubjects = Array.from(new Set((user.scores || []).map((s: any) => s.subject)));
                      const scores = (user.scores || []).map((s: any) => `${s.subject}: ${s.score}/${s.total_questions}`).join('; ');
                      return (
                        <TableRow key={user.id} className="hover:bg-gray-50 transition">
                          <TableCell className="font-semibold text-gray-900">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.class_name || <span className="text-gray-400">-</span>}</TableCell>
                          <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</TableCell>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{uniqueSubjects.length > 0 ? uniqueSubjects.join(', ') : <span className="text-gray-400">None</span>}</TableCell>
                          <TableCell>{scores}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Question Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Question</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editQuestionText">Question</Label>
                <Textarea
                  id="editQuestionText"
                  value={editForm.questionText}
                  onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editOptionA">Option A</Label>
                  <Input
                    id="editOptionA"
                    value={editForm.optionA}
                    onChange={(e) => setEditForm({ ...editForm, optionA: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editOptionB">Option B</Label>
                  <Input
                    id="editOptionB"
                    value={editForm.optionB}
                    onChange={(e) => setEditForm({ ...editForm, optionB: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editOptionC">Option C</Label>
                  <Input
                    id="editOptionC"
                    value={editForm.optionC}
                    onChange={(e) => setEditForm({ ...editForm, optionC: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editOptionD">Option D</Label>
                  <Input
                    id="editOptionD"
                    value={editForm.optionD}
                    onChange={(e) => setEditForm({ ...editForm, optionD: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCorrectAnswer">Correct Answer</Label>
                <select
                  id="editCorrectAnswer"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.correctAnswer}
                  onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDifficulty">Difficulty</Label>
                <select
                  id="editDifficulty"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.difficulty}
                  onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditModal({ open: false, question: null })}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backup Button */}
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={() => {
            fetch('/api/backup/google-drive', { method: 'POST' })
              .then(res => res.json())
              .then(data => {
                if (data.url) {
                  window.open(data.url, '_blank'); // Open Google OAuth URL
                } else if (data.success) {
                  alert('Backup to Google Drive successful!');
                } else {
                  alert('Google Drive backup failed.');
                }
              });
          }}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white flex items-center"
        >
          <Cloud className="w-4 h-4 mr-2" /> Backup to Google Drive
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
