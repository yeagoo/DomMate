import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '../hooks/useAuth';
import AuthenticatedApp from './AuthenticatedApp';
import UserMenu from './UserMenu';
import type { ReactNode } from 'react';

interface AuthWrapperProps {
  children: ReactNode;
  language?: 'zh' | 'en';
  enableUserMenu?: boolean;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ 
  children, 
  language = 'zh',
  enableUserMenu = true
}) => {
  // 渲染用户菜单到header中
  useEffect(() => {
    if (enableUserMenu) {
      const userMenuContainer = document.getElementById('user-menu');
      if (userMenuContainer) {
        const root = createRoot(userMenuContainer);
        root.render(
          <AuthProvider>
            <UserMenu language={language} />
          </AuthProvider>
        );
      }
    }
  }, [language, enableUserMenu]);

  return (
    <AuthProvider>
      <AuthenticatedApp language={language}>
        {children}
      </AuthenticatedApp>
    </AuthProvider>
  );
};

export default AuthWrapper; 