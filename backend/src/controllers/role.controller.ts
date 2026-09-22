import { Request, Response, NextFunction } from "express";
import { roleService } from "../services/role.service";
import { sendSuccess } from "../utils/response.util";

export const roleController = {
  async createRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const createdBy = req.user!.id;
      const role = await roleService.createRole(req.body, createdBy);
      sendSuccess(res, role, "Role created successfully", 201);
    } catch (error) {
      next(error);
    }
  },

  async getAllRoles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const roles = await roleService.getAllRoles();
      sendSuccess(res, roles);
    } catch (error) {
      next(error);
    }
  },

  async getRoleById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const role = await roleService.getRoleById(id);
      sendSuccess(res, role);
    } catch (error) {
      next(error);
    }
  },

  async updateRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updatedBy = req.user!.id;
      const role = await roleService.updateRole(id, req.body, updatedBy);
      sendSuccess(res, role, "Role updated successfully");
    } catch (error) {
      next(error);
    }
  },

  async deleteRole(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = req.user!.id;
      const result = await roleService.deleteRole(id, deletedBy);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
};
