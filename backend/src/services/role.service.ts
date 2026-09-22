import prisma from "../config/database";
import { AppError } from "../middlewares/errorHandler";
import { logService } from "./log.service";
import { CreateRoleDto, UpdateRoleDto } from "../types";

export const roleService = {
  // Create role
  async createRole(data: CreateRoleDto, createdBy: string) {
    const { type, name, description, permissions } = data;

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new AppError("Role name already exists", 409);
    }

    const role = await prisma.role.create({
      data: {
        type,
        name,
        description,
        permissions: permissions as any,
      },
    });

    // Log the action
    await logService.create({
      userId: createdBy,
      type: "CREATE",
      action: "Created new role",
      note: `Created role: ${role.name}`,
      metadata: { roleId: role.id },
    });

    return role;
  },

  // Get all roles
  async getAllRoles() {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return roles.map((role: { _count: { userRoles: any } }) => ({
      ...role,
      userCount: role._count.userRoles,
      _count: undefined,
    }));
  },

  // Get role by ID
  async getRoleById(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new AppError("Role not found", 404);
    }

    return role;
  },

  // Update role
  async updateRole(roleId: string, data: UpdateRoleDto, updatedBy: string) {
    const { name, description, permissions } = data;

    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      throw new AppError("Role not found", 404);
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name },
      });

      if (nameExists) {
        throw new AppError("Role name already exists", 409);
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions) updateData.permissions = permissions as any;

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: updateData,
    });

    // Log the action
    await logService.create({
      userId: updatedBy,
      type: "UPDATE",
      action: "Updated role",
      note: `Updated role: ${updatedRole.name}`,
      metadata: { roleId, changes: data },
    });

    return updatedRole;
  },

  // Delete role
  async deleteRole(roleId: string, deletedBy: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      throw new AppError("Role not found", 404);
    }

    // Check if role is assigned to any users
    if (role._count.userRoles > 0) {
      throw new AppError(
        `Cannot delete role. It is assigned to ${role._count.userRoles} user(s)`,
        400
      );
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    // Log the action
    await logService.create({
      userId: deletedBy,
      type: "DELETE",
      action: "Deleted role",
      note: `Deleted role: ${role.name}`,
      metadata: { roleId },
    });

    return { message: "Role deleted successfully" };
  },
};
