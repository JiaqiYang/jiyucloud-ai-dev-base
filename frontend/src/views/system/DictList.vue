<template>
  <a-config-provider :locale="zhCN">
    <div class="dict-container">
      <a-card title="字典管理" :bordered="false">
        <div class="dict-actions">
          <a-space>
            <a-input v-model:value="typeSearch" placeholder="搜索字典类型" style="width: 220px" allowClear />
            <a-button type="primary" @click="openTypeModal()">新增字典类型</a-button>
          </a-space>
        </div>
        <div class="dict-grid">
          <div class="dict-types">
            <a-table
              :dataSource="dictTypes"
              :columns="typeColumns"
              :loading="typeLoading"
              :pagination="typePagination"
              @change="onTypeTableChange"
              :row-key="record => record.id"
              :customRow="typeCustomRow"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="record.status === 'active' ? 'green' : 'red'">{{ record.status === 'active' ? '启用' : '禁用' }}</a-tag>
                </template>
                <template v-if="column.key === 'actions'">
                  <a-space>
                    <a-button type="link" size="small" @click="openTypeModal(record)">编辑</a-button>
                    <a-popconfirm title="确定删除该字典类型？" @confirm="deleteType(record.id)">
                      <a-button type="link" size="small" danger>删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
          <div class="dict-items">
            <div class="dict-items-header">
              <a-space>
                <a-input v-model:value="itemSearch" placeholder="搜索字典项" style="width: 220px" allowClear />
                <a-button type="primary" :disabled="!selectedType" @click="openItemModal()">新增字典项</a-button>
              </a-space>
              <div class="selected-type">当前类型：{{ selectedType ? selectedType.name : '未选择' }}</div>
            </div>
            <a-table
              :dataSource="dictItems"
              :columns="itemColumns"
              :loading="itemLoading"
              :pagination="itemPagination"
              @change="onItemTableChange"
              :row-key="record => record.id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="record.status === 'active' ? 'green' : 'red'">{{ record.status === 'active' ? '启用' : '禁用' }}</a-tag>
                </template>
                <template v-if="column.key === 'actions'">
                  <a-space>
                    <a-button type="link" size="small" @click="openItemModal(record)">编辑</a-button>
                    <a-popconfirm title="确定删除该字典项？" @confirm="deleteItem(record.id)">
                      <a-button type="link" size="small" danger>删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </a-card>

      <a-modal v-model:open="typeModal.open" :title="typeModal.editing ? '编辑字典类型' : '新增字典类型'" @ok="submitType" @cancel="closeTypeModal" okText="确定" cancelText="取消">
        <a-form :model="typeForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
          <a-form-item label="类型编码">
            <a-input v-model:value="typeForm.code" :disabled="typeModal.editing" />
          </a-form-item>
          <a-form-item label="类型名称">
            <a-input v-model:value="typeForm.name" />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="typeForm.status" style="width: 160px">
              <a-select-option value="active">启用</a-select-option>
              <a-select-option value="inactive">禁用</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model:value="typeForm.description" />
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal v-model:open="itemModal.open" :title="itemModal.editing ? '编辑字典项' : '新增字典项'" @ok="submitItem" @cancel="closeItemModal" okText="确定" cancelText="取消">
        <a-form :model="itemForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
          <a-form-item label="所属类型">
            <a-input v-model:value="selectedTypeName" disabled />
          </a-form-item>
          <a-form-item label="键">
            <a-input v-model:value="itemForm.key" :disabled="itemModal.editing" />
          </a-form-item>
          <a-form-item label="值">
            <a-input v-model:value="itemForm.value" />
          </a-form-item>
          <a-form-item label="显示文本">
            <a-input v-model:value="itemForm.label" />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="itemForm.status" style="width: 160px">
              <a-select-option value="active">启用</a-select-option>
              <a-select-option value="inactive">禁用</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="排序">
            <a-input-number v-model:value="itemForm.order_no" :min="0" />
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </a-config-provider>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { getDictTypes, getDictItems, createDictType, updateDictType, deleteDictType, createDictItem, updateDictItem, deleteDictItem } from '@/api/system/dict'

const zhCNLocale = zhCN

const dictTypes = ref([])
const dictItems = ref([])
const selectedType = ref(null)
const typeLoading = ref(false)
const itemLoading = ref(false)
const typeSearch = ref('')
const itemSearch = ref('')

const typePagination = reactive({ current: 1, pageSize: 10, total: 0 })
const itemPagination = reactive({ current: 1, pageSize: 10, total: 0 })

const typeColumns = [
  { title: '类型编码', dataIndex: 'code', key: 'code' },
  { title: '类型名称', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '操作', key: 'actions', width: 160 }
]

