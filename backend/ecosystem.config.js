module.exports = {
    apps: [{
        name: 'cemetery-backend',
        script: './src/app.js',
        instances: 'max', // 根据 CPU 核心数自动创建实例
        exec_mode: 'cluster', // 集群模式
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        env_development: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        // 内存限制
        max_memory_restart: '1G',
        // 自动重启配置
        autorestart: true,
        watch: false, // 生产环境不建议开启
        max_restarts: 10,
        min_uptime: '10s',
        // 日志配置
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        // 进程管理
        listen_timeout: 10000,
        kill_timeout: 5000,
        // 高级配置
        instance_var: 'INSTANCE_ID',
        // 优雅关闭
        wait_ready: true,
        shutdown_with_message: true
    }]
};
