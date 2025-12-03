<template>
  <div class="login-container">
    <!-- Left Side - Brand Section -->
    <div class="left-section">
      <div class="brand-content">
        <div class="logo-section">
          <img :src="loginLogoSrc" alt="Logo" class="brand-logo" />
          <h1 class="brand-title">{{ siteName }}</h1>
          <h2 class="system-name">{{ siteSubtitle }}</h2>
        </div>
        <div class="brand-description">
          <p class="description-text" :style="{ whiteSpace: 'pre-line' }">{{ siteSlogan }}</p>
        </div>
        <div class="brand-footer">
          <p>{{ siteCopyright }}</p>
        </div>
      </div>
    </div>

    <!-- Right Side - Login Form -->
    <div class="right-section">
      <div class="form-wrapper">
        <div class="form-header">
          <h3 class="form-title">登录系统</h3>
          <p class="form-subtitle">欢迎回来，请输入您的账号信息</p>
        </div>

        <a-form 
          :model="formState" 
          name="login-form" 
          autocomplete="off" 
          @finish="onFinish" 
          layout="vertical"
          class="login-form"
        >
          <a-form-item 
            label="用户名"
            name="username" 
            :rules="[{ required: true, message: '请输入用户名' }]"
          >
            <a-input 
              v-model:value="formState.username" 
              placeholder="请输入用户名" 
              size="large"
              class="custom-input"
            >
              <template #prefix>
                <UserOutlined class="input-icon" />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item 
            label="密码"
            name="password" 
            :rules="[{ required: true, message: '请输入密码' }]"
          >
            <a-input-password 
              v-model:value="formState.password" 
              placeholder="请输入密码" 
              size="large"
              class="custom-input"
            >
              <template #prefix>
                <LockOutlined class="input-icon" />
              </template>
            </a-input-password>
          </a-form-item>

          <a-form-item 
            label="验证码"
            name="captchaText" 
            :rules="[{ required: true, message: '请输入验证码' }]"
          >
            <div class="captcha-row">
              <a-input 
                v-model:value="formState.captchaText" 
                placeholder="请输入验证码" 
                size="large"
                class="custom-input captcha-input"
              >
                <template #prefix>
                  <SafetyOutlined class="input-icon" />
                </template>
              </a-input>
              <div class="captcha-image" @click="refreshCaptcha" v-html="captchaSvg"></div>
            </div>
          </a-form-item>

          <a-form-item>
            <a-checkbox v-model:checked="rememberMe">记住账号密码</a-checkbox>
          </a-form-item>

          <a-form-item>
            <a-button 
              type="primary" 
              html-type="submit" 
              block 
              size="large" 
              :loading="loading"
              class="login-button"
            >
              <span v-if="!loading">登 录</span>
            </a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { message } from 'ant-design-vue';
import { getCaptcha } from '@/api/auth';
import request from '@/utils/request';
import logoPng from '@/assets/logo.png';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);

const formState = reactive({
  username: '',
  password: '',
  captchaText: ''
});

const captchaId = ref('');
const captchaSvg = ref('');
const rememberMe = ref(false);

const siteName = ref('JiyuCloud');
const siteSubtitle = ref('公墓管理系统');
const siteSlogan = ref('');
const siteCopyright = ref('© 2025 JiyuCloud Cemetery Management System');
const siteIcon = ref(null);
const apiBase = import.meta.env.VITE_API_BASE_URL;
const apiOrigin = (apiBase || '').replace('/api', '');
const loginLogoSrc = computed(() => {
  const icon = siteIcon.value?.png64 || siteIcon.value?.png32 || '';
  if (icon) {
    const s = icon.toString();
    if (s.startsWith('http')) return s;
    if (s.startsWith('/uploads')) return apiOrigin + s;
  }
  return logoPng;
});
const applyFavicon = (v) => {
  try {
    const href = `${apiBase}/public/favicon.ico?v=${v || Date.now()}`;
    let link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = href;
  } catch {}
};
const loadSiteMeta = async () => {
  try {
    const meta = await request({ url: '/public/site/meta', method: 'get' });
    siteName.value = meta?.name || 'JiyuCloud';
    siteIcon.value = meta?.icon || null;
    siteSubtitle.value = meta?.subtitle || '公墓管理系统';
    siteSlogan.value = meta?.slogan || '专业的公墓信息化管理平台\n为您提供高效、安全、可靠的管理服务';
    siteCopyright.value = meta?.copyright || '© 2025 JiyuCloud Cemetery Management System';
    if (siteIcon.value?.version) applyFavicon(siteIcon.value.version);
    try { document.title = siteName.value; } catch {}
  } catch {}
};

// 从 localStorage 加载保存的凭据
const loadSavedCredentials = () => {
  const savedUsername = localStorage.getItem('saved_username');
  const savedPassword = localStorage.getItem('saved_password');
  const savedRemember = localStorage.getItem('remember_me');
  
  if (savedRemember === 'true' && savedUsername) {
    formState.username = savedUsername;
    formState.password = savedPassword || '';
    rememberMe.value = true;
  }
};

// 保存凭据到 localStorage
const saveCredentials = (username, password) => {
  if (rememberMe.value) {
    localStorage.setItem('saved_username', username);
    localStorage.setItem('saved_password', password);
    localStorage.setItem('remember_me', 'true');
  } else {
    localStorage.removeItem('saved_username');
    localStorage.removeItem('saved_password');
    localStorage.removeItem('remember_me');
  }
};

