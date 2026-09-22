import { Router } from "express";
import { logController } from "../controllers/log.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/rbac.middleware";

const router = Router();

// All log routes require authentication and 'logs' permission
router.use(authenticate, checkPermission("logs"));

router.get("/", logController.getLogs);

export default router;
