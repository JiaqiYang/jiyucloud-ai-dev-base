<template>
  <div style="padding:24px">
    <a-card title="菜单管理">
      <div style="margin-bottom:12px; display:flex; gap:8px">
        <a-button type="primary" @click="openCreateRoot">新增顶级目录</a-button>
        <a-button @click="reload">刷新</a-button>
      </div>
      <a-table :columns="columns" :data-source="tree" :loading="loading" rowKey="id" :pagination="false" :customRow="customRow">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key==='type'">
            {{ typeLabel(record.type) }}
          </template>
          <template v-else-if="column.key==='status'">
            <a-tag :color="statusColor(record.status)">{{ statusLabelMap[record.status] || record.status }}</a-tag>
          </template>
          <template v-else-if="column.key==='actions'">
            <a-space>
              <a-button type="link" @click="openCreateChild(record)">新增子级</a-button>
              <a-button type="link" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm title="确定删除该菜单？" @confirm="() => remove(record.id)">
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="modal.open" :title="modalTitle" @ok="submit" :confirmLoading="modal.loading" okText="确定" cancelText="取消" :maskClosable="false" :width="720">
      <a-form :model="form" :rules="rules" ref="formRef" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="父级" name="parent_id">
          <a-input v-model:value="parentTitle" disabled />
        </a-form-item>
        <a-form-item label="类型" name="type" required>
          <a-select v-model:value="form.type" style="width: 160px">
            <a-select-option value="dir">目录</a-select-option>
            <a-select-option value="menu">菜单</a-select-option>
            <a-select-option value="button">按钮</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Key" name="key" required>
          <a-input v-model:value="form.key" :disabled="!!form.id" placeholder="唯一键" />
        </a-form-item>
        <a-form-item label="标题" name="title" required>
          <a-input v-model:value="form.title" placeholder="显示名称" />
        </a-form-item>
        <a-form-item label="路径" name="path" v-if="form.type==='menu'">
          <a-input v-model:value="form.path" placeholder="路由路径" />
        </a-form-item>
        <a-form-item label="图标" name="icon" v-if="form.type!=='button'">
          <a-select v-model:value="form.icon" show-search :filterOption="filterIcon" style="width: 320px" placeholder="选择图标">
            <a-select-option v-for="name in iconNames" :key="name" :value="name">
              <a-space>
                <component :is="name" />
                <span>{{ name }}</span>
              </a-space>
            </a-select-option>
          </a-select>
          <div v-if="form.icon" style="margin-top:8px">
            <a-tag>预览</a-tag>
            <component :is="form.icon" :style="{ fontSize: '18px' }" />
          </div>
        </a-form-item>
        <a-form-item label="按钮编码" name="permission_code" v-if="form.type==='button'">
          <a-input v-model:value="form.permission_code" placeholder="按钮权限编码" />
        </a-form-item>
        <a-form-item label="排序" name="order_no">
          <a-input-number v-model:value="form.order_no" :min="0" :step="1" />
        </a-form-item>
        <a-form-item label="状态" name="status">
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
import * as AntIcons from '@ant-design/icons-vue'
import { getMenuTree, createMenu, updateMenu, deleteMenu } from '@/api/system/menu'
import { getDictTypes, getDictItems, createDictType, createDictItem } from '@/api/system/dict'

const loading = ref(false)
const tree = ref([])
const modal = reactive({ open: false, loading: false })
const form = reactive({ id: null, parent_id: null, type: 'menu', key: '', title: '', path: '', icon: '', permission_code: '', order_no: 0, status: 'active' })
const parentTitle = ref('顶级')
const formRef = ref()
const keysSet = computed(() => {
  const s = new Set()
  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (n.key) s.add(n.key)
      if (Array.isArray(n.children) && n.children.length > 0) walk(n.children)
    }
  }
  walk(tree.value)
  return s
})
const rules = computed(() => ({
  key: [
    { required: true, message: '请输入唯一 Key' },
    { pattern: /^[A-Za-z0-9_\-]+$/, message: '仅支持字母/数字/下划线/中划线' },
    { validator: (_rule, value) => {
        if (form.id) return Promise.resolve()
        const v = (value || '').trim()
        if (!v) return Promise.reject('请输入唯一 Key')
        if (keysSet.value.has(v)) return Promise.reject('Key 已存在')
        return Promise.resolve()
      } 
    }
  ],
  title: [{ required: true, message: '请输入标题' }],
  type: [{ required: true, message: '请选择类型' }],
  path: [
    { validator: (_rule, value) => {
        if (form.type !== 'menu') return Promise.resolve()
        const v = (value || '').trim()
        if (!v) return Promise.reject('请输入路径')
        if (!v.startsWith('/')) return Promise.reject('路径需以 / 开头')
        return Promise.resolve()
      } 
    }
  ],
  permission_code: [
    { validator: (_rule, value) => {
        if (form.type !== 'button') return Promise.resolve()
        const v = (value || '').trim()
        if (!v) return Promise.reject('请输入按钮编码')
        return Promise.resolve()
      } 
    }
  ],
  order_no: [{ type: 'number', message: '请输入数字排序' }],
  status: [{ required: true, message: '请选择状态' }]
}))

