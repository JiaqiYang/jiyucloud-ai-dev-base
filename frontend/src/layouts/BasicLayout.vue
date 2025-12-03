<!--
  文件: frontend/src/layouts/BasicLayout.vue
  描述: 主布局组件，负责顶部菜单、侧边菜单、内容区域与用户交互。
  作者: 项目组
  创建日期: 2025-11-25
  修改日期: 2025-11-25
  版本: v1.0.0
  版权: Copyright (c) 2025 JiyuCloud
-->
<template>
  <a-layout style="min-height: 100vh">
    <a-layout-header class="top-header">
      <div class="top-left">
        <div class="logo-container">
          <img :src="headerLogoSrc" alt="Logo" class="logo-img" />
          <span class="logo-text">{{ siteName }}</span>
        </div>
          <!-- 顶部一级菜单：完全依据后端返回（menu/dir），不写死仪表盘 -->
          <a-menu v-model:selectedKeys="topSelectedKeys" mode="horizontal">
            <a-menu-item v-for="t in topMenus" :key="t.key" @click="onTopTopClick(t)">
              <component :is="resolveIcon(t.icon)" />
              <span>{{ t.title }}</span>
            </a-menu-item>
          </a-menu>
      </div>
      <div class="header-right">
          <!-- Notifications -->
          <a-dropdown v-model:open="notifDropdownOpen" :trigger="['hover']" placement="bottomRight">
            <a-badge :count="unreadCount" :offset="[-3, 3]">
              <a-button type="text" :class="['header-icon-btn', bellFlash ? 'flashing' : '']">
                <BellOutlined :style="{ fontSize: '20px' }" />
              </a-button>
            </a-badge>
            <template #overlay>
              <div class="notification-dropdown">
                <div class="notification-header">
                  <span>通知</span>
                  <a-space style="margin-left:auto">
                    <a-button size="small" type="text" @click.stop="markAllNotificationsRead">全部已读</a-button>
                  </a-space>
                </div>
                <div class="notification-list">
                  <div v-if="!notifications.length" class="empty-tip">暂无通知</div>
                  <div v-for="n in topNotifications" :key="n.id" class="notification-item" :class="{ unread: !n.read }" @click="openNotification(n)">
                    <span class="dot" />
                    <div class="item-content">
                      <div class="title">{{ n.title }}</div>
                      <div class="desc">{{ n.description }}</div>
                      <div class="time">{{ formatRelative(n.created_at) }}</div>
                    </div>
                    <a-tag :color="messageTypeColor(n.type)" style="margin-left:8px">{{ messageTypeLabel(n.type) }}</a-tag>
                    <a-button size="small" type="link" @click.stop="markNotificationRead(n.id)" v-if="!n.read">标为已读</a-button>
                  </div>
                </div>
                <div class="notification-footer">
                  <a-button type="link" size="small" @click.stop="openNotificationCenter">查看全部</a-button>
                </div>
              </div>
            </template>
          </a-dropdown>

          <a-divider type="vertical" style="height: 24px; margin: 0 8px" />

          <!-- Sound Toggle -->
          <a-tooltip :title="audioEnabled ? '声音已开启' : '声音未开启'" placement="bottom">
            <a-button type="text" :class="['header-icon-btn', (audioEnabled && speakerFlash) ? 'flashing' : '']" @click="toggleSound">
              <component :is="SoundOutlined" :style="{ fontSize: '18px', color: audioEnabled ? '#52c41a' : '#999' }" />
            </a-button>
          </a-tooltip>

          <!-- User Dropdown -->
          <a-dropdown :trigger="['hover']" placement="bottomRight">
            <div class="user-info-wrapper">
              <a-avatar :size="32" :src="avatarSrc" class="user-avatar">
                <template #icon><UserOutlined /></template>
              </a-avatar>
              <div class="user-details">
                <div class="user-line">
                  <span class="welcome">欢迎，</span>
                  <span class="user-name">{{ displayName }}</span>
                </div>
              </div>
              <DownOutlined :style="{ fontSize: '12px', color: '#999' }" />
            </div>
            <template #overlay>
              <div class="user-dropdown">
                <div class="dropdown-header">
                  <a-avatar :size="46" :src="avatarSrc" class="dropdown-avatar">
                    <template #icon><UserOutlined /></template>
                  </a-avatar>
                  <div class="dropdown-user">
                    <div class="dropdown-name">{{ userInfo.real_name || userInfo.username }}</div>
                    <a-tag color="blue">{{ userInfo.role || '管理员' }}</a-tag>
                  </div>
                </div>
                <div class="dropdown-content">
                  <a-menu class="user-dropdown-menu">
                    <a-menu-item key="sessions" @click="openUserSessions">
                      <DesktopOutlined style="margin-right: 12px" />
                      <span>登录过的设备</span>
                    </a-menu-item>
                    <a-menu-item key="profile" @click="showUserProfile">
                      <UserOutlined style="margin-right: 12px" />
                      <span>修改个人信息</span>
                    </a-menu-item>
                    <a-menu-item key="changePassword" @click="showChangePassword">
                      <KeyOutlined style="margin-right: 12px" />
                      <span>修改密码</span>
                    </a-menu-item>
                    <a-menu-item key="preferences" @click="showPreferences">
                      <SettingOutlined style="margin-right: 12px" />
                      <span>个性化设置</span>
                    </a-menu-item>
                    <a-menu-divider style="margin: 6px 0" />
                    <a-menu-item key="clearCache" @click="handleClearCache">
                      <DeleteOutlined style="margin-right: 16px; color: #ff4d4f" />
                      <span style="color:#ff4d4f">清理缓存</span>
                    </a-menu-item>
                  </a-menu>
                </div>
              </div>
            </template>
          </a-dropdown>

          <!-- Logout Button -->
          <a-tooltip title="退出登录" placement="bottom">
            <a-button type="text" danger class="logout-btn" @click="handleLogout">
              <LogoutOutlined :style="{ fontSize: '18px' }" />
            </a-button>
          </a-tooltip>
      </div>
    </a-layout-header>

    <a-layout>
      <!-- 侧边栏：显示当前目录的二级菜单（基于懒加载缓存） -->
      <a-layout-sider v-if="showSider" v-model:collapsed="collapsed" collapsible theme="light">
          <a-menu v-model:selectedKeys="selectedKeys" theme="light" mode="inline">
            <a-menu-item v-for="m in activeChildren" :key="m.key" @click="onSideMenuClick(m)">
              <template #icon>
                <component :is="resolveIcon(m.icon)" />
              </template>
              <span v-if="!collapsed">{{ m.title }}</span>
            </a-menu-item>
          </a-menu>
      </a-layout-sider>

      <a-layout-content style="margin: 0 16px; display: flex; flex-direction: column">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>{{ breadcrumbFirst }}</a-breadcrumb-item>
          <a-breadcrumb-item v-if="breadcrumbSecond">{{ breadcrumbSecond }}</a-breadcrumb-item>
        </a-breadcrumb>
        <div :style="{ padding: '24px', background: '#fff', minHeight: '360px', flex: 1 }">
          <router-view />
        </div>
        <div class="content-footer">{{ siteCopyright }}</div>
      </a-layout-content>
    </a-layout>

    <!-- User Profile Modal -->
    <a-modal 
      v-model:open="profileVisible" 
      title="修改个人信息" 
      @ok="handleSaveProfile" 
      :confirmLoading="profileSaving" okText="确定" cancelText="取消"
      width="600px" 
      class="profile-modal"
    >
      <div class="profile-content">
        <div class="profile-header">
          <a-avatar :size="80" :src="profileAvatarSrc">
            <template #icon><UserOutlined /></template>
          </a-avatar>
          <div class="profile-header-info">
            <h2>{{ displayName }}</h2>
            <a-tag color="blue">{{ displayRole }}</a-tag>
          </div>
        </div>
        <a-divider />
        <a-form :model="profileForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
          <a-form-item label="真实姓名">
            <a-input v-model:value="profileForm.real_name" placeholder="请输入真实姓名" allowClear />
          </a-form-item>
          <a-form-item label="电话">
            <a-input v-model:value="profileForm.phone" placeholder="请输入联系电话" allowClear />
          </a-form-item>
          <a-form-item label="邮箱">
            <a-input v-model:value="profileForm.email" placeholder="请输入邮箱" allowClear />
          </a-form-item>
          <a-form-item label="部门">
            <a-input v-model:value="profileForm.department" placeholder="请输入部门" allowClear />
          </a-form-item>
          <a-form-item label="头像">
            <a-upload
              name="file"
              :action="uploadAction"
              :headers="uploadHeaders"
              :file-list="avatarFileList"
              list-type="picture-card"
              :max-count="1"
              accept="image/*"
              @change="handleProfileAvatarChange"
              @remove="handleProfileAvatarRemove"
            >
              <template v-if="avatarFileList.length < 1">
                <div style="color:#1677ff">上传头像</div>
              </template>
            </a-upload>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- Change Password Modal -->
    <a-modal 
      v-model:open="passwordVisible" 
      title="修改密码" 
      @ok="handleChangePassword" 
      :confirmLoading="passwordLoading" okText="确定" cancelText="取消"
      width="500px"
    >
      <a-form :model="passwordForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="当前密码" required>
          <a-input-password v-model:value="passwordForm.oldPassword" placeholder="请输入当前密码" />
        </a-form-item>
        <a-form-item label="新密码" required>
          <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认密码" required>
          <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal 
      v-model:open="preferencesVisible" 
      title="个性化设置" 
      @ok="handleSavePreferences" 
      :confirmLoading="preferencesSaving" okText="确定" cancelText="取消"
      width="700px"
    >
      <a-form :model="preferencesForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="系统通知音">
          <a-space>
            <a-upload
              name="file"
              :action="uploadActionAudio"
              :headers="uploadHeaders"
              :file-list="audioSystemFileList"
              :max-count="1"
              accept=".mp3,.wav,.ogg"
              @change="info => handleAudioChange('system', info)"
              @remove="() => handleAudioRemove('system')"
            >
              <a-button>上传</a-button>
            </a-upload>
            <a-button @click="() => previewEffectiveAudio('system')" :disabled="!effectiveAudioUrlForForm('system')">试听</a-button>
          </a-space>
        </a-form-item>
        <a-form-item label="业务提醒音">
          <a-space>
            <a-upload
              name="file"
              :action="uploadActionAudio"
              :headers="uploadHeaders"
              :file-list="audioBusinessFileList"
              :max-count="1"
              accept=".mp3,.wav,.ogg"
              @change="info => handleAudioChange('business', info)"
              @remove="() => handleAudioRemove('business')"
            >
              <a-button>上传</a-button>
            </a-upload>
            <a-button @click="() => previewEffectiveAudio('business')" :disabled="!effectiveAudioUrlForForm('business')">试听</a-button>
          </a-space>
        </a-form-item>
        <a-form-item label="告警提示音">
          <a-space>
            <a-upload
              name="file"
              :action="uploadActionAudio"
              :headers="uploadHeaders"
              :file-list="audioAlertFileList"
              :max-count="1"
              accept=".mp3,.wav,.ogg"
              @change="info => handleAudioChange('alert', info)"
              @remove="() => handleAudioRemove('alert')"
            >
              <a-button>上传</a-button>
            </a-upload>
            <a-button @click="() => previewEffectiveAudio('alert')" :disabled="!effectiveAudioUrlForForm('alert')">试听</a-button>
          </a-space>
        </a-form-item>
        <a-form-item label="用户消息音">
          <a-space>
            <a-upload
              name="file"
              :action="uploadActionAudio"
              :headers="uploadHeaders"
              :file-list="audioUserFileList"
              :max-count="1"
              accept=".mp3,.wav,.ogg"
              @change="info => handleAudioChange('user', info)"
              @remove="() => handleAudioRemove('user')"
            >
              <a-button>上传</a-button>
            </a-upload>
            <a-button @click="() => previewEffectiveAudio('user')" :disabled="!effectiveAudioUrlForForm('user')">试听</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Notification Center -->
    <a-modal v-model:open="notificationsVisible" title="通知中心" :footer="null" width="720px">
      <div class="notification-center">
        <a-radio-group v-model:value="notificationFilter" style="margin-bottom: 8px">
          <a-radio-button value="all">全部</a-radio-button>
          <a-radio-button value="unread">未读</a-radio-button>
        </a-radio-group>
        <a-tabs v-model:activeKey="notificationActiveType">
          <a-tab-pane v-for="group in notificationGroups" :key="group.key" :tab="messageTypeLabel(group.key)">
            <div class="center-list">
              <div v-if="!group.items.length" class="empty-tip">暂无该类型消息</div>
              <div v-for="n in group.items" :key="n.id" class="notification-item" :class="{ unread: !n.read }">
                <span class="dot" />
                <div class="item-content">
                  <div class="title">{{ n.title }}</div>
                  <div class="desc">{{ n.description }}</div>
                  <div class="time">{{ formatRelative(n.created_at) }}</div>
                </div>
                <a-space>
                  <a-button size="small" @click="markNotificationRead(n.id)" v-if="!n.read">已读</a-button>
                </a-space>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-modal>

    <a-modal v-model:open="mySessionsVisible" title="登录过的设备" :footer="null" width="960px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
        <a-space>
          <a-input-search v-model:value="mySessionsKeyword" placeholder="搜索设备/IP/会话ID" style="width:280px" allowClear @search="loadMySessions" />
          <a-select v-model:value="mySessionsOnlineFilter" style="width:160px">
            <a-select-option value="all">全部</a-select-option>
            <a-select-option value="online">在线</a-select-option>
            <a-select-option value="offline">离线</a-select-option>
          </a-select>
        </a-space>
        <a-space v-if="otherOnlineSessionsCount > 0">
          <a-popconfirm title="确定退出其它在线设备？" @confirm="kickAllOtherSessions">
            <a-button type="primary" danger>退出其它设备</a-button>
          </a-popconfirm>
        </a-space>
      </div>
      <div class="sessions-grid">
        <div v-for="record in mySessionsView" :key="record.device + '|' + (record.ip || '')" class="session-card">
          <div class="session-card-header" :class="record.is_online ? 'online' : 'offline'">
            <div class="device-icon">
              <DesktopOutlined v-if="!isMobileUa(record.device)" />
              <MobileOutlined v-else />
            </div>
            <div class="device-title" :title="record.device">{{ record.device || '未知设备' }}</div>
            <a-tag :color="record.is_online ? 'green' : 'red'" class="status-tag">{{ record.is_online ? '在线' : '离线' }}</a-tag>
          </div>
          <div class="session-card-body">
            <div class="row"><span class="label">IP</span><span class="value">{{ record.ip || '-' }}<a-tag v-if="isPrivateIp(record.ip)" color="blue" style="margin-left:6px">内网</a-tag></span></div>
            <div class="row"><span class="label">IP所在地</span><span class="value" :title="record.location">{{ record.location || '-' }}</span></div>
            <div class="row"><span class="label">最近活跃</span><span class="value">{{ formatRelative(record.last_active || record.last_active_at || record.updated_at) }}</span></div>
            <div class="row"><span class="label">登录时间</span><span class="value">{{ formatDate(record.login_time || record.created_at) }}</span></div>
          </div>
          <div class="session-card-footer">
            <a-popconfirm v-if="record.is_online && record.session_id && record.session_id !== currentSessionId" title="确定退出该设备？" @confirm="() => kickSession(record)">
              <a-button size="small" danger>退出设备</a-button>
            </a-popconfirm>
          </div>
        </div>
      </div>
    </a-modal>
  </a-layout>
