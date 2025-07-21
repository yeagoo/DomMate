import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown, Key } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import PasswordChangeDialog from './PasswordChangeDialog';

interface UserMenuProps {
  language?: 'zh' | 'en';
}

const UserMenu: React.FC<UserMenuProps> = ({ language = 'zh' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout, sessionInfo } = useAuth();

  // 多语言文本
  const texts = {
    zh: {
      userMenu: '用户菜单',
      changePassword: '修改密码',
      logout: '退出登录',
      sessionInfo: '会话信息'
    },
    en: {
      userMenu: 'User Menu',
      changePassword: 'Change Password',
      logout: 'Logout',
      sessionInfo: 'Session Info'
    }
  };

  const t = texts[language];

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理登出
  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  // 处理密码修改
  const handleChangePassword = () => {
    setIsOpen(false);
    setShowPasswordDialog(true);
  };

  // 格式化时间
  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US');
    } catch (error) {
      return dateTimeStr;
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={t.userMenu}
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
            {/* 会话信息 */}
            {sessionInfo && (
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="text-xs text-gray-500 mb-1">{t.sessionInfo}</div>
                <div className="text-xs text-gray-600">
                  <div>ID: {sessionInfo.id.substring(0, 8)}...</div>
                  <div>
                    {language === 'zh' ? '过期时间' : 'Expires'}: {formatDateTime(sessionInfo.expiresAt)}
                  </div>
                </div>
              </div>
            )}

            {/* 修改密码 */}
            <button
              onClick={handleChangePassword}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            >
              <Key className="h-4 w-4 mr-2" />
              {t.changePassword}
            </button>

            {/* 分隔线 */}
            <div className="border-t border-gray-100 my-1"></div>

            {/* 退出登录 */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t.logout}
            </button>
          </div>
        )}
      </div>

      {/* 密码修改对话框 */}
      <PasswordChangeDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        language={language}
      />
    </>
  );
};

export default UserMenu; 