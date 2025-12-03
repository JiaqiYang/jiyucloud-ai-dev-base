const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// 颜色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ ${message}`, 'blue');
}

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
    totalTests++;
    try {
        await fn();
        passedTests++;
        logSuccess(name);
    } catch (error) {
        failedTests++;
        logError(`${name}: ${error.message}`);
        if (error.response) {
            console.log('  Response:', error.response.data);
        }
    }
}

// 1. 测试认证 API
async function testAuth() {
    logInfo('\n=== 测试认证 API ===');

    await test('登录成功', async () => {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });

        if (!response.data.token) {
            throw new Error('未返回 token');
        }

        authToken = response.data.token;
        logInfo(`Token: ${authToken.substring(0, 20)}...`);
    });

    await test('获取当前用户信息', async () => {
        const response = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!response.data.user) {
            throw new Error('未返回用户信息');
        }

        logInfo(`用户: ${response.data.user.username}`);
    });
}

async function testConfigAndSessions() {
    logInfo('\n=== 测试配置与会话在线判定 ===');
    let userId = null;
    await test('获取当前用户ID', async () => {
        const r = await axios.get(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (!r.data.user || !r.data.user.id) throw new Error('缺少用户ID');
        userId = r.data.user.id;
    });
    await test('心跳记录', async () => {
        await axios.post(`${BASE_URL}/auth/heartbeat`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
    });
    await test('设置大阈值并判定在线', async () => {
        await axios.put(`${BASE_URL}/configs/auto_logout`, { name: '无操作自动下线', data: { inactive_ms: 9999000 } }, { headers: { Authorization: `Bearer ${authToken}` } });
        const s1 = await axios.get(`${BASE_URL}/users/${userId}/sessions`, { headers: { Authorization: `Bearer ${authToken}` } });
        const list1 = Array.isArray(s1.data.list) ? s1.data.list : [];
        const anyOnline = list1.some(x => x.is_online === true);
        if (!anyOnline) throw new Error('未判定为在线');
    });
    await test('设置极小阈值并判定离线', async () => {
        await axios.put(`${BASE_URL}/configs/auto_logout`, { name: '无操作自动下线', data: { inactive_ms: 1 } }, { headers: { Authorization: `Bearer ${authToken}` } });
        const s2 = await axios.get(`${BASE_URL}/users/${userId}/sessions`, { headers: { Authorization: `Bearer ${authToken}` } });
        const list2 = Array.isArray(s2.data.list) ? s2.data.list : [];
        const anyOffline = list2.some(x => x.is_online === false);
        if (!anyOffline) throw new Error('未判定为离线');
    });
}

// 2. 测试墓园管理 API
async function testCemeteries() {
    logInfo('\n=== 测试墓园管理 API ===');

    let cemeteryId;

    await test('获取墓园列表', async () => {
        const response = await axios.get(`${BASE_URL}/cemeteries`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!Array.isArray(response.data.list)) {
            throw new Error('返回数据格式错误');
        }

        logInfo(`墓园数量: ${response.data.total}`);
        if (response.data.list.length > 0) {
            cemeteryId = response.data.list[0].id;
        }
    });

    await test('获取墓园详情', async () => {
        if (!cemeteryId) {
            throw new Error('没有可用的墓园ID');
        }

        const response = await axios.get(`${BASE_URL}/cemeteries/${cemeteryId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!response.data.name) {
            throw new Error('未返回墓园详情');
        }

        logInfo(`墓园名称: ${response.data.name}`);
    });
}

// 3. 测试墓区管理 API
async function testCemeteryAreas() {
    logInfo('\n=== 测试墓区管理 API ===');

    await test('获取墓区列表', async () => {
        const response = await axios.get(`${BASE_URL}/cemetery-areas?cemeteryId=1`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!Array.isArray(response.data.list)) {
            throw new Error('返回数据格式错误');
        }

        logInfo(`墓区数量: ${response.data.total}`);
    });
}

// 4. 测试墓位管理 API
async function testCemeteryPlots() {
    logInfo('\n=== 测试墓位管理 API ===');

    let plotId;

    await test('获取墓位列表', async () => {
        const response = await axios.get(`${BASE_URL}/cemetery-plots?page=1&pageSize=10`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!Array.isArray(response.data.list)) {
            throw new Error('返回数据格式错误');
        }

        logInfo(`墓位总数: ${response.data.total}`);
        if (response.data.list.length > 0) {
            plotId = response.data.list[0].id;
        }
    });

    await test('获取墓位详情', async () => {
        if (!plotId) {
            throw new Error('没有可用的墓位ID');
        }

        const response = await axios.get(`${BASE_URL}/cemetery-plots/${plotId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!response.data.plot_number) {
            throw new Error('未返回墓位详情');
        }

        logInfo(`墓位编号: ${response.data.plot_number}, 状态: ${response.data.status}`);
    });
}

// 5. 测试客户管理 API
async function testCustomers() {
    logInfo('\n=== 测试客户管理 API ===');

    let customerId;

    await test('获取客户列表', async () => {
        const response = await axios.get(`${BASE_URL}/customers?page=1&pageSize=10`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!Array.isArray(response.data.list)) {
            throw new Error('返回数据格式错误');
        }

        logInfo(`客户总数: ${response.data.total}`);
        if (response.data.list.length > 0) {
            customerId = response.data.list[0].id;
        }
    });

    await test('获取客户详情', async () => {
        if (!customerId) {
            throw new Error('没有可用的客户ID');
        }

        const response = await axios.get(`${BASE_URL}/customers/${customerId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!response.data.name) {
            throw new Error('未返回客户详情');
        }

        logInfo(`客户姓名: ${response.data.name}, 电话: ${response.data.phone}`);
    });
}

// 6. 测试订单管理 API
async function testOrders() {
    logInfo('\n=== 测试订单管理 API ===');

    let orderId;

    await test('获取订单列表', async () => {
        const response = await axios.get(`${BASE_URL}/orders?page=1&pageSize=10`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!Array.isArray(response.data.list)) {
            throw new Error('返回数据格式错误');
        }

        logInfo(`订单总数: ${response.data.total}`);
        if (response.data.list.length > 0) {
            orderId = response.data.list[0].id;
        }
    });

    await test('获取订单详情', async () => {
        if (!orderId) {
            throw new Error('没有可用的订单ID');
        }

        const response = await axios.get(`${BASE_URL}/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!response.data.order_number) {
            throw new Error('未返回订单详情');
        }

        logInfo(`订单号: ${response.data.order_number}, 状态: ${response.data.status}`);
    });
}

// 7. 测试支付管理 API
async function testPayments() {
    logInfo('\n=== 测试支付管理 API ===');

    await test('获取支付记录列表', async () => {
        const response = await axios.get(`${BASE_URL}/payments?page=1&pageSize=10`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!Array.isArray(response.data.list)) {
            throw new Error('返回数据格式错误');
        }

        logInfo(`支付记录总数: ${response.data.total}`);
    });

    await test('获取支付统计', async () => {
        const response = await axios.get(`${BASE_URL}/payments/statistics`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.totalAmount === undefined) {
            throw new Error('未返回统计数据');
        }

        logInfo(`总支付金额: ${response.data.totalAmount}`);
    });
}

// 8. 测试退款管理 API
async function testRefunds() {
    logInfo('\n=== 测试退款管理 API ===');

    await test('获取退款申请列表', async () => {
        const response = await axios.get(`${BASE_URL}/refunds?page=1&pageSize=10`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!Array.isArray(response.data.list)) {
            throw new Error('返回数据格式错误');
        }

        logInfo(`退款申请总数: ${response.data.total}`);
    });
}

// 主测试函数
async function runTests() {
    log('\n========================================', 'blue');
    log('  后端 API 测试开始', 'blue');
    log('========================================\n', 'blue');

    try {
        await testAuth();
        await testConfigAndSessions();
        await testCemeteries();
        await testCemeteryAreas();
        await testCemeteryPlots();
        await testCustomers();
        await testOrders();
        await testPayments();
        await testRefunds();
    } catch (error) {
        logError(`测试过程中发生错误: ${error.message}`);
    }

    // 输出测试结果
    log('\n========================================', 'blue');
    log('  测试结果汇总', 'blue');
    log('========================================', 'blue');
    log(`总测试数: ${totalTests}`, 'yellow');
    log(`通过: ${passedTests}`, 'green');
    log(`失败: ${failedTests}`, 'red');
    log(`成功率: ${((passedTests / totalTests) * 100).toFixed(2)}%\n`, 'yellow');

    process.exit(failedTests > 0 ? 1 : 0);
}

// 运行测试
runTests();
