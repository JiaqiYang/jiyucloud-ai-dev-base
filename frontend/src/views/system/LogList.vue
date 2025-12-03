<template>
  <a-config-provider :locale="zhCN">
    <div class="log-container">
      <a-card title="系统日志" :bordered="false">
      <!-- 筛选器 -->
      <div class="filter-section">
        <a-form layout="inline" :model="filterForm">
          <a-form-item label="关键字">
            <a-input v-model:value="filterForm.keyword" placeholder="搜索模块/操作/描述/IP/UA" style="width: 280px" allowClear />
          </a-form-item>
          <a-form-item label="模块">
            <a-select v-model:value="filterForm.module" placeholder="选择模块" style="width: 180px" allowClear>
              <a-select-option v-for="m in moduleOptions" :key="m" :value="m">{{ m }}</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="操作">
            <a-select v-model:value="filterForm.action" placeholder="选择操作" style="width: 180px" allowClear>
              <a-select-option v-for="a in actionOptions" :key="a" :value="a">{{ a }}</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="操作用户ID">
            <a-input v-model:value="filterForm.user_id" placeholder="输入用户ID" style="width: 160px" allowClear />
          </a-form-item>

          <a-form-item label="IP地址">
            <a-input v-model:value="filterForm.ip_address" placeholder="输入IP地址" style="width: 160px" allowClear />
          </a-form-item>
          <a-form-item>
            <a-checkbox v-model:checked="filterForm.hasSession">仅包含会话ID</a-checkbox>
          </a-form-item>

          <a-form-item label="日期范围">
            <a-range-picker 
              v-model:value="filterForm.dateRange" 
              :show-time="true"
              format="YYYY-MM-DD HH:mm:ss"
            />
            <a-space style="margin-left: 8px">
              <a-button @click="setQuickRange('today')">今天</a-button>
              <a-button @click="setQuickRange('week')">本周</a-button>
              <a-button @click="setQuickRange('month')">本月</a-button>
            </a-space>
          </a-form-item>

          <a-form-item>
            <a-button type="primary" @click="handleSearch">
              <SearchOutlined />
              查询
            </a-button>
            <a-button style="margin-left: 8px" @click="handleReset">重置</a-button>
            <a-switch style="margin-left: 12px" v-model:checked="autoRefresh" />
            <span style="margin-left: 6px; color:#607080">自动刷新</span>
          </a-form-item>
        </a-form>
      </div>

      <!-- 操作按钮 -->
      <div class="action-section">
        <a-button 
          danger 
          :disabled="selectedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          <DeleteOutlined />
          批量删除
        </a-button>
        <a-button style="margin-left: 8px" @click="exportCsv">导出CSV</a-button>
      </div>

      <!-- 日志表格 -->
      <a-table
        :dataSource="dataSource"
        :columns="columns"
        :loading="loading"
        :row-selection="rowSelection"
        :pagination="{ ...pagination, showSizeChanger: true }"
        @change="handleTableChange"
        :row-key="record => record.id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'user'">
            <span v-if="record.user?.id">
              <a-button type="link" size="small" @click="gotoUser(record.user.id)">
                {{ record.user?.real_name || record.user?.username || ('用户#' + record.user.id) }}
              </a-button>
            </span>
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'created_at'">
            {{ formatDate(record.created_at) }}
          </template>
          <template v-if="column.key === 'ip_location'">
            {{ record.ip_location || '-' }}
          </template>
          <template v-if="column.key === 'user_agent'">
            <span :title="record.user_agent">{{ shortUa(record.user_agent) }}</span>
          </template>
          <template v-if="column.key === 'session_id'">
            <span>{{ extractSession(record.description) || '-' }}</span>
            <a-button v-if="extractSession(record.description)" type="text" size="small" @click="copyText(extractSession(record.description))">复制</a-button>
          </template>
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="showDetail(record)">详情</a-button>
              <a-popconfirm title="确定要删除吗？" @confirm="handleDelete(record.id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情抽屉 -->
    <a-drawer
      v-model:open="detailVisible"
      title="日志详情"
      width="600"
      :footer-style="{ textAlign: 'right' }"
    >
      <a-descriptions bordered :column="1" v-if="currentLog">
        <a-descriptions-item label="操作模块">{{ currentLog.module }}</a-descriptions-item>
        <a-descriptions-item label="操作类型">{{ currentLog.action }}</a-descriptions-item>
        <a-descriptions-item label="操作用户">
          {{ currentLog.user?.real_name || currentLog.user?.username || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="IP地址">{{ currentLog.ip_address || '-' }}</a-descriptions-item>
        <a-descriptions-item label="IP所在地">{{ currentLog.ip_location || '-' }}</a-descriptions-item>
        <a-descriptions-item label="会话ID">{{ extractSession(currentLog.description) || '-' }}</a-descriptions-item>
        <a-descriptions-item label="User-Agent">
          <pre>{{ currentLog.user_agent || '-' }}</pre>
        </a-descriptions-item>
        <a-descriptions-item label="操作时间">{{ formatDate(currentLog.created_at) }}</a-descriptions-item>
        <a-descriptions-item label="详细信息">
          <pre>{{ formatDetails(currentLog.description) }}</pre>
        </a-descriptions-item>
      </a-descriptions>
    </a-drawer>
    </div>
  </a-config-provider>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { getLogs, deleteLog, batchDeleteLogs, getLogDetail, getLogStatistics } from '@/api/system/log';
import { getMenuDefinitions } from '@/api/system/menu';
import dayjs from 'dayjs';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import 'dayjs/locale/zh-cn';

const dataSource = ref([]);
const loading = ref(false);
const detailVisible = ref(false);
const currentLog = ref(null);
const selectedRowKeys = ref([]);
const moduleOptions = ref([]);
const actionOptions = ref([]);
const zhCNLocale = zhCN;
const autoRefresh = ref(false);
let autoTimer = null;
const router = useRouter();

const filterForm = reactive({
  module: undefined,
  action: undefined,
  dateRange: null,
  user_id: undefined,
  ip_address: '',
  keyword: '',
  hasSession: false
});

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
});

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '模块', dataIndex: 'module', key: 'module' },
  { title: '操作', dataIndex: 'action', key: 'action' },
  { title: '操作用户', key: 'user' },
  { title: 'IP地址', dataIndex: 'ip_address', key: 'ip_address' },
  { title: 'IP所在地', dataIndex: 'ip_location', key: 'ip_location' },
  { title: '会话ID', key: 'session_id', width: 220 },
  { title: 'User-Agent', dataIndex: 'user_agent', key: 'user_agent' },
  { title: '操作时间', key: 'created_at', width: 180 },
  { title: '操作', key: 'actions', width: 150, fixed: 'right' }
];

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => {
    selectedRowKeys.value = keys;
  }
}));

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      module: filterForm.module,
      action: filterForm.action,
      user_id: filterForm.user_id,
      ip_address: filterForm.ip_address,
      keyword: filterForm.keyword || undefined,
      hasSession: filterForm.hasSession ? 'true' : undefined
    };

    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startDate = filterForm.dateRange[0].toDate().toISOString();
      params.endDate = filterForm.dateRange[1].toDate().toISOString();
    }

    const res = await getLogs(params);
    dataSource.value = Array.isArray(res?.list) ? res.list : [];
    pagination.total = Number(res?.total || 0);
  } catch (error) {
    console.error(error);
    const errMsg = error?.response?.data?.error || error?.response?.data?.message || '加载日志失败';
    message.error(errMsg);
  } finally {
    loading.value = false;
  }
};

