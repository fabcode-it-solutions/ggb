import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { sendSuccess } from "../utils/response.util";

export const userController = {
  async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const createdBy = req.user!.id;
      const user = await userService.createUser(req.body, createdBy);
      sendSuccess(res, user, "User created successfully", 201);
    } catch (error) {
      next(error);
    }
  },

  async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page, limit, isActive } = req.query;
      const result = await userService.getAllUsers({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        isActive:
          isActive === "true" ? true : isActive === "false" ? false : undefined,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  },

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updatedBy = req.user!.id;
      const user = await userService.updateUser(id, req.body, updatedBy);
      sendSuccess(res, user, "User updated successfully");
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = req.user!.id;
      const result = await userService.deleteUser(id, deletedBy);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
};
