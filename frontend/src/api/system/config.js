import request from '@/utils/request'

export function getConfig(code) {
  return request({ url: `/configs/${code}`, method: 'get' })
}

export function updateConfig(code, payload) {
  return request({ url: `/configs/${code}`, method: 'put', data: payload })
}
