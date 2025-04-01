import React, { useState, useEffect } from 'react';
import { Youtube, Loader2, ChevronDown, ChevronUp, Globe, LogIn } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LAYOUT, CONTENT_HEIGHTS, AUTH } from './styles/constants';
import { useAuth } from './AuthContext';
import UserProfile from './UserProfile';
import TokenCounter from './TokenCounter';
import PurchaseTokensModal from './PurchaseTokensModal';

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

// LoginModal component for when a user tries to use features requiring authentication
const LoginModal = ({ onClose }: { onClose: () => void }) => {
  const { login } = useAuth();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Youtube className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Sign in Required</h2>
          <p className="text-gray-400">
            Please sign in to access video summaries and personalized features
          </p>
        </div>
        
        <div className="space-y-6">
          <button
            onClick={login}
            className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
              </g>
            </svg>
            Sign in with Google
          </button>
          
          <div className="flex justify-between mt-4">
            <button
              onClick={onClose} 
              className="text-gray-400 hover:text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <p className="text-gray-500 text-sm self-center">
              By signing in, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Progress component
const LoadingProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress in 5 steps
    const steps = [20, 45, 65, 85, 98];
    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep]);
        currentStep++;
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center p-6 bg-gray-700/50 rounded-lg border border-gray-600">
      <div className="w-64 mb-4">
        <div className="h-2 bg-gray-600 rounded-full">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-gray-400">
        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        <p>Generating summary... {progress}%</p>
      </div>
    </div>
  );
};

