import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const AuthContext = createContext(null);
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ✅ FIX: Saare axios calls mein credentials: 'include' add karo (cookie bhejne ke liye)
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // ✅ FIX: Token localStorage mein nahi rakhte — httpOnly cookie mein hai (browser manage karta hai)
  // Sirf user state rakhte hain
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (!error.response) {
          toast.error('Network Error: Unable to connect to server. Please check your connection.');
        } else if (error.response.status === 401) {
          if (isAuthenticated) {
            toast.error('Session expired. Please log in again.');
            logout();
          }
        } else if (error.response.status >= 500) {
          toast.error('Internal Server Error. Please try again later.');
        }
        return Promise.reject(error);
      }
    );

    // App load pe user fetch karo (cookie se automatically authenticate hoga)
    fetchUser();

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      // 401 = not logged in, that's fine
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${API}/auth/google`;
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { user: userData } = response.data;
    // ✅ FIX: Token cookie mein automatically set ho jaata hai backend se
    // localStorage.setItem nahi karna — XSS vulnerability thi
    setUser(userData);
    setIsAuthenticated(true);

    if (userData?.role === 'admin') {
      window.location.href = '/admin/dashboard';
    }

    return userData;
  };

  const register = async (userData) => {
    const response = await axios.post(`${API}/auth/register`, userData);
    return response.data;
  };

  const logout = async () => {
    try {
      // ✅ FIX: Backend logout call karo — token blacklist hoga server pe
      await axios.post(`${API}/auth/logout`);
    } catch (error) {
      // Logout silently fail karo
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      // ✅ localStorage.removeItem('token') — hataya (token wahan tha hi nahi)
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
