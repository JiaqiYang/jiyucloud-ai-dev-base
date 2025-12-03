const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoLib = require('png-to-ico');
const pngToIco = pngToIcoLib && pngToIcoLib.default ? pngToIcoLib.default : pngToIcoLib;
const { SystemConfig } = require('../models');

const ensureDir = dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const processIcon = async inputPath => {
  const uploadRoot = path.join(__dirname, '../../uploads');
  const siteDir = path.join(uploadRoot, 'site');
  ensureDir(siteDir);
  const ts = Date.now();
  const baseName = `site_icon_${ts}`;
  const sizes = [16, 32, 64];
  const pngPaths = [];
  for (const s of sizes) {
    const out = path.join(siteDir, `${baseName}-${s}.png`);
    await sharp(inputPath)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(out);
    pngPaths.push(out);
  }
  const icoOut = path.join(siteDir, `${baseName}.ico`);
  const icoBuf = await pngToIco(pngPaths);
  fs.writeFileSync(icoOut, icoBuf);
  const rel = p => `/uploads/site/${path.basename(p)}`;
  const data = {
    png16: rel(pngPaths[0]),
    png32: rel(pngPaths[1]),
    png64: rel(pngPaths[2]),
    favicon: rel(icoOut),
    version: ts
  };
  const row = await SystemConfig.findOne({ where: { code: 'site_icon' } });
  const json = JSON.stringify(data);
  if (row) {
    row.data = json;
    await row.save();
  } else {
    await SystemConfig.create({ code: 'site_icon', name: '站点图标', data: json });
  }
  return data;
};

const processFavicon = async inputPath => {
  const uploadRoot = path.join(__dirname, '../../uploads');
  const siteDir = path.join(uploadRoot, 'site');
  ensureDir(siteDir);
  const ts = Date.now();
  const baseName = `site_favicon_${ts}`;
  const sizes = [16, 32, 64];
  const pngPaths = [];
  for (const s of sizes) {
    const out = path.join(siteDir, `${baseName}-${s}.png`);
    await sharp(inputPath)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(out);
    pngPaths.push(out);
  }
  const icoOut = path.join(siteDir, `${baseName}.ico`);
  const icoBuf = await pngToIco(pngPaths);
  fs.writeFileSync(icoOut, icoBuf);
  const rel = p => `/uploads/site/${path.basename(p)}`;
  return {
    png16: rel(pngPaths[0]),
    png32: rel(pngPaths[1]),
    png64: rel(pngPaths[2]),
    favicon: rel(icoOut),
    version: ts
  };
};

const getMeta = async () => {
  let name = 'JiyuCloud';
  let subtitle = '公墓管理系统';
  let slogan = '专业的公墓信息化管理平台\n为您提供高效、安全、可靠的管理服务';
  let copyright = '© 2025 JiyuCloud Cemetery Management System';
  let icon = null;
  let favicon = null;
  const nameCfg = await SystemConfig.findOne({ where: { code: 'site_name' } });
  if (nameCfg) {
    try {
      const d = JSON.parse(nameCfg.data || '{}');
      if (d && d.name) {
        name = String(d.name);
      }
    } catch {}
  }
  const subCfg = await SystemConfig.findOne({ where: { code: 'site_subtitle' } });
  if (subCfg) {
    try {
      const d = JSON.parse(subCfg.data || '{}');
      if (d && d.subtitle) {
        subtitle = String(d.subtitle);
      }
    } catch {}
  }
  const iconCfg = await SystemConfig.findOne({ where: { code: 'site_icon' } });
  if (iconCfg) {
    try {
      icon = JSON.parse(iconCfg.data || '{}');
    } catch {
      icon = null;
    }
  }
  const favCfg = await SystemConfig.findOne({ where: { code: 'site_favicon' } });
  if (favCfg) {
    try {
      favicon = JSON.parse(favCfg.data || '{}');
    } catch {
      favicon = null;
    }
  }
  const slogCfg = await SystemConfig.findOne({ where: { code: 'site_slogan' } });
  if (slogCfg) {
    try {
      const d = JSON.parse(slogCfg.data || '{}');
      if (d && d.slogan) {
        slogan = String(d.slogan);
      }
    } catch {}
  }
  const copyCfg = await SystemConfig.findOne({ where: { code: 'site_copyright' } });
  if (copyCfg) {
    try {
      const d = JSON.parse(copyCfg.data || '{}');
      if (d && d.copyright) {
        copyright = String(d.copyright);
      }
    } catch {}
  }
  return { name, subtitle, slogan, copyright, icon, favicon };
};

module.exports = { processIcon, processFavicon, getMeta };
