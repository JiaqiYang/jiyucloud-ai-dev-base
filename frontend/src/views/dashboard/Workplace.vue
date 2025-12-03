<template>
  <div class="dashboard-container">
    <!-- Welcome Section -->
    <a-card class="welcome-card" :bordered="false">
      <div class="welcome-content">
        <div>
          <h2 class="welcome-title">欢迎回来，{{ userInfo.real_name || userInfo.username }}</h2>
          <p class="welcome-subtitle">{{ currentDate }} | {{ userInfo.role || '管理员' }}</p>
        </div>
      </div>
    </a-card>

    <!-- System Overview -->
    <a-row :gutter="[16, 16]" style="margin-top: 24px">
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card :bordered="false" class="stat-card">
          <a-statistic
            title="模块数量"
            :value="overview.modules"
            :value-style="{ color: '#1a2332', fontSize: '28px', fontWeight: '600' }"
          >
            <template #suffix>
              <span style="font-size: 14px; color: #8B9CAD">个</span>
            </template>
          </a-statistic>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :lg="6">
        <a-card :bordered="false" class="stat-card">
          <a-statistic
            title="在线用户"
            :value="overview.onlineUsers"
            :value-style="{ color: '#52c41a', fontSize: '28px', fontWeight: '600' }"
          >
            <template #suffix>
              <span style="font-size: 14px; color: #8B9CAD">人</span>
            </template>
          </a-statistic>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :lg="6">
        <a-card :bordered="false" class="stat-card">
          <a-statistic
            title="未读通知"
            :value="overview.unreadNotifications"
            :value-style="{ color: '#1a2332', fontSize: '28px', fontWeight: '600' }"
          >
            <template #suffix>
              <span style="font-size: 14px; color: #8B9CAD">条</span>
            </template>
          </a-statistic>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :lg="6">
        <a-card :bordered="false" class="stat-card">
          <a-statistic
            title="错误日志"
            :value="overview.errorLogs"
            :value-style="{ color: '#ff4d4f', fontSize: '28px', fontWeight: '600' }"
          >
            <template #suffix>
              <span style="font-size: 14px; color: #8B9CAD">条</span>
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- Quick Actions -->
    <a-card title="快捷入口" style="margin-top: 24px" :bordered="false">
      <a-row :gutter="[16, 16]">
        <a-col v-for="(m, idx) in quickModules" :key="m.key || idx" :xs="12" :sm="8" :md="6">
          <a-button block size="large" class="action-btn" @click="openModule(m)">
            {{ m.title || m.key || m.path }}
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- Modules List -->
    <a-card title="项目模块" style="margin-top: 24px" :bordered="false">
      <a-list :data-source="modules" size="small">
        <template #renderItem="{ item }">
          <a-list-item @click="openModule(item)" style="cursor: pointer">
            <a-list-item-meta
              :title="(item.title || item.key || '模块') + ' — ' + (item.path || '')"
              :description="item.component"
            />
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getMenuDefinitions } from '@/api/system/menu'

const userStore = useUserStore()
const router = useRouter()
const userInfo = computed(() => userStore.userInfo)

const currentDate = computed(() => {
  const now = new Date()
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  return now.toLocaleDateString('zh-CN', options)
})

const modules = ref([])
const quickModules = computed(() => (modules.value || []).slice(0, 8))

const overview = reactive({
  modules: 0,
  onlineUsers: 0,
  unreadNotifications: 0,
  errorLogs: 0
})

const openModule = (m) => {
  const p = (m && typeof m.path === 'string') ? m.path : ''
  if (!p) return
  const path = p.startsWith('/') ? p : ('/' + p)
  router.push(path).catch(() => {})
}

onMounted(async () => {
  try {
    const defs = await getMenuDefinitions().catch(() => [])
    modules.value = Array.isArray(defs) ? defs : []
    overview.modules = modules.value.length
  } catch {}
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.welcome-card {
  background: linear-gradient(135deg, #1a2332 0%, #2d3e50 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.welcome-content {
  color: white;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: white;
}

.welcome-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.stat-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-sub {
  margin-top: 8px;
  font-size: 12px;
  color: #8B9CAD;
}

.action-btn {
  height: 48px;
  border-radius: 8px;
  border: 1.5px solid #d0d7de;
  transition: all 0.3s ease;
}

.action-btn:hover {
  border-color: #1a2332;
  color: #1a2332;
  transform: translateY(-2px);
}

:deep(.ant-card) {
  border-radius: 12px;
}

:deep(.ant-card-head-title) {
  font-weight: 600;
  font-size: 16px;
}

:deep(.ant-statistic-title) {
  font-size: 14px;
  color: #8B9CAD;
  margin-bottom: 8px;
}
</style>
