import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

type Permission =
  | "roles"
  | "inventory"
  | "dashboard"
  | "analytics"
  | "users"
  | "logs"
  | "orders";

export const checkPermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401);
      }

      // Check if user has any role with the required permission
      const hasPermission = req.user.roles.some((role) => {
        const permissions = role.permissions as Record<string, boolean>;
        return permissions[requiredPermission] === true;
      });

      if (!hasPermission) {
        throw new AppError("Insufficient permissions", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Shortcut for admin-only routes
export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const isAdmin = req.user.roles.some((role) => role.type === "ADMIN");

    if (!isAdmin) {
      throw new AppError("Admin access required", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
