<template>
  <div>
    <a-card title="用户管理">
      <div style="margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:8px">
        <div style="display:flex; gap:12px; flex-wrap: wrap">
          <div class="filter-item">
            <a-input-search v-model:value="userKeyword" placeholder="输入用户名/真实姓名/电话/邮箱搜索" style="max-width:360px" allowClear @search="doSearch" />
          </div>
          <div class="filter-item">
            <span class="filter-label">角色</span>
            <a-select v-model:value="filterRoleId" style="width: 180px" placeholder="按角色筛选" @change="onFilterChange">
              <a-select-option :value="undefined">全部角色</a-select-option>
              <a-select-option v-for="r in roles" :key="r.id" :value="r.id">{{ r.role_name }}</a-select-option>
            </a-select>
          </div>
          <div class="filter-item">
            <span class="filter-label">在线</span>
            <a-select v-model:value="filterOnline" style="width: 160px" placeholder="按在线状态筛选" @change="onFilterChange">
              <a-select-option value="all">全部</a-select-option>
              <a-select-option value="online">在线</a-select-option>
              <a-select-option value="offline">离线</a-select-option>
            </a-select>
          </div>
          <div class="filter-item">
            <span class="filter-label">状态</span>
            <a-select v-model:value="filterStatus" style="width: 160px" placeholder="按状态筛选" @change="onFilterChange">
              <a-select-option value="all">全部</a-select-option>
              <a-select-option value="active">启用</a-select-option>
              <a-select-option value="inactive">禁用</a-select-option>
            </a-select>
          </div>
          <a-button @click="refreshList">刷新</a-button>
        </div>
        <a-button type="primary" @click="showModal()">新增用户</a-button>
      </div>
      <a-table :dataSource="dataSource" :columns="columns" :pagination="pagination" @change="handleTableChange" :loading="loading" rowKey="id" :rowClassName="rowClassName">
        
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatar'">
            <a-avatar :size="32" :src="resolveFileUrl(record.avatar)">
              <template #icon><UserOutlined /></template>
            </a-avatar>
          </template>
          <template v-if="column.key === 'role'">
            {{ record.Role?.role_name || record.role?.role_name || '暂无角色' }}
          </template>
          <template v-if="column.key === 'department'">
            {{ record.Department?.name || record.department || '-' }}
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'active' ? 'green' : 'red'">
              {{ record.status === 'active' ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'last_login'">
            {{ formatDate(record.last_login) }}
          </template>
          <template v-if="column.key === 'online'">
            <a-tag :color="isOnline(record) ? 'green' : 'red'">{{ isOnline(record) ? '在线' : '离线' }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="showModal(record)">编辑</a-button>
              <a-button type="link" @click="showSessions(record)">登录记录</a-button>
              <a-popconfirm title="确定强制下线该用户？" okText="确定" cancelText="取消" @confirm="() => handleForceLogout(record)" v-if="isOnline(record)">
                <a-button type="link" danger>强制下线</a-button>
              </a-popconfirm>
              <template v-if="!isSuperAdmin(record)">
                <a-popconfirm title="确定要删除吗？" okText="确定" cancelText="取消" @confirm="handleDelete(record.id)">
                  <a-button type="link" danger>删除</a-button>
                </a-popconfirm>
              </template>
              <template v-else>
                <a-button type="link" danger disabled>不可删除</a-button>
              </template>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="visible"
      :title="modalTitle"
      @ok="handleOk"
      :confirmLoading="confirmLoading"
      okText="确定"
      cancelText="取消"
      :width="720"
      :maskClosable="false"
    >
      <a-form :model="formState" :rules="rules" ref="formRef" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-row :gutter="[16, 8]">
          <a-col :span="12">
            <a-form-item label="用户名" name="username" required>
              <a-input v-model:value="formState.username" :disabled="!!formState.id" allowClear placeholder="请输入用户名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="密码" name="password">
              <a-input-password v-model:value="formState.password" allowClear placeholder="留空则不修改" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="真实姓名" name="real_name">
              <a-input v-model:value="formState.real_name" allowClear placeholder="请输入真实姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="角色" name="role_id" required>
              <a-select v-model:value="formState.role_id" showSearch optionFilterProp="children" placeholder="请选择角色">
                <a-select-option v-for="role in roles" :key="role.id" :value="role.id">
                  {{ role.role_name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="电话" name="phone">
              <a-input v-model:value="formState.phone" allowClear placeholder="请输入联系电话" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="邮箱" name="email">
              <a-input v-model:value="formState.email" allowClear placeholder="请输入邮箱" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="部门" name="department_id">
              <a-tree-select
                v-model:value="formState.department_id"
                :treeData="deptTree"
                :fieldNames="{ value: 'id', label: 'name', children: 'children' }"
                allowClear
                placeholder="请选择部门"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态" name="status">
              <a-select v-model:value="formState.status" placeholder="请选择状态">
                <a-select-option value="active">启用</a-select-option>
                <a-select-option value="inactive">禁用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="头像" name="avatar">
              <a-upload
                name="file"
                :action="uploadAction"
                :headers="uploadHeaders"
                :file-list="avatarFileList"
                list-type="picture-card"
                :max-count="1"
                accept="image/*"
                @change="handleAvatarChange"
                @remove="handleAvatarRemove"
                @preview="handleAvatarPreview"
              >
                <template v-if="avatarFileList.length < 1">
                  <div style="color:#1677ff">上传头像</div>
                </template>
              </a-upload>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
    <a-modal v-model:open="previewOpen" :title="previewTitle" :footer="null" @cancel="handleAvatarPreviewCancel">
      <img :src="previewImage" style="max-width:100%;max-height:60vh;object-fit:contain" />
  </a-modal>
    <a-modal v-model:open="sessionsVisible" title="登录记录" :footer="null" :width="980">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
        <a-space>
          <a-input-search v-model:value="sessionsKeyword" placeholder="搜索设备/IP/会话ID" style="width:280px" allowClear @search="refreshSessions" />
          <a-select v-model:value="sessionsOnlineFilter" style="width:160px">
            <a-select-option value="all">全部</a-select-option>
            <a-select-option value="online">在线</a-select-option>
            <a-select-option value="offline">离线</a-select-option>
          </a-select>
        </a-space>
        <a-space>
          <a-button @click="refreshSessions">刷新</a-button>
          <a-button @click="exportSessionsCsv" type="default">导出CSV</a-button>
          <a-popconfirm v-if="currentUserForSessions" title="确定踢出全部在线设备？" okText="确定" cancelText="取消" @confirm="kickAllOnlineSessions">
            <a-button type="primary" danger>踢出全部在线设备</a-button>
          </a-popconfirm>
        </a-space>
      </div>
      <div class="sessions-grid">
        <div v-for="record in sessionsView" :key="record.id" class="session-card">
          <div class="session-card-header" :class="record.is_online ? 'online' : 'offline'">
            <div class="device-icon">
              <DesktopOutlined v-if="!isMobileUa(record.device)" />
              <MobileOutlined v-else />
            </div>
            <div class="device-title" :title="record.device">{{ record.device || '未知设备' }}</div>
            <a-tag :color="record.is_online ? 'green' : 'red'" class="status-tag">{{ record.is_online ? '在线' : '离线' }}</a-tag>
          </div>
          <div class="session-card-body">
            <div class="row">
              <span class="label">IP</span>
              <span class="value">
                {{ record.ip || '-' }}
                <a-tag v-if="isPrivateIp(record.ip)" color="blue" style="margin-left:6px">内网</a-tag>
              </span>
            </div>
            <div class="row">
              <span class="label">IP所在地</span>
              <span class="value" :title="record.location">{{ record.location || '-' }}</span>
            </div>
            <div class="row">
              <span class="label">系统</span>
              <span class="value">
                <a-tag>{{ parseUa(record.device).os }}</a-tag>
              </span>
            </div>
            <div class="row">
              <span class="label">浏览器</span>
              <span class="value">
                <a-tag>{{ parseUa(record.device).browser }}</a-tag>
              </span>
            </div>
            <div class="row">
              <span class="label">会话ID</span>
              <span class="value" :title="record.session_id || '-'">
                {{ record.session_id || '-' }}
                <a-button v-if="record.session_id" type="text" size="small" @click="copyText(record.session_id)" style="margin-left:4px"><CopyOutlined /></a-button>
              </span>
            </div>
            <div class="row">
              <span class="label">最近活跃</span>
              <span class="value">{{ formatRelative(record.last_active || record.last_active_at || record.updated_at) }}</span>
            </div>
            <div class="row">
              <span class="label">登录时间</span>
              <span class="value">{{ formatDate(record.login_time || record.created_at) }}</span>
            </div>
          </div>
  <div class="session-card-footer">
            <a-popconfirm v-if="record.is_online && record.session_id && currentUserForSessions" title="确定强制下线该设备？" okText="确定" cancelText="取消" @confirm="() => handleForceLogoutSession(currentUserForSessions, record)">
              <a-button size="small" danger :disabled="isCurrentUserOwnSession(currentUserForSessions, record)">强制下线</a-button>
            </a-popconfirm>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { getUsers, createUser, updateUser, deleteUser, forceLogoutUser, getUserSessions, forceLogoutSession } from '@/api/system/user';
import { getRoles } from '@/api/system/role';
import { CopyOutlined, DesktopOutlined, MobileOutlined } from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router';
import { getDepartmentTree } from '@/api/system/department';

const dataSource = ref([]);
const loading = ref(false);
const roles = ref([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const columns = [
  { title: '头像', key: 'avatar', width: 80 },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '真实姓名', dataIndex: 'real_name', key: 'real_name' },
  { title: '角色', key: 'role' },
  { title: '电话', dataIndex: 'phone', key: 'phone' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '部门', key: 'department' },
  { title: '最后登录', key: 'last_login' },
  { title: '在线', key: 'online', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action' },
];

const visible = ref(false);
const confirmLoading = ref(false);
const modalTitle = ref('新增用户');
const formState = reactive({
  id: null,
  username: '',
  password: '',
  real_name: '',
  role_id: undefined,
  phone: '',
  email: '',
  department: '',
  avatar: '',
  status: 'active',
});
const avatarFileList = ref([]);
const deptTree = ref([]);
const loadDeptTree = async () => { try { const res = await getDepartmentTree({ status: 'active' }); deptTree.value = Array.isArray(res) ? res : [] } catch {} };
const uploadAction = `${import.meta.env.VITE_API_BASE_URL}/uploads/avatar`;
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('token') || ''}` };
const formRef = ref();
const rules = ref({
  username: [{ required: true, message: '请输入用户名' }],
  password: [],
  role_id: [{ required: true, message: '请选择角色' }],
  email: [{ type: 'email', message: '请输入有效邮箱' }],
  phone: [{ pattern: /^(\+?\d{1,4})?\d{7,14}$/ , message: '请输入有效电话' }],
});
const previewOpen = ref(false);
const previewImage = ref('');
const previewTitle = ref('');
const apiOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace('/api', '');
const resolveFileUrl = (u) => {
  if (!u) return '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('/uploads')) return apiOrigin + u;
  return u;
};

const userKeyword = ref('');
const route = useRoute();
const router = useRouter();
const clearHighlightStorage = () => {
  try { sessionStorage.removeItem('focusUserId'); } catch {}
  try {
    const q = { ...(route.query || {}) };
    if (q.focusUserId != null) {
      delete q.focusUserId;
      router.replace({ path: route.path, query: q });
    }
  } catch {}
};
const clearHighlight = () => {
  isFading.value = false;
  highlightedUserId.value = 0;
  clearHighlightStorage();
};
const doSearch = () => { clearHighlight(); pagination.current = 1; loadData(); };
const refreshList = () => { clearHighlight(); loadData(); };
const filterRoleId = ref();
const filterOnline = ref('all');
const filterStatus = ref('all');
const onFilterChange = () => { pagination.current = 1; loadData(); };

const loadData = async () => {
  loading.value = true;
  try {
    const res = await getUsers({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: userKeyword.value,
      role_id: filterRoleId.value,
      online: filterOnline.value === 'all' ? undefined : filterOnline.value,
      status: filterStatus.value === 'all' ? undefined : filterStatus.value,
    });
    dataSource.value = res.list;
    pagination.total = res.total;
    tryFocusUser();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const loadRoles = async () => {
  try {
    const res = await getRoles();
    roles.value = res;
  } catch (error) {
    console.error(error);
  }
};

const handleTableChange = (pag) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadData();
};

const showModal = (record) => {
  visible.value = true;
  if (record) {
    modalTitle.value = '编辑用户';
    Object.assign(formState, record);
    formState.password = ''; // Clear password field
    formState.department_id = record.Department?.id || record.department_id || undefined;
    avatarFileList.value = formState.avatar ? [{ uid: '1', name: 'avatar', status: 'done', url: resolveFileUrl(formState.avatar) }] : [];
    rules.value.password = [];
  } else {
    modalTitle.value = '新增用户';
    formState.id = null;
    formState.username = '';
    formState.password = '';
    formState.real_name = '';
    formState.role_id = undefined;
    formState.phone = '';
    formState.email = '';
    formState.department = '';
    formState.department_id = undefined;
    formState.avatar = '';
    formState.status = 'active';
    avatarFileList.value = [];
    rules.value.password = [{ required: true, message: '请输入密码' }];
  }
};

const handleOk = async () => {
  confirmLoading.value = true;
  try {
    await formRef.value?.validate();
    if (formState.id) {
      await updateUser(formState.id, formState);
      message.success('更新成功');
    } else {
      await createUser(formState);
      message.success('创建成功');
    }
    visible.value = false;
    loadData();
  } catch (error) {
    console.error(error);
  } finally {
    confirmLoading.value = false;
  }
};

const handleDelete = async (id) => {
  try {
    await deleteUser(id);
    message.success('删除成功');
    loadData();
  } catch (error) {
    const errMsg = error?.response?.data?.error || error?.response?.data?.message || '删除失败';
    message.error(errMsg);
  }
};


const focusedUserId = computed(() => {
  let v = route.query?.focusUserId;
  try {
    const sv = sessionStorage.getItem('focusUserId');
    if (sv) v = sv;
  } catch {}
  if (v == null) return 0;
  const n = parseInt(Array.isArray(v) ? v[0] : String(v));
  return isNaN(n) ? 0 : n;
});
let didFocus = false;
const highlightedUserId = ref(0);
const isFading = ref(false);
let fadeTimer = null;
let clearTimer = null;
const tryFocusUser = () => {
  if (didFocus) return;
  const id = focusedUserId.value;
  if (!id) return;
  const list = Array.isArray(dataSource.value) ? dataSource.value : [];
  const found = list.find(r => Number(r.id) === Number(id));
  if (found) {
    didFocus = true;
    highlightedUserId.value = Number(found.id);
    isFading.value = false;
    if (fadeTimer) { try { clearTimeout(fadeTimer) } catch {} fadeTimer = null }
    if (clearTimer) { try { clearTimeout(clearTimer) } catch {} clearTimer = null }
    fadeTimer = setTimeout(() => { isFading.value = true; }, 4000);
    clearTimer = setTimeout(() => { clearHighlight(); }, 6000);
    nextTick(() => {
      const row = document.querySelector(`.ant-table-row[data-row-key="${found.id}"]`);
      if (row && typeof row.scrollIntoView === 'function') {
        try { row.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
      }
    });
  }
};

onMounted(() => {
  loadData();
  loadRoles();
  loadDeptTree();
});

const rowClassName = (record) => {
  if (Number(record?.id) === Number(highlightedUserId.value)) {
    return isFading.value ? 'row-focused fade-out' : 'row-focused';
  }
  return '';
};
watch(() => dataSource.value, () => { tryFocusUser(); });

const isSuperAdmin = (record) => {
  const code = record?.Role?.role_code || record?.role?.role_code;
  return code === 'super_admin' || record?.username === 'admin';
};

const isOnline = (record) => {
  const v = record?.online ?? record?.is_online ?? record?.session_active;
  return v === true || v === 1 || v === 'online';
};

const formatDate = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString();
  } catch (e) {
    return String(d);
  }
};

const handleForceLogout = async (record) => {
  try {
    await forceLogoutUser(record.id);
    message.success('已强制下线');
    loadData();
  } catch (error) {
    const errMsg = error?.response?.data?.error || error?.response?.data?.message || '操作失败';
    message.error(errMsg);
  }
};

const sessionsVisible = ref(false);
const sessionsLoading = ref(false);
const sessionsData = ref([]);
const currentUserForSessions = ref(null);
const sessionsKeyword = ref('');
const sessionsOnlineFilter = ref('all');
const sessionsView = computed(() => {
  const kw = sessionsKeyword.value.trim().toLowerCase();
  const f = sessionsOnlineFilter.value;
  const list = Array.isArray(sessionsData.value) ? sessionsData.value : [];
  return list.filter(it => {
    const onlineOk = f === 'all' ? true : (f === 'online' ? it.is_online : !it.is_online);
    if (!onlineOk) return false;
    if (!kw) return true;
    const s = `${it.device || ''} ${it.ip || ''} ${it.session_id || ''}`.toLowerCase();
    return s.includes(kw);
  });
});
const showSessions = async (record) => {
  currentUserForSessions.value = record;
  sessionsVisible.value = true;
  sessionsLoading.value = true;
  try {
    const res = await getUserSessions(record.id);
    sessionsData.value = Array.isArray(res?.list) ? res.list : (Array.isArray(res) ? res : []);
    sessionsKeyword.value = '';
    sessionsOnlineFilter.value = 'all';
  } catch (e) {
    sessionsData.value = [];
  } finally {
    sessionsLoading.value = false;
  }
};

const refreshSessions = async () => {
  if (!currentUserForSessions.value) return;
  sessionsLoading.value = true;
  try {
    const res = await getUserSessions(currentUserForSessions.value.id);
    sessionsData.value = Array.isArray(res?.list) ? res.list : [];
  } finally {
    sessionsLoading.value = false;
  }
};

const copyText = async (t) => {
  try {
    await navigator.clipboard.writeText(String(t || ''));
    message.success('已复制');
  } catch {}
};

const isMobileUa = (ua) => {
  const s = String(ua || '').toLowerCase();
  return s.includes('mobile') || s.includes('android') || s.includes('iphone');
};

const isPrivateIp = (ip) => {
  const s = String(ip || '');
  if (s === '::1') return true;
  return /^127\./.test(s) || /^10\./.test(s) || /^192\.168\./.test(s) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(s);
};

const formatRelative = (d) => {
  if (!d) return '-';
  try {
    const t = new Date(d).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - t) / 1000));
    if (diff < 10) return '刚刚';
    if (diff < 60) return `${diff}秒前`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}分钟前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}小时前`;
    const day = Math.floor(h / 24);
    return `${day}天前`;
  } catch { return String(d); }
};

const exportSessionsCsv = () => {
  const list = Array.isArray(sessionsView.value) ? sessionsView.value : [];
  const headers = ['设备', 'IP', 'IP所在地', '会话ID', '在线', '最近活跃时间', '登录时间'];
  const rows = list.map(it => [
    it.device || '',
    it.ip || '',
    it.location || '',
    it.session_id || '',
    it.is_online ? '在线' : '离线',
    formatDate(it.last_active || it.last_active_at || it.updated_at) || '',
    formatDate(it.login_time || it.created_at) || ''
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.map(x => String(x).replace(/"/g, '""')).map(x => /[",\n]/.test(x) ? `"${x}"` : x).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '登录记录.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const parseUa = (ua) => {
  const s = String(ua || '').toLowerCase();
  let os = 'Unknown';
  if (s.includes('android')) os = 'Android';
  else if (s.includes('iphone') || s.includes('ipad') || s.includes('ios')) os = 'iOS';
  else if (s.includes('mac')) os = 'macOS';
  else if (s.includes('windows')) os = 'Windows';
  let browser = 'Unknown';
  if (s.includes('edg/')) browser = 'Edge';
  else if (s.includes('chrome/')) browser = 'Chrome';
  else if (s.includes('safari/') && !s.includes('chrome/')) browser = 'Safari';
  else if (s.includes('firefox/')) browser = 'Firefox';
  return { os, browser };
};

const kickAllOnlineSessions = async () => {
  try {
    const user = currentUserForSessions.value;
    if (!user) return;
    const onlineSessions = (sessionsView.value || []).filter(x => x.is_online && x.session_id);
    for (const s of onlineSessions) {
      await handleForceLogoutSession(user, s);
    }
    await refreshSessions();
    await loadData();
    message.success('已踢出全部在线设备');
  } catch (e) {
    const errMsg = e?.response?.data?.error || e?.response?.data?.message || '操作失败';
    message.error(errMsg);
  }
};

const handleForceLogoutSession = async (userRecord, sessionRecord) => {
  try {
    if (isCurrentUserOwnSession(userRecord, sessionRecord)) { message.warning('不能强制下线当前会话'); return }
    const r = await forceLogoutSession(userRecord.id, sessionRecord.session_id);
    message.success('该设备已踢出');
    const res = await getUserSessions(userRecord.id);
    sessionsData.value = Array.isArray(res?.list) ? res.list : [];
    await loadData();
    if (r && r.anyOnline === false) {
      message.info('该用户已无在线设备，已标记为离线');
    }
  } catch (e) {
    const errMsg = e?.response?.data?.error || e?.response?.data?.message || '操作失败';
    message.error(errMsg);
  }
};
const handleAvatarChange = info => {
  const status = info.file?.status;
  if (status === 'done') {
    const url = info.file.response?.url;
    if (url) formState.avatar = url;
  }
  avatarFileList.value = (info.fileList || []).map(f => {
    if (f.response?.url) f.url = resolveFileUrl(f.response.url);
    else if (f.url) f.url = resolveFileUrl(f.url);
    return f;
  });
  if (status === 'removed' && avatarFileList.value.length === 0) {
    formState.avatar = '';
  }
};

const handleAvatarRemove = () => {
  formState.avatar = '';
};

const getBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

const handleAvatarPreview = async file => {
  const resolvedUrl = file.url ? resolveFileUrl(file.url) : '';
  if (!resolvedUrl && !file.preview && file.originFileObj) {
    file.preview = await getBase64(file.originFileObj);
  }
  previewImage.value = resolvedUrl || file.thumbUrl || file.preview || '';
  previewOpen.value = true;
  previewTitle.value = file.name || '预览';
};

const handleAvatarPreviewCancel = () => {
  previewOpen.value = false;
};

// 当前操作者的用户ID与会话ID（从JWT中解析）
const currentSessionId = computed(() => {
  try {
    const token = localStorage.getItem('token') || ''
    const payload = token.split('.')[1]
    if (!payload) return ''
    const json = JSON.parse(decodeURIComponent(escape(window.atob(payload))))
    return json?.jti || ''
  } catch { return '' }
})
const currentUserId = computed(() => {
  try {
    const token = localStorage.getItem('token') || ''
    const payload = token.split('.')[1]
    if (!payload) return 0
    const json = JSON.parse(decodeURIComponent(escape(window.atob(payload))))
    return json?.id || 0
  } catch { return 0 }
})
const isCurrentUserOwnSession = (userRecord, sessionRecord) => {
  const uid = userRecord?.id
  const sid = sessionRecord?.session_id
  return Boolean(uid && sid && uid === currentUserId.value && sid === currentSessionId.value)
}
</script>

<style scoped>
.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  max-height: 480px;
  overflow: auto;
  padding: 4px;
}
.filter-item { display: flex; align-items: center; gap: 6px; }
.filter-label { color: #607080; font-size: 12px; }
.session-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  transition: box-shadow .2s ease, transform .2s ease;
}
.session-card:hover { box-shadow: 0 6px 16px rgba(26,35,50,.12); transform: translateY(-2px); }
.session-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
}
.session-card-header.online { background: linear-gradient(90deg, #f0fff4, #ffffff); }
.session-card-header.offline { background: linear-gradient(90deg, #fff5f5, #ffffff); }
.device-icon :deep(svg) { font-size: 18px; color: #1a2332; }
.device-title {
  flex: 1;
  font-weight: 600;
  color: #1a2332;
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
}
.status-tag { margin-left: auto; }
.session-card-body { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.row { display: flex; gap: 8px; }
.label { width: 84px; color: #607080; }
.value { flex: 1; color: #1a2332; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.session-card-footer { padding: 10px 12px; border-top: 1px dashed #f0f0f0; display: flex; justify-content: flex-end; }
:deep(.row-focused) { background: #fffbe6 !important; }
:deep(.row-focused) td { background: #fffbe6 !important; }
:deep(.row-focused.fade-out) {
  transition: opacity .6s ease, background-color .6s ease;
  opacity: 0.2;
}
</style>
