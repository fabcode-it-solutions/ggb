import jwt from "jsonwebtoken";
import { config } from "../config/env";
import crypto from "crypto";

interface JwtPayload {
  userId: string;
  email: string;
  sessionId: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET!, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, config.JWT_SECRET!) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export const generateCsrfToken = (): string => {
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const timestamp = Date.now().toString();
  const payload = `${randomBytes}.${timestamp}`;

  // Sign the CSRF token with JWT_SECRET
  return jwt.sign({ csrf: payload }, config.JWT_SECRET!, { expiresIn: "24h" });
};

export const verifyCsrfToken = (token: string): boolean => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET!) as { csrf: string };
    return !!decoded.csrf;
  } catch (error) {
    return false;
  }
};
