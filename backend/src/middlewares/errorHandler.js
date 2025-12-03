/**
 * 全局错误处理中间件
 * @param {Error & {status?:number, code?:string}} err 错误对象
 * @param {import('express').Request} req 请求对象
 * @param {import('express').Response} res 响应对象
 * @param {Function} _next next
 */
module.exports = function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || '服务器内部错误';
  const traceId = req.headers['x-trace-id'] || undefined;
  res.status(status).json({ code, message, traceId });
};
