import { Router } from "express";
import { webhookController } from "../controllers/webhook.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validator";
import {
  createWebhookSchema,
  updateWebhookSchema,
  retriggerWebhookSchema,
  webhookIdSchema,
  webhookOrderIdSchema,
} from "../validators/webhook.validator";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Webhook:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [NOT_UPDATED, UPDATED]
 *         attempts:
 *           type: integer
 *         responseData:
 *           type: object
 *         errorMessage:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// All webhook routes require authentication and admin access
// Note: You can change this to checkPermission("webhooks") if you add that permission
router.use(authenticate, checkPermission("logs")); // Using 'logs' permission for now, change as needed

/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     summary: Get all webhooks
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NOT_UPDATED, UPDATED, all]
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhooks retrieved successfully
 *   post:
 *     summary: Create webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *               responseData:
 *                 type: object
 *               errorMessage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Webhook created successfully
 */

// Create webhook
router.post(
  "/",
  validate(createWebhookSchema),
  webhookController.createWebhook
);

// Get all webhooks (with filters)
router.get("/", webhookController.getAllWebhooks);

// Get webhook statistics
router.get("/stats", webhookController.getWebhookStats);

// Get recent failures
router.get("/failures", webhookController.getRecentFailures);

// Retrigger multiple webhooks (bulk action)
router.post(
  "/retrigger-multiple",
  validate(retriggerWebhookSchema),
  webhookController.retriggerMultipleWebhooks
);

// Get webhook by ID
router.get("/:id", validate(webhookIdSchema), webhookController.getWebhookById);

// Update webhook
router.put(
  "/:id",
  validate(updateWebhookSchema),
  webhookController.updateWebhook
);

// Delete webhook
router.delete(
  "/:id",
  validate(webhookIdSchema),
  webhookController.deleteWebhook
);

// Retrigger single webhook
router.post(
  "/:id/retrigger",
  validate(webhookIdSchema),
  webhookController.retriggerWebhook
);

// Get webhook by order ID
router.get(
  "/order/:orderId",
  validate(webhookOrderIdSchema),
  webhookController.getWebhookByOrderId
);

export default router;
