+<template>
  <div class="page-wrap">
    <div class="toolbar">
      <a-space>
        <a-input-search v-model:value="keyword" placeholder="搜索标题/内容" allowClear @search="load" style="width:280px" />
        <a-select v-model:value="status" placeholder="状态" allowClear style="width:140px">
          <a-select-option v-for="i in dictStatus" :key="i.value" :value="i.value">{{ i.label }}</a-select-option>
        </a-select>
        <a-select v-model:value="priority" placeholder="优先级" allowClear style="width:140px">
          <a-select-option v-for="i in dictPriority" :key="i.value" :value="i.value">{{ i.label }}</a-select-option>
        </a-select>
        <a-select v-model:value="filterDept" placeholder="部门" allowClear style="width:160px">
          <a-select-option v-for="d in deptOptions" :key="d.value" :value="d.value">{{ d.label }}</a-select-option>
        </a-select>
        <a-switch v-model:checked="validOnly" checked-children="有效期内" un-checked-children="全部" />
      </a-space>
      <a-space>
        <a-button type="primary" @click="openCreate">新建通知</a-button>
        <a-popconfirm title="确认批量删除选中通知？" @confirm="handleBatchDelete" :disabled="!selectedRowKeys.length">
          <a-button danger :disabled="!selectedRowKeys.length">批量删除</a-button>
        </a-popconfirm>
      </a-space>
    </div>
    <a-table :dataSource="list" :loading="loading" rowKey="id" :pagination="pagination" @change="onTableChange" :rowSelection="rowSelection">
      <a-table-column title="标题" dataIndex="title" key="title" :ellipsis="true" />
      <a-table-column title="优先级" dataIndex="priority" key="priority" />
      <a-table-column title="状态" dataIndex="status" key="status" />
      <a-table-column title="接收部门" key="departments" />
      <a-table-column title="开始时间" key="start_time" :customRender="({record}) => formatDate(record.start_time)" />
      
      <a-table-column title="创建人" key="created_by" :customRender="({record}) => (record.creator && (record.creator.real_name || record.creator.username)) || '-'" />
      <a-table-column title="操作" key="actions" />
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'actions'">
          <a-space>
            <a-button size="small" type="link" @click="openEdit(record)">编辑</a-button>
            <a-popconfirm title="确认删除该通知？" @confirm="() => handleDelete(record)">
              <a-button size="small" danger type="text">删除</a-button>
            </a-popconfirm>
            <a-button size="small" type="link" @click="openSendConfirm(record)">发送消息</a-button>
            <a-button size="small" type="link" @click="openMessageRecords(record)">发送记录</a-button>
          </a-space>
        </template>
        <template v-if="column.key === 'priority'">
          <div @mouseenter="hoverPriorityId = record.id" @mouseleave="hoverPriorityId = null">
            <template v-if="editPriorityId === record.id">
              <a-space>
                <a-select v-model:value="editPriorityValue" size="small" style="width:110px" :options="dictPriority" />
                <a-button size="small" type="primary" @click="savePriority(record)">保存</a-button>
                <a-button size="small" @click="cancelPriorityEdit">取消</a-button>
              </a-space>
            </template>
            <template v-else>
              <a-space>
                <a-tag :color="priorityColor(record.priority)">{{ priorityLabel(record.priority) }}</a-tag>
                <a-button v-if="hoverPriorityId === record.id" size="small" type="link" @click="startPriorityEdit(record)">编辑</a-button>
              </a-space>
            </template>
          </div>
        </template>
        <template v-if="column.key === 'status'">
          {{ statusLabel(record.status) }}
        </template>
        <template v-if="column.key === 'departments'">
          <span v-if="Array.isArray(record.department_ids) && record.department_ids.length">
            {{ record.department_ids.map(id => deptLabel(id)).join('，') }}
          </span>
          <span v-else>全部</span>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalOpen"
      :title="isEdit ? '编辑通知' : '新建通知'"
      :confirmLoading="saving"
      width="720px"
      :destroyOnClose="true"
      :getContainer="false"
      :key="modalOpen ? 'modal-open' : 'modal-closed'"
      :footer="null"
    >
      <a-form :model="form" :label-col="{span:5}" :wrapper-col="{span:17}">
        <a-form-item label="标题" required>
          <a-input v-model:value="form.title" placeholder="请输入标题" />
        </a-form-item>
        <a-form-item label="内容" required>
          <QuillEditor
            v-if="modalOpen"
            v-model:content="form.content"
            contentType="html"
            theme="snow"
            style="height:260px"
            :key="(editingId || 'create') + '-' + (modalOpen ? 'open' : 'close')"
          />
        </a-form-item>
        <a-form-item label="接收部门">
          <a-select v-model:value="form.department_ids" mode="multiple" allowClear placeholder="选择部门（留空为全部）" style="width:100%">
            <a-select-option v-for="d in deptOptions" :key="d.value" :value="d.value">{{ d.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="优先级" required>
          <a-select v-model:value="form.priority" placeholder="请选择">
            <a-select-option value="low">低</a-select-option>
            <a-select-option value="normal">普通</a-select-option>
            <a-select-option value="high">高</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="定时发送">
          <a-switch v-model:checked="scheduleEnabled" checked-children="开启" un-checked-children="关闭" />
        </a-form-item>
        <a-config-provider :locale="zhCN">
          <a-form-item label="开始时间" v-if="scheduleEnabled">
            <a-date-picker v-model:value="start" show-time placeholder="选择开始时间" />
          </a-form-item>
        </a-config-provider>
      </a-form>
      <div style="display:flex; justify-content:flex-end; gap:8px; padding-top:8px">
        <a-button @click="modalOpen=false">取消</a-button>
        <a-button type="default" :loading="saving" @click="handleSaveDraft">保存草稿</a-button>
        <a-button type="primary" :loading="saving" @click="handlePublish">发送通知</a-button>
      </div>
    </a-modal>

    <a-modal v-model:open="sendConfirmOpen" title="发送消息" :confirmLoading="sending" :footer="null" width="780px">
      <div class="send-panel">
        <div class="send-summary">
          <div class="send-title">{{ currentSendRecord?.title || '-' }}</div>
          <div class="send-meta-line">
            <a-tag :color="priorityColor(currentSendRecord?.priority)">优先级：{{ priorityLabel(currentSendRecord?.priority) }}</a-tag>
            <a-tag v-if="Array.isArray(currentSendRecord?.department_ids) && currentSendRecord.department_ids.length">收件部门：{{ currentSendRecord.department_ids.length }} 个</a-tag>
            <a-tag v-else color="blue">收件部门：全部</a-tag>
          </div>
        </div>
        <div class="send-section">
          <div class="send-header">
            <span>内容预览</span>
          </div>
          <div class="send-content" v-html="currentSendRecord?.content || ''"></div>
        </div>
        
        <a-alert type="warning" show-icon class="send-warning" :message="'发送后将通知所有选定的部门且无法删除，是否确认发送？'" />
        <div class="send-actions">
          <a-button @click="sendConfirmOpen=false">取消</a-button>
          <a-button type="primary" :loading="sending" @click="confirmSend">确认发送</a-button>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="recordsOpen" title="发送记录" :footer="null" width="780px">
      <div class="records-toolbar">
        <div class="records-toolbar-left">
          <a-space wrap>
            <a-input-search v-model:value="recordsKeyword" placeholder="按标题/内容搜索" allowClear style="width:240px" @search="loadMessageRecords" />
            <a-select v-model:value="recordsMessageType" style="width:140px" allowClear placeholder="类型">
              <a-select-option value="system">系统通知</a-select-option>
              <a-select-option value="user">用户消息</a-select-option>
              <a-select-option value="business">业务提醒</a-select-option>
              <a-select-option value="alert">告警信息</a-select-option>
            </a-select>
            <a-select v-model:value="recordsStatus" style="width:140px" allowClear placeholder="发送状态">
              <a-select-option v-for="i in dictMessageStatus" :key="i.value" :value="i.value">{{ i.label }}</a-select-option>
            </a-select>
            <a-select v-model:value="recordsReadStatus" style="width:140px" allowClear placeholder="已读状态">
              <a-select-option value="unread">未读</a-select-option>
              <a-select-option value="read">已读</a-select-option>
            </a-select>
            <a-select
              v-model:value="recordsReceiverId"
              style="width:180px"
              allowClear
              placeholder="接收人"
              showSearch
              :filterOption="(input, option) => (option?.label || '').toLowerCase().includes((input || '').toLowerCase())"
              :options="recordsReceiverOptions"
            />
            <a-button size="small" @click="loadMessageRecords">刷新</a-button>
          </a-space>
        </div>
        <div class="records-toolbar-right">
          <a-popconfirm title="确认撤回选中的消息记录？" @confirm="handleBatchRecall" :disabled="!recordsSelectedRowKeys.length">
            <a-button danger :disabled="!recordsSelectedRowKeys.length">批量撤回</a-button>
          </a-popconfirm>
        </div>
      </div>
      <a-table :dataSource="recordsList" :loading="recordsLoading" rowKey="id" :pagination="recordsPagination" @change="onRecordsTableChange" :rowSelection="recordsRowSelection">
        <a-table-column title="标题" key="title" :customRender="({record}) => (record.title || '-')" />
        <a-table-column title="发送者" key="sender" :customRender="({record}) => (record.sender_name || ('用户#'+record.sender_id))" />
        <a-table-column title="接收者" key="receiver" :customRender="({record}) => (record.receiver_name || ('用户#'+record.receiver_id))" />
        <a-table-column title="发送时间" key="sent_at" :customRender="({record}) => formatDate(record.sent_at)" />
        <a-table-column title="发送状态" key="message_status" :customRender="({record}) => messageStatusLabel(record.status)" />
        <a-table-column title="已读状态" key="read_status" :customRender="({record}) => (record.read_status === 'read' ? '已读' : '未读')" />
      </a-table>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { BellOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { getNotifications, createNotification, updateNotification, deleteNotification, batchDeleteNotifications } from '@/api/system/notification'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { getDictItems } from '@/api/system/dict'
import { getDepartmentTree } from '@/api/system/department'
import { sendMessages, listMessageRecords, batchRecallMessages } from '@/api/system/message'
import { getUsers } from '@/api/system/user'

const loading = ref(false)
const list = ref([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const keyword = ref('')
const status = ref()
const priority = ref()
const filterDept = ref()
const validOnly = ref(false)
const selectedRowKeys = ref([])

const modalOpen = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const form = reactive({ title: '', content: '', priority: 'normal', status: 'draft', department_ids: [] })
const start = ref()
const end = ref()
const scheduleEnabled = ref(false)

const formatDate = (d) => {
  if (!d) return '-'
  try { return new Date(d).toLocaleString() } catch { return String(d) }
}

const dictPriority = ref([])
const dictStatus = ref([])
const dictMessageStatus = ref([])
const deptOptions = ref([])
const loadDicts = async () => {
  try {
    const p = await getDictItems({ typeCode: 'notification_priority', pageSize: 100 })
    const s = await getDictItems({ typeCode: 'notification_status', pageSize: 100 })
    const ms = await getDictItems({ typeCode: 'message_status', pageSize: 100 })
    dictPriority.value = (p.list || []).filter(i => i.status === 'active').map(i => ({ value: i.value, label: i.label }))
    dictStatus.value = (s.list || []).filter(i => i.status === 'active').map(i => ({ value: i.value, label: i.label }))
    dictMessageStatus.value = (ms.list || []).filter(i => i.status === 'active').map(i => ({ value: i.value, label: i.label }))
  } catch {}
}
const loadDeptOptions = async () => {
  try {
    const tree = await getDepartmentTree({ status: 'active' })
    const arr = []
    const walk = (nodes) => { (nodes || []).forEach(n => { arr.push({ value: n.id, label: n.name }); if (Array.isArray(n.children) && n.children.length) walk(n.children) }) }
    walk(Array.isArray(tree) ? tree : [])
    deptOptions.value = arr
  } catch { deptOptions.value = [] }
}
onMounted(() => { loadDicts(); loadDeptOptions(); })
dayjs.locale('zh-cn')
const deptLabel = (id) => {
  const item = (deptOptions.value || []).find(d => Number(d.value) === Number(id))
  return item ? item.label : `部门#${id}`
}
const priorityLabel = (v) => {
  try {
    const arr = Array.isArray(dictPriority.value) ? dictPriority.value : []
    const found = arr.find(i => i.value === v)
    return (found && found.label) || v
  } catch { return v }
}
const statusLabel = (v) => {
  try {
    const arr = Array.isArray(dictStatus.value) ? dictStatus.value : []
    const found = arr.find(i => i.value === v)
    return (found && found.label) || v
  } catch { return v }
}

const messageStatusLabel = (v) => {
  try {
    const arr = Array.isArray(dictMessageStatus.value) ? dictMessageStatus.value : []
    const found = arr.find(i => i.value === v)
    return (found && found.label) || (v === 'sent' ? '已发送' : v === 'recalled' ? '已撤回' : v)
  } catch { return v }
}

const priorityColor = (v) => {
  if (v === 'high') return 'red'
  if (v === 'normal') return 'blue'
  return 'green'
}

const hoverPriorityId = ref(null)
const editPriorityId = ref(null)
const editPriorityValue = ref('')
const startPriorityEdit = (record) => { editPriorityId.value = record.id; editPriorityValue.value = record.priority }
const cancelPriorityEdit = () => { editPriorityId.value = null; editPriorityValue.value = '' }
const savePriority = async (record) => {
  try {
    await updateNotification(record.id, { priority: editPriorityValue.value })
    record.priority = editPriorityValue.value
    cancelPriorityEdit()
    message.success('优先级已更新')
  } catch (e) { message.error('更新优先级失败') }
}

const buildPayload = () => ({
  title: form.title,
  content: form.content,
  priority: form.priority,
  start_time: scheduleEnabled.value ? (start.value ? start.value.toDate() : null) : null,
  end_time: null,
  department_ids: Array.isArray(form.department_ids) ? form.department_ids : []
})

const handleSaveDraft = async () => {
  if (!form.title || !form.content) return message.warning('请填写标题与内容')
  saving.value = true
  try {
    const data = { ...buildPayload(), status: 'draft' }
    if (isEdit.value && editingId.value) await updateNotification(editingId.value, data)
    else await createNotification(data)
    message.success('草稿已保存')
    modalOpen.value = false
    await load()
  } catch (e) { message.error(e?.response?.data?.error || '保存草稿失败') } finally { saving.value = false }
}

const handlePublish = async () => {
  if (!form.title || !form.content) return message.warning('请填写标题与内容')
  saving.value = true
  try {
    const data = { ...buildPayload(), status: 'published' }
    if (scheduleEnabled.value && !data.start_time) {
      saving.value = false
      return message.warning('请选择开始时间')
    }
    if (isEdit.value && editingId.value) await updateNotification(editingId.value, data)
    else await createNotification(data)
    message.success('通知已发送')
    modalOpen.value = false
    await load()
  } catch (e) { message.error(e?.response?.data?.error || '发送通知失败') } finally { saving.value = false }
}

const load = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: keyword.value || undefined,
      status: status.value || undefined,
      priority: priority.value || undefined,
      department_id: filterDept.value || undefined,
      valid: validOnly.value ? 'true' : undefined
    }
    const r = await getNotifications(params)
    list.value = Array.isArray(r.list) ? r.list : []
    pagination.total = Number(r.total || 0)
  } catch (e) {
    message.error(e?.response?.data?.error || '加载失败')
  } finally { loading.value = false }
}

const onTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  load()
}

const rowSelection = {
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => { selectedRowKeys.value = keys }
}

const openCreate = () => {
  isEdit.value = false
  editingId.value = null
  form.title = ''
  form.content = ''
  form.priority = 'normal'
  form.status = 'draft'
  start.value = undefined
  end.value = undefined
  scheduleEnabled.value = false
  modalOpen.value = true
}

const openEdit = (record) => {
  isEdit.value = true
  editingId.value = record.id
  form.title = record.title
  form.content = record.content
  form.priority = record.priority
  form.status = record.status
  form.department_ids = Array.isArray(record.department_ids) ? record.department_ids : []
  start.value = record.start_time ? dayjs(record.start_time) : undefined
  end.value = record.end_time ? dayjs(record.end_time) : undefined
  scheduleEnabled.value = !!record.start_time
  modalOpen.value = true
}

const handleSubmit = async () => {
  if (!form.title || !form.content) return message.warning('请填写标题与内容')
  saving.value = true
  try {
    const payload = {
      title: form.title,
      content: form.content,
      priority: form.priority,
      status: form.status,
      start_time: start.value ? start.value.toDate() : null,
      end_time: end.value ? end.value.toDate() : null,
      department_ids: Array.isArray(form.department_ids) ? form.department_ids : []
    }
    if (isEdit.value && editingId.value) {
      await updateNotification(editingId.value, payload)
      message.success('更新成功')
    } else {
      await createNotification(payload)
      message.success('创建成功')
    }
    modalOpen.value = false
    await load()
  } catch (e) {
    message.error(e?.response?.data?.error || '保存失败')
  } finally { saving.value = false }
}

const handleDelete = async (record) => {
  try {
    await deleteNotification(record.id)
    message.success('删除成功')
    await load()
  } catch (e) { message.error(e?.response?.data?.error || '删除失败') }
}

const handleBatchDelete = async () => {
  try {
    if (!selectedRowKeys.value.length) return
    await batchDeleteNotifications(selectedRowKeys.value)
    message.success('批量删除成功')
    selectedRowKeys.value = []
    await load()
  } catch (e) { message.error(e?.response?.data?.error || '批量删除失败') }
}

const router = useRouter()
const sendConfirmOpen = ref(false)
const sending = ref(false)
const currentSendRecord = ref(null)
const openSendConfirm = (record) => { currentSendRecord.value = record; sendConfirmOpen.value = true }
const recordsOpen = ref(false)
const recordsLoading = ref(false)
const recordsList = ref([])
const recordsPagination = reactive({ current: 1, pageSize: 10, total: 0 })
const recordsMessageType = ref('system')
const recordsStatus = ref()
const recordsReadStatus = ref()
const recordsKeyword = ref('')
const recordsNotificationId = ref()
const recordsSelectedRowKeys = ref([])
const recordsReceiverId = ref()
const recordsReceiverOptions = ref([])
const recordsRowSelection = computed(() => ({
  selectedRowKeys: recordsSelectedRowKeys.value,
  onChange: (keys) => { recordsSelectedRowKeys.value = keys }
}))
const openMessageRecords = (record) => {
  recordsOpen.value = true
  recordsNotificationId.value = record?.id
  recordsKeyword.value = ''
  recordsPagination.current = 1
  recordsStatus.value = undefined
  recordsReadStatus.value = undefined
  recordsReceiverId.value = undefined
  recordsReceiverOptions.value = []
  recordsSelectedRowKeys.value = []
  loadAllReceivers().then(() => loadMessageRecords())
}
const loadAllReceivers = async () => {
  try {
    const pageSize = 200
    let page = 1
    let total = 0
    const acc = []
    while (true) {
      const res = await getUsers({ page, pageSize })
      const list = Array.isArray(res?.list) ? res.list : []
      total = Number(res?.total || list.length)
      acc.push(...list)
      if (acc.length >= total || list.length < pageSize) break
      page += 1
      if (page > 50) break
    }
    const seen = new Set()
    const opts = []
    for (const u of acc) {
      const id = u.id
      if (seen.has(id)) continue
      seen.add(id)
      opts.push({ value: id, label: u.real_name || u.username || ('用户#' + id) })
    }
    recordsReceiverOptions.value = opts
  } catch { recordsReceiverOptions.value = [] }
}
const loadMessageRecords = async () => {
  recordsLoading.value = true
  try {
      const r = await listMessageRecords({
        page: recordsPagination.current,
        pageSize: recordsPagination.pageSize,
        message_type: recordsMessageType.value || undefined,
        status: recordsStatus.value || undefined,
        read_status: recordsReadStatus.value || undefined,
        receiver_id: recordsReceiverId.value || undefined,
        keyword: recordsKeyword.value || undefined,
        notification_id: recordsNotificationId.value || undefined
      })
    recordsList.value = Array.isArray(r.list) ? r.list : []
    recordsPagination.total = Number(r.total || 0)
  } finally { recordsLoading.value = false }
}
const onRecordsTableChange = (pag) => { recordsPagination.current = pag.current; recordsPagination.pageSize = pag.pageSize; loadMessageRecords() }

const handleBatchRecall = async () => {
  if (!recordsSelectedRowKeys.value.length) return
  try {
    await batchRecallMessages(recordsSelectedRowKeys.value)
    message.success('批量撤回成功')
    recordsSelectedRowKeys.value = []
    await loadMessageRecords()
  } catch (e) { message.error(e?.response?.data?.error || '批量撤回失败') }
}
const confirmSend = async () => {
  if (!currentSendRecord.value) return
  sending.value = true
  try {
    await sendMessages({ notification_id: currentSendRecord.value.id, title: currentSendRecord.value.title })
    message.success('消息已发送')
    sendConfirmOpen.value = false
    try { await load() } catch {}
  } catch (e) { message.error(e?.response?.data?.error || '发送失败') } finally { sending.value = false }
}

const scheduleText = computed(() => {
  try {
    const s = currentSendRecord.value?.start_time
    return s ? dayjs(s).format('YYYY-MM-DD HH:mm') : '立即发送'
  } catch { return '立即发送' }
})

load()
</script>

<style scoped>
.page-wrap { display: flex; flex-direction: column; gap: 10px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.send-title { font-weight: 700; font-size: 20px; color: #1f1f1f; line-height: 1.5; }
.send-panel { display: flex; flex-direction: column; gap: 12px; }
.send-summary { display:flex; flex-direction: column; gap: 6px; padding: 14px; background: linear-gradient(90deg, #f7fbff, #ffffff); border: 1px solid #eef3f7; border-radius: 10px; box-shadow: 0 6px 16px rgba(26,35,50,0.06); }
.send-meta-line { display:flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.send-section { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; }
.send-header { display: flex; align-items: center; gap: 8px; color: #607080; font-weight: 600; }
.send-icon { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; background:#eaf2ff; color:#1677ff; }
.send-content { border: 1px solid #f0f0f0; background: #fff; border-radius: 8px; padding: 12px; max-height: 280px; overflow: auto; }
.send-meta-tags :deep(.ant-tag) { border-radius: 999px; }
.send-warning { margin-top: 2px; }
.send-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }
.records-toolbar { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.records-toolbar-left { flex: 1 1 auto; min-width: 0; }
.records-toolbar-right { display: flex; align-items: center; }
</style>
