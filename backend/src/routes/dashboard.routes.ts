import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/rbac.middleware";

const router = Router();

// All dashboard routes require authentication and 'dashboard' permission
router.use(authenticate, checkPermission("dashboard"));

// Dashboard statistics endpoints
router.get("/stats", dashboardController.getStats);
router.get("/inventory-stats", dashboardController.getInventoryStats);
router.get("/activity", dashboardController.getRecentActivity);
router.get("/product-breakdown", dashboardController.getProductTypeBreakdown);
router.get("/recent-logs", dashboardController.getRecentLogs);
router.get("/user-stats", dashboardController.getUserStats);

export default router;
