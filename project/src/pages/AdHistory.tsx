import React, { useState, useEffect } from 'react';
import { ArrowLeft, Instagram, Sparkles, Calendar, Hash, Type, Image, Video, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService, SavedAd } from '../services/firebaseService';

const AdHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ads, setAds] = useState<SavedAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAds = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const userAds = await firebaseService.getUserAds(user.id);
        setAds(userAds);
      } catch (err) {
        console.error('Error loading ads:', err);
        setError('Failed to load ad history');
      } finally {
        setIsLoading(false);
      }
    };

    loadAds();
  }, [user?.id]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    try {
      await firebaseService.deleteAd(adId);
      setAds(ads.filter(ad => ad.id !== adId));
    } catch (err) {
      console.error('Error deleting ad:', err);
      setError('Failed to delete ad');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Back Button and Logo */}
            <div className="flex items-center">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-2 rounded-lg shadow-md">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <Sparkles className="w-5 h-5 text-purple-500 ml-2" />
              <h1 className="ml-2 text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                InstaAdGen
              </h1>
            </div>

            {/* User Info */}
            <div className="text-sm text-gray-700">
              Welcome, <span className="font-medium">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ad History</h2>
          <p className="text-gray-600">View and manage your generated Instagram ads</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading your ads...</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Instagram className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No ads yet</h3>
            <p className="text-gray-600 mb-6">Create your first AI-generated Instagram ad!</p>
            <button
              onClick={() => navigate('/ai-generator')}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 transition-all"
            >
              Create Ad
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Ad Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{ad.title}</h3>
                    <div className="flex space-x-2">
                      {ad.published && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Published
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(ad.createdAt)}
                  </div>

                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-4">
                    <strong>Prompt:</strong> {ad.prompt}
                  </p>
                </div>

                {/* Ad Content */}
                <div className="p-6">
                  {/* Caption */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <Type className="w-4 h-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Caption</span>
                    </div>
                    <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">
                      {ad.content.caption}
                    </p>
                  </div>

                  {/* Hashtags */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <Hash className="w-4 h-4 text-pink-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Hashtags</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ad.content.hashtags.slice(0, 6).map((hashtag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                        >
                          {hashtag}
                        </span>
                      ))}
                      {ad.content.hashtags.length > 6 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{ad.content.hashtags.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Media Type */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      {ad.content.mediaType === 'video' ? (
                        <Video className="w-4 h-4 text-orange-600 mr-2" />
                      ) : (
                        <Image className="w-4 h-4 text-green-600 mr-2" />
                      )}
                      <span className="text-sm font-medium text-gray-700">Media</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">{ad.content.mediaDescription}</p>
                      {ad.content.mediaStyle && (
                        <span className="inline-block mt-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                          {ad.content.mediaStyle} style
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate('/ai-generator', { state: { prompt: ad.prompt } })}
                      className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 transition-all"
                    >
                      Recreate
                    </button>
                    {ad.published && (
                      <button className="flex items-center justify-center bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdHistory;