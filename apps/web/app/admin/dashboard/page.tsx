'use client';

import React from 'react';
import AlertDashboard from '@/components/AlertDashboard';

const AdminDashboardPage: React.FC = () => {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Admin Alert Dashboard</h1>
      <AlertDashboard />
    </main>
  );
};

export default AdminDashboardPage;
