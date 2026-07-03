'use client';

/**
 * @file AuthContext.js
 * @description React context to maintain super admin credentials and checks.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

// Set axios default withCredentials at module level
axios.defaults.withCredentials = true;

const AuthContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`);
        if (res.data && res.data.accessToken) {
          const token = res.data.accessToken;
          setAccessToken(token);
          
          const userRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setUser(userRes.data.user);
        }
      } catch (error) {
        console.warn('Initial session loading skipped (no active session cookie).');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      // Ensure the logged in user is actually a super admin!
      if (res.data.user.role !== 'super_admin') {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${res.data.accessToken}` }
        });
        return { success: false, error: 'Access Denied: Only platform administrators are allowed' };
      }

      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || 'Invalid credentials';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (accessToken) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } fontally: {
      setUser(null);
      setAccessToken(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
