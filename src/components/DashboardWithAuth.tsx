import React from 'react';
import AuthWrapper from './AuthWrapper';
import Dashboard from './Dashboard';

interface DashboardWithAuthProps {
  language?: 'zh' | 'en';
}

const DashboardWithAuth: React.FC<DashboardWithAuthProps> = ({ language = 'zh' }) => {
  return (
    <AuthWrapper language={language}>
      <Dashboard />
    </AuthWrapper>
  );
};

export default DashboardWithAuth; 