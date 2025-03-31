import React, { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';

interface TokenCounterProps {
  tokens: number;
}

const TokenCounter: React.FC<TokenCounterProps> = ({ tokens }) => {
  const [prevTokens, setPrevTokens] = useState(tokens);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (tokens < prevTokens) {
      // Token was decreased
      setShowAnimation(true);
      setIsPulsing(true);
      
      // Play a sound effect (optional)
      const audio = new Audio('/token-loss.mp3'); // You'll need to add this sound file
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Catch and ignore if audio fails to play
      
      // Remove animation classes after they complete
      setTimeout(() => setShowAnimation(false), 2000); // Match animation duration
      setTimeout(() => setIsPulsing(false), 500); // Match pulse duration
    }
    setPrevTokens(tokens);
  }, [tokens]);

  return (
    <div className="relative flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full text-sm font-medium">
      <Coins 
        className={`w-5 h-5 text-yellow-400 transition-all ${
          isPulsing ? 'animate-token-pulse' : ''
        }`} 
      />
      <span 
        className={`text-white transition-all ${
          isPulsing ? 'animate-token-pulse' : ''
        }`}
      >
        {tokens} tokens
      </span>
      
      {/* Token loss animation */}
      {showAnimation && (
        <>
          {/* Multiple falling -1s for more dramatic effect */}
          <div 
            className="absolute -right-2 animate-token-loss pointer-events-none"
            style={{ animationDelay: '0s' }}
            aria-hidden="true"
          >
            <span className="text-red-500 font-bold text-lg">-1</span>
          </div>
          <div 
            className="absolute -right-1 animate-token-loss pointer-events-none"
            style={{ animationDelay: '0.1s' }}
            aria-hidden="true"
          >
            <span className="text-red-400 font-bold text-base opacity-75">-1</span>
          </div>
          <div 
            className="absolute -right-3 animate-token-loss pointer-events-none"
            style={{ animationDelay: '0.2s' }}
            aria-hidden="true"
          >
            <span className="text-red-400 font-bold text-sm opacity-50">-1</span>
          </div>
          
          {/* Flash effect */}
          <div 
            className="absolute inset-0 bg-red-500 opacity-0 animate-[flash_0.2s_ease-out] rounded-full"
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
};

export default TokenCounter;