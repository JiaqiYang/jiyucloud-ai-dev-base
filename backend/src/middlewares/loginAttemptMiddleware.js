// 登录尝试跟踪 (生产环境建议使用 Redis)
const loginAttempts = new Map();

// 清理过期的锁定记录（测试环境不启用定时器）
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of loginAttempts.entries()) {
      if (value.lockedUntil && now > value.lockedUntil) {
        loginAttempts.delete(key);
      }
    }
  }, 60 * 1000); // 每分钟清理一次
}

// 计算锁定时长（分钟）
/**
 * 根据失败次数计算锁定时长（分钟）
 * @param {number} attempts 失败次数
 * @returns {number} 锁定分钟
 */
function getLockoutDuration(attempts) {
  if (attempts < 3) {
    return 0;
  }
  if (attempts === 3) {
    return 5;
  }
  if (attempts === 4) {
    return 15;
  }
  if (attempts === 5) {
    return 30;
  }
  return 60; // 6次及以上锁定1小时
}

// 检查账号是否被锁定
/**
 * 检查账号是否被锁定
 * @param {string} username 用户名
 * @returns {{locked:boolean, remainingMinutes?:number, attempts?:number}}
 */
function checkLockout(username) {
  const record = loginAttempts.get(username);
  if (!record) {
    return { locked: false };
  }

  const now = Date.now();
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return {
      locked: true,
      remainingMinutes,
      attempts: record.attempts
    };
  }

  return { locked: false };
}

// 记录登录失败
/**
 * 记录登录失败
 * @param {string} username 用户名
 * @returns {{attempts:number, lockedUntil?:number, lockoutMinutes:number}}
 */
function recordFailedAttempt(username) {
  const record = loginAttempts.get(username) || { attempts: 0 };
  record.attempts += 1;

  const lockoutMinutes = getLockoutDuration(record.attempts);
  if (lockoutMinutes > 0) {
    record.lockedUntil = Date.now() + lockoutMinutes * 60 * 1000;
  }

  loginAttempts.set(username, record);

  return {
    attempts: record.attempts,
    lockedUntil: record.lockedUntil,
    lockoutMinutes
  };
}

// 重置登录记录（登录成功时调用）
/**
 * 重置登录失败记录
 * @param {string} username 用户名
 * @returns {void}
 */
function resetAttempts(username) {
  loginAttempts.delete(username);
}

module.exports = {
  checkLockout,
  recordFailedAttempt,
  resetAttempts
};
