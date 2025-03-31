import React from 'react';
import { Coins } from 'lucide-react';

interface TokenCounterProps {
  tokens: number;
}

const TokenCounter: React.FC<TokenCounterProps> = ({ tokens }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full text-sm font-medium">
      <Coins className="w-5 h-5 text-yellow-400" />
      <span className="text-white">{tokens || 15} tokens</span>
    </div>
  );
};

export default TokenCounter;