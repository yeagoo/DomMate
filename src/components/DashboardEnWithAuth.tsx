import React from 'react';
import AuthWrapper from './AuthWrapper';
import DashboardEn from './DashboardEn';

interface DashboardEnWithAuthProps {
  language?: 'zh' | 'en';
}

const DashboardEnWithAuth: React.FC<DashboardEnWithAuthProps> = ({ language = 'en' }) => {
  return (
    <AuthWrapper language={language}>
      <DashboardEn />
    </AuthWrapper>
  );
};

export default DashboardEnWithAuth; 