import React, { useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';

interface ForcedPasswordChangeDialogProps {
  isOpen: boolean;
  reason: string;
  sessionId: string;
  language?: 'zh' | 'en';
  onSuccess: () => void;
  onLogout: () => void;
}

const ForcedPasswordChangeDialog: React.FC<ForcedPasswordChangeDialogProps> = ({
  isOpen,
  reason,
  sessionId,
  language = 'zh',
  onSuccess,
  onLogout
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const texts = {
    zh: {
      title: '强制修改密码',
      subtitle: '出于安全考虑，您需要修改密码后才能继续使用系统',
      currentPasswordLabel: '当前密码',
      currentPasswordPlaceholder: '请输入当前密码',
      newPasswordLabel: '新密码',
      newPasswordPlaceholder: '请输入新密码（至少6位）',
      confirmPasswordLabel: '确认新密码',
      confirmPasswordPlaceholder: '请再次输入新密码',
      changeButton: '修改密码',
      changing: '修改中...',
      logoutButton: '退出登录',
      showPassword: '显示密码',
      hidePassword: '隐藏密码',
      successMessage: '密码修改成功！即将进入系统...',
      errors: {
        emptyCurrentPassword: '请输入当前密码',
        emptyNewPassword: '请输入新密码',
        emptyConfirmPassword: '请输入确认密码',
        passwordTooShort: '新密码长度至少需要6位',
        passwordMismatch: '两次输入的新密码不一致',
        changeFailed: '密码修改失败，请重试'
      }
    },
    en: {
      title: 'Force Password Change',
      subtitle: 'For security reasons, you need to change your password before continuing to use the system',
      currentPasswordLabel: 'Current Password',
      currentPasswordPlaceholder: 'Enter current password',
      newPasswordLabel: 'New Password',
      newPasswordPlaceholder: 'Enter new password (at least 6 characters)',
      confirmPasswordLabel: 'Confirm New Password',
      confirmPasswordPlaceholder: 'Enter new password again',
      changeButton: 'Change Password',
      changing: 'Changing...',
      logoutButton: 'Logout',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      successMessage: 'Password changed successfully! Entering system...',
      errors: {
        emptyCurrentPassword: 'Please enter current password',
        emptyNewPassword: 'Please enter new password',
        emptyConfirmPassword: 'Please enter confirmation password',
        passwordTooShort: 'New password must be at least 6 characters',
        passwordMismatch: 'New passwords do not match',
        changeFailed: 'Password change failed, please try again'
      }
    }
  };

  const t = texts[language];

  // 处理密码修改
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证输入
    if (!currentPassword.trim()) {
      setError(t.errors.emptyCurrentPassword);
      return;
    }

    if (!newPassword.trim()) {
      setError(t.errors.emptyNewPassword);
      return;
    }

    if (!confirmPassword.trim()) {
      setError(t.errors.emptyConfirmPassword);
      return;
    }

    if (newPassword.length < 6) {
      setError(t.errors.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.errors.passwordMismatch);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId
        },
        body: JSON.stringify({
          oldPassword: currentPassword.trim(),
          newPassword: newPassword.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        // 延迟2秒后调用成功回调
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(result.message || t.errors.changeFailed);
      }
    } catch (error) {
      console.error('密码修改请求失败:', error);
      setError(t.errors.changeFailed);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* 背景遮罩 */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        
        {/* 对话框内容 */}
        <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-md transform transition-all">
          {!success ? (
            <>
              {/* 头部 */}
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t.title}</h2>
                <p className="text-gray-600 text-sm mb-4">{t.subtitle}</p>
                
                {/* 强制修改原因 */}
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-amber-700 text-sm font-medium">{reason}</p>
                </div>
              </div>

              {/* 错误信息 */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* 表单 */}
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* 当前密码 */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    {t.currentPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder={t.currentPasswordPlaceholder}
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={isLoading}
                      title={showCurrentPassword ? t.hidePassword : t.showPassword}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 新密码 */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    {t.newPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder={t.newPasswordPlaceholder}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}
                      title={showNewPassword ? t.hidePassword : t.showPassword}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 确认新密码 */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    {t.confirmPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder={t.confirmPasswordPlaceholder}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                      title={showConfirmPassword ? t.hidePassword : t.showPassword}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 按钮组 */}
                <div className="flex flex-col gap-3 pt-4">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.changing}
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        {t.changeButton}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    {t.logoutButton}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* 成功状态 */
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t.successMessage}</h2>
              <div className="flex justify-center">
                <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForcedPasswordChangeDialog; 