'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRegister } from '@/lib/auth/authHooks';

const RegisterPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const registerMutation = useRegister();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    if (formData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      validateForm();
      await registerMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });
      // Redirect will happen automatically when user state updates
      router.push('/dashboard');
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
            Create your account
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Join the Unified Cloud Security Platform
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          {registerMutation.isError && (
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
                    {registerMutation.error?.message || 'Registration failed. Please try again.'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="name" 
              style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
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
              placeholder="Enter your full name"
            />
          </div>

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
                autoComplete="new-password"
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
                placeholder="Create a password (min 8 characters)"
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="confirmPassword" 
              style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
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
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
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
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <button
              type="submit"
              disabled={registerMutation.isPending}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                backgroundColor: registerMutation.isPending ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: registerMutation.isPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {registerMutation.isPending ? (
                <>
                  <span style={{ marginRight: '0.5rem' }}>⏳</span>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: '#2563eb', fontWeight: 500 }}>
                Sign in
              </a>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;