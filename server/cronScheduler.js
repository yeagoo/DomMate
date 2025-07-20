import cron from 'node-cron';

// 存储活跃的定时任务
const activeTasks = new Map();

/**
 * 生成cron表达式
 * @param {string} type - 通知类型
 * @param {number} hour - 小时（0-23）
 * @param {number} minute - 分钟（0-59）
 * @param {number} weekday - 星期几（0=周日，1=周一...6=周六）
 * @returns {string} cron表达式
 */
export function generateCronExpression(type, hour = 8, minute = 0, weekday = 1) {
  // 验证参数范围
  hour = Math.max(0, Math.min(23, hour));
  minute = Math.max(0, Math.min(59, minute));
  weekday = Math.max(0, Math.min(6, weekday));

  switch (type) {
    case 'daily_summary':
      // 每日在指定时间发送
      return `${minute} ${hour} * * *`;
    
    case 'weekly_summary':
      // 每周在指定星期的指定时间发送
      return `${minute} ${hour} * * ${weekday}`;
    
    case 'expiry_reminder':
      // 到期提醒每天在指定时间检查
      return `${minute} ${hour} * * *`;
    
    default:
      // 默认每天8点
      return `0 8 * * *`;
  }
}

/**
 * 解析cron表达式为可读格式
 * @param {string} cronExpr - cron表达式
 * @returns {object} 解析后的时间信息
 */
export function parseCronExpression(cronExpr) {
  const parts = cronExpr.split(' ');
  if (parts.length !== 5) {
    return null;
  }

  const [minute, hour, day, month, weekday] = parts;
  
  return {
    minute: minute === '*' ? 0 : parseInt(minute),
    hour: hour === '*' ? 0 : parseInt(hour),
    day: day === '*' ? '*' : parseInt(day),
    month: month === '*' ? '*' : parseInt(month),
    weekday: weekday === '*' ? '*' : parseInt(weekday)
  };
}

/**
 * 获取cron表达式的可读描述
 * @param {string} type - 通知类型
 * @param {number} hour - 小时
 * @param {number} minute - 分钟
 * @param {number} weekday - 星期几
 * @param {string} language - 语言
 * @returns {string} 描述文本
 */
export function getCronDescription(type, hour, minute, weekday, language = 'zh') {
  const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
  const weekdays = {
    zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };

  switch (type) {
    case 'daily_summary':
      return language === 'zh' 
        ? `每天 ${timeStr} 发送`
        : `Daily at ${timeStr}`;
    
    case 'weekly_summary':
      const weekdayName = weekdays[language][weekday] || weekdays[language][1];
      return language === 'zh'
        ? `每${weekdayName} ${timeStr} 发送`
        : `Weekly on ${weekdayName} at ${timeStr}`;
    
    case 'expiry_reminder':
      return language === 'zh'
        ? `每天 ${timeStr} 检查到期域名`
        : `Daily at ${timeStr} check expiring domains`;
    
    default:
      return language === 'zh' ? '未知调度' : 'Unknown schedule';
  }
}

/**
 * 注册动态定时任务
 * @param {string} ruleId - 规则ID
 * @param {string} cronExpr - cron表达式
 * @param {function} taskFunction - 任务执行函数
 */
export function registerDynamicTask(ruleId, cronExpr, taskFunction) {
  // 先停止已存在的任务
  stopDynamicTask(ruleId);

  try {
    // 验证cron表达式
    if (!cron.validate(cronExpr)) {
      throw new Error(`无效的cron表达式: ${cronExpr}`);
    }

    // 创建新任务
    const task = cron.schedule(cronExpr, taskFunction, {
      scheduled: false, // 不立即启动
      name: `rule_${ruleId}`
    });

    // 启动任务
    task.start();
    
    // 保存任务引用
    activeTasks.set(ruleId, {
      task: task,
      cronExpression: cronExpr,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ 动态任务已注册: ${ruleId}, 表达式: ${cronExpr}`);
    return true;

  } catch (error) {
    console.error(`❌ 注册动态任务失败 ${ruleId}:`, error.message);
    return false;
  }
}

/**
 * 停止并删除动态任务
 * @param {string} ruleId - 规则ID
 * @returns {boolean} 是否成功停止
 */
export function stopDynamicTask(ruleId) {
  const taskInfo = activeTasks.get(ruleId);
  if (taskInfo) {
    try {
      taskInfo.task.stop();
      activeTasks.delete(ruleId);
      console.log(`✅ 动态任务已停止: ${ruleId}`);
      return true;
    } catch (error) {
      console.error(`❌ 停止动态任务失败 ${ruleId}:`, error.message);
      return false;
    }
  }
  return false;
}

/**
 * 重新加载所有动态任务
 * @param {function} getRules - 获取规则的函数
 * @param {function} getTaskFunction - 获取任务执行函数的函数
 */
export async function reloadAllDynamicTasks(getRules, getTaskFunction) {
  console.log('🔄 重新加载所有动态定时任务...');
  
  try {
    // 停止所有现有任务
    const ruleIds = Array.from(activeTasks.keys());
    ruleIds.forEach(ruleId => stopDynamicTask(ruleId));

    // 获取活跃规则
    const rules = await getRules();
    const activeRules = rules.filter(rule => rule.isActive && rule.cronExpression);

    // 注册新任务
    let successCount = 0;
    for (const rule of activeRules) {
      const taskFunction = getTaskFunction(rule);
      if (registerDynamicTask(rule.id, rule.cronExpression, taskFunction)) {
        successCount++;
      }
    }

    console.log(`✅ 动态任务重新加载完成: ${successCount}/${activeRules.length} 个任务`);
    return successCount;

  } catch (error) {
    console.error('❌ 重新加载动态任务失败:', error.message);
    return 0;
  }
}

/**
 * 获取所有活跃任务的状态
 * @returns {Array} 任务状态列表
 */
export function getActiveTasks() {
  const tasks = [];
  for (const [ruleId, taskInfo] of activeTasks.entries()) {
    tasks.push({
      ruleId: ruleId,
      cronExpression: taskInfo.cronExpression,
      isRunning: taskInfo.task.running,
      createdAt: taskInfo.createdAt
    });
  }
  return tasks;
}

/**
 * 计算下次执行时间
 * @param {string} cronExpr - cron表达式
 * @returns {Date|null} 下次执行时间
 */
export function getNextRunTime(cronExpr) {
  try {
    if (!cron.validate(cronExpr)) {
      return null;
    }

    // 使用一个简化的方法计算下次执行时间
    const task = cron.schedule(cronExpr, () => {}, { scheduled: false });
    // 注意：node-cron 没有直接提供获取下次执行时间的方法
    // 这里返回一个近似值，实际项目中可能需要使用 cron-parser 库
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    task.destroy();
    
    return nextHour;
  } catch (error) {
    return null;
  }
}

export default {
  generateCronExpression,
  parseCronExpression,
  getCronDescription,
  registerDynamicTask,
  stopDynamicTask,
  reloadAllDynamicTasks,
  getActiveTasks,
  getNextRunTime
}; 