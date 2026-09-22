import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validateCsrf } from "../middlewares/csrf.middleware";
import { authLimiter } from "../middlewares/rateLimiter";
import { validate } from "../middlewares/validator";
import { loginSchema } from "../validators/auth.validator";
import {
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/profile.validator";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *             csrfToken:
 *               type: string
 *             user:
 *               type: object
 *         message:
 *           type: string
 */

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many requests
 */

// Login (with rate limiting)
router.post("/login", authLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent if account exists
 *       429:
 *         description: Too many requests
 */

// Forgot password (with rate limiting)
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// Reset password (with rate limiting)
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid CSRF token
 */

// Logout
router.post("/logout", authenticate, authController.logout);

// Logout all sessions
router.post("/logout-all", authenticate, authController.logoutAllSessions);

// Get active sessions
router.get("/sessions", authenticate, authController.getActiveSessions);

// Get current user profile (me)
router.get("/me", authenticate, authController.me);

// Get profile (alternative endpoint)
router.get("/profile", authenticate, authController.getProfile);

// Update profile
router.put(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile
);

// Change password
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;
