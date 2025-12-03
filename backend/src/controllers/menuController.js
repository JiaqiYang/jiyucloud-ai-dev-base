const { ok, fail } = require('../utils/response');
const service = require('../services/menuService');
const menuController = {
  /**
   * 获取所有激活的菜单定义
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async definitions(req, res) {
    const { rows } = await service.listAll();
    const idKeyMap = new Map(rows.map(r => [r.id, r.key]));
    const list = rows
      .filter(r => r.type === 'menu')
      .map(r => ({
        key: r.key,
        title: r.title,
        path: r.path,
        parent_key: idKeyMap.get(r.parent_id) || null,
        icon: r.icon,
        component: r.component
      }));
    return ok(res, list);
  },

  /**
   * 获取菜单列表（管理用）
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async list(req, res) {
    const { rows } = await service.listAll();
    return ok(res, rows);
  },

  /**
   * 创建菜单记录
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async create(req, res) {
    try {
      const { row, error } = await service.createMenu(req, req.body);
      if (error) {
        return fail(res, /管理员权限/.test(error) ? 403 : 400, 'FAILED', error);
      }
      return ok(res, row);
    } catch (e) {
      return fail(res, 500, 'INTERNAL_ERROR', '创建失败');
    }
  },

  /**
   * 更新菜单记录
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { row, error } = await service.updateMenu(req, id, req.body);
      if (error) {
        return fail(
          res,
          /管理员权限/.test(error) ? 403 : /未找到/.test(error) ? 404 : 400,
          'FAILED',
          error
        );
      }
      return ok(res, row);
    } catch (e) {
      return fail(res, 500, 'INTERNAL_ERROR', '更新失败');
    }
  },

  /**
   * 删除菜单记录
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async remove(req, res) {
    try {
      const { id } = req.params;
      const { success, error } = await service.deleteMenu(req, id);
      if (error) {
        return fail(
          res,
          /管理员权限/.test(error) ? 403 : /未找到/.test(error) ? 404 : 400,
          'FAILED',
          error
        );
      }
      return ok(res, { success });
    } catch (e) {
      return fail(res, 500, 'INTERNAL_ERROR', '删除失败');
    }
  },

  /**
   * 获取菜单树结构
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async tree(req, res) {
    const { tree } = await service.getTree();
    return ok(res, tree);
  },

  /**
   * 获取当前角色可见的一级菜单
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async enabledTop(req, res) {
    try {
      const { top } = await service.enabledTop(req);
      return ok(res, top);
    } catch {
      return ok(res, []);
    }
  },

  /**
   * 获取指定目录下当前角色可见的二级菜单
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async enabledChildren(req, res) {
    try {
      const { parentKey } = req.params;
      const { list } = await service.enabledChildren(req, parentKey);
      return ok(res, list);
    } catch {
      return ok(res, []);
    }
  },

  /**
   * 获取角色菜单配置
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async getRoleConfig(req, res) {
    const { roleCode } = req.params;
    const result = await service.getRoleConfig(roleCode);
    return ok(res, result);
  },

  /**
   * 保存角色菜单配置
   * @param {import('express').Request} req 请求对象
   * @param {import('express').Response} res 响应对象
   * @returns {Promise<void>}
   */
  async setRoleConfig(req, res) {
    try {
      const { roleCode } = req.params;
      const { keys } = req.body;
      const result = await service.setRoleConfig(req, roleCode, keys);
      if (result.error) {
        return fail(
          res,
          /管理员权限/.test(result.error) ? 403 : /不存在/.test(result.error) ? 404 : 400,
          'FAILED',
          result.error
        );
      }
      return ok(res, result);
    } catch (err) {
      return fail(res, 500, 'INTERNAL_ERROR', '保存失败');
    }
  }

  /**
   * 重新初始化默认菜单与父子关系，并为管理员赋予全部菜单与权限
   * 仅管理员可调用
   */
};

module.exports = menuController;
/**
 * 菜单控制器
 *
 * 说明：
 * - definitions：返回所有激活的菜单定义（含父键、路径、组件标识）
 * - list/tree：菜单管理用的完整列表与树
 * - enabledTop：根据当前登录角色可见的一级菜单（dashboard 与有可见子菜单的目录）
 * - enabledChildren：根据目录键返回该角色可见的二级菜单
 * - getRoleConfig/setRoleConfig：读取/保存角色的菜单键集合
 */
/**
 * 文件: backend/src/controllers/menuController.js
 * 描述: 菜单相关控制器，提供菜单定义、可见菜单、树形结构、CRUD 及角色菜单配置等接口
 * 作者: 项目组
 * 创建日期: 2025-11-25
 * 修改日期: 2025-11-25
 * 版本: v1.0.0
 * 版权: Copyright (c) 2025 JiyuCloud
 */
