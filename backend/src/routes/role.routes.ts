import { Router } from "express";
import { roleController } from "../controllers/role.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validator";
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
} from "../validators/role.validator";

const router = Router();

// All role routes require authentication and 'roles' permission
router.use(authenticate, checkPermission("roles"));

router.post("/", validate(createRoleSchema), roleController.createRole);
router.get("/", roleController.getAllRoles);
router.get("/:id", validate(roleIdSchema), roleController.getRoleById);
router.put("/:id", validate(updateRoleSchema), roleController.updateRole);
router.delete("/:id", validate(roleIdSchema), roleController.deleteRole);

export default router;
