import React from 'react';
import { Youtube, Loader2, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LAYOUT, CONTENT_HEIGHTS } from './styles/constants';

// API URL should point to your backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function extractVideoId(url: string) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function getYouTubeThumbnail(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

interface ErrorDetails {
  videoId?: string;
  errorType?: string;
  errorMessage?: string;
  errorStack?: string;
  transcriptEmpty?: boolean;
  transcriptLength?: number;
}

interface ErrorResponse {
  error: string;
  details?: ErrorDetails;
}

interface VideoInfo {
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
}

interface SummaryResponse {
  summary: string;
  language: string;
  videoInfo: VideoInfo | null;
  transcript: string;
}

function App() {
  const [url, setUrl] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<ErrorResponse | null>(null);
  const [usedLanguage, setUsedLanguage] = React.useState('');
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);
  const [videoInfo, setVideoInfo] = React.useState<VideoInfo | null>(null);
  const [targetLanguage, setTargetLanguage] = React.useState('');
  const [showLanguageSelector, setShowLanguageSelector] = React.useState(false);
  const [translatedSummary, setTranslatedSummary] = React.useState('');
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');

  const resetApplication = () => {
    setUrl('');
    setSummary('');
    setLoading(false);
    setError(null);
    setUsedLanguage('');
    setShowErrorDetails(false);
    setVideoInfo(null);
    setTargetLanguage('');
    setShowLanguageSelector(false);
    setTranslatedSummary('');
    setIsTranslating(false);
    setTranscript('');
  };

  const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
  ];

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Extract video ID and create basic preview
    const videoId = extractVideoId(newUrl);
    if (videoId) {
      // Set basic video info even without API
      setVideoInfo({
        title: 'Loading video details...',
        description: '',
        thumbnail: getYouTubeThumbnail(videoId),
        channelTitle: ''
      });

      // Try to fetch additional info if API is available
      try {
        const response = await fetch(`${API_URL}/api/video-info?videoId=${videoId}`);
        const data = await response.json();
        if (response.ok && data.videoInfo) {
          setVideoInfo(data.videoInfo);
        }
      } catch (error) {
        console.error('Failed to fetch video info:', error);
      }
    } else {
      setVideoInfo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting handleSubmit...');
    setLoading(true);
    setError(null);
    setSummary('');
    setUsedLanguage('');
    setVideoInfo(null);
    setTranslatedSummary('');
    setTargetLanguage('');
    setTranscript('');

    try {
      const videoId = extractVideoId(url);
      console.log('Extracted videoId:', videoId);
      
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      console.log('Fetching summary and transcript for video:', videoId);
      const response = await fetch(`${API_URL}/api/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      console.log('Raw response status:', response.status);
      const data = await response.json();
      console.log('API Response full data:', {
        summary: data.summary,
        language: data.language,
        videoInfo: data.videoInfo,
        transcript: data.transcript ? `${data.transcript.length} chars` : 'null',
        hasTranscript: Boolean(data.transcript),
        responseKeys: Object.keys(data)
      });
      
      if (!response.ok) {
        console.error('Response not OK:', data);
        setError(data as ErrorResponse);
        throw new Error(data.error || 'Failed to summarize video');
      }

      console.log('Setting state values:');
      console.log('- Summary length:', data.summary?.length || 0);
      console.log('- Language:', data.language);
      console.log('- Video info:', data.videoInfo?.title);
      console.log('- Transcript:', data.transcript ? `${data.transcript.length} chars` : 'null');
      console.log('- Full Summary Text:', data.summary);
      
      setSummary(data.summary);
      setTranscript(data.transcript || 'No transcript available');
      setUsedLanguage(data.language);
      setVideoInfo(data.videoInfo);
      
      console.log('State updated successfully');
    } catch (err) {
      console.error('Error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : null
      });
      if (!error) {
        setError({
          error: err instanceof Error ? err.message : 'An error occurred',
        });
      }
    } finally {
      setLoading(false);
      console.log('HandleSubmit completed');
    }
  };

  const handleTranslate = async () => {
    if (!targetLanguage || !summary) return;
    
    setIsTranslating(true);
    try {
      const response = await fetch(`${API_URL}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: summary,
          targetLanguage,
          sourceLanguage: usedLanguage
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      setSummary(data.translation);
      setUsedLanguage(targetLanguage);
    } catch (err) {
      setError({
        error: err instanceof Error ? err.message : 'Translation failed',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  // This is our custom renderer for summary content - no ReactMarkdown 
  const SummaryContent = ({ content }: { content: string }) => {
    if (!content) return null;
    
    // Split content into lines for processing
    const lines = content.split('\n');
    
    // Check emoji pattern based on the backend prompt
    const emojiPattern = /^([🔍📊📈📉💹⚡🔧🌐💻🔗💰💵🏦💼📱🎯🎨🔑💡⚙️⚠️❗❌🚫⛔✅👍💪🏆💯🔄🔨🛠️📝🌟💥🔥⭐💫])(\s+)/;
    
    // Process formatted text - convert [b]concept[/b] to bold
    const processFormattedText = (text: string) => {
      return text.replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>');
    };
    
    return (
      <div className="prose prose-invert max-w-none">
        {lines.map((line, index) => {
          // Skip empty lines
          if (!line.trim()) {
            return <div key={`empty-${index}`} className="h-4"></div>;
          }
          
          // Process section headers (like **Summary** or Highlights)
          if (line.trim() === 'Summary' || 
              line.trim() === 'Highlights' || 
              line.trim() === 'Key Insights' || 
              line.trim() === 'Conclusion') {
            return (
              <h2 key={`section-${index}`} className="text-white text-2xl font-bold mt-6 mb-4">
                {line.trim()}
              </h2>
            );
          }
          
          // Process markdown headers (**Title**)
          if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
            const title = line.trim().replace(/^\*\*|\*\*$/g, '');
            return (
              <h2 key={`header-${index}`} className="text-white text-2xl font-bold mt-6 mb-4">
                {title}
              </h2>
            );
          }
          
          // Process emoji + concept lines
          const emojiMatch = line.match(emojiPattern);
          if (emojiMatch) {
            const emoji = emojiMatch[1];
            const rest = line.slice(emoji.length).trim();
            
            // Find concept (text before colon)
            const colonIndex = rest.indexOf(':');
            if (colonIndex > 0) {
              let concept = rest.slice(0, colonIndex).trim();
              const description = rest.slice(colonIndex + 1).trim();
              
              // Check for [b]concept[/b] format
              const boldMatch = concept.match(/\[b\](.*?)\[\/b\]/);
              if (boldMatch) {
                concept = boldMatch[1]; // Extract the text between [b] tags
              }
              
              return (
                <p key={`emoji-line-${index}`} className="text-gray-300 mb-4 flex items-start">
                  <span className="inline-block mr-2">{emoji}</span>
                  <span>
                    <strong className="text-white">{concept}:</strong>{' '}
                    <span>{description}</span>
                  </span>
                </p>
              );
            }
          }
          
          // Default paragraph rendering with processed bold tags
          return (
            <p key={`paragraph-${index}`} className="text-gray-300 mb-4" 
               dangerouslySetInnerHTML={{ __html: processFormattedText(line) }}>
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Youtube 
              className="w-12 h-12 text-red-500 cursor-pointer hover:text-red-600 transition-colors" 
              onClick={resetApplication}
            />
          </div>
          <h1 
            className="text-4xl font-bold mb-2 cursor-pointer hover:text-gray-300 transition-colors"
            onClick={resetApplication}
          >
            YouTube Video Summarizer
          </h1>
          <p className="text-gray-400">Get AI-powered summaries of any YouTube video</p>
        </div>

        <div className="max-w-2xl mx-auto flex gap-2 mb-8">
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="Paste YouTube URL here..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !url}
            className="px-6 py-2 bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Summarize'
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{error.error}</p>
                {error.details && (
                  <button
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="text-sm mt-2 flex items-center gap-1 text-red-400 hover:text-red-300"
                  >
                    {showErrorDetails ? (
                      <>
                        <ChevronUp size={16} />
                        Hide Debug Info
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        Show Debug Info
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            {showErrorDetails && error.details && (
              <div className="mt-4 p-4 bg-red-500/5 rounded border border-red-500/10 text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(error.details, null, 2)}
              </div>
            )}
          </div>
        )}

        {videoInfo && !summary && !loading && (
          <div className="flex justify-center items-center">
            <div className="p-6 bg-gray-700/50 rounded-lg border border-gray-600 max-w-md">
              <div className="flex flex-col gap-4">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-[240px] h-[180px] rounded-lg shadow-lg mx-auto object-cover"
                />
                <div className="overflow-hidden text-center">
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2">{videoInfo.title}</h3>
                  <p className="text-gray-400 text-sm truncate">Channel: {videoInfo.channelTitle}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center">
            <div className="p-6 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
                <p className="text-gray-400">Generating summary...</p>
              </div>
            </div>
          </div>
        )}

        {videoInfo && summary && (
          <div className="flex gap-6" style={{ height: `${LAYOUT.CONTAINER_HEIGHT}px` }}>
            {/* Left Column - Video Info and Transcript */}
            <div className="w-[40%] flex flex-col gap-6">
              {/* Video Info */}
              <div 
                className="p-6 bg-gray-700/50 rounded-lg border border-gray-600"
                ref={(el) => {
                  if (el) {
                    const height = el.offsetHeight;
                    document.documentElement.style.setProperty('--video-info-height', `${height}px`);
                  }
                }}
              >
                <div className="flex flex-col gap-4">
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-[240px] h-[180px] rounded-lg shadow-lg mx-auto object-cover"
                  />
                  <div className="overflow-hidden">
                    <h3 className="text-xl font-semibold mb-2 line-clamp-2">{videoInfo.title}</h3>
                    <p className="text-gray-400 text-sm truncate">Channel: {videoInfo.channelTitle}</p>
                  </div>
                </div>
              </div>

              {/* Transcript */}
              <div className="p-6 bg-gray-700/50 rounded-lg border border-gray-600">
                <h3 className="text-xl font-semibold mb-4">Transcript</h3>
                <div className="overflow-y-auto text-sm pr-4" style={{ height: CONTENT_HEIGHTS.TRANSCRIPT }}>
                  {transcript ? (
                    <pre className="text-gray-300 whitespace-pre-wrap font-sans">{transcript}</pre>
                  ) : (
                    <p className="text-gray-400">No transcript available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="w-[60%]">
              <div className="h-full p-6 bg-gray-700/50 rounded-lg border border-gray-600 flex flex-col">
                <div className="flex justify-between items-center mb-4" style={{ height: `${LAYOUT.SUMMARY_HEADER_HEIGHT}px` }}>
                  <h2 className="text-xl font-semibold"></h2>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        style={{ height: `${LAYOUT.TRANSLATE_BUTTON_HEIGHT}px` }}
                      >
                        <Globe className="w-5 h-5" />
                        {targetLanguage ? languages.find(lang => lang.code === targetLanguage)?.name : 'Select Language'}
                      </button>
                      {showLanguageSelector && (
                        <div className="absolute z-10 right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg border border-gray-600">
                          {languages.map((lang) => (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => {
                                setTargetLanguage(lang.code);
                                setShowLanguageSelector(false);
                              }}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-600 transition-colors ${
                                targetLanguage === lang.code ? 'bg-blue-600' : ''
                              }`}
                            >
                              {lang.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {targetLanguage && (
                      <button
                        onClick={handleTranslate}
                        disabled={isTranslating}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        style={{ height: `${LAYOUT.TRANSLATE_BUTTON_HEIGHT}px` }}
                      >
                        {isTranslating ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'Translate'
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-y-auto pr-4" style={{ height: CONTENT_HEIGHTS.SUMMARY }}>
                  {/* Replace ReactMarkdown with our custom renderer */}
                  <SummaryContent content={summary} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This tool uses OpenAI's GPT-3.5 Turbo model for summarization.</p>
          <p>Powered by a secure backend to avoid CORS issues.</p>
        </div>
      </div>
    </div>
  );
}

export default App;