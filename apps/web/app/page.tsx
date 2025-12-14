'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

const HomePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
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

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        textAlign: 'center',
        color: 'white'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '800',
          marginBottom: '1rem',
          lineHeight: 1.2
        }}>
          U-PCB MVP
        </h1>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 300,
          marginBottom: '1rem',
          opacity: 0.9
        }}>
          Unified Cloud Security Platform
        </h2>
        <p style={{
          fontSize: '1.125rem',
          marginBottom: '3rem',
          opacity: 0.8,
          maxWidth: '600px',
          margin: '0 auto 3rem auto'
        }}>
          Comprehensive cloud security policy compliance and monitoring solution for modern enterprises.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '3rem'
        }}>
          <a
            href="/login"
            style={{
              padding: '1rem 2rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease'
            }}
          >
            Sign In
          </a>
          <a
            href="/register"
            style={{
              padding: '1rem 2rem',
              backgroundColor: 'white',
              color: '#4c1d95',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              transition: 'all 0.3s ease'
            }}
          >
            Get Started
          </a>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginTop: '4rem',
          textAlign: 'left'
        }}>
          <div style={{
            padding: '2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              🔒 Security Scans
            </h3>
            <p style={{ opacity: 0.8 }}>
              Automated cloud resource scanning with comprehensive security assessments and compliance reporting.
            </p>
          </div>
          
          <div style={{
            padding: '2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              📋 Policy Management
            </h3>
            <p style={{ opacity: 0.8 }}>
              Define, enforce, and monitor security policies across your entire cloud infrastructure.
            </p>
          </div>
          
          <div style={{
            padding: '2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              ⚠️ Real-time Alerts
            </h3>
            <p style={{ opacity: 0.8 }}>
              Get instant notifications for security violations and compliance issues as they happen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