function App() {
  const { isAuthenticated, isLoading, user, login, tokens, decrementTokens, updateTokens } = useAuth();
  
  // All state hooks in one place to maintain consistent order
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [usedLanguage, setUsedLanguage] = useState('');
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [translatedSummary, setTranslatedSummary] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  
  // Define all useEffect hooks - always ensure they're in the same order
  // Scroll observer effect
  useEffect(() => {
    // Create a MutationObserver to detect when chat messages are added
    const chatObserver = new MutationObserver(() => {
      // Call scroll function whenever DOM changes
      scrollToLatestMessage();
    });
    
    // Start observing changes to the chat container
    const observeChat = () => {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatObserver.observe(chatContainer, { 
          childList: true,
          subtree: true,
          characterData: true 
        });
      } else {
        // If container not found, try again shortly
        setTimeout(observeChat, 500);
      }
    };
    
    // Start observation
    observeChat();
    
    // Cleanup on unmount
    return () => chatObserver.disconnect();
  }, []);

  // Chat history effect
  useEffect(() => {
    if (chatHistory.length > 0) {
      // Call immediately
      scrollToLatestMessage();
      
      // And again after a short delay to ensure content is rendered
      setTimeout(scrollToLatestMessage, 100);
      setTimeout(scrollToLatestMessage, 300);
    }
  }, [chatHistory]);

  // If authentication is still loading, show a subtle loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

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
    setChatMessage('');
    setChatHistory([]);
    setIsChatting(false);
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

  // Enhanced scrollToLatestMessage function with more robust element targeting
  const scrollToLatestMessage = () => {
    // Wait for DOM to fully update
    setTimeout(() => {
      // Try multiple potential scroll containers
      const scrollContainers = [
        document.querySelector('.overflow-y-auto'),
        document.querySelector('.chat-messages-container')?.parentElement,
        document.querySelector('.flex-1.overflow-y-auto')
      ];
      
      // Try each container
      for (const container of scrollContainers) {
        if (container && container instanceof HTMLElement) {
          // Force scroll to bottom with a delay to ensure content is rendered
          container.scrollTop = container.scrollHeight + 1000;
          
          // For extra reliability, try again with a slightly longer delay
          setTimeout(() => {
            container.scrollTop = container.scrollHeight + 1000;
          }, 50);
        }
      }
    }, 10);
    
    // Last resort: try with a longer delay
    setTimeout(() => {
      const containers = document.querySelectorAll('.overflow-y-auto');
      containers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.scrollTop = container.scrollHeight + 1000;
        }
      });
    }, 300);
  };

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
    
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    if (tokens <= 0) {
      setShowPurchaseModal(true);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      console.log('Summary response:', data);
      
      if (response.status === 401) {
        setShowLoginModal(true);
        throw new Error('Authentication required');
      }
      
      if (!response.ok) {
        console.error('Response not OK:', data);
        setError(data as ErrorResponse);
        throw new Error(data.error || 'Failed to summarize video');
      }

      setSummary(data.summary);
      setTranscript(data.transcript || 'No transcript available');
      setUsedLanguage(data.language);
      setVideoInfo(data.videoInfo);
      
      // Update tokens with the value from the response
      if (typeof data.tokens === 'number') {
        console.log('Updating tokens from response:', data.tokens);
        updateTokens(data.tokens);
      }

    } catch (err) {
      console.error('Error in handleSubmit:', err);
      if (!error) {
        setError({
          error: err instanceof Error ? err.message : 'An error occurred',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    // If not authenticated, show login modal
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!targetLanguage || !summary) return;
    
    setIsTranslating(true);
    try {
      const response = await fetch(`${API_URL}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Add for auth
        body: JSON.stringify({
          text: summary,
          targetLanguage,
          sourceLanguage: usedLanguage
        }),
      });

      // Check if authentication error
      if (response.status === 401) {
        setShowLoginModal(true);
        throw new Error('Authentication required');
      }

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

  // Add this function at the top of the component or with other utility functions
  const getTitle = (language: string) => {
    const titles = {
      'en': 'Summary',
      'es': 'Resumen',
      'fr': 'Résumé',
      'pt': 'Resumo',
      'de': 'Zusammenfassung',
      'it': 'Riassunto',
      'zh': '摘要',
      'ja': '要約',
      'ko': '요약',
      'ru': 'Сводка'
    };
    // Get base language code (e.g., 'en' from 'en-US')
    const baseLanguage = language.split('-')[0];
    return titles[baseLanguage as keyof typeof titles] || titles['en'];
  };

  // Process formatted text
  const processFormattedText = (text: string) => {
    return text
      .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/&amp;#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
  };

  // Update SummaryContent to use the shared function
  const SummaryContent = ({ content }: { content: string }) => {
    if (!content) return null;
    
    return (
      <div className="prose prose-invert max-w-none">
        <h2 className="text-2xl font-bold mb-6 text-white">
          {getTitle(usedLanguage)}
        </h2>
        
        <div 
          className="text-gray-300 leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ 
            __html: processFormattedText(content)
          }}
        />
      </div>
    );
  };

  // Add a helper function to detect YouTube URLs in chat messages
  const isYouTubeUrl = (message: string) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    return youtubeRegex.test(message);
  };

  // Update the handleChat function
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();

    // If not authenticated, show login modal
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!chatMessage.trim()) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');

    // Check if the message is a YouTube URL
    if (isYouTubeUrl(userMessage)) {
      // Reset all states
      setSummary('');
      setTranscript('');
      setChatHistory([]);
      setError(null);
      setUsedLanguage('');
      setVideoInfo(null);
      setTargetLanguage('');
      setTranslatedSummary('');
      
      // Set the URL and trigger summarization
      setUrl(userMessage);
      handleSubmit(e);
      return;
    }

    // Regular chat handling continues here...
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    scrollToLatestMessage();
    
    setIsChatting(true);
    try {
      const videoId = extractVideoId(url);
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Add for auth
        body: JSON.stringify({
          videoId,
          message: userMessage,
          context: {
            transcript: transcript,
            summary: summary,
            videoTitle: videoInfo?.title
          }
        }),
      });

      // Check if authentication error
      if (response.status === 401) {
        setShowLoginModal(true);
        throw new Error('Authentication required');
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Add AI response
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      // Aggressively scroll again
      scrollToLatestMessage();
      setTimeout(scrollToLatestMessage, 50);
      setTimeout(scrollToLatestMessage, 150);

    } catch (err) {
      setError({
        error: err instanceof Error ? err.message : 'Failed to get response',
      });
    } finally {
      setIsChatting(false);
      // Final scroll attempts
      scrollToLatestMessage();
      setTimeout(scrollToLatestMessage, 100);
      setTimeout(scrollToLatestMessage, 300);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
      {/* Navbar */}
      <div 
        className="w-full fixed top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/50"
        style={{ 
          height: `${LAYOUT.NAV_HEIGHT}px`, 
          paddingTop: `${LAYOUT.TOP_PADDING}px`,
          paddingBottom: `${LAYOUT.TOP_PADDING}px`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-end items-center gap-4 h-full">
          {isAuthenticated && (
            <TokenCounter tokens={tokens} />
          )}
          {isAuthenticated ? (
            <UserProfile />
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <LogIn size={18} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Main content - Adjusted spacing for summary view */}
      <div 
        className="flex-1 max-w-7xl mx-auto px-4 flex flex-col items-center"
        style={{ 
          paddingTop: `${LAYOUT.NAV_HEIGHT + (summary ? 0 : 20)}px`, // Reduce padding when showing summary
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${summary ? LAYOUT.SUMMARY_CONTENT_OFFSET : LAYOUT.CENTER_CONTENT_OFFSET}px)`
        }}
      >
        {/* Title section - Conditional margin based on content state */}
        <div 
          className="flex flex-col items-center cursor-pointer p-4"
          onClick={resetApplication}
          style={{
            marginTop: videoInfo && !summary && !loading ? '40px' : `${LAYOUT.CONTENT_TOP_MARGIN}px`,
            padding: `${LAYOUT.TITLE_SECTION_PADDING}px`,
          }}
        >
          <Youtube 
            className="text-red-500 mb-1 hover:text-red-600 transition-colors"
            size={LAYOUT.TITLE_ICON_SIZE}
          />
          <h1 className="text-3xl font-bold mb-5 hover:text-gray-300 transition-colors">
            YouTube Video Summarizer
          </h1>
          <p className="text-gray-400">Get AI-powered summaries of any YouTube video</p>
        </div>

        {/* URL input section - Adjusted margin */}
        <div className="w-full max-w-2xl flex gap-2 mb-6">
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

        {/* Video preview - Added bottom margin */}
        {videoInfo && !summary && !loading && (
          <div className="flex justify-center items-center mt-2 mb-8">
            <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 max-w-md">
              <div className="flex flex-col gap-3">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-[160px] h-[120px] rounded-lg shadow-lg mx-auto object-cover"
                  style={{ objectFit: 'cover' }}
                />
                <div className="overflow-hidden text-center">
                  <h3 className="text-lg font-semibold mb-1 line-clamp-2">{videoInfo.title}</h3>
                  <p className="text-gray-400 text-sm truncate">Channel: {videoInfo.channelTitle}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center">
            <LoadingProgress />
          </div>
        )}

        {videoInfo && summary && (
          <div className="flex gap-6" style={{ height: `${LAYOUT.CONTAINER_HEIGHT}px` }}>
            {/* Left Column - Video Info and Transcript */}
            <div className="w-[40%] flex flex-col gap-6">
              {/* Video Info */}
              <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="flex flex-col gap-3">
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-[160px] h-[120px] rounded-lg shadow-lg mx-auto object-cover"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="overflow-hidden">
                    <h3 className="text-lg font-semibold mb-1 line-clamp-2">{videoInfo.title}</h3>
                    <p className="text-gray-400 text-sm truncate">Channel: {videoInfo.channelTitle}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-700/50 rounded-lg border border-gray-600 flex flex-col">
                <h3 className="text-xl font-semibold mb-4">Transcript</h3>
                <div 
                  className="overflow-y-auto text-sm pr-4" 
                  style={{ 
                    height: '287px'
                  }}
                >
                  {transcript ? (
                    <pre className="text-gray-300 whitespace-pre-wrap font-sans">
                      {transcript.split('\n').map((line, index) => {
                        const timestampMatch = line.match(/^\[(\d+:\d{2})\]/);
                        
                        if (timestampMatch) {
                          const timestamp = timestampMatch[0];
                          const text = line.slice(timestamp.length);
                          return (
                            <div key={index} className="mb-2">
                              <span className="text-blue-400 mr-2">{timestamp}</span>
                              <span>{text}</span>
                            </div>
                          );
                        }
                        return <div key={index} className="mb-2">{line}</div>;
                      })}
                    </pre>
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

                {/* Main content area with single scrollbar */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Scrollable container for both summary and chat */}
                  <div className="flex-1 overflow-y-auto pr-4 mb-4">
                    <SummaryContent content={summary} />
                    
                    {/* Chat History */}
                    <div className="mt-6 space-y-4 chat-messages-container" id="chat-messages-container">
                      {chatHistory.map((msg, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg ${
                            msg.role === 'user' ? 'bg-blue-600/20 ml-8' : 'bg-gray-700/50 mr-8'
                          }`}
                          dangerouslySetInnerHTML={{ 
                            __html: processFormattedText(msg.content)
                          }}
                        />
                      ))}
                      {/* Invisible element at the bottom to scroll to */}
                      <div id="scroll-anchor" />
                    </div>
                  </div>
                </div>

                {/* Fixed chat input at bottom */}
                <div className="mt-auto pt-4 border-t border-gray-600">
                  <form onSubmit={handleChat} className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Ask me anything about the video..."
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isChatting}
                    />
                    <button
                      type="submit"
                      disabled={isChatting || !chatMessage.trim()}
                      className="px-6 py-2 bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {isChatting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ask'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Login Modal */}
        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
        
        {/* Purchase Tokens Modal */}
        {showPurchaseModal && (
          <PurchaseTokensModal onClose={() => setShowPurchaseModal(false)} />
        )}
      </div>
    </div>
  );
}

export default App;