</template>

<script setup>
import { ref, computed, watch, reactive, onMounted, onUnmounted, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { Modal, message } from 'ant-design-vue';
import { updateUser, getUserSessions, forceLogoutSession } from '@/api/system/user';
import { listMessageRecords, markMessageRead as apiMarkRead, markAllMessagesRead as apiMarkAllRead } from '@/api/system/message'
import { getEnabledTopMenus, getEnabledChildren, getMenuDefinitions } from '@/api/system/menu'
import { heartbeat, logoutServer } from '@/api/auth'
import { getConfig } from '@/api/system/config'
import request from '@/utils/request'
import * as AntIcons from '@ant-design/icons-vue'

const resolveIcon = (name) => {
  const key = (name || '').toString().trim()
  const Comp = AntIcons[key]
  return Comp || AntIcons['SettingOutlined']
}
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const topMenus = ref([])
const childrenMap = ref({})
const collapsed = ref(true);
const topSelectedKeys = ref(['dashboard']);
const selectedKeys = ref([]);
const profileVisible = ref(false);
const profileSaving = ref(false);
const preferencesVisible = ref(false);
const preferencesSaving = ref(false);
const preferencesForm = reactive({ audio_message_system: '', audio_message_business: '', audio_message_alert: '', audio_message_user: '' });
const audioSystemFileList = ref([]);
const audioBusinessFileList = ref([]);
const audioAlertFileList = ref([]);
const audioUserFileList = ref([]);
const passwordVisible = ref(false);
const passwordLoading = ref(false);
// Notifications state
const notifications = ref([])
const notificationsVisible = ref(false)
const notificationFilter = ref('all')
const unreadCount = ref(0)
const notifDropdownOpen = ref(false)
const notificationsLoading = ref(false)
const notificationsLastLoadedAt = ref(0)
const notificationsMinIntervalMs = 10000
const bellFlash = ref(false)
let bellFlashTimer = null
const triggerBellFlash = () => {
  try {
    bellFlash.value = true
    if (bellFlashTimer) { try { clearTimeout(bellFlashTimer) } catch {} }
    bellFlashTimer = setTimeout(() => { bellFlash.value = false }, 1000)
  } catch {}
}
const audioMap = ref({ system: '', business: '', alert: '', user: '' })
const audioPlayers = {}
const AUDIO_PREF_KEY = 'sound_enabled'
const audioEnabled = ref(false)
const audioUnlocked = ref(false)
const pendingAudioTypes = []
let audioUnlockPromptShown = false
const SoundOutlined = AntIcons.SoundOutlined
const speakerFlash = ref(false)
let speakerFlashTimer = null
const triggerSpeakerFlash = () => {
  try {
    if (!audioEnabled.value) return
    speakerFlash.value = true
    if (speakerFlashTimer) { try { clearTimeout(speakerFlashTimer) } catch {} }
    speakerFlashTimer = setTimeout(() => { speakerFlash.value = false }, 1000)
  } catch {}
}
const createSilentAudio = (ms = 200) => {
  try {
    const sampleRate = 44100
    const samples = Math.max(1, Math.floor((ms / 1000) * sampleRate))
    const headerSize = 44
    const dataSize = samples * 2
    const buf = new ArrayBuffer(headerSize + dataSize)
    const dv = new DataView(buf)
    const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)) }
    writeStr(0, 'RIFF'); dv.setUint32(4, 36 + dataSize, true); writeStr(8, 'WAVE'); writeStr(12, 'fmt ')
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true)
    dv.setUint32(24, sampleRate, true); dv.setUint32(28, sampleRate * 2, true)
    dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); writeStr(36, 'data'); dv.setUint32(40, dataSize, true)
    for (let i = 0; i < samples; i++) { dv.setInt16(headerSize + i * 2, 0, true) }
    const blob = new Blob([new Uint8Array(buf)], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    const a = new Audio(url)
    a.preload = 'auto'
    a.volume = 1
    return a
  } catch { return null }
}
const unlockAudio = async () => {
  try {
    const types = ['system', 'business', 'alert', 'user']
    for (const k of types) {
      const url = getEffectiveAudioUrl(k)
      if (!url) continue
      let player = audioPlayers[k]
      if (!player) { player = new Audio(url); player.preload = 'auto'; player.volume = 1; audioPlayers[k] = player } else if (player.src !== url) { player.src = url }
      player.muted = true
      player.currentTime = 0
      try {
        await player.play()
        try { player.pause() } catch {}
        player.currentTime = 0
        player.muted = false
        audioUnlocked.value = true
      } catch {}
    }
    if (!audioUnlocked.value) {
      const a = createSilentAudio(300)
      if (a) {
        a.muted = true
        a.currentTime = 0
        try { await a.play(); try { a.pause() } catch {}; a.currentTime = 0; a.muted = false; audioUnlocked.value = true } catch {}
      }
    }
    if (audioUnlocked.value && pendingAudioTypes.length) {
      const list = pendingAudioTypes.splice(0, pendingAudioTypes.length)
      for (const t of list) { try { playAudioByType(t) } catch {} }
    }
  } catch {}
}
const disableAudio = () => { try { audioEnabled.value = false; audioUnlocked.value = false; localStorage.setItem(AUDIO_PREF_KEY, '0'); message.info('已关闭通知声音提醒') } catch {} }
const toggleSound = async () => {
  if (audioEnabled.value) {
    if (!audioUnlocked.value) {
      try {
        await unlockAudio()
        if (audioUnlocked.value) { try { message.success('通知声音已开启') } catch {} }
      } catch {}
      return
    }
    return disableAudio()
  }
  try {
    audioEnabled.value = true
    localStorage.setItem(AUDIO_PREF_KEY, '1')
    await unlockAudio()
  } catch {}
  if (audioUnlocked.value) { try { message.success('通知声音已开启') } catch {} }
}
const playAudioByType = (type) => {
  try {
    if (!audioEnabled.value) return
    const k = ['system', 'business', 'alert', 'user'].includes(type) ? type : 'user'
    const url = getEffectiveAudioUrl(k)
    if (!audioUnlocked.value) {
      pendingAudioTypes.push(k)
      if (!audioEnabled.value && !audioUnlockPromptShown) { audioUnlockPromptShown = true; try { message.info('请点击右上角小喇叭开启声音') } catch {} }
      return
    }
    if (!url) return
    let player = audioPlayers[k]
    if (!player) {
      player = new Audio(url)
      player.preload = 'auto'
      player.volume = 1
      audioPlayers[k] = player
    } else if (player.src !== url) {
      player.src = url
    }
    player.currentTime = 0
    player.play().catch(() => {})
    try { if (audioEnabled.value) triggerSpeakerFlash() } catch {}
  } catch {}
}
const topNotifications = computed(() => (notifications.value || []).slice(0, 3))
const restoreNotifications = () => {}
const saveNotifications = () => {}
const syncUnreadFromLocal = () => {
  try { unreadCount.value = (Array.isArray(notifications.value) ? notifications.value : []).filter(n => !n.read).length } catch { unreadCount.value = 0 }
}
const loadNotifications = async (force = false) => {
  if (!force) {
    if (notificationsLoading.value) return
    const now = Date.now()
    if (notificationsLastLoadedAt.value && (now - notificationsLastLoadedAt.value) < notificationsMinIntervalMs) return
  }
  notificationsLoading.value = true
  try {
    const uid = userInfo.value?.id
    const res = await listMessageRecords({ page: 1, pageSize: 20, receiver_id: uid, status: 'sent' })
    const raw = Array.isArray(res?.list) ? res.list : []
    notifications.value = raw.map(it => ({
      id: it.id,
      title: it.title || '消息',
      description: it.content || '',
      created_at: it.sent_at || it.created_at,
      read: String(it.read_status) === 'read',
      type: it.message_type || 'user',
      priority: (it.priority || 'normal')
    }))
    saveNotifications()
  } catch {}
  finally { notificationsLoading.value = false; notificationsLastLoadedAt.value = Date.now() }
}
const notificationsView = computed(() => {
  const f = notificationFilter.value
  let arr = Array.isArray(notifications.value) ? notifications.value.slice() : []
  try { arr.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) } catch {}
  if (f === 'unread') arr = arr.filter(n => !n.read)
  return arr
})
const notificationActiveType = ref('system')
const notificationGroups = computed(() => {
  const types = ['system', 'business', 'alert']
  const groups = []
  const byType = {}
  for (const t of types) byType[t] = []
  for (const n of notificationsView.value) {
    const t = n.type || 'user'
    if (!byType[t]) byType[t] = []
    byType[t].push(n)
  }
  for (const t of types) {
    groups.push({ key: t, items: byType[t] || [] })
  }
  return groups
})
const messageTypeLabel = (t) => (t === 'system' ? '系统通知' : t === 'business' ? '业务提醒' : t === 'alert' ? '告警信息' : '用户消息')
const messageTypeColor = (t) => (t === 'system' ? 'blue' : t === 'business' ? 'orange' : t === 'alert' ? 'red' : 'green')
const markNotificationRead = async (id) => {
  try { await apiMarkRead(id) } catch {}
  const list = Array.isArray(notifications.value) ? notifications.value : []
  const idx = list.findIndex(n => n.id === id)
  if (idx >= 0) {
    notifications.value[idx] = { ...list[idx], read: true }
    saveNotifications()
  }
  try {
    const uid = userInfo.value?.id
    const r = await listMessageRecords({ page: 1, pageSize: 1, receiver_id: uid, read_status: 'unread', status: 'sent', exclude_message_type: 'user' })
    unreadCount.value = Number(r.total || 0)
  } catch {}
}
const markAllNotificationsRead = async () => {
  try { await apiMarkAllRead() } catch {}
  const list = Array.isArray(notifications.value) ? notifications.value : []
  notifications.value = list.map(n => ({ ...n, read: true }))
  saveNotifications()
  try {
    const uid = userInfo.value?.id
    const r = await listMessageRecords({ page: 1, pageSize: 1, receiver_id: uid, read_status: 'unread', status: 'sent', exclude_message_type: 'user' })
    unreadCount.value = Number(r.total || 0)
  } catch {}
}
const clearNotifications = async () => {
  notifications.value = []
  saveNotifications()
  try {
    const uid = userInfo.value?.id
    const r = await listMessageRecords({ page: 1, pageSize: 1, receiver_id: uid, read_status: 'unread', status: 'sent', exclude_message_type: 'user' })
    unreadCount.value = Number(r.total || 0)
  } catch {}
}
const openNotificationCenter = () => { notificationsVisible.value = true }
const openNotification = (n) => {
  const isHigh = String(n.priority || '').toLowerCase() === 'high'
  const opts = { title: isHigh ? `【高优先级】${n.title}` : n.title, content: n.description, okText: '知道了', maskClosable: false }
  try { if (isHigh) opts.icon = h(AntIcons.AlertOutlined, { style: 'color:#ff4d4f' }) } catch {}
  opts.onOk = async () => {
    try { await apiMarkRead(n.id) } catch {}
  }
  Modal.info(opts)
}


