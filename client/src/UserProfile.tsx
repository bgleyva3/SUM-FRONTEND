import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { LogOut, User, ChevronDown, ChevronUp } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <User className="w-6 h-6 text-gray-300" />
        )}
        <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
        {isMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-10 border border-gray-700">
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              logout();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;