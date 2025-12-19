import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Lock } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    navigate('/login');
  };

  const handlePublicForm = () => {
    navigate('/rent');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Bike className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900">SriRentABike</h1>
        <p className="text-center text-gray-600 mt-2">Digital rental agreements made easy</p>

        <div className="mt-8 space-y-6">
          <div className="flex justify-center">
            <button
              onClick={handleAdminLogin}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Lock className="w-4 h-4 mr-2" />
              Admin Login
            </button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2 text-center">Public Form</h2>
            <p className="text-xs text-gray-500 text-center mb-4">
              Anyone can fill the rental agreement form
            </p>
            <div className="flex justify-center">
              <button
                onClick={handlePublicForm}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Open Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