const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const userInfo = computed(() => userStore.userInfo);
const displayName = computed(() => {
  const u = userInfo.value || {};
  return u.real_name || u.username || '用户';
});
const displayRole = computed(() => {
  const u = userInfo.value || {};
  const r = u.role || (u.Role && (u.Role.role_name || u.Role.role_code));
  return r || '管理员';
});

import adminAvatar from '@/assets/logo.png';
const apiOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');
const resolveFileUrl = (u) => {
  if (!u) return '';
  const s = u.toString();
  if (s.startsWith('http')) return s;
  if (s.startsWith('/uploads')) return apiOrigin + s;
  return s;
};

const avatarSrc = computed(() => {
  const u = userInfo.value || {};
  if (u.avatar) return resolveFileUrl(u.avatar);
  const r = (u.role || (u.Role && (u.Role.role_name || u.Role.role_code)) || '').toString().toLowerCase();
  if (r.includes('admin') || r.includes('管理员')) return adminAvatar;
  return '';
});
const siteName = ref('JiyuCloud')
const siteIcon = ref(null)
const siteCopyright = ref('© 2025 JiyuCloud Cemetery Management System')
const apiBase = import.meta.env.VITE_API_BASE_URL
const apiOrigin2 = (apiBase || '').replace('/api', '')
const headerLogoSrc = computed(() => {
  const icon = siteIcon.value?.png32 || ''
  if (icon) {
    const s = icon.toString()
    if (s.startsWith('http')) return s
    if (s.startsWith('/uploads')) return apiOrigin2 + s
  }
  return adminAvatar
})
const applyFavicon = (v) => {
  try {
    const href = `${apiBase}/public/favicon.ico?v=${v || Date.now()}`
    let link = document.querySelector('link[rel="icon"]')
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
    link.href = href
  } catch {}
}
const loadSiteMeta = async () => {
  try {
    const meta = await request({ url: '/public/site/meta', method: 'get' })
    siteName.value = meta?.name || 'JiyuCloud'
    siteIcon.value = meta?.icon || null
    siteCopyright.value = meta?.copyright || '© 2025 JiyuCloud Cemetery Management System'
    if (siteIcon.value?.version) applyFavicon(siteIcon.value.version)
    try { document.title = siteName.value } catch {}
  } catch {}
}

