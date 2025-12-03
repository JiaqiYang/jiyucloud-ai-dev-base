// 用户 Store：管理 token、用户信息与登录/登出流程
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('token') || '')
    const userInfo = ref({})

    /**
     * 设置令牌并持久化
     * @param {string} newToken 新令牌
     */
    function setToken(newToken) {
        token.value = newToken
        localStorage.setItem('token', newToken)
    }

    /**
     * 设置用户信息
     * @param {Object} info 用户信息对象
     */
    function setUserInfo(info) {
        userInfo.value = info
    }

    /**
     * 登录
     * @param {string} username 用户名
     * @param {string} password 密码
     * @param {string} captchaId 验证码 ID
     * @param {string} captchaText 验证码文本
     * @returns {Promise<Object>} 登录响应
     */
    async function login(username, password, captchaId, captchaText) {
        try {
            const { default: request } = await import('@/utils/request')
            const res = await request.post('/auth/login', {
                username,
                password,
                captchaId,
                captchaText
            })
            const { token: newToken, user } = res
            setToken(newToken)
            setUserInfo(user)
            return res
        } catch (error) {
            throw error
        }
    }

    /**
     * 登出
     */
    function logout() {
        token.value = ''
        userInfo.value = {}
        localStorage.removeItem('token')
    }

    /**
     * 初始化用户信息
     * - 若存在令牌且本地无用户信息，则请求 /auth/me
     */
    async function init() {
        try {
            if (!token.value) return
            if (userInfo.value && (userInfo.value.id || userInfo.value.username)) return
            const { getMe } = await import('@/api/auth')
            const res = await getMe()
            if (res && res.user) {
                userInfo.value = res.user
            }
        } catch (e) {
            token.value = ''
            userInfo.value = {}
            localStorage.removeItem('token')
        }
    }

    return { token, userInfo, setToken, setUserInfo, logout, login, init }
})
/**
 * 文件: frontend/src/stores/user.js
 * 描述: 用户 Store，管理令牌、用户信息、登录/登出与初始化流程。
 * 作者: 项目组
 * 创建日期: 2025-11-25
 * 修改日期: 2025-11-25
 * 版本: v1.0.0
 * 版权: Copyright (c) 2025 JiyuCloud
 */
