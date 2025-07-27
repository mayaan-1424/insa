import React, { useState } from 'react';
import { ArrowLeft, Instagram, Sparkles, Send, Loader2, CheckCircle, AlertCircle, Hash, Type, Image, Video, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { geminiService, GeneratedAdContent } from '../services/geminiService';
import { firebaseService } from '../services/firebaseService';
import { mediaGenerationService, GeneratedMedia, MediaGenerationOptions } from '../services/mediaGenerationService';
import ApiKeyModal from '../components/ApiKeyModal';
import MediaGenerationModal from '../components/MediaGenerationModal';

const AIGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedAdContent | null>(null);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<GeneratedMedia | null>(null);

  React.useEffect(() => {
    // Set the Python pamphlet prompt
    setPrompt("An eye-catching pamphlet image promoting Python programming classes. The design features a bold title at the top that says 'Master Python Today!', with vibrant colors like blue, yellow, and white. The Python logo is prominently displayed. The pamphlet layout includes sections such as 'What You'll Learn', 'Who Can Join', and 'Course Highlights'. Visual elements include a flow of Python code, icons of coding, a laptop with Python editor open, and graphics showing happy learners. It has a professional yet friendly and student-focused vibe");
    
    const loadApiKey = async () => {
      if (user?.id) {
        const savedApiKey = await firebaseService.getGeminiApiKey(user.id);
        if (savedApiKey) {
          geminiService.initialize(savedApiKey);
          setHasApiKey(true);
        }
      }
    };
    
    if (user?.id) {
      loadApiKey();
    }
  }, [user?.id]);


  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleSaveApiKey = async (apiKey: "AIzaSyBWPsUmdRr3dQKzISYQ4tysFhQ63ZOuawA") => {
    try {
      geminiService.initialize(apiKey);
      
      if (user?.id) {
        await firebaseService.saveGeminiApiKey(user.id, apiKey);
      }
      
      setHasApiKey(true);
      setShowApiKeyModal(false);
      setError('');
    } catch (err) {
      console.error('Error saving API key:', err);
      setError('Invalid API key. Please check and try again.');
    }
  };


  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your ad');
      return;
    }

    if (!hasApiKey) {
      setShowApiKeyModal(true);
      return;
    }

    setError('');
    setIsGenerating(true);
    setGeneratedContent(null);
    setPublishStatus('idle');

    try {
      const content = await geminiService.generateAdContent(prompt);
      setGeneratedContent(content);
    } catch (err) {
      console.error('Generation error:', err);
      if (err instanceof Error && err.message.includes('API key')) {
        setShowApiKeyModal(true);
      } else if (err instanceof Error && err.message.includes('The model is overloaded')) {
        setError('AI generation service is currently busy. Please try again in a few moments.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate content. Please try again.');
      }
    }

    setIsGenerating(false);
  };

  const handleGenerateMedia = async (options: MediaGenerationOptions) => {
    if (!generatedContent) return;

    setIsGeneratingMedia(true);
    try {
      const media = await mediaGenerationService.generateMediaFromAdContent(generatedContent, options);
      setGeneratedMedia(media);
    } catch (err) {
      console.error('Media generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate media');
    }
    setIsGeneratingMedia(false);
  };

  const handleSelectMedia = (media: GeneratedMedia) => {
    setSelectedMedia(media);
    setShowMediaModal(false);
  };

  const handlePublishToInstagram = async () => {
    if (!generatedContent) return;

    setIsPublishing(true);
    setPublishStatus('idle');
    setError('');

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Save the ad to Firebase
      const adTitle = generatedContent.caption.substring(0, 50) + '...';
      await firebaseService.saveAd(user.id, adTitle, prompt, generatedContent);

      // Use a high-quality stock image URL that Instagram can access
      const imageUrl = selectedMedia?.url || 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1080&fit=crop';

      // Combine caption with hashtags
      const fullCaption = `${generatedContent.caption}\n\n${generatedContent.hashtags.join(' ')}`;

      console.log('Publishing to Instagram...');
      console.log('Image URL:', imageUrl);
      console.log('Caption:', fullCaption);

      // Call backend API
      const response = await fetch('http://localhost:3001/api/publish-to-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: fullCaption,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Backend response:', result);

      if (result.error) {
        throw new Error(result.details || result.error);
      }

      if (result.success && result.postId) {
        console.log('✅ Successfully published! Post ID:', result.postId);
        
        // Mark ad as published in Firebase
        const savedAds = await firebaseService.getUserAds(user.id);
        const latestAd = savedAds[0]; // Get the most recent ad
        if (latestAd) {
          await firebaseService.markAdAsPublished(latestAd.id);
        }
        
        setPublishStatus('success');
      } else {
        throw new Error('Unexpected response format from server');
      }

    } catch (err) {
      console.error('Publishing error:', err);
      setPublishStatus('error');
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to publish to Instagram';
      if (err instanceof Error) {
        if (err.message.includes('access token')) {
          errorMessage = 'Instagram access token is invalid or expired. Please check your credentials.';
        } else if (err.message.includes('user ID')) {
          errorMessage = 'Instagram User ID is invalid. Please check your credentials.';
        } else if (err.message.includes('image_url')) {
          errorMessage = 'The image could not be accessed by Instagram. Please try a different image.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }

    setIsPublishing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateContent();
    }
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Ad Generator</h2>
          <p className="text-gray-600">Describe your ad idea and let AI create engaging content for Instagram</p>
        </div>

        {/* AI Prompt Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe the ad you want to create..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 resize-none"
                rows={3}
                disabled={isGenerating}
              />
            </div>
            <button
              onClick={handleGenerateContent}
              disabled={isGenerating || !prompt.trim()}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white p-3 rounded-lg hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              {isGenerating ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isGenerating && (
          <div className="bg-white rounded-2xl shadow-lg p-12 mb-8 border border-gray-100">
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Generating Your Ad Content
              </h3>
              <p className="text-gray-600">
                AI is creating engaging content for your Instagram ad...
              </p>
            </div>
          </div>
        )}

        {/* Generated Content */}
        {generatedContent && !isGenerating && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Generated Ad Content</h3>
            
            <div className="space-y-6">
              {/* Text Content */}
              <div>
                {/* Caption */}
                <div>
                  <div className="flex items-center mb-3">
                    <Type className="w-5 h-5 text-purple-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900">Caption</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed">{generatedContent.caption}</p>
                  </div>
                </div>

                {/* Hashtags */}
                <div>
                  <div className="flex items-center mb-3">
                    <Hash className="w-5 h-5 text-pink-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900">Hashtags</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.hashtags.map((hashtag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Media Description */}
              <div>
                <div className="flex items-center mb-3">
                  <Instagram className="w-5 h-5 text-orange-600 mr-2" />
                  <h4 className="text-lg font-semibold text-gray-900">
                    Media Suggestion
                  </h4>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed">{generatedContent.mediaDescription}</p>
                </div>
                
                <div className="mt-4 text-center">
                  {generatedContent.mediaStyle && (
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                        {generatedContent.mediaStyle} style
                      </span>
                      {generatedContent.tone && (
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium ml-2">
                          {generatedContent.tone} tone
                        </span>
                      )}
                      {generatedContent.productCategory && (
                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium ml-2">
                          {generatedContent.productCategory}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generated Media Preview */}
            {selectedMedia && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {selectedMedia.type === 'image' ? (
                      <Image className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <Video className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <h4 className="text-lg font-semibold text-gray-900">Generated Media</h4>
                  </div>
                  <button
                    onClick={() => setShowMediaModal(true)}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    Change Media
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-3 overflow-hidden max-w-xs mx-auto">
                    {selectedMedia.type === 'image' ? (
                      <img
                        src={selectedMedia.url}
                        alt={selectedMedia.description}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={selectedMedia.url}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        loop
                        playsInline
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 text-center">{selectedMedia.description}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {generatedContent && !isGenerating && (
          <div className="text-center mb-6">
            <button
              onClick={() => setShowMediaModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <div className="flex items-center justify-center">
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Media Content
              </div>
            </button>
          </div>
        )}

        {/* Publish Button */}
        {generatedContent && !isGenerating && (
          <div className="text-center">
            <button
              onClick={handlePublishToInstagram}
              disabled={isPublishing}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white py-4 px-8 rounded-lg font-medium text-lg hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              {isPublishing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  Publishing to Instagram...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Instagram className="w-6 h-6 mr-3" />
                  Publish to Instagram
                </div>
              )}
            </button>

            {/* Publish Status */}
            {publishStatus === 'success' && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <span className="text-green-800 font-medium">Successfully published to Instagram!</span>
                </div>
              </div>
            )}

            {publishStatus === 'error' && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                  <span className="text-red-800 font-medium">Failed to publish to Instagram</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleSaveApiKey}
      />

      {/* Media Generation Modal */}
      <MediaGenerationModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onGenerate={handleGenerateMedia}
        isGenerating={isGeneratingMedia}
        generatedMedia={generatedMedia}
        onSelectMedia={handleSelectMedia}
      />
    </div>
  );
};

export default AIGenerator;