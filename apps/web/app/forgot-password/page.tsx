'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSent(true);
      setLoading(false);
    }, 1000);
  };

  if (sent) {
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
              Check your email
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              We've sent a password reset link to {email}
            </p>
          </div>
          
          <div style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '0.375rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>✅</div>
            <p style={{ fontSize: '0.875rem', color: '#065f46' }}>
              Password reset instructions sent to your email address.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link 
              href="/login"
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
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
            Reset your password
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <div style={{ marginBottom: '1.5rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {loading ? (
                <>
                  <span style={{ marginRight: '0.5rem' }}>⏳</span>
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link 
              href="/login"
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}
            >
              ← Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;