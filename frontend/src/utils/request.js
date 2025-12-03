// Axios 封装：设置基础地址、超时、令牌注入与错误透传
import axios from 'axios'
import { message } from 'ant-design-vue'

const resolveBaseURL = () => {
    const envBase = import.meta.env && import.meta.env.VITE_API_BASE_URL
    if (envBase) return envBase
    if (typeof window !== 'undefined') {
        const port = window.location.port
        if (port === '5173' || port === '5174') return 'http://localhost:3000/api'
    }
    return '/api'
}

const service = axios.create({
    baseURL: resolveBaseURL(),
    timeout: 5000
})

/**
 * 请求拦截器
 * - 注入 Authorization Bearer Token
 */
service.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

/**
 * 响应拦截器
 * - 直接返回 response.data
 * - 错误交由调用方处理
 */
service.interceptors.response.use(
    response => {
        const d = response && response.data
        if (d && typeof d === 'object' && Object.prototype.hasOwnProperty.call(d, 'data')) {
            return d.data
        }
        return d
    },
    async error => {
        const status = error?.response?.status
        if (status === 401) {
            try {
                const { useUserStore } = await import('@/stores/user')
                const router = (await import('@/router')).default
                const store = useUserStore()
                store.logout()
                message.info('已下线，请重新登录')
                router.push('/login')
            } catch {}
        }
        return Promise.reject(error)
    }
)

export default service
/**
 * 文件: frontend/src/utils/request.js
 * 描述: Axios 封装，设置基础地址、超时、令牌注入与错误透传。
 * 作者: 项目组
 * 创建日期: 2025-11-25
 * 修改日期: 2025-11-25
 * 版本: v1.0.0
 * 版权: Copyright (c) 2025 JiyuCloud
 */
