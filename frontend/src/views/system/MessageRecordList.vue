<template>
  <div class="page-wrap">
    <div class="toolbar">
      <a-space>
        <a-input-search v-model:value="keyword" placeholder="搜索内容/接收者" allowClear @search="load" style="width:280px" />
        <a-select v-model:value="messageType" placeholder="消息类型" allowClear style="width:160px">
          <a-select-option v-for="i in dictMessageTypes" :key="i.value" :value="i.value">{{ i.label }}</a-select-option>
        </a-select>
      </a-space>
    </div>
    <a-table :dataSource="list" :loading="loading" rowKey="id" :pagination="pagination" @change="onTableChange">
      <a-table-column title="标题" key="title" :customRender="({record}) => (record.title || '-')" />
      <a-table-column title="发送者" key="sender" :customRender="({record}) => (record.sender_name || ('用户#'+record.sender_id))" />
      <a-table-column title="接收者" key="receiver" :customRender="({record}) => (record.receiver_name || ('用户#'+record.receiver_id))" />
      <a-table-column title="内容" key="content" :customRender="({record}) => renderContent(record.content)" />
      <a-table-column title="发送时间" key="sent_at" :customRender="({record}) => formatDate(record.sent_at)" />
      <a-table-column title="状态" key="status" :customRender="({record}) => (record.read_status === 'read' ? '已读' : '未读')" />
    </a-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { listMessageRecords } from '@/api/system/message'
import { getDictItems } from '@/api/system/dict'

const keyword = ref('')
const messageType = ref()
const dictMessageTypes = ref([])
const list = ref([])
const loading = ref(false)
const pagination = ref({ current: 1, pageSize: 10, total: 0 })

const formatDate = (d) => { try { return new Date(d).toLocaleString() } catch { return String(d || '-') } }
const renderContent = (html) => {
  const div = document.createElement('div');
  div.innerHTML = String(html || '').replace(/<[^>]+>/g, '').slice(0, 120);
  return div.textContent || div.innerText || '';
}

const load = async () => {
  loading.value = true
  try {
    const res = await listMessageRecords({ page: pagination.value.current, pageSize: pagination.value.pageSize, keyword: keyword.value, message_type: messageType.value || undefined })
    list.value = Array.isArray(res?.list) ? res.list : []
    pagination.value.total = Number(res?.total || 0)
  } finally { loading.value = false }
}

const onTableChange = (pag) => { pagination.value.current = pag.current; pagination.value.pageSize = pag.pageSize; load() }

const loadDicts = async () => {
  try {
    const res = await getDictItems({ typeCode: 'message_type', pageSize: 100 })
    dictMessageTypes.value = (res.list || []).filter(i => i.status === 'active').map(i => ({ value: i.value, label: i.label }))
  } catch { dictMessageTypes.value = [] }
}

loadDicts()
load()
</script>

<style scoped>
.page-wrap { padding: 12px }
.toolbar { display:flex; justify-content: space-between; align-items:center; margin-bottom: 12px }
</style>
