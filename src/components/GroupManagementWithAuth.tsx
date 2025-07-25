import React from 'react';
import AuthWrapper from './AuthWrapper';
import { GroupManagement } from './GroupManagement';

interface GroupManagementWithAuthProps {
  language?: 'zh' | 'en';
}

const GroupManagementWithAuth: React.FC<GroupManagementWithAuthProps> = ({ language = 'zh' }) => {
  return (
    <AuthWrapper language={language}>
      <div className="space-y-6">
        <GroupManagement language={language} />
      </div>
    </AuthWrapper>
  );
};

export default GroupManagementWithAuth; 