const loadFilterOptions = async () => {
  try {
    const stats = await getLogStatistics({});
    const modules = Array.isArray(stats?.moduleStats) ? stats.moduleStats.map(s => s.module).filter(Boolean) : [];
    const actions = Array.isArray(stats?.actionStats) ? stats.actionStats.map(s => s.action).filter(Boolean) : [];
    moduleOptions.value = [...new Set(modules)].sort();
    actionOptions.value = [...new Set(actions)].sort();
  } catch (error) {
    // 静默失败，保持空选项
    moduleOptions.value = moduleOptions.value || [];
    actionOptions.value = actionOptions.value || [];
  }
};

const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

const handleReset = () => {
  filterForm.module = undefined;
  filterForm.action = undefined;
  filterForm.dateRange = null;
  filterForm.user_id = undefined;
  filterForm.ip_address = '';
  filterForm.keyword = '';
  filterForm.hasSession = false;
  pagination.current = 1;
  loadData();
};

const handleTableChange = (pag) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadData();
};

const showDetail = async (record) => {
  try {
    const res = await getLogDetail(record.id);
    currentLog.value = res || null;
    detailVisible.value = !!currentLog.value;
  } catch (error) {
    const errMsg = error?.response?.data?.error || error?.response?.data?.message || '获取日志详情失败';
    message.error(errMsg);
  }
};

const handleDelete = async (id) => {
  try {
    await deleteLog(id);
    message.success('删除成功');
    loadData();
  } catch (error) {
    const errMsg = error?.response?.data?.error || error?.response?.data?.message || '删除失败';
    message.error(errMsg);
  }
};

const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的日志');
    return;
  }

  Modal.confirm({
    title: '确认删除',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 条日志吗？`,
    onOk: async () => {
      try {
        await batchDeleteLogs(selectedRowKeys.value);
        message.success('批量删除成功');
        selectedRowKeys.value = [];
        loadData();
      } catch (error) {
        const errMsg = error?.response?.data?.error || error?.response?.data?.message || '批量删除失败';
        message.error(errMsg);
      }
    }
  });
};

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-';
};

const formatDetails = (details) => {
  if (!details) return '-';
  try {
    return typeof details === 'string' ? details : JSON.stringify(details, null, 2);
  } catch {
    return details;
  }
};

const setQuickRange = (type) => {
  const now = dayjs();
  let start = now.startOf('day');
  let end = now.endOf('day');
  if (type === 'week') {
    const weekday = now.day();
    start = now.subtract(weekday, 'day').startOf('day');
    end = now.add(6 - weekday, 'day').endOf('day');
  } else if (type === 'month') {
    start = now.startOf('month');
    end = now.endOf('month');
  }
  filterForm.dateRange = [start, end];
  pagination.current = 1;
  loadData();
};

const extractSession = (desc) => {
  try {
    const m = String(desc || '').match(/session:([0-9a-f\-]+)/i);
    return m ? m[1] : '';
  } catch { return ''; }
};
const shortUa = (ua) => {
  const s = String(ua || '');
  return s.length > 60 ? s.slice(0, 60) + '…' : s;
};
const copyText = async (t) => {
  try { await navigator.clipboard.writeText(String(t || '')); message.success('已复制'); } catch {}
};
const exportCsv = () => {
  const list = Array.isArray(dataSource.value) ? dataSource.value : [];
  const headers = ['ID','模块','操作','用户','IP地址','IP所在地','会话ID','时间','User-Agent','详情'];
  const rows = list.map(r => [
    r.id,
    r.module || '',
    r.action || '',
    (r.user?.real_name || r.user?.username || ''),
    r.ip_address || '',
    r.ip_location || '',
    extractSession(r.description) || '',
    formatDate(r.created_at) || '',
    r.user_agent || '',
    (typeof r.description === 'string' ? r.description : JSON.stringify(r.description))
  ]);
  const esc = (x) => String(x).replace(/"/g, '""');
  const wrap = (x) => /[",\n]/.test(x) ? `"${x}"` : x;
  const csv = [headers.join(','), ...rows.map(row => row.map(v => wrap(esc(String(v)))).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = '系统日志.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const setupAutoRefresh = () => {
  if (autoTimer) { try { clearInterval(autoTimer) } catch {} autoTimer = null }
  if (autoRefresh.value) {
    autoTimer = setInterval(() => { loadData() }, 30000);
  }
};

const findUserListPath = async () => {
  try {
    const defs = await getMenuDefinitions();
    const items = Array.isArray(defs) ? defs : [];
    const it = items.find(x => x && x.component === 'system/UserList' && typeof x.path === 'string');
    return it ? it.path : '/system/user';
  } catch { return '/system/user'; }
};

const gotoUser = async (userId) => {
  try {
    const p = await findUserListPath();
    const path = p.startsWith('/') ? p : ('/' + p);
    try { sessionStorage.setItem('focusUserId', String(userId)); } catch {}
    router.push({ path, query: { focusUserId: userId } });
  } catch {}
};

onMounted(() => {
  dayjs.locale('zh-cn');
  filterForm.dateRange = [dayjs().startOf('day'), dayjs().endOf('day')];
  loadData();
  loadFilterOptions();
  setupAutoRefresh();
});
watch(autoRefresh, setupAutoRefresh);
</script>

<style scoped>
.log-container {
  padding: 24px;
}

.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.action-section {
  margin-bottom: 16px;
}

pre {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
}
</style>
