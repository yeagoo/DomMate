import React, { useState } from 'react';
import { Eye, EyeOff, Lock, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface PasswordChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'zh' | 'en';
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({ 
  isOpen, 
  onClose, 
  language = 'zh' 
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 多语言文本
  const texts = {
    zh: {
      title: '修改访问密码',
      oldPasswordLabel: '当前密码',
      newPasswordLabel: '新密码',
      confirmPasswordLabel: '确认新密码',
      oldPasswordPlaceholder: '请输入当前密码',
      newPasswordPlaceholder: '请输入新密码（至少6位）',
      confirmPasswordPlaceholder: '请再次输入新密码',
      changeButton: '修改密码',
      changing: '修改中...',
      cancelButton: '取消',
      showPassword: '显示密码',
      hidePassword: '隐藏密码',
      errors: {
        emptyFields: '请填写所有字段',
        passwordTooShort: '新密码长度不能少于6位',
        passwordMismatch: '两次输入的新密码不一致',
        changeFailed: '密码修改失败，请重试'
      },
      success: '密码修改成功！'
    },
    en: {
      title: 'Change Access Password',
      oldPasswordLabel: 'Current Password',
      newPasswordLabel: 'New Password',
      confirmPasswordLabel: 'Confirm New Password',
      oldPasswordPlaceholder: 'Enter current password',
      newPasswordPlaceholder: 'Enter new password (at least 6 characters)',
      confirmPasswordPlaceholder: 'Enter new password again',
      changeButton: 'Change Password',
      changing: 'Changing...',
      cancelButton: 'Cancel',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      errors: {
        emptyFields: 'Please fill in all fields',
        passwordTooShort: 'New password must be at least 6 characters',
        passwordMismatch: 'New passwords do not match',
        changeFailed: 'Password change failed, please try again'
      },
      success: 'Password changed successfully!'
    }
  };

  const t = texts[language];

  // 重置表单
  const resetForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // 处理关闭
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 处理密码修改
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError(t.errors.emptyFields);
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
    setSuccess('');

    try {
      const sessionId = localStorage.getItem('sessionId');
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { 'X-Session-Id': sessionId }),
        },
        body: JSON.stringify({
          oldPassword: oldPassword.trim(),
          newPassword: newPassword.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(t.success);
        // 2秒后自动关闭对话框
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(result.message || t.errors.changeFailed);
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      setError(t.errors.changeFailed);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 当前密码 */}
          <div>
            <label htmlFor="old-password" className="block text-sm font-medium text-gray-700 mb-1">
              {t.oldPasswordLabel}
            </label>
            <div className="relative">
              <input
                id="old-password"
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t.oldPasswordPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                title={showOldPassword ? t.hidePassword : t.showPassword}
              >
                {showOldPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* 新密码 */}
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
              {t.newPasswordLabel}
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.newPasswordPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              {t.confirmPasswordLabel}
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.confirmPasswordPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
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

          {/* 错误信息 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* 成功信息 */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t.changing}
                </>
              ) : (
                t.changeButton
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.cancelButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeDialog; 