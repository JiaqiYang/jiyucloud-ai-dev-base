// 菜单相关 API：用于动态路由与懒加载菜单
import request from '@/utils/request'

export function getMenuDefinitions() {
  return request({ url: '/public/menus/definitions', method: 'get' }).then(r => (Array.isArray(r?.data) ? r.data : r))
}

export function getRoleMenus(roleCode) {
  return request({ url: `/menus/config/${roleCode}`, method: 'get' })
}

export function setRoleMenus(roleCode, keys) {
  return request({ url: `/menus/config/${roleCode}`, method: 'post', data: { keys } })
}

export function listMenus() {
  return request({ url: '/menus', method: 'get' })
}

export function createMenu(data) {
  return request({ url: '/menus', method: 'post', data })
}

export function updateMenu(id, data) {
  return request({ url: `/menus/${id}`, method: 'put', data })
}

export function deleteMenu(id) {
  return request({ url: `/menus/${id}`, method: 'delete' })
}

export function getMenuTree() {
  return request({ url: '/menus/tree', method: 'get' }).then(r => (Array.isArray(r?.data) ? r.data : r))
}

export function getEnabledTopMenus() {
  return request({ url: '/menus/enabled/top', method: 'get' }).then(r => (Array.isArray(r?.data) ? r.data : r))
}

export function getEnabledChildren(parentKey) {
  return request({ url: `/menus/enabled/children/${parentKey}`, method: 'get' }).then(r => (Array.isArray(r?.data) ? r.data : r))
}
/**
 * 文件: frontend/src/api/system/menu.js
 * 描述: 菜单相关 API 封装，包含菜单定义、可见一级/二级菜单、菜单 CRUD 与角色菜单配置。
 * 作者: 项目组
 * 创建日期: 2025-11-25
 * 修改日期: 2025-11-25
 * 版本: v1.0.0
 * 版权: Copyright (c) 2025 JiyuCloud
 */
