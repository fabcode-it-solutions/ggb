import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";
import prisma from "../config/database";
import { AppError } from "../middlewares/errorHandler";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = verifyToken(token);

    // Check if session exists and is valid
    const session = await prisma.loginSession.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new AppError("Session not found or expired", 401);
    }

    // Check if session expired
    if (new Date() > session.expiresAt) {
      await prisma.loginSession.delete({ where: { id: session.id } });
      throw new AppError("Session expired", 401);
    }

    // Check if user is active
    if (!session.user.isActive) {
      throw new AppError("User account is inactive", 403);
    }

    // Attach user to request
    req.user = {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      roles: session.user.userRoles.map((ur: { role: any }) => ur.role),
      sessionId: session.id,
    };

    next();
  } catch (error) {
    next(error);
  }
};
