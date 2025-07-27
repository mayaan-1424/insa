import React from 'react';
import { LogOut, Instagram, Sparkles, Key, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleInstagramClick = () => {
    navigate('/ai-generator');
  };

  const handleCredentialsClick = () => {
    navigate('/credentials');
  };

  const handleHistoryClick = () => {
    navigate('/history');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-2 rounded-lg shadow-md">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <Sparkles className="w-5 h-5 text-purple-500 ml-2" />
              <h1 className="ml-2 text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                InstaAdGen
              </h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Title */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Dashboard</h2>
          <p className="text-xl text-gray-600">Choose an option to get started</p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Instagram Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleInstagramClick}
              className="group w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-12 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <div className="flex flex-col items-center space-y-6">
                <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Instagram className="w-12 h-12 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Instagram</h3>
                  <p className="text-gray-600">Generate AI-powered ad content</p>
                </div>
              </div>
            </button>
          </div>

          {/* Right Column - Social Media Credentials Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleCredentialsClick}
              className="group w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-12 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <div className="flex flex-col items-center space-y-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Key className="w-12 h-12 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Social Media Credentials</h3>
                  <p className="text-gray-600">Manage your account settings</p>
                </div>
              </div>
            </button>
          </div>

          {/* Third Column - Ad History Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleHistoryClick}
              className="group w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-12 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <div className="flex flex-col items-center space-y-6">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <History className="w-12 h-12 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Ad History</h3>
                  <p className="text-gray-600">View your generated ads</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;