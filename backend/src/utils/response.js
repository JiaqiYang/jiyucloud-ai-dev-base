/**
 *
 */
/**
 * 标准成功响应
 * @param {import('express').Response} res Express 响应对象
 * @param {any} [data=null] 业务数据
 * @param {string} [message='OK'] 提示信息
 * @returns {import('express').Response}
 */
function ok(res, data = null, message = 'OK') {
  return res.json({ code: 'OK', message, data });
}

/**
 * 标准失败响应
 * @param {import('express').Response} res Express 响应对象
 * @param {number} [status=400] HTTP 状态码
 * @param {string} [code='BAD_REQUEST'] 业务错误码
 * @param {string} [message='请求错误'] 错误信息
 * @param {any} [details] 额外错误详情
 * @returns {import('express').Response}
 */
function fail(res, status = 400, code = 'BAD_REQUEST', message = '请求错误', details) {
  return res.status(status).json({ code, message, details });
}

module.exports = { ok, fail };
