import React from 'react';
import { useAuth } from '../hooks/useAuth';
import LoginForm from './LoginForm';
import { RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthenticatedAppProps {
  children: ReactNode;
  language?: 'zh' | 'en';
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ children, language = 'zh' }) => {
  const { isAuthenticated, isLoading, login } = useAuth();

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'zh' ? '正在验证身份...' : 'Verifying identity...'}
          </p>
        </div>
      </div>
    );
  }

  // 未认证状态，显示登录表单
  if (!isAuthenticated) {
    return (
      <LoginForm 
        language={language} 
        onLoginSuccess={login}
      />
    );
  }

  // 已认证状态，显示应用内容
  return <>{children}</>;
};

export default AuthenticatedApp; 