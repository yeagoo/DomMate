import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface SessionInfo {
  id: string;
  expiresAt: string;
  lastActivity: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionId: string | null;
  sessionInfo: SessionInfo | null;
  login: (sessionId: string) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  // 从localStorage中获取sessionId
  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      checkSession(storedSessionId);
    } else {
      setIsLoading(false);
    }
  }, []);

  // 检查会话有效性
  const checkSession = async (sessionIdToCheck?: string): Promise<boolean> => {
    const currentSessionId = sessionIdToCheck || sessionId;
    
    if (!currentSessionId) {
      setIsLoading(false);
      return false;
    }

    try {
      const response = await fetch('/api/auth/session', {
        headers: {
          'X-Session-Id': currentSessionId,
        },
      });

      const data = await response.json();

      if (data.success && data.valid) {
        setIsAuthenticated(true);
        setSessionInfo(data.session);
        setSessionId(currentSessionId);
        localStorage.setItem('sessionId', currentSessionId);
        return true;
      } else {
        // 会话无效，清理状态
        setIsAuthenticated(false);
        setSessionId(null);
        setSessionInfo(null);
        localStorage.removeItem('sessionId');
        return false;
      }
    } catch (error) {
      console.error('检查会话失败:', error);
      setIsAuthenticated(false);
      setSessionId(null);
      setSessionInfo(null);
      localStorage.removeItem('sessionId');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 登录
  const login = (newSessionId: string) => {
    setSessionId(newSessionId);
    setIsAuthenticated(true);
    localStorage.setItem('sessionId', newSessionId);
    // 重新检查会话以获取详细信息
    checkSession(newSessionId);
  };

  // 登出
  const logout = async () => {
    try {
      if (sessionId) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'X-Session-Id': sessionId,
          },
        });
      }
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      // 无论API调用是否成功，都清理本地状态
      setIsAuthenticated(false);
      setSessionId(null);
      setSessionInfo(null);
      localStorage.removeItem('sessionId');
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    sessionId,
    sessionInfo,
    login,
    logout,
    checkSession: () => checkSession()
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 自定义Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API请求拦截器Hook
export const useAuthenticatedFetch = () => {
  const { sessionId, logout } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (!sessionId) {
      throw new Error('No session ID available');
    }

    const authOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'X-Session-Id': sessionId,
      },
    };

    const response = await fetch(url, authOptions);

    // 如果返回401，说明会话已过期
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      if (data.requiresAuth) {
        await logout();
        window.location.reload(); // 刷新页面到登录界面
      }
    }

    return response;
  };

  return authenticatedFetch;
}; 