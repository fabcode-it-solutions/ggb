import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { sendSuccess } from "../utils/response.util";import { generateCsrfToken } from "../utils/jwt.util";

export const authController = {
  // Login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers["user-agent"];

      const result = await authService.login(
        { email, password },
        ipAddress,
        userAgent
      );

      sendSuccess(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  },

  // Logout
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = req.user!.sessionId;

      const result = await authService.logout(userId, sessionId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  // Get active sessions
  async getActiveSessions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessions = await authService.getActiveSessions(userId);
      sendSuccess(res, sessions);
    } catch (error) {
      next(error);
    }
  },

  // Logout all sessions
  async logoutAllSessions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessionId = req.user!.sessionId;

      const result = await authService.logoutAllSessions(userId, sessionId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  // Get current user profile (me)
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await authService.getProfile(userId);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  },

  // Get profile (same as me, alternative endpoint)
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await authService.getProfile(userId);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  },

  // Update profile
  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { firstName, lastName, email } = req.body;

      const updatedProfile = await authService.updateProfile(userId, {
        firstName,
        lastName,
        email,
      });

      sendSuccess(res, updatedProfile, "Profile updated successfully");
    } catch (error) {
      next(error);
    }
  },

  // Change password
  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      const result = await authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  // Forgot password
  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  // Reset password
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
};
