import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock User for Demo Mode
  const mockUser = {
    id: 'DEMO-USER-001',
    email: 'admin@kgpinnovation.com',
    displayName: 'admin',
    role: 'Admin',
    kgpId: 'KGPA00001',
    vendorId: null
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        if (token === 'mock-token') {
          setUser(mockUser);
        } else {
          const data = await authApi.me();
          setUser(data.user || data);
        }
      } catch (error) {
        console.warn('Auth verification failed, falling back to mock mode if token is mock-token', error);
        if (token === 'mock-token') {
          setUser(mockUser);
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      setUser(data.user);
      return data;
    } catch (err) {
      console.warn('Login failed, using mock demo mode', err);
      // Demo Fallback
      localStorage.setItem('accessToken', 'mock-token');
      const demoUser = { ...mockUser, email, displayName: email.split('@')[0] };
      setUser(demoUser);
      return { user: demoUser, accessToken: 'mock-token' };
    }
  };

  const register = async (name, email, password) => {
    try {
      // If we had a real register endpoint we would call it here
      // const data = await authApi.register(name, email, password);
      throw new Error('Backend registration not connected in this demo, using mock registration.');
    } catch (err) {
      console.warn('Register fallback, using mock demo mode', err);
      localStorage.setItem('accessToken', 'mock-token');
      const demoUser = { ...mockUser, email, displayName: name };
      setUser(demoUser);
      return { user: demoUser, accessToken: 'mock-token' };
    }
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('accessToken') && localStorage.getItem('accessToken') !== 'mock-token') {
        await authApi.logout();
      }
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout
    }}>
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
