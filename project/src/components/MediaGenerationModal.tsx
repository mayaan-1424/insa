import React, { useState } from 'react';
import { X, Image, Video, Loader2, Download, Play, Pause } from 'lucide-react';
import { GeneratedMedia, MediaGenerationOptions } from '../services/mediaGenerationService';

interface MediaGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: MediaGenerationOptions) => Promise<GeneratedMedia[]>;
  isGenerating: boolean;
  generatedMedia: GeneratedMedia[];
  onSelectMedia: (media: GeneratedMedia) => void;
}

const MediaGenerationModal: React.FC<MediaGenerationModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  generatedMedia,
  onSelectMedia
}) => {
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'both'>('image');
  const [style, setStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '16:9'>('1:1');
  const [duration, setDuration] = useState(5);
  const [customPrompt, setCustomPrompt] = useState('');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const handleGenerate = async () => {
    const options: MediaGenerationOptions = {
      prompt: customPrompt,
      type: mediaType,
      style,
      aspectRatio,
      duration: mediaType === 'video' || mediaType === 'both' ? duration : undefined
    };

    await onGenerate(options);
  };

  const handleVideoPlay = (videoUrl: string) => {
    setPlayingVideo(playingVideo === videoUrl ? null : videoUrl);
  };

  const handleSelectMedia = (media: GeneratedMedia) => {
    onSelectMedia(media);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900">Generate Media Content</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Generation Options */}
          <div className="space-y-6 mb-8">
            {/* Media Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Media Type
              </label>
              <div className="flex space-x-4">
                {[
                  { value: 'image', label: 'Image Only', icon: Image },
                  { value: 'video', label: 'Video Only', icon: Video },
                  { value: 'both', label: 'Both', icon: Image }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setMediaType(value as any)}
                    className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all ${
                      mediaType === value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Prompt (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Add specific details for your media generation..."
              />
            </div>

            {/* Style Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="photorealistic">Photorealistic</option>
                <option value="modern">Modern</option>
                <option value="minimalist">Minimalist</option>
                <option value="vibrant">Vibrant</option>
                <option value="luxury">Luxury</option>
                <option value="artistic">Artistic</option>
                <option value="cinematic">Cinematic</option>
              </select>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aspect Ratio
              </label>
              <div className="flex space-x-3">
                {[
                  { value: '1:1', label: 'Square (1:1)' },
                  { value: '9:16', label: 'Portrait (9:16)' },
                  { value: '16:9', label: 'Landscape (16:9)' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setAspectRatio(value as any)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      aspectRatio === value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Duration */}
            {(mediaType === 'video' || mediaType === 'both') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Duration (seconds)
                </label>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>3s</span>
                  <span className="font-medium">{duration}s</span>
                  <span>15s</span>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white py-4 px-6 rounded-lg font-medium hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  Generating Media...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Image className="w-6 h-6 mr-3" />
                  Generate Media
                </div>
              )}
            </button>
          </div>

          {/* Generated Media Results */}
          {generatedMedia.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Generated Media</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedMedia.map((media, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-4 overflow-hidden">
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt={media.description}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                            ref={(video) => {
                              if (video && playingVideo === media.url) {
                                video.play();
                              } else if (video) {
                                video.pause();
                              }
                            }}
                          />
                          <button
                            onClick={() => handleVideoPlay(media.url)}
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all"
                          >
                            {playingVideo === media.url ? (
                              <Pause className="w-12 h-12 text-white" />
                            ) : (
                              <Play className="w-12 h-12 text-white" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{media.description}</p>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectMedia(media)}
                        className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Use This Media
                      </button>
                      <a
                        href={media.url}
                        download
                        className="flex items-center justify-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaGenerationModal;