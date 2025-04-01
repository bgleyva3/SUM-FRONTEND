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

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  tokens: 0,
  decrementTokens: async () => false,
  updateTokens: () => {},
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
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
        console.log('Auth check response:', data);
        
        if (response.ok && data.isAuthenticated) {
          setUser(data.user);
          setIsAuthenticated(true);
          if (data.tokens !== undefined) {
            console.log('Setting initial tokens:', data.tokens);
            setTokens(data.tokens);
          } else if (data.user && data.user.id) {
            await fetchUserTokens(data.user.id);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setTokens(0);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
        setTokens(0);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const fetchUserTokens = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Fetched user tokens:', userData.tokens);
        setTokens(userData.tokens || 0);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  const updateTokens = (newTokens) => {
    console.log('Updating tokens to:', newTokens);
    setTokens(newTokens);
  };

  const decrementTokens = async () => {
    if (!user || tokens <= 0) return false;
    
    try {
      const userRef = doc(db, 'users', user.id);
      
      await updateDoc(userRef, {
        tokens: tokens - 1,
        lastUpdated: serverTimestamp()
      });
      
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
        updateTokens,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;