const Role = require('../models/Role');
// removed unused imports due to service layer handling permissions
const { ok, fail } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/roleService');

exports.list = asyncHandler(async (req, res) => {
  const roles = await Role.findAll();
  return ok(res, roles);
});

exports.create = async (req, res) => {
  try {
    const { role, error } = await service.createRole(req.body);
    if (error) {
      return fail(res, 400, 'BAD_REQUEST', error);
    }
    return ok(res, role);
  } catch (error) {
    return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, error } = await service.updateRole(id, req.body);
    if (error) {
      return fail(res, 404, 'NOT_FOUND', error);
    }
    return ok(res, role);
  } catch (error) {
    return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { success, error } = await service.deleteRole(id);
    if (error) {
      return fail(res, 404, 'NOT_FOUND', error);
    }
    return ok(res, { success });
  } catch (error) {
    return fail(res, 500, 'INTERNAL_ERROR', '服务器内部错误');
  }
};
