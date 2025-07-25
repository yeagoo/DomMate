import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface CaptchaData {
  id: string;
  question: string;
}

interface LoginInfo {
  success?: boolean;
  failedAttempts: number;
  requiresCaptcha: boolean;
  captcha?: CaptchaData;
}

interface LoginResult {
  success: boolean;
  message: string;
  sessionId?: string;
  requiresCaptcha?: boolean;
  captcha?: CaptchaData;
  forcePasswordChange?: boolean;
  forceChangeReason?: string;
}

interface LoginFormProps {
  language?: 'zh' | 'en';
  onLoginSuccess: (sessionId: string, options?: { forcePasswordChange?: boolean; reason?: string }) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ language = 'zh', onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);

  // 多语言文本
  const texts = {
    zh: {
      title: '访问验证',
      subtitle: '请输入访问密码以继续使用',
      passwordLabel: '访问密码',
      passwordPlaceholder: '请输入访问密码',
      captchaLabel: '验证码',
      captchaPlaceholder: '请输入计算结果',
      refreshCaptcha: '刷新验证码',
      loginButton: '登录',
      logging: '登录中...',
      showPassword: '显示密码',
      hidePassword: '隐藏密码',
      failedAttemptsInfo: '连续失败 {count} 次',
      defaultPassword: '默认密码: admin123',
      errors: {
        emptyPassword: '请输入密码',
        emptyCaptcha: '请输入验证码',
        loginFailed: '登录失败，请重试'
      }
    },
    en: {
      title: 'Access Verification',
      subtitle: 'Please enter the access password to continue',
      passwordLabel: 'Access Password',
      passwordPlaceholder: 'Enter access password',
      captchaLabel: 'Captcha',
      captchaPlaceholder: 'Enter the calculation result',
      refreshCaptcha: 'Refresh Captcha',
      loginButton: 'Login',
      logging: 'Logging in...',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      failedAttemptsInfo: 'Failed {count} times in a row',
      defaultPassword: 'Default password: admin123',
      errors: {
        emptyPassword: 'Please enter password',
        emptyCaptcha: 'Please enter captcha',
        loginFailed: 'Login failed, please try again'
      }
    }
  };

  const t = texts[language];

  // 获取登录信息
  const fetchLoginInfo = async () => {
    try {
      const response = await fetch('/api/auth/info');
      const data: LoginInfo = await response.json();
      
      if (data.success !== false) {
        setFailedAttempts(data.failedAttempts);
        setRequiresCaptcha(data.requiresCaptcha);
        if (data.captcha) {
          setCaptchaData(data.captcha);
        }
      }
    } catch (error) {
      console.error('获取登录信息失败:', error);
    }
  };

  // 刷新验证码
  const refreshCaptcha = async () => {
    try {
      const response = await fetch('/api/auth/captcha');
      const data = await response.json();
      
      if (data.success && data.captcha) {
        setCaptchaData(data.captcha);
        setCaptcha('');
      }
    } catch (error) {
      console.error('刷新验证码失败:', error);
    }
  };

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError(t.errors.emptyPassword);
      return;
    }

    if (requiresCaptcha && !captcha.trim()) {
      setError(t.errors.emptyCaptcha);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password.trim(),
          captcha: captcha.trim(),
          captchaId: captchaData?.id
        }),
      });

      const result: LoginResult = await response.json();

      if (result.success && result.sessionId) {
        // 检查是否需要强制修改密码
        if (result.forcePasswordChange) {
          // 需要强制修改密码，传递会话信息和原因
          onLoginSuccess(result.sessionId, {
            forcePasswordChange: true,
            reason: result.forceChangeReason || '需要修改密码'
          });
        } else {
          // 正常登录成功
          onLoginSuccess(result.sessionId);
        }
      } else {
        // 登录失败
        setError(result.message || t.errors.loginFailed);
        
        // 更新验证码要求状态
        if (result.requiresCaptcha) {
          setRequiresCaptcha(true);
          if (result.captcha) {
            setCaptchaData(result.captcha);
            setCaptcha('');
          }
        }
        
        // 重新获取登录信息
        await fetchLoginInfo();
      }
    } catch (error) {
      console.error('登录请求失败:', error);
      setError(t.errors.loginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化获取登录信息
  useEffect(() => {
    fetchLoginInfo();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* 头部 */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h1>
            <p className="text-gray-600 text-sm">{t.subtitle}</p>
          </div>

          {/* 失败次数提醒 */}
          {failedAttempts > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                <span className="text-amber-700 text-sm">
                  {t.failedAttemptsInfo.replace('{count}', failedAttempts.toString())}
                </span>
              </div>
            </div>
          )}

          {/* 默认密码提示 */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-blue-700 text-sm">{t.defaultPassword}</span>
            </div>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  title={showPassword ? t.hidePassword : t.showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* 验证码 */}
            {requiresCaptcha && captchaData && (
              <div>
                <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.captchaLabel}
                </label>
                <div className="space-y-3">
                  {/* 验证码题目 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-md">
                    <span className="font-mono text-lg font-semibold">
                      {captchaData.question} = ?
                    </span>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title={t.refreshCaptcha}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  {/* 验证码输入 */}
                  <input
                    id="captcha"
                    type="text"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    placeholder={t.captchaPlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin -ml-1 mr-3 h-4 w-4" />
                  {t.logging}
                </>
              ) : (
                t.loginButton
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 