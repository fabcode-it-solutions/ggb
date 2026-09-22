// src/routes/order.routes.ts
import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validator";
import {
  listOrdersQuerySchema,
  updateOrderStatusSchema,
  orderIdSchema,
  createOrderSchema,
  releaseOrderSchema,
  bulkReleaseSchema,
} from "../validators/order.validator";

const router = Router();

// All order routes require authentication
router.use(authenticate, checkPermission("orders"));

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders with pagination and filters
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by orderNo, SKU, customerName, customerEmail, shopifyOrderName
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, PROCESSING, FULFILLED, CANCELLED, all] }
 *       - in: query
 *         name: sku
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.post("/", validate(createOrderSchema), orderController.createOrder);

router.get("/", validate(listOrdersQuerySchema), orderController.getOrders);

/**
 * @swagger
 * /api/orders/stats:
 *   get:
 *     summary: Get order summary statistics
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 */
router.get("/stats", orderController.getOrderStats);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get("/:id", validate(orderIdSchema), orderController.getOrderById);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, FULFILLED, CANCELLED]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.patch(
  "/:id/status",
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order deleted successfully
 */
router.delete("/:id", validate(orderIdSchema), orderController.deleteOrder);

/**
 * @swagger
 * /api/orders/bulk-release:
 *   post:
 *     summary: Release multiple orders to Shopify
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Bulk release result
 */
router.post(
  "/bulk-release",
  validate(bulkReleaseSchema),
  orderController.bulkRelease,
);

/**
 * @swagger
 * /api/orders/{id}/release:
 *   post:
 *     summary: Release a single order to Shopify
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order released successfully
 */
router.post(
  "/:id/release",
  validate(releaseOrderSchema),
  orderController.releaseOrder,
);

export default router;
