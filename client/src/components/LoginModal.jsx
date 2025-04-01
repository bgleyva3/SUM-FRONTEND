import { Youtube } from 'lucide-react';
import { useAuth } from '../AuthContext';

const LoginModal = ({ onClose }) => {
  const { login } = useAuth();

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999]"
        onClick={onClose}
      />
      <div 
        className="fixed inset-0 flex items-center justify-center z-[999]"
        style={{
          marginTop: '0px',
          height: '100vh'
        }}
      >
        <div 
          className="w-full max-w-[400px] mx-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-[#1e2530] rounded-2xl shadow-2xl">
            <div className="px-8 py-10 flex flex-col items-center">
              <div className="text-red-500 mb-6">
                <Youtube size={48} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Sign in Required</h2>
              <p className="text-gray-400 text-center mb-8">
                Please sign in to access video summaries and personalized features
              </p>
              <div className="w-full">
                <button
                  onClick={login}
                  className="w-full bg-white hover:bg-gray-50 text-[#1e2530] rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Sign in with Google
                </button>
              </div>
              <div className="mt-6 flex flex-col items-center gap-2">
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors px-4 py-1"
                >
                  Cancel
                </button>
                <p className="text-gray-500 text-sm text-center">
                  By signing in, you agree to our Terms of Service
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginModal; 