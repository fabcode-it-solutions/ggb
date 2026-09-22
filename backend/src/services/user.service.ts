import prisma from "../config/database";
import { hashPassword } from "../utils/password.util";
import { AppError } from "../middlewares/errorHandler";
import { logService } from "./log.service";
import { CreateUserDto, UpdateUserDto } from "../types";
import { emailService } from "../utils/email.util";

export const userService = {
  // Create user (Admin only)
  async createUser(data: CreateUserDto, createdBy: string) {
    const { email, password, firstName, lastName, roleIds } = data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("Email already exists", 409);
    }

    // Validate roles exist
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      throw new AppError("One or more invalid role IDs", 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with roles
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        userRoles: {
          create: roleIds.map((roleId) => ({ roleId })),
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
    await emailService.sendWelcomeEmail(
    email,
    firstName,
    password,
  );
    // Log the action
    await logService.create({
      userId: createdBy,
      type: "CREATE",
      action: "Created new user",
      note: `Created user: ${user.email}`,
      metadata: { createdUserId: user.id },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  },

  // Get all users with pagination
  async getAllUsers(filters: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  type: true,
                  name: true,
                  permissions: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Get user by ID
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                type: true,
                name: true,
                description: true,
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  // Update user
  async updateUser(userId: string, data: UpdateUserDto, updatedBy: string) {
    const { firstName, lastName, email, isActive, roleIds } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    // If email is being updated, check for duplicates
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw new AppError("Email already exists", 409);
      }
    }

    // Update user
    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle role updates
    if (roleIds && roleIds.length > 0) {
      // Validate roles exist
      const roles = await prisma.role.findMany({
        where: { id: { in: roleIds } },
      });

      if (roles.length !== roleIds.length) {
        throw new AppError("One or more invalid role IDs", 400);
      }

      // Delete existing roles and create new ones
      await prisma.userRole.deleteMany({
        where: { userId },
      });

      updateData.userRoles = {
        create: roleIds.map((roleId) => ({ roleId })),
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Log the action
    await logService.create({
      userId: updatedBy,
      type: "UPDATE",
      action: "Updated user",
      note: `Updated user: ${updatedUser.email}`,
      metadata: { updatedUserId: userId, changes: data },
    });

    return updatedUser;
  },

  // Delete user (soft delete by setting isActive = false)
  async deleteUser(userId: string, deletedBy: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Also delete all active sessions
    await prisma.loginSession.deleteMany({
      where: { userId },
    });

    // Log the action
    await logService.create({
      userId: deletedBy,
      type: "DELETE",
      action: "Deleted user",
      note: `Deleted user: ${user.email}`,
      metadata: { deletedUserId: userId },
    });

    return { message: "User deleted successfully" };
  },
};
