<template>
  <div>
    <a-card title="角色管理">
      <template #extra>
        <a-button type="primary" @click="showModal()">新增角色</a-button>
      </template>
      <a-table :dataSource="dataSource" :columns="columns" :loading="loading">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ statusLabelMap[record.status] || record.status }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="showModal(record)">编辑</a-button>
              <a-button type="link" @click="showAssignModal(record)">分配权限</a-button>
              <a-popconfirm title="确定要删除吗？" @confirm="handleDelete(record.id)">
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Role Modal -->
    <a-modal v-model:open="visible" :title="modalTitle" @ok="handleOk" :confirmLoading="confirmLoading" okText="确定" cancelText="取消">
      <a-form :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="角色名称" required>
          <a-input v-model:value="formState.role_name" />
        </a-form-item>
        <a-form-item label="角色编码" required>
          <a-input v-model:value="formState.role_code" :disabled="!!formState.id" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="formState.description" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="formState.status" style="width: 200px" placeholder="请选择状态">
            <a-select-option v-for="i in roleStatusDict" :key="i.key || i.value" :value="i.value">{{ i.label }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Assign Modal -->
    <a-modal v-model:open="assignVisible" title="分配菜单" @ok="handleAssignOk" :confirmLoading="assignConfirmLoading" :width="760" okText="确定" cancelText="取消">
      <a-tree
        v-if="menuTreeData.length > 0"
        v-model:checkedKeys="checkedMenuKeys"
        checkable
        :tree-data="menuTreeData"
        :fieldNames="{ title: 'title', key: 'key', children: 'children' }"
        defaultExpandAll
      />
      <div v-else>正在加载菜单...</div>
    </a-modal>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { getRoles, createRole, updateRole, deleteRole } from '@/api/system/role';
import { getMenuTree, getRoleMenus, setRoleMenus } from '@/api/system/menu';
import { getDictTypes, getDictItems, createDictType, createDictItem } from '@/api/system/dict';

const dataSource = ref([]);
const loading = ref(false);

const columns = [
  { title: '角色名称', dataIndex: 'role_name', key: 'role_name' },
  { title: '角色编码', dataIndex: 'role_code', key: 'role_code' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '操作', key: 'action' },
];

// Role Modal
const visible = ref(false);
const confirmLoading = ref(false);
const modalTitle = ref('新增角色');
const formState = reactive({
  id: null,
  role_name: '',
  role_code: '',
  description: '',
  status: 'active',
});
const roleStatusDict = ref([]);
const statusLabelMap = computed(() => {
  const m = {};
  for (const i of roleStatusDict.value || []) m[i.value] = i.label;
  return m;
});
const statusColor = (s) => (s === 'active' ? 'green' : (s === 'inactive' ? 'red' : 'blue'));

// Assign Modal
const assignVisible = ref(false);
const assignConfirmLoading = ref(false);
const activeTab = ref('menu');
const currentRoleId = ref(null);
const currentRoleCode = ref('');
const menuTreeData = ref([]);
const checkedMenuKeys = ref([]);



const loadData = async () => {
  loading.value = true;
  try {
    const res = await getRoles();
    dataSource.value = res;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};



const showModal = (record) => {
  visible.value = true;
  if (record) {
    modalTitle.value = '编辑角色';
    Object.assign(formState, record);
  } else {
    modalTitle.value = '新增角色';
    formState.id = null;
    formState.role_name = '';
    formState.role_code = '';
    formState.description = '';
    formState.status = 'active';
  }
};

const handleOk = async () => {
  confirmLoading.value = true;
  try {
    if (formState.id) {
      await updateRole(formState.id, formState);
      message.success('更新成功');
    } else {
      await createRole(formState);
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
    await deleteRole(id);
    message.success('删除成功');
    loadData();
  } catch (error) {
    console.error(error);
  }
};

const showAssignModal = async (record) => {
  currentRoleId.value = record.id;
  currentRoleCode.value = record.role_code;
  assignVisible.value = true;
  assignConfirmLoading.value = true;
  activeTab.value = 'menu';
  try {
    const [tree, selectedMenus] = await Promise.all([
      getMenuTree(),
      getRoleMenus(record.role_code)
    ]);
    menuTreeData.value = Array.isArray(tree) ? tree : [];
    checkedMenuKeys.value = Array.isArray(selectedMenus?.keys) ? selectedMenus.keys : [];
  } catch (error) {
    console.error(error);
    menuTreeData.value = [];
    checkedMenuKeys.value = [];
  } finally {
    assignConfirmLoading.value = false;
  }
};

const handleAssignOk = async () => {
  assignConfirmLoading.value = true;
  try {
    await setRoleMenus(currentRoleCode.value, checkedMenuKeys.value);
    message.success('分配成功');
    assignVisible.value = false;
  } catch (error) {
    console.error(error);
  } finally {
    assignConfirmLoading.value = false;
  }
};

onMounted(() => {
  initRoleStatusDict();
  loadData();
});

const initRoleStatusDict = async () => {
  try {
    const res = await getDictTypes({ page: 1, pageSize: 1, keyword: 'role_status' });
    const exists = Array.isArray(res?.list) ? res.list.some(x => x.code === 'role_status') : false;
    if (!exists) {
      await createDictType({ code: 'role_status', name: '角色状态', status: 'active', description: '' });
    }
    const itemsRes = await getDictItems({ typeCode: 'role_status', page: 1, pageSize: 100 });
    const set = new Set((itemsRes?.list || []).map(i => i.value));
    const defaults = [
      { key: 'active', value: 'active', label: '启用' },
      { key: 'inactive', value: 'inactive', label: '禁用' },
    ];
    for (const it of defaults) {
      if (!set.has(it.value)) {
        await createDictItem({ type_code: 'role_status', key: it.key, value: it.value, label: it.label, status: 'active', order_no: 0 });
      }
    }
    const latest = await getDictItems({ typeCode: 'role_status', page: 1, pageSize: 100 });
    roleStatusDict.value = Array.isArray(latest?.list) ? latest.list : [];
  } catch (e) {
    roleStatusDict.value = [
      { key: 'active', value: 'active', label: '启用' },
      { key: 'inactive', value: 'inactive', label: '禁用' },
    ];
  }
};
</script>
