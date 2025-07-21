import crypto from 'crypto';
import db from './database.js';

// 生成随机会话ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// 密码哈希
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 生成简单的数字验证码
function generateCaptcha() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operators = ['+', '-', '*'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  
  let answer;
  let question;
  
  switch (operator) {
    case '+':
      answer = num1 + num2;
      question = `${num1} + ${num2}`;
      break;
    case '-':
      // 确保结果为正数
      if (num1 >= num2) {
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
      } else {
        answer = num2 - num1;
        question = `${num2} - ${num1}`;
      }
      break;
    case '*':
      answer = num1 * num2;
      question = `${num1} × ${num2}`;
      break;
  }
  
  return { question, answer: answer.toString() };
}

class AuthService {
  constructor() {
    this.activeCaptchas = new Map(); // 存储活跃的验证码
    this.startCleanupTimer();
  }

  // 启动清理定时器
  startCleanupTimer() {
    // 每10分钟清理一次过期会话和验证码
    setInterval(async () => {
      try {
        await db.cleanupExpiredSessions();
        this.cleanupExpiredCaptchas();
      } catch (error) {
        console.error('清理过期数据失败:', error);
      }
    }, 10 * 60 * 1000); // 10分钟
  }

  // 清理过期验证码
  cleanupExpiredCaptchas() {
    const now = Date.now();
    for (const [key, data] of this.activeCaptchas.entries()) {
      if (now - data.createdAt > 5 * 60 * 1000) { // 5分钟过期
        this.activeCaptchas.delete(key);
      }
    }
  }

  // 用户登录
  async login(password, captcha = null, captchaId = null, ipAddress, userAgent) {
    try {
      // 检查是否需要验证码
      const requiresCaptcha = await db.shouldRequireCaptcha(ipAddress);
      
      if (requiresCaptcha) {
        if (!captcha || !captchaId) {
          return {
            success: false,
            message: '需要验证码',
            requiresCaptcha: true,
            captcha: this.generateCaptchaForClient()
          };
        }
        
        // 验证验证码
        const captchaData = this.activeCaptchas.get(captchaId);
        if (!captchaData || captchaData.answer !== captcha.toString()) {
          // 记录失败尝试
          await db.recordLoginAttempt(ipAddress, false, true);
          this.activeCaptchas.delete(captchaId); // 删除使用过的验证码
          
          return {
            success: false,
            message: '验证码错误',
            requiresCaptcha: true,
            captcha: this.generateCaptchaForClient()
          };
        }
        
        // 删除使用过的验证码
        this.activeCaptchas.delete(captchaId);
      }

      // 验证密码
      const hashedPassword = hashPassword(password);
      const storedPassword = await db.getAuthConfig('access_password');
      
      if (hashedPassword !== storedPassword) {
        // 记录失败尝试
        await db.recordLoginAttempt(ipAddress, false, requiresCaptcha);
        
        return {
          success: false,
          message: '密码错误',
          requiresCaptcha: await db.shouldRequireCaptcha(ipAddress),
          captcha: await db.shouldRequireCaptcha(ipAddress) ? this.generateCaptchaForClient() : null
        };
      }

      // 登录成功，创建会话
      const sessionId = generateSessionId();
      const expiryHours = parseInt(await db.getAuthConfig('session_expiry_hours') || '24');
      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
      
      await db.createSession(sessionId, ipAddress, userAgent, expiresAt);
      await db.recordLoginAttempt(ipAddress, true, requiresCaptcha);

      return {
        success: true,
        message: '登录成功',
        sessionId,
        expiresAt
      };

    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        message: '登录过程中发生错误'
      };
    }
  }

  // 验证会话
  async validateSession(sessionId) {
    if (!sessionId) return null;
    
    try {
      return await db.validateSession(sessionId);
    } catch (error) {
      console.error('会话验证失败:', error);
      return null;
    }
  }

  // 用户登出
  async logout(sessionId) {
    try {
      if (sessionId) {
        await db.deleteSession(sessionId);
      }
      return { success: true, message: '登出成功' };
    } catch (error) {
      console.error('登出失败:', error);
      return { success: false, message: '登出过程中发生错误' };
    }
  }

  // 修改密码
  async changePassword(oldPassword, newPassword, sessionId) {
    try {
      // 验证会话
      const session = await this.validateSession(sessionId);
      if (!session) {
        return { success: false, message: '会话无效，请重新登录' };
      }

      // 验证旧密码
      const hashedOldPassword = hashPassword(oldPassword);
      const storedPassword = await db.getAuthConfig('access_password');
      
      if (hashedOldPassword !== storedPassword) {
        return { success: false, message: '原密码错误' };
      }

      // 设置新密码
      const hashedNewPassword = hashPassword(newPassword);
      await db.setAuthConfig('access_password', hashedNewPassword);

      return { success: true, message: '密码修改成功' };
    } catch (error) {
      console.error('修改密码失败:', error);
      return { success: false, message: '密码修改过程中发生错误' };
    }
  }

  // 生成验证码（供客户端使用）
  generateCaptchaForClient() {
    const captcha = generateCaptcha();
    const captchaId = crypto.randomUUID();
    
    this.activeCaptchas.set(captchaId, {
      answer: captcha.answer,
      createdAt: Date.now()
    });
    
    return {
      id: captchaId,
      question: captcha.question
    };
  }

  // 获取登录状态信息
  async getLoginInfo(ipAddress) {
    try {
      const failedAttempts = await db.getRecentFailedAttempts(ipAddress);
      const requiresCaptcha = await db.shouldRequireCaptcha(ipAddress);
      
      return {
        failedAttempts,
        requiresCaptcha,
        captcha: requiresCaptcha ? this.generateCaptchaForClient() : null
      };
    } catch (error) {
      console.error('获取登录信息失败:', error);
      return {
        failedAttempts: 0,
        requiresCaptcha: false,
        captcha: null
      };
    }
  }

  // 中间件：验证API访问权限
  async authenticateRequest(req, res, next) {
    // 允许登录相关的API不需要认证
    const publicPaths = ['/api/auth/login', '/api/auth/info', '/api/auth/captcha'];
    if (publicPaths.includes(req.path)) {
      return next();
    }

    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    
    if (!sessionId) {
      return res.status(401).json({ 
        success: false, 
        message: '未授权访问',
        requiresAuth: true 
      });
    }

    const session = await this.validateSession(sessionId);
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: '会话已过期，请重新登录',
        requiresAuth: true 
      });
    }

    // 将会话信息添加到请求对象
    req.session = session;
    next();
  }
}

// 创建单例实例
const authService = new AuthService();

export default authService; 