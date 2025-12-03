import request from '@/utils/request'

export function getNotifications(params) {
  return request({ url: '/notifications', method: 'get', params })
}

export function createNotification(data) {
  return request({ url: '/notifications', method: 'post', data })
}

export function getNotification(id) {
  return request({ url: `/notifications/${id}`, method: 'get' })
}

export function updateNotification(id, data) {
  return request({ url: `/notifications/${id}`, method: 'put', data })
}

export function deleteNotification(id) {
  return request({ url: `/notifications/${id}`, method: 'delete' })
}

export function batchDeleteNotifications(ids) {
  return request({ url: '/notifications/batch-delete', method: 'post', data: { ids } })
}

export function getUnreadCount() {
  return request({ url: '/notifications/unread-count', method: 'get' })
}

export function markNotificationRead(id) {
  return request({ url: `/notifications/${id}/read`, method: 'post' })
}

export function markAllNotificationsRead() {
  return request({ url: '/notifications/read-all', method: 'post' })
}