const columns = [
  { title: '排序', dataIndex: 'order_no', key: 'order_no', width: 80 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: 'Key', dataIndex: 'key', key: 'key', width: 200 },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '路径', dataIndex: 'path', key: 'path' },
  { title: '图标', dataIndex: 'icon', key: 'icon', width: 200 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'actions', width: 220 }
]

const typeLabel = (t) => ({ dir: '目录', menu: '菜单', button: '按钮' }[t] || t)

const dictStatus = ref([])
const statusLabelMap = computed(() => {
  const m = {}
  for (const i of dictStatus.value || []) m[i.value] = i.label
  return m
})
const statusColor = (s) => (s === 'active' ? 'green' : (s === 'inactive' ? 'red' : 'blue'))

const iconNames = computed(() => Object.keys(AntIcons).filter(n => n.endsWith('Outlined')))
const filterIcon = (input, option) => {
  const v = option?.value || ''
  return String(v).toLowerCase().includes(String(input).toLowerCase())
}

const reload = async () => {
  loading.value = true
  try {
    const res = await getMenuTree()
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
  form.type = 'dir'
  form.key = ''
  form.title = ''
  form.path = ''
  form.icon = ''
  form.permission_code = ''
  form.order_no = 0
  form.status = 'active'
  parentTitle.value = '顶级'
}

const openCreateChild = (record) => {
  modal.open = true
  form.id = null
  form.parent_id = record.id
  form.type = 'menu'
  form.key = ''
  form.title = ''
  form.path = ''
  form.icon = ''
  form.permission_code = ''
  form.order_no = 0
  form.status = 'active'
  parentTitle.value = record.title || '父级'
}

const openEdit = (record) => {
  modal.open = true
  form.id = record.id
  form.parent_id = record.parent_id || null
  form.type = record.type || 'menu'
  form.key = record.key || ''
  form.title = record.title || ''
  form.path = record.path || ''
  form.icon = record.icon || ''
  form.permission_code = record.permission_code || ''
  form.order_no = record.order_no || 0
  form.status = record.status || 'active'
  parentTitle.value = record.parent?.title || '顶级'
}

const modalTitle = computed(() => (form.id ? '编辑菜单' : (form.parent_id ? '新增子级' : '新增顶级目录')))

const submit = async () => {
  modal.loading = true
  try {
    await formRef.value?.validate()
    if (form.id) {
      await updateMenu(form.id, { title: form.title, path: form.path, icon: form.icon, parent_id: form.parent_id, type: form.type, permission_code: form.permission_code, order_no: form.order_no, status: form.status })
      message.success('更新成功')
    } else {
      await createMenu({ key: form.key, title: form.title, path: form.path, icon: form.icon, parent_id: form.parent_id, type: form.type, permission_code: form.permission_code, order_no: form.order_no, status: form.status })
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
    await deleteMenu(id)
    message.success('删除成功')
    await reload()
  } catch (e) {
    const err = e?.response?.data?.error || e?.response?.data?.message || '删除失败'
    message.error(err)
  }
}

onMounted(() => { initDicts(); reload() })

const loadDicts = async () => {
  try {
    const statusRes = await getDictItems({ typeCode: 'menu_status', page: 1, pageSize: 100 })
    dictStatus.value = Array.isArray(statusRes?.list) ? statusRes.list : []
  } catch {
    dictStatus.value = []
  }
}

const ensureMenuDicts = async () => {
  try {
    const needTypes = [
      { code: 'menu_type', name: '菜单类型' },
      { code: 'menu_status', name: '菜单状态' }
    ]
    // Ensure types exist
    for (const t of needTypes) {
      const res = await getDictTypes({ page: 1, pageSize: 1, keyword: t.code })
      const exists = Array.isArray(res?.list) ? res.list.some(x => x.code === t.code) : false
      if (!exists) {
        await createDictType({ code: t.code, name: t.name, status: 'active', description: '' })
      }
    }
    // Ensure items exist
    const typeItems = await getDictItems({ typeCode: 'menu_type', page: 1, pageSize: 100 })
    const statusItems = await getDictItems({ typeCode: 'menu_status', page: 1, pageSize: 100 })
    const typeSet = new Set((typeItems?.list || []).map(i => i.value))
    const statusSet = new Set((statusItems?.list || []).map(i => i.value))
    const needTypeItems = [
      { key: 'dir', value: 'dir', label: '目录' },
      { key: 'menu', value: 'menu', label: '菜单' },
      { key: 'button', value: 'button', label: '按钮' }
    ]
    const needStatusItems = [
      { key: 'active', value: 'active', label: '启用' },
      { key: 'inactive', value: 'inactive', label: '禁用' }
    ]
    for (const i of needTypeItems) {
      if (!typeSet.has(i.value)) {
        await createDictItem({ type_code: 'menu_type', key: i.key, value: i.value, label: i.label, status: 'active', order_no: 0 })
      }
    }
    for (const i of needStatusItems) {
      if (!statusSet.has(i.value)) {
        await createDictItem({ type_code: 'menu_status', key: i.key, value: i.value, label: i.label, status: 'active', order_no: 0 })
      }
    }
  } catch (e) {
    // silent
  }
}

const initDicts = async () => {
  try { await ensureMenuDicts() } catch {}
  await loadDicts()
}

// 拖拽排序与层级调整
const draggingId = ref(null)
const customRow = (record) => ({
  draggable: record.type !== 'button',
  onDragstart: (e) => { draggingId.value = record.id; e.dataTransfer.effectAllowed = 'move' },
  onDragover: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' },
  onDrop: (e) => handleDrop(e, record)
})

const findNode = (nodes, id) => {
  for (const n of nodes || []) {
    if (n.id === id) return n
    const f = findNode(n.children || [], id)
    if (f) return f
  }
  return null
}
const isDescendant = (ancestorId, targetId) => {
  const anc = findNode(tree.value, ancestorId)
  if (!anc) return false
  const f = findNode(anc.children || [], targetId)
  return !!f
}
const getChildrenArray = (parentId) => {
  if (!parentId) return tree.value
  const p = findNode(tree.value, parentId)
  return p ? (p.children || []) : []
}
const handleDrop = async (e, target) => {
  const dragId = draggingId.value
  draggingId.value = null
  if (!dragId || dragId === target.id) return
  const dragNode = findNode(tree.value, dragId)
  if (!dragNode) return
  const asChild = e.shiftKey
  if (asChild && target.type === 'button') { message.warning('不能将子级放到按钮下'); return }
  if (asChild && isDescendant(dragId, target.id)) { message.warning('不能移动到自身子树下'); return }
  const newParentId = asChild ? target.id : (target.parent_id || null)
  const siblings = getChildrenArray(newParentId)
  const filtered = siblings.filter(s => s.id !== dragId)
  const targetIndex = filtered.findIndex(s => s.id === target.id)
  const insertIndex = Math.max(0, targetIndex + (asChild ? 0 : 1))
  filtered.splice(insertIndex, 0, dragNode)
  try {
    // 先更新父级
    await updateMenu(dragId, { parent_id: newParentId })
    // 依次重排 order_no
    const updates = []
    filtered.forEach((item, idx) => {
      const nextOrder = idx + 1
      if (item.order_no !== nextOrder || item.id === dragId) {
        updates.push(updateMenu(item.id, { order_no: nextOrder }))
      }
    })
    await Promise.all(updates)
    message.success('已更新排序/层级')
    await reload()
  } catch (err) {
    const msg = err?.response?.data?.error || err?.response?.data?.message || '更新失败'
    message.error(msg)
  }
}
</script>

<style scoped>
.actions { display: flex; gap: 8px }
</style>
