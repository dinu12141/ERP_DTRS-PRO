import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // Set up axios with Firebase ID token immediately
        const token = await firebaseUser.getIdToken();
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Real-time listener for user data
        const unsubscribeSnapshot = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = { id: firebaseUser.uid, ...docSnap.data() };
            setUser(userData);
          }
          setLoading(false);
        }, (error) => {
          console.error('Failed to fetch user data:', error);
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = { id: userCredential.user.uid, ...userDoc.data() };
        setUser(userData);

        // Set axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        return { success: true, role: userData.role };
      } else {
        return { success: false, error: 'User data not found' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  };

  const register = async (email, password, userData) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Register with backend to save additional user data
      const response = await axios.post(`${API_URL}/auth/register`, {
        user: {
          ...userData,
          email,
        },
        password,
      });

      return { success: true, user: response.data };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getToken = async () => {
    if (firebaseUser) {
      return await firebaseUser.getIdToken();
    }
    return null;
  };

  const value = {
    user,
    firebaseUser,
    loading,
    login,
    register,
    logout,
    getToken,
    isAuthenticated: !!firebaseUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};


