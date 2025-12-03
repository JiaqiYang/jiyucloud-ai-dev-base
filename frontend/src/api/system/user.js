import request from '@/utils/request'

export function getUsers(params) {
    return request({
        url: '/users',
        method: 'get',
        params
    })
}

export function createUser(data) {
    return request({
        url: '/users',
        method: 'post',
        data
    })
}

export function updateUser(id, data) {
    return request({
        url: `/users/${id}`,
        method: 'put',
        data
    })
}

export function deleteUser(id) {
    return request({
        url: `/users/${id}`,
        method: 'delete'
    })
}

export function forceLogoutUser(id) {
    return request({
        url: `/users/${id}/force-logout`,
        method: 'post'
    })
}

export function getUserSessions(id) {
    return request({
        url: `/users/${id}/sessions`,
        method: 'get'
    })
}

export function forceLogoutSession(id, sessionId) {
    return request({
        url: `/users/${id}/force-logout-session`,
        method: 'post',
        data: { sessionId }
    })
}
