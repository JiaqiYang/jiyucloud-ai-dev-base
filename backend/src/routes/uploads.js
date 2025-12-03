/**
 * 上传路由（需认证）
 * - POST /avatar 上传头像，返回相对 URL
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authMiddleware = require('../middlewares/authMiddleware');

/**
 * 确保目录存在
 * @param {string} dir 目录路径
 */
const ensureDir = dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const uploadRoot = path.join(__dirname, '../../uploads');
const avatarDir = path.join(uploadRoot, 'avatars');
const siteDir = path.join(uploadRoot, 'site');
const audioDir = path.join(uploadRoot, 'audios');
ensureDir(avatarDir);
ensureDir(siteDir);
ensureDir(audioDir);

/**
 * Multer 存储配置：保存到 avatars 目录，按文件名+时间戳命名
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    const ts = Date.now();
    cb(null, `${name || 'avatar'}_${ts}${ext || '.png'}`);
  }
});

/**
 * 上传限制与文件类型过滤
 */
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('仅支持 png/jpg/jpeg/webp'));
    }
    cb(null, true);
  }
});

router.use(authMiddleware);

router.post('/avatar', upload.single('file'), (req, res) => {
  try {
    const rel = `/uploads/avatars/${req.file.filename}`;
    res.json({ url: rel });
  } catch (err) {
    res.status(500).json({ error: '上传失败' });
  }
});

const siteStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, siteDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    const ts = Date.now();
    cb(null, `${name || 'site'}_${ts}${ext || '.png'}`);
  }
});
const siteUpload = multer({
  storage: siteStorage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('仅支持 png/jpg/jpeg/svg'));
    }
    cb(null, true);
  }
});

router.post('/site/icon', (req, res) => {
  siteUpload.single('file')(req, res, async err => {
    if (err) {
      return res.status(400).json({ error: err.message || '上传失败' });
    }
    try {
      const abs = path.join(siteDir, req.file.filename);
      const { processIcon } = require('../services/siteIconService');
      const data = await processIcon(abs);
      res.json({ url: `/uploads/site/${req.file.filename}`, generated: data });
    } catch (e) {
      res.status(500).json({ error: e.message || '图标处理失败' });
    }
  });
});

router.post('/site/favicon', (req, res) => {
  siteUpload.single('file')(req, res, async err => {
    if (err) {
      return res.status(400).json({ error: err.message || '上传失败' });
    }
    try {
      const abs = path.join(siteDir, req.file.filename);
      const { processFavicon } = require('../services/siteIconService');
      const { SystemConfig } = require('../models');
      const data = await processFavicon(abs);
      const json = JSON.stringify(data || {});
      const row = await SystemConfig.findOne({ where: { code: 'site_favicon' } });
      if (row) {
        row.name = '标签页小图标';
        row.data = json;
        await row.save();
      } else {
        await SystemConfig.create({ code: 'site_favicon', name: '标签页小图标', data: json });
      }
      res.json({ url: `/uploads/site/${req.file.filename}`, generated: data });
    } catch (e) {
      res.status(500).json({ error: e.message || '图标处理失败' });
    }
  });
});

const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, audioDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    const ts = Date.now();
    cb(null, `${name || 'audio'}_${ts}${ext || '.mp3'}`);
  }
});
const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp3', '.wav', '.ogg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('仅支持 mp3/wav/ogg'));
    }
    cb(null, true);
  }
});

router.post('/audio', audioUpload.single('file'), (req, res) => {
  try {
    const rel = `/uploads/audios/${req.file.filename}`;
    res.json({ url: rel });
  } catch (err) {
    res.status(500).json({ error: '上传失败' });
  }
});
router.post('/audio/defaults', async (req, res) => {
  try {
    const genWav = (freq, ms) => {
      const sampleRate = 44100;
      const samples = Math.floor((ms / 1000) * sampleRate);
      const headerSize = 44;
      const dataSize = samples * 2;
      const buf = Buffer.alloc(headerSize + dataSize);
      buf.write('RIFF', 0);
      buf.writeUInt32LE(36 + dataSize, 4);
      buf.write('WAVE', 8);
      buf.write('fmt ', 12);
      buf.writeUInt32LE(16, 16);
      buf.writeUInt16LE(1, 20);
      buf.writeUInt16LE(1, 22);
      buf.writeUInt32LE(sampleRate, 24);
      buf.writeUInt32LE(sampleRate * 2, 28);
      buf.writeUInt16LE(2, 32);
      buf.writeUInt16LE(16, 34);
      buf.write('data', 36);
      buf.writeUInt32LE(dataSize, 40);
      let off = headerSize;
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const s = Math.sin(2 * Math.PI * freq * t) * 0.3;
        const v = Math.max(-1, Math.min(1, s));
        buf.writeInt16LE((v * 32767) | 0, off);
        off += 2;
      }
      return buf;
    };
    const ts = Date.now();
    const defs = {
      system: { f: 880, d: 700 },
      business: { f: 660, d: 600 },
      alert: { f: 440, d: 900 },
      user: { f: 550, d: 500 }
    };
    const out = {};
    for (const k of Object.keys(defs)) {
      const { f, d } = defs[k];
      const buf = genWav(f, d);
      const name = `${k}_default_${ts}.wav`;
      fs.writeFileSync(path.join(audioDir, name), buf);
      out[k] = `/uploads/audios/${name}`;
    }
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: '生成失败' });
  }
});

module.exports = router;
