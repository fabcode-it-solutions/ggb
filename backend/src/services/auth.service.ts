import prisma from "../config/database";
import { hashPassword, comparePassword } from "../utils/password.util";
import { generateToken, generateCsrfToken } from "../utils/jwt.util";
import { AppError } from "../middlewares/errorHandler";
import { logService } from "./log.service";
import { emailService } from "../utils/email.util";
import { LoginCredentials } from "../types";
import crypto from "crypto";

export const authService = {
  // Login
  async login(
    credentials: LoginCredentials,
    ipAddress?: string,
    userAgent?: string
  ) {
    const { email, password } = credentials;

    // Find user with roles
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError("Account is inactive", 403);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    // Calculate session expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create login session (temporary token to generate JWT)
    const tempToken = `temp_${Date.now()}_${Math.random()}`;

    const session = await prisma.loginSession.create({
      data: {
        userId: user.id,
        token: tempToken,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    // Generate JWT with session ID
    const token = generateToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    // Generate CSRF token using JWT_SECRET
    const csrfToken = generateCsrfToken();

    // Update session with real JWT token
    await prisma.loginSession.update({
      where: { id: session.id },
      data: { token },
    });

    // Log the login
    await logService.create({
      userId: user.id,
      type: "LOGIN",
      action: "User logged in",
      metadata: { ipAddress, userAgent },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      csrfToken,
      user: {
        ...userWithoutPassword,
        roles: user.userRoles.map(
          (ur: {
            role: { id: any; type: any; name: any; permissions: any };
          }) => ({
            id: ur.role.id,
            type: ur.role.type,
            name: ur.role.name,
            permissions: ur.role.permissions,
          })
        ),
      },
    };
  },

  // Logout
  async logout(userId: string, sessionId: string) {
    // Delete the session
    await prisma.loginSession.delete({
      where: { id: sessionId },
    });

    // Log the logout
    await logService.create({
      userId,
      type: "LOGOUT",
      action: "User logged out",
    });

    return { message: "Logged out successfully" };
  },

  // Get active sessions
  async getActiveSessions(userId: string) {
    const sessions = await prisma.loginSession.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sessions;
  },

  // Logout all sessions
  async logoutAllSessions(userId: string, currentSessionId: string) {
    // Delete all sessions except current one
    await prisma.loginSession.deleteMany({
      where: {
        userId,
        id: {
          not: currentSessionId,
        },
      },
    });

    // Log the action
    await logService.create({
      userId,
      type: "LOGOUT",
      action: "User logged out from all other sessions",
    });

    return { message: "Logged out from all other sessions successfully" };
  },

  // Get profile
  async getProfile(userId: string) {
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

  // Update profile
  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
    }
  ) {
    const { firstName, lastName, email } = data;

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
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
      },
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

    // Log the action
    await logService.create({
      userId,
      type: "UPDATE",
      action: "User updated profile",
      note: "Profile information updated",
      metadata: { changes: data },
    });

    return updatedUser;
  },

  // Change password
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 401);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Log the action
    await logService.create({
      userId,
      type: "UPDATE",
      action: "User changed password",
      note: "Password changed successfully",
    });

    return { message: "Password changed successfully" };
  },

  // Forgot password
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email, isActive:true },
    }); 
 
    // Don't reveal if user exists or not for security
    if (!user) {
      return { message: "If the email exists, a reset link has been sent" };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1); // Token valid for 1 hour

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpiry,
      },
    });
 
    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        email,
        resetToken,
        `${user.firstName} ${user.lastName}`
      );

    } catch (error) {
      console.error("Error sending password reset email:", error);
      // Log the email error but don't throw to avoid revealing user existence
      await logService.create({
        userId: user.id,
        type: "ERROR",
        action: "Password reset email failed",
        note: `Email sending failed: ${error}`,
      });
    }

    // Log the action
    await logService.create({
      userId: user.id,
      type: "UPDATE",
      action: "Password reset requested",
      note: "User requested password reset",
    });

    return { message: "If the email exists, a reset link has been sent" };
  },

  // Reset password
  async resetPassword(token: string, newPassword: string) {
    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpiry: null,
      },
    });

    // Delete all active sessions for security
    await prisma.loginSession.deleteMany({
      where: { userId: user.id },
    });

    // Log the action
    await logService.create({
      userId: user.id,
      type: "UPDATE",
      action: "Password reset completed",
      note: "User reset password using token",
    });

    return { message: "Password reset successfully" };
  },
};
