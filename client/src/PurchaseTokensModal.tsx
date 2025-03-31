import React from 'react';
import { Coins, X, CreditCard, AlertTriangle } from 'lucide-react';

interface PurchaseTokensModalProps {
  onClose: () => void;
}

const PurchaseTokensModal: React.FC<PurchaseTokensModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <Coins className="w-8 h-8 text-yellow-400" />
            <h2 className="text-2xl font-bold">Get More Tokens</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 text-red-400">
            <AlertTriangle size={18} />
            <p className="font-medium">You're out of tokens!</p>
          </div>
          <p className="text-gray-300">
            You've used all your monthly tokens. Purchase additional tokens to continue generating video summaries.
          </p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="border border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-700/50 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-medium">25 Tokens</span>
              <span className="text-green-400 font-bold">$4.99</span>
            </div>
            <p className="text-gray-400 text-sm">Best for occasional video summaries</p>
          </div>
          
          <div className="border border-blue-500 bg-blue-900/20 rounded-lg p-4 cursor-pointer hover:bg-blue-900/30 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium">100 Tokens</span>
                <span className="bg-blue-500 text-xs px-2 py-1 rounded-full font-bold">POPULAR</span>
              </div>
              <span className="text-green-400 font-bold">$14.99</span>
            </div>
            <p className="text-gray-400 text-sm">Perfect for regular use, save 25%</p>
          </div>
          
          <div className="border border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-700/50 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-medium">250 Tokens</span>
              <span className="text-green-400 font-bold">$29.99</span>
            </div>
            <p className="text-gray-400 text-sm">For power users, save 40%</p>
          </div>
        </div>
        
        <button
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          <CreditCard size={18} />
          Proceed to Payment
        </button>
        
        <p className="text-center text-gray-500 text-sm mt-4">
          Your monthly free tokens will refresh on the 1st of each month
        </p>
      </div>
    </div>
  );
};

export default PurchaseTokensModal;