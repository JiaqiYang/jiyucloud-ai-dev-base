import request from '@/utils/request'

export function getDictTypes(params) {
  return request({ url: '/dicts', method: 'get', params })
}

export function createDictType(data) {
  return request({ url: '/dicts', method: 'post', data })
}

export function updateDictType(id, data) {
  return request({ url: `/dicts/${id}`, method: 'put', data })
}

export function deleteDictType(id) {
  return request({ url: `/dicts/${id}`, method: 'delete' })
}

export function getDictItems(params) {
  return request({ url: '/dict-items', method: 'get', params })
}

export function createDictItem(data) {
  return request({ url: '/dict-items', method: 'post', data })
}

export function updateDictItem(id, data) {
  return request({ url: `/dict-items/${id}`, method: 'put', data })
}

export function deleteDictItem(id) {
  return request({ url: `/dict-items/${id}`, method: 'delete' })
}
