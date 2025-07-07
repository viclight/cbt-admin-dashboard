import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '@/lib/database';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const result = await requestPasswordReset(email);
      // In a real app, you would send this token via email
      // For now, we'll just show it in the console for testing
      console.log('Reset token:', result.token);
      console.log('Reset URL:', `${window.location.origin}/reset-password`);
      setIsSuccess(true);
      setMessage('Password reset instructions have been sent to your email address. (Demo: Token is ' + result.token + ')');
    } catch (error: any) {
      setMessage(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your email address and we'll send you instructions to reset your password.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="h-11"
                />
              </div>

              {message && !isSuccess && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 transition-colors"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Instructions...
                  </div>
                ) : (
                  'Send Reset Instructions'
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  {message}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-gray-600">
                Check your email and follow the instructions to reset your password.
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Link 
              to="/login" 
              className="flex items-center justify-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
