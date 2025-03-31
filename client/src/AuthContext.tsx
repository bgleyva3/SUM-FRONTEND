import React, { createContext, useState, useEffect, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

// API URL from environment variable or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Constants
const INITIAL_TOKENS = 15;

interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface TokenInfo {
  tokens: number;
  lastUpdated: Timestamp;
  createdAt: Timestamp;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokens: number;
  decrementTokens: () => Promise<boolean>;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  tokens: 0,
  decrementTokens: async () => false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/user`, {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && data.isAuthenticated) {
          setUser(data.user);
          setIsAuthenticated(true);
          if (data.user && data.user.id) {
            await fetchUserTokens(data.user.id);
          }
        } else {
          // Make sure to handle failed auth properly
          setUser(null);
          setIsAuthenticated(false);
          setTokens(0);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Make sure to handle errors properly
        setUser(null);
        setIsAuthenticated(false);
        setTokens(0);
      } finally {
        // Always set loading to false
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Fetch user tokens from Firebase
  const fetchUserTokens = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as TokenInfo;
        
        // If no tokens field exists, initialize it
        if (typeof userData.tokens === 'undefined') {
          await updateDoc(userDocRef, {
            tokens: INITIAL_TOKENS,
            lastUpdated: serverTimestamp()
          });
          setTokens(INITIAL_TOKENS);
          return;
        }
        
        // Check if tokens need to be refreshed (monthly)
        const lastUpdated = userData.lastUpdated?.toDate() || new Date();
        const now = new Date();
        
        if (now.getMonth() !== lastUpdated.getMonth() || now.getFullYear() !== lastUpdated.getFullYear()) {
          await updateDoc(userDocRef, {
            tokens: INITIAL_TOKENS,
            lastUpdated: serverTimestamp()
          });
          setTokens(INITIAL_TOKENS);
        } else {
          setTokens(userData.tokens);
        }
      } else {
        // First time user - create their document with initial tokens
        await setDoc(userDocRef, {
          tokens: INITIAL_TOKENS,
          lastUpdated: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        setTokens(INITIAL_TOKENS);
      }
    } catch (error) {
      console.error('Error fetching user tokens:', error);
      // Set to INITIAL_TOKENS instead of 0 in case of error
      setTokens(INITIAL_TOKENS);
    }
  };

  // Decrement tokens when user makes a summary
  const decrementTokens = async (): Promise<boolean> => {
    if (!user || tokens <= 0) return false;
    
    try {
      const userDocRef = doc(db, 'users', user.id);
      
      // Decrement tokens in Firestore
      await updateDoc(userDocRef, {
        tokens: tokens - 1,
        lastUpdated: serverTimestamp()
      });
      
      // Update local state
      setTokens(prev => prev - 1);
      return true;
    } catch (error) {
      console.error('Error decrementing tokens:', error);
      return false;
    }
  };

  // Login function - redirects to Google OAuth
  const login = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        credentials: 'include'
      });
      setUser(null);
      setIsAuthenticated(false);
      setTokens(0);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        tokens,
        decrementTokens,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;