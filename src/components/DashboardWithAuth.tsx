import React, { useState, useEffect } from 'react';
import { AuthProvider } from '../hooks/useAuth';
import AuthenticatedApp from './AuthenticatedApp';
import Dashboard from './Dashboard';
import { GroupManagement } from './GroupManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { EmailDashboard } from './EmailDashboard';

const DashboardWithAuth: React.FC<{ language?: 'zh' | 'en' }> = ({ language = 'zh' }) => {
  const [currentPath, setCurrentPath] = useState('/'); // 默认首页，客户端会更新

  // 初始化当前路径并监听URL变化
  useEffect(() => {
    // 在客户端初始化时设置当前路径
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
    }

    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  // 监听页面内链接点击
  useEffect(() => {
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === 'A' && target.href && typeof window !== 'undefined') {
        const url = new URL(target.href);
        // 检查是否是内部链接
        if (url.origin === window.location.origin) {
          e.preventDefault();
          const newPath = url.pathname;
          if (newPath !== currentPath) {
            window.history.pushState({}, '', newPath);
            setCurrentPath(newPath);
          }
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('click', handleLinkClick);
      return () => document.removeEventListener('click', handleLinkClick);
    }
  }, [currentPath]);

  // 根据当前路径渲染对应的组件
  const renderCurrentPage = () => {
    switch (currentPath) {
             case '/groups':
         return <GroupManagement language={language} />;
      case '/analytics':
        return <AnalyticsDashboard language={language} />;
      case '/email':
        return <EmailDashboard language={language} />;
             case '/en':
         return <Dashboard />;
       case '/en/groups':
         return <GroupManagement />;
       case '/en/analytics':
         return <AnalyticsDashboard language="en" />;
       case '/en/email':
         return <EmailDashboard language="en" />;
       default:
         return <Dashboard />;
    }
  };

  return (
    <AuthProvider>
      <AuthenticatedApp language={language}>
        {renderCurrentPage()}
      </AuthenticatedApp>
    </AuthProvider>
  );
};

export default DashboardWithAuth; 