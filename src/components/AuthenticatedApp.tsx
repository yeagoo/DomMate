import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoginForm from './LoginForm';
import ForcedPasswordChangeDialog from './ForcedPasswordChangeDialog';
import { RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthenticatedAppProps {
  children: ReactNode;
  language?: 'zh' | 'en';
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ children, language = 'zh' }) => {
  const { isAuthenticated, isLoading, login, logout } = useAuth();
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [forceChangeReason, setForceChangeReason] = useState('');
  const [forceChangeSessionId, setForceChangeSessionId] = useState('');

  // 处理登录成功
  const handleLoginSuccess = (sessionId: string, options?: { forcePasswordChange?: boolean; reason?: string }) => {
    if (options?.forcePasswordChange) {
      // 需要强制修改密码
      setForcePasswordChange(true);
      setForceChangeReason(options.reason || '需要修改密码');
      setForceChangeSessionId(sessionId);
    } else {
      // 正常登录
      login(sessionId);
    }
  };

  // 处理强制密码修改成功
  const handleForcePasswordChangeSuccess = () => {
    // 密码修改成功后，清除强制修改状态，正常登录
    setForcePasswordChange(false);
    setForceChangeReason('');
    login(forceChangeSessionId);
    setForceChangeSessionId('');
  };

  // 处理强制密码修改时的登出
  const handleForcePasswordChangeLogout = async () => {
    // 清除所有状态并登出
    setForcePasswordChange(false);
    setForceChangeReason('');
    setForceChangeSessionId('');
    
    // 如果有会话ID，发送登出请求
    if (forceChangeSessionId) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'X-Session-Id': forceChangeSessionId,
          },
        });
      } catch (error) {
        console.error('登出请求失败:', error);
      }
    }
  };

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

  // 强制修改密码状态
  if (forcePasswordChange) {
    return (
      <>
        <ForcedPasswordChangeDialog
          isOpen={true}
          reason={forceChangeReason}
          sessionId={forceChangeSessionId}
          language={language}
          onSuccess={handleForcePasswordChangeSuccess}
          onLogout={handleForcePasswordChangeLogout}
        />
        {/* 背景内容 */}
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-sm">
              {language === 'zh' ? '正在等待密码修改...' : 'Waiting for password change...'}
            </p>
          </div>
        </div>
      </>
    );
  }

  // 未认证状态，显示登录表单
  if (!isAuthenticated) {
    return (
      <LoginForm 
        language={language} 
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 已认证状态，显示应用内容
  return <>{children}</>;
};

export default AuthenticatedApp; 