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

    // Axios Interceptor to auto-refresh expired access tokens seamlessly on 401
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response &&
          error.response.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url.includes('/auth/refresh') &&
          !originalRequest.url.includes('/auth/login')
        ) {
          originalRequest._retry = true;
          try {
            const refreshRes = await axios.post(`${API_URL}/auth/refresh`);
            if (refreshRes.data && refreshRes.data.accessToken) {
              const newToken = refreshRes.data.accessToken;
              setAccessToken(newToken);
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          } catch (refreshErr) {
            console.warn('Auto refresh failed, clearing session.');
            setUser(null);
            setAccessToken(null);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      // Ensure the logged in user is a platform administrator or subadmin
      const userRole = res.data.user?.role;
      const isAdminUser = userRole === 'super_admin' || userRole === 'sub_admin' || userRole === 'admin';
      
      if (!isAdminUser) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${res.data.accessToken}` }
        });
        return { success: false, error: 'Access Denied: Only platform administrators and subadmins are allowed' };
      }

      // Check if subadmin account is suspended
      if (res.data.user.status === 'suspended' || res.data.user.isSuspended) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${res.data.accessToken}` }
        });
        return { success: false, error: 'Account Suspended: Your administrative access has been suspended by the Super Administrator' };
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
    } finally {
      setUser(null);
      setAccessToken(null);
      setLoading(false);
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';

  const hasPermission = (permissionKey) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (!permissionKey) return true;
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    return perms.includes('*') || perms.includes(permissionKey);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, isSuperAdmin, hasPermission }}>
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