const profileForm = reactive({
  real_name: '',
  phone: '',
  email: '',
  department: '',
  avatar: ''
});
const avatarFileList = ref([]);
const uploadAction = `${import.meta.env.VITE_API_BASE_URL}/uploads/avatar`;
const uploadActionAudio = `${import.meta.env.VITE_API_BASE_URL}/uploads/audio`;
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('token') || ''}` };
const profileAvatarSrc = computed(() => resolveFileUrl(profileForm.avatar) || avatarSrc.value);

const breadcrumbFirst = ref('首页')
const breadcrumbSecond = ref('')

const STATE_KEY = 'layoutState'
const restoreState = () => {
  try {
    const s = JSON.parse(sessionStorage.getItem(STATE_KEY) || '{}')
    if (Array.isArray(s.topSelectedKeys) && s.topSelectedKeys.length) topSelectedKeys.value = s.topSelectedKeys
    if (Array.isArray(s.selectedKeys)) selectedKeys.value = s.selectedKeys
    if (typeof s.breadcrumbFirst === 'string') breadcrumbFirst.value = s.breadcrumbFirst
    if (typeof s.breadcrumbSecond === 'string') breadcrumbSecond.value = s.breadcrumbSecond
    if (typeof s.collapsed === 'boolean') collapsed.value = s.collapsed
  } catch {}
}
const saveState = () => {
  const s = {
    topSelectedKeys: topSelectedKeys.value,
    selectedKeys: selectedKeys.value,
    breadcrumbFirst: breadcrumbFirst.value,
    breadcrumbSecond: breadcrumbSecond.value,
    collapsed: collapsed.value
  }
  sessionStorage.setItem(STATE_KEY, JSON.stringify(s))
}
restoreState()
document.title = breadcrumbSecond.value ? `${breadcrumbFirst.value} - ${breadcrumbSecond.value}` : breadcrumbFirst.value


const activeChildren = computed(() => {
  const top = topSelectedKeys.value[0]
  if (!top || top === 'dashboard') return []
  const map = childrenMap.value || {}
  const list = Array.isArray(map[top]) ? map[top] : []
  return list
})
const showSider = computed(() => topSelectedKeys.value[0] && topSelectedKeys.value[0] !== 'dashboard' && activeChildren.value.length > 0)

const defsList = ref([])
const defByKey = computed(() => {
  const m = {}
  for (const d of (Array.isArray(defsList.value) ? defsList.value : [])) {
    if (d && d.key) m[d.key] = d
  }
  return m
})
const menuPathForKey = (key) => {
  const d = defByKey.value[key]
  return d && d.path ? d.path : '/dashboard'
}

watch([
  () => route.path,
  () => defsList.value,
  () => topMenus.value
], ([newPath]) => {
  const defs = Array.isArray(defsList.value) ? defsList.value : []
  const tops = Array.isArray(topMenus.value) ? topMenus.value : []
  if (!defs.length) return
  if (newPath === '/dashboard') {
    topSelectedKeys.value = ['dashboard']
    selectedKeys.value = []
    breadcrumbFirst.value = '首页'
    breadcrumbSecond.value = '仪表盘'
    return
  }
  const d = defs.find(x => x && x.path === newPath)
  if (!d) return
  const top = d.parent_key || 'dashboard'
  topSelectedKeys.value = [top]
  selectedKeys.value = [d.key]
  const t = tops.find(x => x.key === top)
  breadcrumbFirst.value = (t && t.title) ? t.title : '首页'
  breadcrumbSecond.value = d.title || ''
  const map = childrenMap.value || {}
  if (!Array.isArray(map[top])) {
    getEnabledChildren(top).then(list => {
      const m = { ...(childrenMap.value || {}) }
      m[top] = Array.isArray(list) ? list : []
      childrenMap.value = m
    })
  }
}, { immediate: true })

// 点击顶部目录时：懒加载其二级菜单并跳转到首个子项
/**
 * 处理点击顶部目录
 * @param {{key:string,title:string}} d 顶部目录项
 */
const onTopDirClick = async (d) => {
  topSelectedKeys.value = [d.key]
  const list = await getEnabledChildren(d.key)
  const map = { ...(childrenMap.value || {}) }
  map[d.key] = Array.isArray(list) ? list : []
  childrenMap.value = map
  const target = (map[d.key] && map[d.key][0] && map[d.key][0].path) ? map[d.key][0].path : '/dashboard'
  breadcrumbFirst.value = d.title || '首页'
  breadcrumbSecond.value = (map[d.key] && map[d.key][0] && map[d.key][0].title) ? map[d.key][0].title : ''
  router.push(target)
}

/**
 * 处理点击顶部菜单（目录或菜单）
 * @param {{key:string,type:string}} t 顶部菜单项
 */
const onTopTopClick = (t) => {
  if (!t || !t.key) return
  if (t.type === 'dir') return onTopDirClick(t)
  const p = menuPathForKey(t.key)
  breadcrumbFirst.value = t.title || '首页'
  breadcrumbSecond.value = ''
  router.push(p)
}

const onSideMenuClick = (m) => {
  const top = topSelectedKeys.value[0]
  const t = (topMenus.value || []).find(x => x.key === top)
  breadcrumbFirst.value = (t && t.title) ? t.title : '首页'
  breadcrumbSecond.value = m.title || ''
  router.push(m.path)
}

watch([
  topSelectedKeys,
  selectedKeys,
  breadcrumbFirst,
  breadcrumbSecond,
  collapsed
], () => {
  saveState()
  const first = breadcrumbFirst.value || '首页'
  const second = breadcrumbSecond.value || ''
  document.title = second ? `${first} - ${second}` : first
})

;(async () => {
  defsList.value = await getMenuDefinitions().catch(() => [])
  const list = await getEnabledTopMenus()
  topMenus.value = Array.isArray(list) ? list : []
})()

const showUserProfile = () => {
  profileVisible.value = true;
  const u = userInfo.value || {};
  profileForm.real_name = u.real_name || '';
  profileForm.phone = u.phone || '';
  profileForm.email = u.email || '';
  profileForm.department = u.department || '';
  profileForm.avatar = u.avatar || '';
  avatarFileList.value = profileForm.avatar ? [{ uid: '1', name: 'avatar', status: 'done', url: resolveFileUrl(profileForm.avatar) }] : [];
};

const showChangePassword = () => {
  passwordVisible.value = true;
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
};

const handleChangePassword = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    Modal.warning({ title: '提示', content: '请填写完整信息' });
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    Modal.warning({ title: '提示', content: '两次密码输入不一致' });
    return;
  }
  if (passwordForm.newPassword.length < 6) {
    Modal.warning({ title: '提示', content: '密码长度不能少于6位' });
    return;
  }
  
  passwordLoading.value = true;
  try {
    // TODO: Call API to change password
    // await changePassword(passwordForm);
    Modal.success({ title: '成功', content: '密码修改成功，请重新登录' });
    passwordVisible.value = false;
    setTimeout(() => {
      userStore.logout();
      router.push('/login');
    }, 1500);
  } catch (error) {
    Modal.error({ title: '错误', content: '密码修改失败' });
  } finally {
    passwordLoading.value = false;
  }
};

const handleProfileAvatarChange = info => {
  avatarFileList.value = (info.fileList || []).map(f => {
    if (f.response?.url) {
      f.url = resolveFileUrl(f.response.url);
      profileForm.avatar = f.response.url;
    } else if (f.url) {
      f.url = resolveFileUrl(f.url);
    }
    return f;
  });
  const status = info.file?.status;
  if (status === 'removed' && avatarFileList.value.length === 0) {
    profileForm.avatar = '';
  }
};

const handleProfileAvatarRemove = () => {
  profileForm.avatar = '';
  avatarFileList.value = [];
};

const handleSaveProfile = async () => {
  const u = userInfo.value || {};
  if (!u.id) { Modal.error({ title: '错误', content: '用户信息缺失' }); return; }
  profileSaving.value = true;
  try {
    await updateUser(u.id, {
      real_name: profileForm.real_name,
      phone: profileForm.phone,
      email: profileForm.email,
      department: profileForm.department,
      avatar: profileForm.avatar
    });
    userStore.setUserInfo({
      ...u,
      real_name: profileForm.real_name,
      phone: profileForm.phone,
      email: profileForm.email,
      department: profileForm.department,
      avatar: profileForm.avatar
    });
    Modal.success({ title: '成功', content: '个人信息已更新' });
    profileVisible.value = false;
  } catch (error) {
    Modal.error({ title: '错误', content: '更新失败' });
  } finally {
    profileSaving.value = false;
  }
};

const handleLogout = () => {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      try {
        logoutServer().catch(() => {})
      } catch {}
      userStore.logout()
      router.push('/login')
    }
  });
};

const handleClearCache = () => {
  Modal.confirm({
    title: '确认清理缓存',
    content: '将清理缓存并退出登录，返回登录页。是否继续？',
    okText: '清理并退出',
    cancelText: '取消',
    onOk() {
      try {
        logoutServer().catch(() => {})
      } catch {}
      try {
        sessionStorage.clear()
        localStorage.clear()
      } catch {}
      userStore.logout()
      router.push('/login')
    }
  })
}
const showPreferences = () => {
  preferencesVisible.value = true
  const s = userSettings.value || {}
  preferencesForm.audio_message_system = s.audio_message_system || ''
  preferencesForm.audio_message_business = s.audio_message_business || ''
  preferencesForm.audio_message_alert = s.audio_message_alert || ''
  preferencesForm.audio_message_user = s.audio_message_user || ''
  audioSystemFileList.value = preferencesForm.audio_message_system ? [{ uid: 'sys', name: 'system', status: 'done', url: resolveFileUrl(preferencesForm.audio_message_system) }] : []
  audioBusinessFileList.value = preferencesForm.audio_message_business ? [{ uid: 'biz', name: 'business', status: 'done', url: resolveFileUrl(preferencesForm.audio_message_business) }] : []
  audioAlertFileList.value = preferencesForm.audio_message_alert ? [{ uid: 'alt', name: 'alert', status: 'done', url: resolveFileUrl(preferencesForm.audio_message_alert) }] : []
  audioUserFileList.value = preferencesForm.audio_message_user ? [{ uid: 'usr', name: 'user', status: 'done', url: resolveFileUrl(preferencesForm.audio_message_user) }] : []
}
const handleAudioChange = (which, info) => {
  const list = (info.fileList || []).map(f => {
    if (f.response?.url) {
      f.url = resolveFileUrl(f.response.url)
    } else if (f.url) {
      f.url = resolveFileUrl(f.url)
    }
    return f
  })
  if (which === 'system') { audioSystemFileList.value = list; preferencesForm.audio_message_system = info.file?.response?.url || preferencesForm.audio_message_system }
  if (which === 'business') { audioBusinessFileList.value = list; preferencesForm.audio_message_business = info.file?.response?.url || preferencesForm.audio_message_business }
  if (which === 'alert') { audioAlertFileList.value = list; preferencesForm.audio_message_alert = info.file?.response?.url || preferencesForm.audio_message_alert }
  if (which === 'user') { audioUserFileList.value = list; preferencesForm.audio_message_user = info.file?.response?.url || preferencesForm.audio_message_user }
  const status = info.file?.status
  if (status === 'removed') {
    if (which === 'system' && audioSystemFileList.value.length === 0) preferencesForm.audio_message_system = ''
    if (which === 'business' && audioBusinessFileList.value.length === 0) preferencesForm.audio_message_business = ''
    if (which === 'alert' && audioAlertFileList.value.length === 0) preferencesForm.audio_message_alert = ''
    if (which === 'user' && audioUserFileList.value.length === 0) preferencesForm.audio_message_user = ''
  }
}
const handleAudioRemove = (which) => {
  if (which === 'system') { preferencesForm.audio_message_system = ''; audioSystemFileList.value = [] }
  if (which === 'business') { preferencesForm.audio_message_business = ''; audioBusinessFileList.value = [] }
  if (which === 'alert') { preferencesForm.audio_message_alert = ''; audioAlertFileList.value = [] }
  if (which === 'user') { preferencesForm.audio_message_user = ''; audioUserFileList.value = [] }
}
const previewAudio = (which) => {
  const map = {
    system: preferencesForm.audio_message_system,
    business: preferencesForm.audio_message_business,
    alert: preferencesForm.audio_message_alert,
    user: preferencesForm.audio_message_user
  }
  const u = resolveFileUrl(map[which])
  if (!u) return
  try {
    const a = new Audio(u)
    a.preload = 'auto'
    a.volume = 1
    a.currentTime = 0
    a.play().catch(() => {})
  } catch {}
}
const effectiveAudioUrlForForm = (which) => {
  const v = (
    which === 'system' ? preferencesForm.audio_message_system :
    which === 'business' ? preferencesForm.audio_message_business :
    which === 'alert' ? preferencesForm.audio_message_alert :
    preferencesForm.audio_message_user
  )
  const sys = audioMap.value[which]
  return resolveFileUrl(v || sys)
}
const previewEffectiveAudio = (which) => {
  const u = effectiveAudioUrlForForm(which)
  if (!u) return
  try {
    const a = new Audio(u)
    a.preload = 'auto'
    a.volume = 1
    a.currentTime = 0
    a.play().catch(() => {})
  } catch {}
}
const handleSavePreferences = async () => {
  const u = userInfo.value || {}
  if (!u.id) { Modal.error({ title: '错误', content: '用户信息缺失' }); return }
  preferencesSaving.value = true
  try {
    const current = userSettings.value || {}
    const next = {
      ...current,
      audio_message_system: preferencesForm.audio_message_system,
      audio_message_business: preferencesForm.audio_message_business,
      audio_message_alert: preferencesForm.audio_message_alert,
      audio_message_user: preferencesForm.audio_message_user
    }
    await updateUser(u.id, { settings: JSON.stringify(next) })
    userStore.setUserInfo({ ...u, settings: JSON.stringify(next) })
    message.success('个性化设置已保存')
    preferencesVisible.value = false
  } catch (e) {
    const err = e?.response?.data?.error || e?.response?.data?.message || '保存失败'
    message.error(err)
  } finally {
    preferencesSaving.value = false
  }
}

let INACTIVE_MS = 5 * 60 * 1000
const HEARTBEAT_INTERVAL_MS = 60 * 1000
let idleTimer = null
let lastHeartbeat = 0
const lastActive = ref(Date.now())
const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
const onActivity = () => {
  const now = Date.now()
  lastActive.value = now
  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = now
    heartbeat().catch((err) => {
      const status = err?.response?.status
      if (status === 401) {
        userStore.logout()
        Modal.info({ title: '提示', content: '已被强制下线，请重新登录' })
        router.push('/login')
      }
    })
  }
  resetIdleTimer()
  try { if (audioEnabled.value && !audioUnlocked.value) unlockAudio().catch(() => {}) } catch {}
}
const resetIdleTimer = () => {
  if (idleTimer) {
    try { clearTimeout(idleTimer) } catch {}
  }
  idleTimer = setTimeout(onIdle, INACTIVE_MS)
}
const onIdle = async () => {
  try {
    await logoutServer().catch(() => {})
  } finally {
    userStore.logout()
    Modal.info({ title: '提示', content: '长时间无操作，已自动退出登录' })
    router.push('/login')
  }
}

onMounted(async () => {
  activityEvents.forEach(ev => window.addEventListener(ev, onActivity, { passive: true }))
  try {
    const r = await getConfig('auto_logout')
    const d = r || {}
    const ms = Number(d.inactive_ms || 0)
    if (ms && ms > 0) {
      INACTIVE_MS = ms
    }
  } catch {}
  resetIdleTimer()
  restoreNotifications()
  try {
    const uid = userInfo.value?.id
    const r = await listMessageRecords({ page: 1, pageSize: 1, receiver_id: uid, read_status: 'unread', status: 'sent', exclude_message_type: 'user' })
    unreadCount.value = Number(r.total || 0)
  } catch { syncUnreadFromLocal() }
  try {
    const origin = (location.origin || '').replace(/^http/, 'ws')
    const token = localStorage.getItem('token') || ''
    const wsUrl = origin + '/ws/notifications' + (token ? ('?token=' + encodeURIComponent(token)) : '')
    const ws = new WebSocket(wsUrl)
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data && data.type === 'refresh') {
          if (notifDropdownOpen.value) {
            loadNotifications(true).catch(() => {})
          }
          const uid = userInfo.value?.id
          listMessageRecords({ page: 1, pageSize: 1, receiver_id: uid, read_status: 'unread', status: 'sent', exclude_message_type: 'user' }).then(r => { unreadCount.value = Number(r.total || 0) }).catch(() => {})
        } else if (data && data.type === 'message:new') {
          try {
            const p = String(data.priority || 'normal').toLowerCase()
            if (p === 'high') {
              const now = Date.now()
              const key = `${data.title || ''}|${data.content || ''}`
              if (!window.__lastDetailModalKey || !window.__lastDetailModalTs || window.__lastDetailModalKey !== key || (now - window.__lastDetailModalTs) > 3000) {
                window.__lastDetailModalKey = key
                window.__lastDetailModalTs = now
                const opts = { title: `【高优先级】${data.title || '消息'}`, content: data.content || '', okText: '知道了', maskClosable: false }
                try { opts.icon = h(AntIcons.AlertOutlined, { style: 'color:#ff4d4f' }) } catch {}
                opts.onOk = async () => {
                  try {
                    const mid = data.id || data.message_id
                    if (mid) {
                      try { await apiMarkRead(mid) } catch {}
                    } else {
                      const uid = userInfo.value?.id
                      const r = await listMessageRecords({ page: 1, pageSize: 20, receiver_id: uid, read_status: 'unread', status: 'sent', message_type: data.message_type || undefined })
                      const list = Array.isArray(r?.list) ? r.list : []
                      const found = list.find(it => (String(it.title || '') === String(data.title || '')) && (String(it.content || '') === String(data.content || '')))
                      if (found && found.id) {
                        try { await apiMarkRead(found.id) } catch {}
                      }
                    }
                    try {
                      const uid2 = userInfo.value?.id
                      const r2 = await listMessageRecords({ page: 1, pageSize: 1, receiver_id: uid2, read_status: 'unread', status: 'sent', exclude_message_type: 'user' })
                      unreadCount.value = Number(r2.total || 0)
                    } catch {}
                  } catch {}
                }
                Modal.info(opts)
              }
            }
          } catch {}
          try { triggerBellFlash() } catch {}
          try { playAudioByType(String(data.message_type || 'user')) } catch {}
          try {
            const uid = userInfo.value?.id
            listMessageRecords({ page: 1, pageSize: 1, receiver_id: uid, read_status: 'unread', status: 'sent', exclude_message_type: 'user' }).then(r => { unreadCount.value = Number(r.total || 0) }).catch(() => {})
          } catch {}
        }
      } catch {}
    }
  } catch {}
  try { window.addEventListener('site-meta-updated', loadSiteMeta) } catch {}
  try { await loadSiteMeta() } catch {}
  try {
    const r1 = await getConfig('audio_message_system'); audioMap.value.system = (r1?.url) || ''
    const r2 = await getConfig('audio_message_business'); audioMap.value.business = (r2?.url) || ''
    const r3 = await getConfig('audio_message_alert'); audioMap.value.alert = (r3?.url) || ''
    const r4 = await getConfig('audio_message_user'); audioMap.value.user = (r4?.url) || ''
  } catch {}
  try { audioEnabled.value = (localStorage.getItem(AUDIO_PREF_KEY) === '1') } catch {}
})
watch(() => notifDropdownOpen.value, (open) => { if (open) loadNotifications(true) })
onUnmounted(() => {
  activityEvents.forEach(ev => window.removeEventListener(ev, onActivity))
  if (idleTimer) try { clearTimeout(idleTimer) } catch {}
  try { window.removeEventListener('site-meta-updated', loadSiteMeta) } catch {}
})
// Sessions for current user
const mySessionsVisible = ref(false)
const mySessionsLoading = ref(false)
const mySessionsData = ref([])
const mySessionsKeyword = ref('')
const mySessionsOnlineFilter = ref('all')
const currentSessionId = computed(() => {
  try {
    const token = localStorage.getItem('token') || ''
    const payload = token.split('.')[1]
    if (!payload) return ''
    const json = JSON.parse(decodeURIComponent(escape(window.atob(payload))))
    return json?.jti || ''
  } catch { return '' }
})
const isMobileUa = (ua) => {
  const s = String(ua || '').toLowerCase();
  return s.includes('mobile') || s.includes('android') || s.includes('iphone');
};
const isPrivateIp = (ip) => {
  const s = String(ip || '');
  if (s === '::1') return true;
  return /^127\./.test(s) || /^10\./.test(s) || /^192\.168\./.test(s) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(s);
};
const formatDate = (d) => {
  if (!d) return '-'
  try {
    return new Date(d).toLocaleString()
  } catch (e) {
    return String(d)
  }
}
const formatRelative = (d) => {
  if (!d) return '-'
  try {
    const t = new Date(d).getTime()
    const now = Date.now()
    const diff = Math.max(0, Math.floor((now - t) / 1000))
    if (diff < 10) return '刚刚'
    if (diff < 60) return `${diff}秒前`
    const m = Math.floor(diff / 60)
    if (m < 60) return `${m}分钟前`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}小时前`
    const day = Math.floor(h / 24)
    return `${day}天前`
  } catch { return String(d) }
}
const openUserSessions = async () => {
  await loadMySessions()
  mySessionsVisible.value = true
}
const loadMySessions = async () => {
  try {
    mySessionsLoading.value = true
    const u = userInfo.value || {}
    const res = await getUserSessions(u.id)
    mySessionsData.value = Array.isArray(res?.list) ? res.list : []
  } catch (e) {
    mySessionsData.value = []
  } finally {
    mySessionsLoading.value = false
  }
}
const mySessionsView = computed(() => {
  const kw = mySessionsKeyword.value.trim().toLowerCase()
  const f = mySessionsOnlineFilter.value
  const list = Array.isArray(mySessionsData.value) ? mySessionsData.value : []
  const latestByDevice = new Map()
  const tsOf = (it) => {
    const d = it.last_active || it.last_active_at || it.updated_at || it.login_time || it.created_at
    try { return d ? new Date(d).getTime() : 0 } catch { return 0 }
  }
  for (const it of list) {
    const key = (it.device || '').toString().toLowerCase()
    const prev = latestByDevice.get(key)
    if (!prev || tsOf(it) >= tsOf(prev)) latestByDevice.set(key, it)
  }
  let arr = Array.from(latestByDevice.values())
  arr = arr.filter(it => f === 'all' ? true : (f === 'online' ? it.is_online : !it.is_online))
  if (kw) {
    arr = arr.filter(it => {
      const s = `${it.device || ''} ${it.ip || ''} ${it.location || ''}`.toLowerCase()
      return s.includes(kw)
    })
  }
  return arr
})
const kickSession = async (record) => {
  try {
    const u = userInfo.value || {}
    await forceLogoutSession(u.id, record.session_id)
    message.success('已退出该设备')
    await loadMySessions()
  } catch (e) {
    const errMsg = e?.response?.data?.error || e?.response?.data?.message || '操作失败'
    message.error(errMsg)
  }
}
const otherOnlineSessionsCount = computed(() => {
  return (mySessionsView.value || []).filter(x => x.is_online && x.session_id && x.session_id !== currentSessionId.value).length
})
const kickAllOtherSessions = async () => {
  try {
    const u = userInfo.value || {}
    const list = (mySessionsView.value || []).filter(x => x.is_online && x.session_id && x.session_id !== currentSessionId.value)
    for (const s of list) {
      await forceLogoutSession(u.id, s.session_id)
    }
    await loadMySessions()
    message.success('已退出其它在线设备')
  } catch (e) {
    const errMsg = e?.response?.data?.error || e?.response?.data?.message || '操作失败'
    message.error(errMsg)
  }
}

