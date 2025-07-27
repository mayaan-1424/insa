import React, { useState } from 'react';
import { Save, Eye, EyeOff, ExternalLink, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services/firebaseService';

const CredentialsInput: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'basic' | 'api'>('basic');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [showSecrets, setShowSecrets] = useState({
    appSecret: false,
    accessToken: false
  });

  const [basicCredentials, setBasicCredentials] = useState({
    username: '',
    password: ''
  });

  const [apiCredentials, setApiCredentials] = useState({
    appId: '',
    appSecret: '',
    accessToken: '',
    businessAccountId: '',
    instagramAccountId: ''
  });

  // Load existing credentials on component mount
  React.useEffect(() => {
    const loadCredentials = async () => {
      if (!user?.id) return;

      console.log('Loading existing credentials from Firestore...', { userId: user.id });
      
      try {
        // Load Instagram credentials
        const instagramCreds = await firebaseService.getInstagramCredentials(user.id);
        if (instagramCreds) {
          console.log('Loaded Instagram credentials:', { username: instagramCreds.username });
          setBasicCredentials({
            username: instagramCreds.username,
            password: instagramCreds.password
          });
        }

        // Load Meta API credentials
        const metaCreds = await firebaseService.getMetaCredentials(user.id);
        if (metaCreds) {
          console.log('Loaded Meta API credentials:', { 
            appId: metaCreds.appId,
            businessAccountId: metaCreds.businessAccountId 
          });
          setApiCredentials({
            appId: metaCreds.appId,
            appSecret: metaCreds.appSecret,
            accessToken: metaCreds.accessToken,
            businessAccountId: metaCreds.businessAccountId,
            instagramAccountId: metaCreds.instagramAccountId || ''
          });
        } else {
          console.log('No existing Meta API credentials found');
        }
      } catch (err) {
        console.error('Error loading credentials:', err);
        setError('Failed to load existing credentials');
      }
    };

    loadCredentials();
  }, [user?.id]);

  const handleBasicSave = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!basicCredentials.username || !basicCredentials.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setSaveStatus('idle');

    try {
      console.log('Saving Instagram credentials to Firestore...', {
        userId: user.id,
        username: basicCredentials.username
      });
      
      await firebaseService.saveInstagramCredentials(
        user.id,
        basicCredentials.username,
        basicCredentials.password
      );
      
      console.log('Instagram credentials saved successfully to Firestore');
      setSaveStatus('success');
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Error saving basic credentials:', err);
      setError(`Failed to save credentials: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSaveStatus('error');
    }

    setIsLoading(false);
  };

  const handleApiSave = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!apiCredentials.appId || !apiCredentials.appSecret || !apiCredentials.accessToken || !apiCredentials.businessAccountId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setSaveStatus('idle');

    try {
      console.log('Saving Meta credentials to Firestore...', {
        userId: user.id,
        appId: apiCredentials.appId,
        businessAccountId: apiCredentials.businessAccountId
      });
      
      await firebaseService.saveMetaCredentials(user.id, {
        appId: apiCredentials.appId,
        appSecret: apiCredentials.appSecret,
        accessToken: apiCredentials.accessToken,
        businessAccountId: apiCredentials.businessAccountId,
        instagramAccountId: apiCredentials.instagramAccountId
      });
      
      console.log('Meta credentials saved successfully to Firestore');
      setSaveStatus('success');
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Error saving API credentials:', err);
      setError(`Failed to save API credentials: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSaveStatus('error');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with Back Button */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-white hover:text-purple-100 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Social Media Credentials</h1>
              </div>
            </div>
            <p className="text-purple-100 mt-2">Configure your Instagram connection</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Basic Login
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'api'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Instagram Graph API
            </button>
          </div>

          <div className="p-6">
            {/* Status Messages */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            {saveStatus === 'success' && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Credentials saved successfully!
              </div>
            )}

            {activeTab === 'basic' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram Username
                  </label>
                  <input
                    type="text"
                    value={basicCredentials.username}
                    onChange={(e) => setBasicCredentials({...basicCredentials, username: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your Instagram username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={basicCredentials.password}
                      onChange={(e) => setBasicCredentials({...basicCredentials, password: e.target.value})}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleBasicSave}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  {isLoading ? 'Saving...' : 'Save Credentials'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Setup Instructions</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Create a Meta Developer App at <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com</a></li>
                    <li>Add Instagram Graph API product</li>
                    <li>Get your credentials from the app dashboard</li>
                    <li>Enter them below</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta App ID
                  </label>
                  <input
                    type="text"
                    value={apiCredentials.appId}
                    onChange={(e) => setApiCredentials({...apiCredentials, appId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your Meta App ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta App Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets.appSecret ? 'text' : 'password'}
                      value={apiCredentials.appSecret}
                      onChange={(e) => setApiCredentials({...apiCredentials, appSecret: e.target.value})}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your Meta App Secret"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets({...showSecrets, appSecret: !showSecrets.appSecret})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets.appSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets.accessToken ? 'text' : 'password'}
                      value={apiCredentials.accessToken}
                      onChange={(e) => setApiCredentials({...apiCredentials, accessToken: e.target.value})}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your Instagram Graph API Access Token"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets({...showSecrets, accessToken: !showSecrets.accessToken})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets.accessToken ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Account ID
                  </label>
                  <input
                    type="text"
                    value={apiCredentials.businessAccountId}
                    onChange={(e) => setApiCredentials({...apiCredentials, businessAccountId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your Facebook Business Account ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram Account ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={apiCredentials.instagramAccountId}
                    onChange={(e) => setApiCredentials({...apiCredentials, instagramAccountId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your Instagram Business Account ID"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleApiSave}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={20} />
                    {isLoading ? 'Saving...' : 'Save API Credentials'}
                  </button>
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-all flex items-center gap-2"
                  >
                    <ExternalLink size={20} />
                    Graph API Explorer
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialsInput;