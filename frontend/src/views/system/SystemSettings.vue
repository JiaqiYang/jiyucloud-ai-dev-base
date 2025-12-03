<template>
  <div>
    <a-card title="系统设置" bordered>
  <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 10 }">
        <a-form-item label="网站名称" required>
          <a-input v-model:value="form.site_name" placeholder="请输入网站名称" allowClear />
        </a-form-item>
        <a-form-item label="网站副标题">
          <a-input v-model:value="form.site_subtitle" placeholder="请输入网站副标题" allowClear />
        </a-form-item>
        <a-form-item label="网站图标">
          <div class="icon-row">
            <a-upload
              name="file"
              :action="uploadActionSiteIcon"
              :headers="uploadHeaders"
              :showUploadList="false"
              :beforeUpload="beforeSiteIconUpload"
              accept=".png,.jpg,.jpeg,.svg"
              @change="handleSiteIconChange"
            >
              <div class="icon-box">
                <template v-if="siteIconGenerated?.png64">
                  <img :src="resolveFileUrl(siteIconGenerated.png64)" class="icon-img" />
                  <div class="icon-overlay">更换图标</div>
                </template>
                <template v-else>
                  <div class="icon-placeholder">上传网站图标</div>
                </template>
              </div>
            </a-upload>
            <div class="icon-previews">
              <div class="preview-item"><img :src="resolveFileUrl(siteIconGenerated?.png16)" class="preview s16" /><span class="preview-label">16×16</span></div>
              <div class="preview-item"><img :src="resolveFileUrl(siteIconGenerated?.png32)" class="preview s32" /><span class="preview-label">32×32</span></div>
              <div class="preview-item"><img :src="resolveFileUrl(siteIconGenerated?.png64)" class="preview s64" /><span class="preview-label">64×64</span></div>
            </div>
          </div>
        </a-form-item>

        <a-form-item label="标签页小图标">
          <div class="icon-row">
            <a-upload
              name="file"
              :action="uploadActionSiteFavicon"
              :headers="uploadHeaders"
              :showUploadList="false"
              :beforeUpload="beforeSiteIconUpload"
              accept=".png,.jpg,.jpeg,.svg"
              @change="handleFaviconChange"
            >
              <div class="icon-box small">
                <template v-if="faviconGenerated?.png32">
                  <img :src="resolveFileUrl(faviconGenerated.png32)" class="icon-img small" />
                  <div class="icon-overlay">更换图标</div>
                </template>
                <template v-else>
                  <div class="icon-placeholder">上传标签页小图标</div>
                </template>
              </div>
            </a-upload>
            <div class="icon-actions">
              <a-button @click="useSiteIconAsFavicon" :disabled="!siteIconGenerated">使用网站图标</a-button>
            </div>
          </div>
        </a-form-item>
        <a-form-item label="网站广告语">
          <a-textarea v-model:value="form.site_slogan" placeholder="请输入网站广告语" :rows="4" allowClear />
        </a-form-item>
        <a-form-item label="网站版权">
          <a-input v-model:value="form.site_copyright" placeholder="请输入网站版权" allowClear />
        </a-form-item>
        <a-form-item label="无操作自动下线(毫秒)" required>
          <a-space>
            <a-input-number v-model:value="form.inactive_ms" :min="1000" :step="1000" />
            <a-button @click="form.inactive_ms = 300000">5分钟</a-button>
            <a-button @click="form.inactive_ms = 900000">15分钟</a-button>
            <a-button @click="form.inactive_ms = 1800000">30分钟</a-button>
            <a-button @click="form.inactive_ms = 3600000">1小时</a-button>
          </a-space>
          <div style="margin-top:6px;color:#8B9CAD">约 {{ seconds }} 秒 / {{ minutes.toFixed(2) }} 分钟</div>
          <a-alert type="info" show-icon style="margin-top:12px" :message="`当前配置将在新页面或下次活动心跳生效`" />
        </a-form-item>
        <a-form-item label="同一用户允许同时登录设备数量" required>
          <a-input-number v-model:value="form.max_devices" :min="1" :max="50" :step="1" />
        </a-form-item>
        <a-form-item label="音效生成">
          <a-space>
            <a-button :loading="generating" @click="generateDefaults">生成默认音效</a-button>
          </a-space>
        </a-form-item>
        <a-form-item label="系统通知音效(URL)">
          <a-space>
            <a-input v-model:value="form.audio_system" placeholder="http 或 /uploads 路径" allowClear style="width:360px" />
            <a-button @click="playAudio('system')" :disabled="!form.audio_system">试听</a-button>
            <a-upload
              name="file"
              :action="uploadActionAudio"
              :headers="uploadHeaders"
              accept=".mp3,.wav,.ogg"
              :max-count="1"
              :showUploadList="false"
              @change="handleAudioUpload('system')"
            >
              <a-button>上传</a-button>
            </a-upload>
          </a-space>
        </a-form-item>
        <a-form-item label="业务提醒音效(URL)">
          <a-space>
            <a-input v-model:value="form.audio_business" placeholder="http 或 /uploads 路径" allowClear style="width:360px" />
            <a-button @click="playAudio('business')" :disabled="!form.audio_business">试听</a-button>
            <a-upload
              name="file"
              :action="uploadActionAudio"
              :headers="uploadHeaders"
              accept=".mp3,.wav,.ogg"
              :max-count="1"
              :showUploadList="false"
              @change="handleAudioUpload('business')"
            >
              <a-button>上传</a-button>
            </a-upload>
          </a-space>
        </a-form-item>
        <a-form-item label="告警信息音效(URL)">
          <a-space>
            <a-input v-model:value="form.audio_alert" placeholder="http 或 /uploads 路径" allowClear style="width:360px" />
            <a-button @click="playAudio('alert')" :disabled="!form.audio_alert">试听</a-button>
            <a-upload
              name="file"
              :action="uploadActionAudio"
              :headers="uploadHeaders"
              accept=".mp3,.wav,.ogg"
              :max-count="1"
              :showUploadList="false"
              @change="handleAudioUpload('alert')"
            >
              <a-button>上传</a-button>
            </a-upload>
          </a-space>
        </a-form-item>
        <a-form-item label="用户消息音效(URL)">
          <a-space>
            <a-input v-model:value="form.audio_user" placeholder="http 或 /uploads 路径" allowClear style="width:360px" />
            <a-button @click="playAudio('user')" :disabled="!form.audio_user">试听</a-button>
            <a-upload
              name="file"
              :action="uploadActionAudio"
              :headers="uploadHeaders"
              accept=".mp3,.wav,.ogg"
              :max-count="1"
              :showUploadList="false"
              @change="handleAudioUpload('user')"
            >
              <a-button>上传</a-button>
            </a-upload>
          </a-space>
        </a-form-item>
        <a-form-item :wrapper-col="{ span: 10, offset: 6 }">
          <a-space>
            <a-button type="primary" :loading="saving" @click="save">保存</a-button>
            <a-button @click="load">重置</a-button>
          </a-space>
        </a-form-item>
  </a-form>
      
      
    </a-card>
  </div>
  </template>
<script setup>
import { ref, computed } from 'vue'
import { message, Upload } from 'ant-design-vue'
import { getConfig, updateConfig } from '@/api/system/config'
import request from '@/utils/request'

const CODE = 'auto_logout'
const form = ref({ inactive_ms: 300000, max_devices: 3, site_name: '', site_subtitle: '公墓管理系统', site_slogan: '', site_copyright: '', audio_system: '', audio_business: '', audio_alert: '', audio_user: '' })
const saving = ref(false)
const generating = ref(false)
const seconds = computed(() => Math.round(Number(form.value.inactive_ms || 0) / 1000))
const minutes = computed(() => Number(form.value.inactive_ms || 0) / 60000)

const load = async () => {
  try {
    const r = await getConfig(CODE)
    const d = r || {}
    const ms = Number(d.inactive_ms || 0)
    form.value.inactive_ms = ms > 0 ? ms : 300000
    const r2 = await getConfig('max_login_devices')
    const d2 = r2 || {}
    const n = Number(d2.count || 0)
    form.value.max_devices = n > 0 ? n : 3
    const r3 = await getConfig('site_name')
    const d3 = r3 || {}
    form.value.site_name = d3.name || 'JiyuCloud'
    const r4 = await getConfig('site_subtitle')
    const d4 = r4 || {}
    form.value.site_subtitle = d4.subtitle || '公墓管理系统'
    const r5 = await getConfig('site_slogan')
    const d5 = r5 || {}
    form.value.site_slogan = d5.slogan || '专业的公墓信息化管理平台\n为您提供高效、安全、可靠的管理服务'
    const r6 = await getConfig('site_copyright')
    const d6 = r6 || {}
    form.value.site_copyright = d6.copyright || '© 2025 JiyuCloud Cemetery Management System'
    const r7 = await getConfig('audio_message_system')
    const d7 = r7 || {}
    form.value.audio_system = d7.url || ''
    const r8 = await getConfig('audio_message_business')
    const d8 = r8 || {}
    form.value.audio_business = d8.url || ''
    const r9 = await getConfig('audio_message_alert')
    const d9 = r9 || {}
    form.value.audio_alert = d9.url || ''
    const r10 = await getConfig('audio_message_user')
    const d10 = r10 || {}
    form.value.audio_user = d10.url || ''
    const meta = await request({ url: '/public/site/meta', method: 'get' })
    const icon = meta?.icon || null
    if (icon && (icon.png16 || icon.png32 || icon.png64)) {
      siteIconGenerated.value = icon
      siteIconUploaded.value = true
      try { document.title = meta?.name || form.value.site_name || 'JiyuCloud' } catch {}
      try { await applyFavicon() } catch {}
    } else {
      siteIconGenerated.value = null
      siteIconUploaded.value = false
      siteIconFileList.value = []
    }
  } catch {}
}
const initFaviconFromMeta = async () => {
  try {
    const meta = await request({ url: '/public/site/meta', method: 'get' })
    const favicon = meta?.favicon || null
    if (favicon && (favicon.png16 || favicon.png32 || favicon.png64)) {
      faviconGenerated.value = favicon
    } else {
      faviconGenerated.value = null
    }
  } catch {}
}
const save = async () => {
  saving.value = true
  try {
    await updateConfig(CODE, { name: '无操作自动下线', data: { inactive_ms: form.value.inactive_ms } })
    await updateConfig('max_login_devices', { name: '同时登录设备数量', data: { count: form.value.max_devices } })
    await updateConfig('site_name', { name: '网站名称', data: { name: form.value.site_name } })
    await updateConfig('site_subtitle', { name: '网站副标题', data: { subtitle: form.value.site_subtitle } })
    await updateConfig('site_slogan', { name: '网站广告语', data: { slogan: form.value.site_slogan } })
    await updateConfig('site_copyright', { name: '网站版权', data: { copyright: form.value.site_copyright } })
    await updateConfig('audio_message_system', { name: '系统通知音效', data: { url: form.value.audio_system } })
    await updateConfig('audio_message_business', { name: '业务提醒音效', data: { url: form.value.audio_business } })
    await updateConfig('audio_message_alert', { name: '告警信息音效', data: { url: form.value.audio_alert } })
    await updateConfig('audio_message_user', { name: '用户消息音效', data: { url: form.value.audio_user } })
    try { document.title = form.value.site_name || 'JiyuCloud' } catch {}
    await applyFavicon()
    try { window.dispatchEvent(new CustomEvent('site-meta-updated')) } catch {}
    message.success('保存成功')
  } catch (e) {
    const msg = e?.response?.data?.error || '保存失败'
    message.error(msg)
  } finally {
    saving.value = false
  }
}

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '')
const uploadActionSiteIcon = `${import.meta.env.VITE_API_BASE_URL}/uploads/site/icon`
const uploadActionSiteFavicon = `${import.meta.env.VITE_API_BASE_URL}/uploads/site/favicon`
const uploadActionAudio = `${import.meta.env.VITE_API_BASE_URL}/uploads/audio`
const uploadActionAudioDefaults = `${import.meta.env.VITE_API_BASE_URL}/uploads/audio/defaults`
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
const siteIconUploaded = ref(false)
const siteIconGenerated = ref(null)
const faviconGenerated = ref(null)
const siteIconFileList = ref([])
const beforeSiteIconUpload = (file, fileList) => {
  try {
    if (Array.isArray(fileList) && fileList.length > 1) {
      message.error('仅允许上传一张图标')
      return Upload.LIST_IGNORE
    }
    return true
  } catch { return true }
}
const resolveFileUrl = (u) => {
  if (!u) return ''
  const s = u.toString()
  if (s.startsWith('http')) return s
  if (s.startsWith('/uploads')) return apiOrigin + s
  return s
}
const applyFavicon = async () => {
  try {
    const meta = await request({ url: '/public/site/meta', method: 'get' })
    const v = meta?.favicon?.version || meta?.icon?.version || Date.now()
    const href = `${import.meta.env.VITE_API_BASE_URL}/public/favicon.ico?v=${v}`
    let link = document.querySelector('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = href
  } catch {}
}
const audioPlayers = {}
const resolveAudioUrl = (u) => resolveFileUrl(u)
const playAudio = (type) => {
  try {
    const url = resolveAudioUrl(type === 'system' ? form.value.audio_system : type === 'business' ? form.value.audio_business : type === 'alert' ? form.value.audio_alert : form.value.audio_user)
    if (!url) return
    let player = audioPlayers[type]
    if (!player) {
      player = new Audio(url)
      audioPlayers[type] = player
    } else if (player.src !== url) {
      player.src = url
    }
    player.currentTime = 0
    player.play().catch(() => {})
  } catch {}
}
const handleSiteIconChange = async (info) => {
  try {
    if (info.file.status === 'done') {
      siteIconUploaded.value = true
      const data = info.file.response?.generated
      if (data) siteIconGenerated.value = data
      siteIconFileList.value = []
      await applyFavicon()
      try { window.dispatchEvent(new CustomEvent('site-meta-updated')) } catch {}
      message.success('网站图标已上传并生成')
      try { setTimeout(() => { try { window.location.reload() } catch {} }, 300) } catch {}
    } else if (info.file.status === 'error') {
      const errMsg = info.file?.error?.response?.data?.error || info.file?.error?.response?.data?.message || info.file?.error?.message || info.file?.response?.error || '上传失败'
      message.error(errMsg)
      siteIconUploaded.value = false
      siteIconGenerated.value = null
      siteIconFileList.value = []
    }
  } catch {}
}
const handleFaviconChange = async (info) => {
  try {
    if (info.file.status === 'done') {
      const data = info.file.response?.generated
      if (data) faviconGenerated.value = data
      await applyFavicon()
      try { window.dispatchEvent(new CustomEvent('site-meta-updated')) } catch {}
      message.success('标签页小图标已上传并生成')
    } else if (info.file.status === 'error') {
      const errMsg = info.file?.error?.response?.data?.error || info.file?.error?.response?.data?.message || info.file?.error?.message || info.file?.response?.error || '上传失败'
      message.error(errMsg)
    }
  } catch {}
}

const useSiteIconAsFavicon = async () => {
  try {
    if (!siteIconGenerated.value) return
    await updateConfig('site_favicon', { name: '标签页小图标', data: siteIconGenerated.value })
    faviconGenerated.value = siteIconGenerated.value
    await applyFavicon()
    try { window.dispatchEvent(new CustomEvent('site-meta-updated')) } catch {}
    message.success('已使用网站图标作为标签页小图标')
  } catch (e) {
    const msg = e?.response?.data?.error || '设置失败'
    message.error(msg)
  }
}
const handleAudioUpload = (type) => (info) => {
  try {
    if (info.file.status === 'done') {
      const url = info.file.response?.url || ''
      if (type === 'system') form.value.audio_system = url
      else if (type === 'business') form.value.audio_business = url
      else if (type === 'alert') form.value.audio_alert = url
      else form.value.audio_user = url
      message.success('上传成功')
    } else if (info.file.status === 'error') {
      message.error('上传失败')
    }
  } catch {}
}

const generateDefaults = async () => {
  generating.value = true
  try {
    const r = await request({ url: '/uploads/audio/defaults', method: 'post' })
    const m = r || {}
    if (m.system) form.value.audio_system = m.system
    if (m.business) form.value.audio_business = m.business
    if (m.alert) form.value.audio_alert = m.alert
    if (m.user) form.value.audio_user = m.user
    message.success('默认音效已生成')
  } catch (e) {
    const msg = e?.response?.data?.error || '生成失败'
    message.error(msg)
  } finally {
    generating.value = false
  }
}

load()
initFaviconFromMeta()
</script>

<style scoped>
.icon-row { display: flex; align-items: flex-end; gap: 16px }
.icon-box { position: relative; width: 120px; height: 120px; border: 1px dashed #d9d9d9; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fafafa }
.icon-box.small { width: 64px; height: 64px }
.icon-img { width: 100%; height: 100%; object-fit: contain }
.icon-img.small { width: 100%; height: 100% }
.icon-overlay { position: absolute; left: 0; right: 0; bottom: 0; height: 32px; background: rgba(0,0,0,0.45); color: #fff; display: none; align-items: center; justify-content: center; font-size: 12px }
.icon-box:hover .icon-overlay { display: flex }
.icon-placeholder { color: #8B9CAD; font-size: 12px }
.icon-previews { display: flex; align-items: flex-end; gap: 12px }
.preview-item { display: flex; align-items: center; justify-content: flex-end; gap: 6px; flex-direction: column; height: 120px }
.preview-label { color: #8B9CAD; font-size: 12px }
.preview { border: 1px solid #eee; background: #fff }
.preview.s16 { width: 16px; height: 16px }
.preview.s32 { width: 32px; height: 32px }
.preview.s64 { width: 64px; height: 64px }
</style>