</script>

<style scoped>
.sessions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; max-height: 520px; overflow: auto; padding: 4px; }
.session-card { border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; display: flex; flex-direction: column; transition: box-shadow .2s ease, transform .2s ease; }
.session-card:hover { box-shadow: 0 6px 16px rgba(26,35,50,.12); transform: translateY(-2px); }
.session-card-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
.session-card-header.online { background: linear-gradient(90deg, #f0fff4, #ffffff); }
.session-card-header.offline { background: linear-gradient(90deg, #fff5f5, #ffffff); }
.device-icon :deep(svg) { font-size: 18px; color: #1a2332; }
.device-title { flex: 1; font-weight: 600; color: #1a2332; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.status-tag { margin-left: auto; }
.session-card-body { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.row { display: flex; gap: 8px; }
.label { width: 84px; color: #607080; }
.value { flex: 1; color: #1a2332; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.session-card-footer { padding: 10px 12px; border-top: 1px dashed #f0f0f0; display: flex; justify-content: flex-end; }
.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.logo-img {
  height: 36px;
  width: 36px;
  flex-shrink: 0;
}

.logo-text {
  margin-left: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 0.5px;
  white-space: nowrap;
  transition: all 0.3s;
}

.layout-header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 10;
}

.top-header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 10;
}

.top-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1 1 auto;
  min-width: 0;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 0 0 auto;
}

.header-icon-btn {
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.25s ease;
  color: #1a2332;
  background: #f9fafb;
  border: 1px solid #eaecef;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.header-icon-btn:hover {
  background: #ffffff;
  border-color: #d0d7de;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  color: #111827;
}

.header-icon-btn.flashing {
  animation: pulseFlash .9s ease-in-out;
}

@keyframes pulseFlash {
  0% { transform: scale(1); box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
  45% { transform: scale(1.08); box-shadow: 0 0 0 2px #ffe58f inset, 0 0 12px #ffd666; }
  100% { transform: scale(1); box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
}

.user-info-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 10px 0 6px;
  cursor: pointer;
  border-radius: 15px;
  transition: all 0.25s ease;
  border: 1px solid #eaecef;
  background: #f9fafb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  height: 45px;
  overflow: hidden;
}

.user-info-wrapper:hover {
  background: #ffffff;
  border-color: #d0d7de;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
}

.user-avatar {
  flex-shrink: 0;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  background: #fff;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.welcome {
  font-size: 12px;
  color: #8B9CAD;
}

.user-line {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  min-width: 0;
}

.user-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  color: #8B9CAD;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.top-left .ant-menu-horizontal) {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

.sep {
  color: #d0d7de;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  color: #8B9CAD;
  line-height: 1;
}

:deep(.ant-layout-sider) {
  background: #fff;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

:deep(.ant-menu) {
  background: #fff;
}

:deep(.ant-badge-count) {
  background: #ff4d4f;
  box-shadow: 0 0 0 1px #fff;
}

.logout-btn {
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.25s ease;
  color: #ff4d4f;
  margin-left: 4px;
  background: #fff;
  border: 1px solid #ffecec;
  box-shadow: 0 2px 6px rgba(255, 77, 79, 0.15);
}

.content-footer {
  background: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  text-align: center;
  padding: 10px 24px;
}

.logout-btn:hover {
  background: #fff1f0;
  color: #ff4d4f;
}

:deep(.ant-dropdown-menu) {
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  padding: 8px 0;
  min-width: 160px;
}

:deep(.ant-dropdown-menu-item) {
  padding: 10px 16px;
  font-size: 14px;
}

:deep(.ant-dropdown-menu-item:hover) {
  background: #f5f7fa;
}

/* Profile Modal Styles */
.profile-content {
  padding: 8px 0;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 8px;
}

.profile-header-info h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}
.user-dropdown {
    background: #fff;
    border: 1px solid #eaecef;
    border-radius: 14px;
    box-shadow: 0 10px 24px rgba(26, 35, 50, 0.16);
    padding: 0;
    min-width: 280px;
    overflow: hidden;
    backdrop-filter: saturate(180%) blur(4px);
  }

  .dropdown-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: linear-gradient(90deg, #f0f7ff, #ffffff);
    border-bottom: 1px solid #f0f0f0;
  }

  .dropdown-user {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .dropdown-name {
    font-size: 16px;
    font-weight: 700;
    color: #1a2332;
  }

  .dropdown-avatar { border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,.12); }
  .dropdown-content { padding: 8px; }

  :deep(.user-dropdown .ant-menu) {
    border: none;
    box-shadow: none;
    background: transparent;
    display: grid;
    gap: 6px;
  }

  :deep(.user-dropdown .ant-menu-item) {
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 12px;
  }

  :deep(.user-dropdown .ant-menu-item:hover) {
    background: #f5f7fa;
    box-shadow: inset 0 0 0 1px #eaecef;
  }
  :deep(.user-dropdown .ant-menu-item .anticon) {
    margin-right: 16px;
  }
  :deep(.user-dropdown .ant-menu-item.danger-item),
  :deep(.user-dropdown .ant-menu-item.danger-item .ant-menu-title-content),
  :deep(.user-dropdown .ant-menu-item.danger-item span) {
    color: #ff4d4f !important;
  }
  :deep(.user-dropdown .ant-menu-item.danger-item .anticon) {
    color: #ff4d4f !important;
  }
  :deep(.user-dropdown .ant-menu-item.danger-item:hover) {
    background: #fff1f0 !important;
    box-shadow: inset 0 0 0 1px #ffd1cf !important;
  }

  /* Notifications Dropdown */
  .notification-dropdown {
    background: #fff;
    border: 1px solid #eaecef;
    border-radius: 14px;
    box-shadow: 0 10px 24px rgba(26, 35, 50, 0.16);
    padding: 0;
    min-width: 320px;
    overflow: hidden;
  }
  .notification-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: linear-gradient(90deg, #f7faff, #ffffff);
    border-bottom: 1px solid #f0f0f0;
    font-weight: 600;
    color: #1a2332;
  }
  .notification-list { padding: 8px; display: flex; flex-direction: column; gap: 6px; }
  .notification-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; }
  .notification-item:hover { background: #f5f7fa; }
  .notification-item.unread .title { font-weight: 700; }
  .notification-item .dot { width: 8px; height: 8px; border-radius: 50%; background: #eaecef; flex-shrink: 0; }
  .notification-item.unread .dot { background: #ff4d4f; }
  .notification-item .item-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .notification-item .title { color: #1a2332; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .notification-item .desc { color: #607080; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .notification-item .time { color: #8B9CAD; font-size: 12px; }
  .notification-footer { padding: 8px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; }

  /* Notification Center */
  .notification-center { max-height: 520px; overflow: auto; }
  .center-list { display: flex; flex-direction: column; gap: 8px; }
  .empty-tip { color: #8B9CAD; text-align: center; padding: 16px; }
</style>
const userSettings = computed(() => {
  try { return JSON.parse((userInfo.value && userInfo.value.settings) || '{}') } catch { return {} }
})
const userAudioMap = computed(() => {
  const u = userInfo.value || {}
  const s = userSettings.value || {}
  return {
    system: s.audio_message_system || u.audio_message_system || '',
    business: s.audio_message_business || u.audio_message_business || '',
    alert: s.audio_message_alert || u.audio_message_alert || '',
    user: s.audio_message_user || u.audio_message_user || ''
  }
})
const getEffectiveAudioUrl = (k) => {
  const u = userAudioMap.value[k]
  const sys = audioMap.value[k]
  return resolveFileUrl(u || sys)
}
