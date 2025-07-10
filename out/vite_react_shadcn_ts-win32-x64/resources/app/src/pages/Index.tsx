
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Award, BarChart3, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">CBT System</h1>
            </div>
            <div className="flex space-x-3">
              <Link to="/login">
                <Button variant="outline">Student Login</Button>
              </Link>
              <Link to="/admin/login">
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Admin Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Computer Based Testing System
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Take tests online with instant results and comprehensive analytics
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started as Student
              </Button>
            </Link>
            <Link to="/admin/register">
              <Button size="lg" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                Register as Admin/Teacher
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Multiple Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Take tests in various subjects including Math, English, Science, and History
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Instant Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Get immediate feedback with detailed performance analytics
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <Award className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <CardTitle>Track Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Monitor your improvement over time with comprehensive history
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Admin Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Teachers can manage questions and monitor student performance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="text-center py-12">
            <h3 className="text-3xl font-bold mb-4">Ready to Start Testing?</h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of students improving their knowledge through our platform
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/register">
                <Button size="lg" variant="secondary">
                  Student Registration
                </Button>
              </Link>
              <Link to="/admin/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                  Teacher Registration
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