const itemColumns = [
  { title: '键', dataIndex: 'key', key: 'key' },
  { title: '值', dataIndex: 'value', key: 'value' },
  { title: '显示文本', dataIndex: 'label', key: 'label' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '排序', dataIndex: 'order_no', key: 'order_no', width: 100 },
  { title: '操作', key: 'actions', width: 160 }
]

const typeModal = reactive({ open: false, editing: false })
const itemModal = reactive({ open: false, editing: false })

const typeForm = reactive({ id: null, code: '', name: '', status: 'active', description: '' })
const itemForm = reactive({ id: null, key: '', value: '', label: '', status: 'active', order_no: 0 })

const selectedTypeName = computed(() => selectedType.value ? selectedType.value.name : '')

const loadTypes = async () => {
  typeLoading.value = true
  try {
    const res = await getDictTypes({ page: typePagination.current, pageSize: typePagination.pageSize, keyword: typeSearch.value })
    dictTypes.value = Array.isArray(res?.list) ? res.list : []
    typePagination.total = Number(res?.total || 0)
  } catch (e) {
    message.error('加载字典类型失败')
  } finally {
    typeLoading.value = false
  }
}

const loadItems = async () => {
  if (!selectedType.value) { dictItems.value = []; itemPagination.total = 0; return }
  itemLoading.value = true
  try {
    const res = await getDictItems({ page: itemPagination.current, pageSize: itemPagination.pageSize, typeCode: selectedType.value.code, keyword: itemSearch.value })
    dictItems.value = Array.isArray(res?.list) ? res.list : []
    itemPagination.total = Number(res?.total || 0)
  } catch (e) {
    message.error('加载字典项失败')
  } finally {
    itemLoading.value = false
  }
}

  const onTypeRowClick = (record) => {
    selectedType.value = record
    itemPagination.current = 1
    loadItems()
  }

  const typeCustomRow = (record) => ({
    onClick: () => onTypeRowClick(record)
  })

const onTypeTableChange = (pag) => {
  typePagination.current = pag.current
  typePagination.pageSize = pag.pageSize
  loadTypes()
}

const onItemTableChange = (pag) => {
  itemPagination.current = pag.current
  itemPagination.pageSize = pag.pageSize
  loadItems()
}

const openTypeModal = (record) => {
  typeModal.open = true
  typeModal.editing = !!record
  typeForm.id = record?.id || null
  typeForm.code = record?.code || ''
  typeForm.name = record?.name || ''
  typeForm.status = record?.status || 'active'
  typeForm.description = record?.description || ''
}

const closeTypeModal = () => { typeModal.open = false }

const submitType = async () => {
  try {
    if (typeModal.editing && typeForm.id) {
      await updateDictType(typeForm.id, { name: typeForm.name, status: typeForm.status, description: typeForm.description })
      message.success('更新成功')
    } else {
      await createDictType({ code: typeForm.code, name: typeForm.name, status: typeForm.status, description: typeForm.description })
      message.success('创建成功')
    }
    typeModal.open = false
    loadTypes()
  } catch (e) {
    message.error('提交失败')
  }
}

const openItemModal = (record) => {
  if (!selectedType.value) { message.warning('请先选择字典类型'); return }
  itemModal.open = true
  itemModal.editing = !!record
  itemForm.id = record?.id || null
  itemForm.key = record?.key || ''
  itemForm.value = record?.value || ''
  itemForm.label = record?.label || ''
  itemForm.status = record?.status || 'active'
  itemForm.order_no = record?.order_no || 0
}

const closeItemModal = () => { itemModal.open = false }

const submitItem = async () => {
  try {
    const payload = { type_code: selectedType.value.code, key: itemForm.key, value: itemForm.value, label: itemForm.label, status: itemForm.status, order_no: itemForm.order_no }
    if (itemModal.editing && itemForm.id) {
      await updateDictItem(itemForm.id, payload)
      message.success('更新成功')
    } else {
      await createDictItem(payload)
      message.success('创建成功')
    }
    itemModal.open = false
    loadItems()
  } catch (e) {
    message.error('提交失败')
  }
}

const deleteType = async (id) => {
  try {
    await deleteDictType(id)
    message.success('删除成功')
    if (selectedType.value && selectedType.value.id === id) { selectedType.value = null; dictItems.value = []; itemPagination.total = 0 }
    loadTypes()
  } catch (e) {
    message.error('删除失败')
  }
}

const deleteItem = async (id) => {
  try {
    await deleteDictItem(id)
    message.success('删除成功')
    loadItems()
  } catch (e) {
    message.error('删除失败')
  }
}

onMounted(() => {
  loadTypes()
})
</script>

<style scoped>
.dict-container { padding: 24px }
.dict-actions { margin-bottom: 16px }
.dict-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 16px }
.dict-items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px }
.selected-type { color: #666 }
</style>
