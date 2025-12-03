// 认证相关 API：验证码、当前用户信息
import request from '@/utils/request'

export function getCaptcha() {
    return request({
        url: '/captcha',
        method: 'get'
    })
}

export function verifyCaptcha(captchaId, captchaText) {
    return request({
        url: '/captcha/verify',
        method: 'post',
        data: { captchaId, captchaText }
    })
}

export function getMe() {
    return request({
        url: '/auth/me',
        method: 'get'
    })
}

export function heartbeat() {
    return request({
        url: '/auth/heartbeat',
        method: 'post'
    })
}

export function logoutServer() {
    return request({
        url: '/auth/logout',
        method: 'post',
        headers: (() => {
            try {
                const t = localStorage.getItem('token')
                return t ? { Authorization: `Bearer ${t}` } : {}
            } catch { return {} }
        })()
    })
}
/**
 * 文件: frontend/src/api/auth.js
 * 描述: 认证相关 API 封装，包含验证码获取与校验、当前登录用户信息。
 * 作者: 项目组
 * 创建日期: 2025-11-25
 * 修改日期: 2025-11-25
 * 版本: v1.0.0
 * 版权: Copyright (c) 2025 JiyuCloud
 */
