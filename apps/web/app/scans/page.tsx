'use client';

import React from 'react';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';

const ScansPage = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '2rem'
    }}>
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0',
        marginBottom: '2rem'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            Security Scans
          </h1>
        </div>
      </header>

      <main style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Cloud Security Scans
          </h2>
          
          <div style={{ color: '#6b7280' }}>
            <p style={{ marginBottom: '1rem' }}>
              Manage and monitor your cloud security scans across all your cloud infrastructure.
            </p>
            
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.375rem',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                No scans configured
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Start by configuring your first security scan to monitor your cloud resources.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ScansProtectedPage = () => {
  return (
    <ProtectedRoute>
      <ScansPage />
    </ProtectedRoute>
  );
};

export default ScansProtectedPage;