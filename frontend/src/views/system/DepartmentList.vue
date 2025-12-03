<template>
  <div style="padding:24px">
    <a-card title="部门管理">
      <div style="margin-bottom:12px; display:flex; gap:8px">
        <a-button type="primary" @click="openCreateRoot">新增顶级部门</a-button>
        <a-button @click="reload">刷新</a-button>
      </div>
      <a-table :columns="columns" :data-source="tree" :loading="loading" rowKey="id" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key==='status'">
            <a-tag :color="statusColor(record.status)">{{ statusLabelMap[record.status] || record.status }}</a-tag>
          </template>
          <template v-else-if="column.key==='actions'">
            <a-space>
              <a-button type="link" @click="openCreateChild(record)">新增子级</a-button>
              <a-button type="link" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm title="确定删除该部门？" @confirm="() => remove(record.id)">
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="modal.open" :title="modalTitle" @ok="submit" :confirmLoading="modal.loading" okText="确定" cancelText="取消" :maskClosable="false" :width="720">
      <a-form :model="form" ref="formRef" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="父级">
          <a-input v-model:value="parentTitle" disabled />
        </a-form-item>
        <a-form-item label="名称" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item label="编码" required>
          <a-input v-model:value="form.code" :disabled="!!form.id" />
        </a-form-item>
        <a-form-item label="状态" required>
          <a-select v-model:value="form.status" style="width: 160px">
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getDepartmentTree, createDepartment, updateDepartment, deleteDepartment } from '@/api/system/department'

const loading = ref(false)
const tree = ref([])
const modal = reactive({ open: false, loading: false })
const form = reactive({ id: null, parent_id: null, name: '', code: '', status: 'active' })
const parentTitle = ref('顶级')
const formRef = ref()

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code', width: 200 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'actions', width: 220 }
]

const dictStatus = ref([
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '禁用' }
])
const statusLabelMap = computed(() => {
  const m = {}
  for (const i of dictStatus.value || []) m[i.value] = i.label
  return m
})
const statusColor = (s) => (s === 'active' ? 'green' : (s === 'inactive' ? 'red' : 'blue'))

const reload = async () => {
  loading.value = true
  try {
    const res = await getDepartmentTree()
    tree.value = Array.isArray(res) ? res : []
  } catch {
    tree.value = []
  } finally {
    loading.value = false
  }
}

const openCreateRoot = () => {
  modal.open = true
  form.id = null
  form.parent_id = null
  form.name = ''
  form.code = ''
  form.status = 'active'
  parentTitle.value = '顶级'
}
const openCreateChild = (record) => {
  modal.open = true
  form.id = null
  form.parent_id = record.id
  form.name = ''
  form.code = ''
  form.status = 'active'
  parentTitle.value = record.name || '父级'
}
const openEdit = (record) => {
  modal.open = true
  form.id = record.id
  form.parent_id = record.parent_id || null
  form.name = record.name || ''
  form.code = record.code || ''
  form.status = record.status || 'active'
  parentTitle.value = record.parent?.name || '顶级'
}

const modalTitle = computed(() => (form.id ? '编辑部门' : (form.parent_id ? '新增子级' : '新增顶级部门')))

const submit = async () => {
  modal.loading = true
  try {
    if (form.id) {
      await updateDepartment(form.id, { name: form.name, status: form.status, parent_id: form.parent_id })
      message.success('更新成功')
    } else {
      await createDepartment({ name: form.name, code: form.code, status: form.status, parent_id: form.parent_id })
      message.success('创建成功')
    }
    modal.open = false
    await reload()
  } catch (e) {
    const err = e?.response?.data?.error || e?.response?.data?.message || '提交失败'
    message.error(err)
  } finally {
    modal.loading = false
  }
}

const remove = async (id) => {
  try {
    await deleteDepartment(id)
    message.success('删除成功')
    await reload()
  } catch (e) {
    const err = e?.response?.data?.error || e?.response?.data?.message || '删除失败'
    message.error(err)
  }
}

onMounted(() => { reload() })
</script>

<style scoped>
.actions { display: flex; gap: 8px }
</style>
