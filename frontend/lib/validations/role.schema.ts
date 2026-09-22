import { z } from "zod";
import { RoleType } from "@/types";

export const createRoleSchema = z.object({
  type: z.nativeEnum(RoleType, {
    message: "Invalid role type",
  }),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  permissions: z.record(z.string(), z.boolean()),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
