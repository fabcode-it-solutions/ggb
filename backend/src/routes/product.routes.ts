import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { adminOnly, checkPermission } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validator";
import {
  bulkUpdateProductsSchema,
  createProductSchema,
  productionPlanningQuerySchema,
  updateProductSchema,
  productIdSchema,
  productSkuSchema,
} from "../validators/product.validator";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         sku:
 *           type: string
 *         inventoryType:
 *           type: string
 *           enum: [SNOW, SXS]
 *         productType:
 *           type: string
 *         ggbNumber:
 *           type: integer
 *         dealerNumber:
 *           type: integer
 *         inventoryCount:
 *           type: integer
 *         wipCount:
 *           type: integer
 */

// All product routes require authentication and 'inventory' permission
router.use(authenticate, checkPermission("inventory"));

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
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
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *   post:
 *     summary: Create new product
 *     tags: [Products]
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
 *               - sku
 *               - inventoryType
 *               - productType
 *               - inventoryCount
 *             properties:
 *               sku:
 *                 type: string
 *               inventoryType:
 *                 type: string
 *                 enum: [SNOW, SXS]
 *               productType:
 *                 type: string
 *               inventoryCount:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product created successfully
 */

router.post(
  "/",
  validate(createProductSchema),
  productController.createProduct,
);
router.get("/", productController.getAllProducts);
router.get(
  "/production-planning",
  validate(productionPlanningQuerySchema),
  productController.getProductionPlanning,
);
router.patch(
  "/bulk-update",
  validate(bulkUpdateProductsSchema),
  productController.bulkUpdateProducts,
);

/**
 * @swagger
 * /api/products/summary:
 *   get:
 *     summary: Get inventory summary
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory summary retrieved
 */
router.get("/summary", productController.getInventorySummary);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.get("/:id", validate(productIdSchema), productController.getProductById);
router.get(
  "/sku/:sku",
  validate(productSkuSchema),
  productController.getProductBySku,
);
router.put(
  "/:id",
  validate(updateProductSchema),
  productController.updateProduct,
);
router.delete(
  "/:id",
  validate(productIdSchema),
  productController.deleteProduct,
);

export default router;
