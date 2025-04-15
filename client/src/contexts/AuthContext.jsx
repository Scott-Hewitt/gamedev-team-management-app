import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          // Token is expired
          logout();
        } else {
          // Set user from token
          fetchUserData(decoded.id, token);
        }
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (userId, token) => {
    try {
      const response = await api.get(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/users/login', { email, password });
      console.log('Login response:', response.data);

      // Extract token and user from the response
      const { token, user, message } = response.data;

      if (!token || !user) {
        throw new Error('Invalid response format from server');
      }

      // Save token to localStorage
      localStorage.setItem('token', token);

      // Set user in state
      setUser(user);

      return user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.post('/users/register', userData);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');

    // Clear user from state
    setUser(null);
    setLoading(false);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
