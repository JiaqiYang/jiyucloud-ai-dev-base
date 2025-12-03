<template>
  <div>
    <a-card title="权限管理">
      <a-tree
        v-if="treeData.length > 0"
        :tree-data="treeData"
        default-expand-all
        :selectable="false"
        :fieldNames="{ title: 'permission_name', key: 'id', children: 'children' }"
      />
      <div v-else>暂无数据</div>
    </a-card>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { listPermissions } from '@/api/system/permission';

const treeData = ref([]);

const loadData = async () => {
  try {
    const res = await listPermissions();
    const tree = [];
    for (const module in res) {
      tree.push({
        id: module,
        permission_name: module,
        children: res[module]
      });
    }
    treeData.value = tree;
  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  loadData();
});
</script>
