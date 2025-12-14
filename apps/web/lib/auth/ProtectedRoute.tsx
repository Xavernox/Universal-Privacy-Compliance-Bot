'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, redirectTo, router]);

  // Show loading spinner while checking authentication
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

  // Don't render children if user is not authenticated
  if (!user) {
    return null;
  }

  return <>{children}</>;
};

// HOC for protecting pages
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  redirectTo = '/login'
) => {
  const ProtectedComponent = (props: P) => {
    return (
      <ProtectedRoute redirectTo={redirectTo}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };

  ProtectedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ProtectedComponent;
};

// Hook for checking if current route is protected
export const useRequireAuth = (redirectTo = '/login') => {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, redirectTo, router]);

  return { user, loading };
};