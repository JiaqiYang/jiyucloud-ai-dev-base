// 路由：仅保留根布局与登录页；
// 在注册路由前调用公开菜单接口，拿到所有路由并一次性注册为 root 子路由。
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getMenuDefinitions } from '@/api/system/menu'
import BasicLayout from '@/layouts/BasicLayout.vue'
import Login from '@/views/auth/Login.vue'

// 视图组件映射：按名称动态引入（如 '/src/views/system/UserList.vue'）
const viewModules = import.meta.glob('/src/views/**/*.vue')
const defsCache = await getMenuDefinitions().catch(() => [])
const childRoutes = []
for (const item of (Array.isArray(defsCache) ? defsCache : [])) {
  if (!item || !item.component || !item.path || !item.key) continue
  const compPath = `/src/views/${item.component}.vue`
  const loader = viewModules[compPath]
  if (!loader) continue
  const childPath = item.path.startsWith('/') ? item.path.slice(1) : item.path
  childRoutes.push({ path: childPath, name: item.key, component: loader })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: Login },
    { path: '/', name: 'root', component: BasicLayout, children: [
      ...childRoutes,
      { path: 'system/message-records', name: 'message-records', component: () => import('@/views/system/MessageRecordList.vue') }
    ] }
  ]
})

/**
 * 根据路径查找菜单定义项
 * @param {string} path 路径（以 / 开头）
 * @returns {Object|null} 菜单定义项
 */
const findDefByPath = (path) => {
  return (Array.isArray(defsCache) ? defsCache : []).find(d => d.path === path) || null
}

router.beforeEach(async (to, from, next) => {
    const token = localStorage.getItem('token')
    if (to.path !== '/login' && !token) {
        next('/login')
    } else {
        try {
            const userStore = useUserStore()
            await userStore.init()
            if (to.path === '/login' && token) {
                return next('/')
            }
        } catch {}
        next()
    }
})

export default router
/**
 * 文件: frontend/src/router/index.js
 * 描述: 前端路由配置。仅保留根布局与登录页；在创建路由前从后端公开接口获取所有菜单定义并统一注册子路由。
 * 作者: 项目组
 * 创建日期: 2025-11-25
 * 修改日期: 2025-11-25
 * 版本: v1.0.0
 * 版权: Copyright (c) 2025 JiyuCloud
 */
