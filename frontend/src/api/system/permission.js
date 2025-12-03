import request from '@/utils/request'

export function listPermissions() {
  return request({ url: '/permissions', method: 'get' })
}
