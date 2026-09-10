import create from 'zustand';
import axios from 'axios';

interface AuthState {
  userId: string | null;
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAuthStore = create<AuthState>((set) => ({
  userId: localStorage.getItem('userId'),
  token: localStorage.getItem('token'),
  email: localStorage.getItem('email'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { id, token, email: userEmail } = response.data.data;

      localStorage.setItem('userId', id);
      localStorage.setItem('token', token);
      localStorage.setItem('email', userEmail);

      set({
        userId: id,
        token,
        email: userEmail,
        isAuthenticated: true
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  register: async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });
      const { id, token, email: userEmail } = response.data.data;

      localStorage.setItem('userId', id);
      localStorage.setItem('token', token);
      localStorage.setItem('email', userEmail);

      set({
        userId: id,
        token,
        email: userEmail,
        isAuthenticated: true
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  },

  logout: () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    set({
      userId: null,
      token: null,
      email: null,
      isAuthenticated: false
    });
  }
}));
