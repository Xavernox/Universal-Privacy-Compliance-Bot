'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLogin } from '@/lib/auth/authHooks';

const LoginPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const loginMutation = useLogin();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await loginMutation.mutateAsync(formData);
      // Redirect will happen automatically when user state updates
      router.push('/dashboard');
    } catch (error) {
      // Error is already handled by the mutation hook and will be available in loginMutation.error
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (authLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f9fafb',
      padding: '3rem 1rem'
    }}>
      <div style={{ maxWidth: '28rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ 
            marginTop: '1.5rem',
            fontSize: '1.875rem',
            fontWeight: '800',
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            Sign in to your account
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Unified Cloud Security Platform
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          {loginMutation.isError && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.375rem',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ color: '#f87171', fontSize: '1.25rem' }}>⚠️</span>
                </div>
                <div style={{ marginLeft: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#991b1b' }}>
                    {loginMutation.error?.message || 'Login failed. Please try again.'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="email" 
              style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#111827',
                backgroundColor: 'white'
              }}
              placeholder="Enter your email"
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="password" 
              style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem 2.5rem 0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: '#111827',
                  backgroundColor: 'white'
                }}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem' }}>
              <a 
                href="/forgot-password" 
                style={{ color: '#2563eb', fontWeight: 500 }}
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                backgroundColor: loginMutation.isPending ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: loginMutation.isPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {loginMutation.isPending ? (
                <>
                  <span style={{ marginRight: '0.5rem' }}>⏳</span>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Don't have an account?{' '}
              <a href="/register" style={{ color: '#2563eb', fontWeight: 500 }}>
                Sign up
              </a>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;