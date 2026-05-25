import { useState, useEffect } from 'react';
import { api, setToken, getToken } from '../api';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

export function useAuth() {
  const { i18n } = useTranslation();
  const [appUser, setAppUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('theme') !== 'light';
  });

  // Login form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Theme application — dark is the default
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Check existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const user = await api.getMe();
          setAppUser(user);
        } catch {
          setToken(null);
          localStorage.removeItem('auth_user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const { token, user } = await api.login(authEmail, authPassword);
      setToken(token);
      setAppUser(user);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const { token, user } = await api.register(authEmail, authPassword, authName);
      setToken(token);
      setAppUser(user);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setAppUser(null);
  };

  return {
    appUser,
    setAppUser,
    loading,
    darkMode,
    toggleDarkMode,
    toggleLanguage,
    authMode,
    setAuthMode,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authName,
    setAuthName,
    authError,
    setAuthError,
    authLoading,
    handleLogin,
    handleRegister,
    handleLogout,
  };
}