// 获取验证码
const refreshCaptcha = async () => {
  try {
    const res = await getCaptcha();
    captchaId.value = res.captchaId;
    captchaSvg.value = res.captchaSvg;
  } catch (error) {
    message.error('获取验证码失败');
  }
};

// 初始化时加载验证码和保存的凭据
refreshCaptcha();
loadSavedCredentials();

onMounted(() => {
  loadSiteMeta();
  try { window.addEventListener('site-meta-updated', loadSiteMeta); } catch {}
});
onUnmounted(() => {
  try { window.removeEventListener('site-meta-updated', loadSiteMeta); } catch {}
});

const onFinish = async (values) => {
  loading.value = true;
  try {
    await userStore.login(values.username, values.password, captchaId.value, values.captchaText);
    // 保存凭据
    saveCredentials(values.username, values.password);
    message.success('登录成功');
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    // 显示后端返回的错误信息
    if (error.response && error.response.data) {
      const errorMsg = error.response.data.error || error.response.data.message || '登录失败';
      message.error(errorMsg);
    } else if (error.request) {
      message.error('网络连接失败，请检查您的网络');
    } else {
      message.error('登录失败，请稍后再试');
    }
    // 登录失败刷新验证码
    refreshCaptcha();
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: row;
}

/* Left Section - Brand */
.left-section {
  flex: 1;
  background-image: url('@/assets/login_bg.png');
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.left-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(15, 32, 56, 0.9) 0%, rgba(32, 58, 86, 0.9) 100%);
}

.brand-content {
  position: relative;
  z-index: 1;
  color: white;
  max-width: 500px;
  animation: fadeInLeft 0.8s ease-out;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.logo-section {
  margin-bottom: 48px;
}

.brand-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
  background: white;
  padding: 12px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.brand-title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: white;
  letter-spacing: 1px;
}

.system-name {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 2px;
}

.brand-description {
  margin-bottom: 60px;
  padding: 32px 0;
  border-top: 2px solid rgba(255, 255, 255, 0.2);
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.description-text {
  font-size: 16px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.brand-footer {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.brand-footer p {
  margin: 0;
}

/* Right Section - Form */
.right-section {
  flex: 0 0 550px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
  animation: fadeInRight 0.8s ease-out;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.form-header {
  margin-bottom: 40px;
}

.form-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a2332;
  margin: 0 0 12px 0;
}

.form-subtitle {
  font-size: 14px;
  color: #607080;
  margin: 0;
}

.login-form {
  margin-bottom: 0;
}

:deep(.ant-form-item-label > label) {
  font-size: 14px;
  font-weight: 600;
  color: #1a2332;
}

:deep(.ant-form-item) {
  margin-bottom: 24px;
}

:deep(.custom-input) {
  border-radius: 8px;
  border: 1.5px solid #d0d7de;
  background: #f6f8fa;
  transition: all 0.3s ease;
}

:deep(.custom-input:hover) {
  border-color: #8B9CAD;
  background: #ffffff;
}

:deep(.custom-input.ant-input-affix-wrapper-focused) {
  border-color: #1a2332;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(26, 35, 50, 0.08);
}

:deep(.input-icon) {
  color: #607080;
  font-size: 16px;
}

.login-button {
  height: 52px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  border: none;
  background: linear-gradient(135deg, #1a2332 0%, #2d3e50 100%);
  box-shadow: 0 4px 12px rgba(26, 35, 50, 0.3);
  transition: all 0.3s ease;
  margin-top: 12px;
}

.login-button:hover {
  background: linear-gradient(135deg, #0f1823 0%, #1a2332 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26, 35, 50, 0.4);
}

.login-button:active {
  transform: translateY(0);
}

/* Captcha Styles */
.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  flex: 0 0 120px;
  height: 40px;
  border: 1.5px solid #d0d7de;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-image:hover {
  border-color: #1a2332;
  box-shadow: 0 0 0 3px rgba(26, 35, 50, 0.08);
}

.captcha-image :deep(svg) {
  width: 100%;
  height: 100%;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .login-container {
    flex-direction: column;
  }
  
  .left-section {
    flex: 0 0 300px;
    padding: 40px;
  }
  
  .brand-content {
    text-align: center;
  }
  
  .brand-title {
    font-size: 32px;
  }
  
  .system-name {
    font-size: 22px;
  }
  
  .brand-description {
    margin-bottom: 0;
  }
  
  .brand-footer {
    display: none;
  }
  
  .right-section {
    flex: 1;
    padding: 40px 30px;
  }
}

@media (max-width: 768px) {
  .left-section {
    flex: 0 0 200px;
    padding: 30px 20px;
  }
  
  .brand-logo {
    width: 60px;
    height: 60px;
  }
  
  .brand-title {
    font-size: 24px;
  }
  
  .system-name {
    font-size: 18px;
  }
  
  .right-section {
    padding: 30px 20px;
  }
  
  .form-title {
    font-size: 24px;
  }
}
</style>
<!--
  文件: frontend/src/views/auth/Login.vue
  描述: 登录页面，负责提交凭据与验证码并完成登录流程。
  作者: 项目组
  创建日期: 2025-11-25
  修改日期: 2025-11-25
  版本: v1.0.0
  版权: Copyright (c) 2025 JiyuCloud
-->
