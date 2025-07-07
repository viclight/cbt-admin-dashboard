
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authenticateAdmin } from '@/lib/database';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const admin = await authenticateAdmin(email, password);
      localStorage.setItem('currentAdmin', JSON.stringify(admin));
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Admin Login</CardTitle>
          <p className="text-gray-600">Access the admin dashboard</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="h-11"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an admin account?{' '}
              <Link to="/admin/register" className="text-purple-600 hover:text-purple-700 font-medium">
                Register here
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
                Back to Student Portal
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
