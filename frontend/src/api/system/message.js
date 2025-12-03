import request from '@/utils/request'

export function sendMessages(data) {
  return request({ url: '/messages/send', method: 'post', data })
}

export function listMessageRecords(params) {
  return request({ url: '/messages/records', method: 'get', params })
}

export function batchRecallMessages(ids) {
  return request({ url: '/messages/batch-recall', method: 'post', data: { ids } })
}

export function markMessageRead(id) {
  return request({ url: '/messages/mark-read', method: 'post', data: { id } })
}

export function markAllMessagesRead() {
  return request({ url: '/messages/read-all', method: 'post' })
}
