import request from '@/utils/request'

export function getLogs(params) {
    return request({
        url: '/logs',
        method: 'get',
        params
    })
}

export function getLogDetail(id) {
    return request({
        url: `/logs/${id}`,
        method: 'get'
    })
}

export function deleteLog(id) {
    return request({
        url: `/logs/${id}`,
        method: 'delete'
    })
}

export function batchDeleteLogs(ids) {
    return request({
        url: '/logs/batch-delete',
        method: 'post',
        data: { ids }
    })
}

export function getLogStatistics(params) {
    return request({
        url: '/logs/statistics/summary',
        method: 'get',
        params
    })
}
