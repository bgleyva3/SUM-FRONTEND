import React, { useEffect } from 'react';
import { Coins, X, CreditCard, AlertTriangle } from 'lucide-react';

const PurchaseTokensModal = ({ onClose }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <>
      
      {/* Modal content - centered with flex and explicit styling */}
      <div
        className="fixed flex items-center justify-center z-50 pointer-events-none p-4"
      >
        <div 
          className="bg-gray-800 rounded-lg overflow-hidden shadow-xl pointer-events-auto w-full max-w-md flex flex-col"
          style={{ maxHeight: '80vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Get More Tokens</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Scrollable content */}
          <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
            {/* Alert message */}
            <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-400">You're out of tokens!</p>
                <p className="text-gray-300 text-sm mt-1">
                  You've used all your monthly tokens. Purchase additional tokens to continue generating video summaries.
                </p>
              </div>
            </div>
            
            {/* Token packages */}
            <div className="space-y-3 mb-4">
              {/* Package 1 */}
              <div className="border border-gray-600 rounded-lg p-3 hover:bg-gray-700/50 cursor-pointer transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-white">25 Tokens</span>
                  <span className="text-green-400 font-bold">$4.99</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">Best for occasional video summaries</p>
              </div>
              
              {/* Package 2 */}
              <div className="border-2 border-blue-500 bg-blue-900/20 rounded-lg p-3 hover:bg-blue-900/30 cursor-pointer transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium text-white">100 Tokens</span>
                    <span className="bg-blue-500 text-xs px-2 py-0.5 rounded-full font-bold text-white">POPULAR</span>
                  </div>
                  <span className="text-green-400 font-bold">$14.99</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">Perfect for regular use, save 25%</p>
              </div>
              
              {/* Package 3 */}
              <div className="border border-gray-600 rounded-lg p-3 hover:bg-gray-700/50 cursor-pointer transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-white">250 Tokens</span>
                  <span className="text-green-400 font-bold">$29.99</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">For power users, save 40%</p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-700 mt-auto">
            <button className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-white">
              <CreditCard size={18} />
              Proceed to Payment
            </button>
            
            <p className="text-center text-gray-500 text-sm mt-3">
              Your monthly free tokens will refresh on the 1st of each month
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PurchaseTokensModal;