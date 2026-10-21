import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Fallback otomatis ke URL Railway backend jika VITE_API_URL tidak terdefinisi
const RAILWAY_BACKEND_URL = 'https://money-managament-production.up.railway.app';
export const API_BASE_URL = (import.meta.env.VITE_API_URL || RAILWAY_BACKEND_URL).replace(/\/$/, '');

export const getApiUrl = (endpoint) => {
  if (!endpoint.startsWith('/')) endpoint = `/${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
};

// Safe API response parser preventing "Unexpected token 'T'..." syntax error when backend returns HTML 404/500
export const parseApiResponse = async (res, defaultErrMsg = 'Terjadi kesalahan sistem') => {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const data = await res.json();
      return data;
    } catch {
      // Fallback if parsing fails
    }
  }

  // If response is not JSON (e.g. Vercel 404 "The page could not be found" HTML page)
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'Server backend tidak ditemukan (404). Pastikan backend dan database sudah aktif dan terhubung ke frontend.'
      );
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(
        `Server backend sedang tidak aktif atau tidak dapat dijangkau (${res.status}).`
      );
    }
    throw new Error(`${defaultErrMsg} (HTTP ${res.status})`);
  }

  return {};
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('arus_token') || null);
  const [loading, setLoading] = useState(true);

  // Helper fetch with auth & automatic API URL resolution
  const authFetch = async (url, options = {}) => {
    const fullUrl = url.startsWith('http') ? url : getApiUrl(url);
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(fullUrl, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error('Sesi telah berakhir. Silakan masuk kembali.');
    }
    return res;
  };

  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(getApiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await parseApiResponse(res);
          setUser(data.user);
        } else {
          localStorage.removeItem('arus_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error verifying auth:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await parseApiResponse(res, 'Gagal masuk');
    if (!res.ok) {
      throw new Error(data.error || 'Gagal masuk ke akun');
    }

    localStorage.setItem('arus_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, phone = '') => {
    const res = await fetch(getApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone_number: phone || null }),
    });

    const data = await parseApiResponse(res, 'Gagal mendaftar');
    if (!res.ok) {
      throw new Error(data.error || 'Gagal mendaftar akun');
    }

    localStorage.setItem('arus_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('arus_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : updatedFields));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        authFetch,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}