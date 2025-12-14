'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useAuth } from './AuthContext';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface AuthError {
  error: string;
}

// Login hook
export const useLogin = () => {
  const { setAuthData } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, AxiosError<AuthError>, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await axios.post<AuthResponse>('/api/auth/login', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      // Update AuthContext with the returned token and user data
      setAuthData(data.token, data.user);
      
      console.log('Login successful:', data.message);
      
      // Invalidate any user-related queries
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error: AxiosError<AuthError>) => {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      throw new Error(errorMessage);
    },
  });
};

// Register hook
export const useRegister = () => {
  const { setAuthData } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, AxiosError<AuthError>, RegisterCredentials>({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await axios.post<AuthResponse>('/api/auth/register', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      // Update AuthContext with the returned token and user data
      setAuthData(data.token, data.user);
      
      console.log('Registration successful:', data.message);
      
      // Invalidate any user-related queries
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error: AxiosError<AuthError>) => {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      throw new Error(errorMessage);
    },
  });
};

// Current user query hook
export const useCurrentUser = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await axios.get<{ user: User }>('/api/auth/me');
      return response.data.user;
    },
    enabled: isAuthenticated, // Only run if authenticated
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Logout mutation hook
export const useLogout = () => {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Add any logout API calls here if needed
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear React Query cache
      queryClient.clear();
      // Call AuthContext logout
      logout();
    },
  });
};