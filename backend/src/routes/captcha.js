/**
 * 验证码路由
 * - GET / 生成验证码（返回 SVG 与 captchaId）
 * - POST /verify 验证验证码
 * 同时导出 `verifyCaptcha(captchaId, captchaText)` 供其他模块调用
 */
const express = require('express');
const router = express.Router();
const svgCaptcha = require('svg-captcha');

// 存储验证码的临时对象 (生产环境建议使用 Redis)
const captchaStore = new Map();

// 清理过期验证码（测试环境不启用定时器）
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of captchaStore.entries()) {
      if (now - value.timestamp > 5 * 60 * 1000) {
        // 5分钟过期
        captchaStore.delete(key);
      }
    }
  }, 60 * 1000); // 每分钟清理一次
}

router.get('/', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 2,
    color: true,
    background: '#f0f2f5',
    width: 120,
    height: 40
  });

  const captchaId = `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 存储验证码（转为小写便于比对）
  captchaStore.set(captchaId, {
    text: captcha.text.toLowerCase(),
    timestamp: Date.now()
  });

  res.json({
    captchaId,
    captchaSvg: captcha.data
  });
});

// 验证验证码
router.post('/verify', (req, res) => {
  const { captchaId, captchaText } = req.body;

  if (!captchaId || !captchaText) {
    return res.status(400).json({ valid: false, message: '参数缺失' });
  }

  const stored = captchaStore.get(captchaId);
  if (!stored) {
    return res.status(400).json({ valid: false, message: '验证码已过期' });
  }

  // 验证后删除
  captchaStore.delete(captchaId);

  if (stored.text === captchaText.toLowerCase()) {
    res.json({ valid: true });
  } else {
    res.status(400).json({ valid: false, message: '验证码错误' });
  }
});

// 验证验证码函数（供其他模块调用）
/**
 * 验证验证码
 * @param {string} captchaId 验证码ID
 * @param {string} captchaText 用户输入验证码
 * @returns {{valid:boolean,message?:string}}
 */
function verifyCaptcha(captchaId, captchaText) {
  if (!captchaId || !captchaText) {
    return { valid: false, message: '参数缺失' };
  }

  const stored = captchaStore.get(captchaId);
  if (!stored) {
    return { valid: false, message: '验证码已过期' };
  }

  // 验证后删除
  captchaStore.delete(captchaId);

  if (stored.text === captchaText.toLowerCase()) {
    return { valid: true };
  } else {
    return { valid: false, message: '验证码错误' };
  }
}

module.exports = router;
module.exports.verifyCaptcha = verifyCaptcha;
