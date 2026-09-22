import { z } from "zod";

const permissionsSchema = z.object({
  roles: z.boolean().optional(),
  inventory: z.boolean().optional(),
  dashboard: z.boolean().optional(),
  analytics: z.boolean().optional(),
  users: z.boolean().optional(),
  logs: z.boolean().optional(),
});

export const createRoleSchema = z.object({
  body: z.object({
    type: z.enum(["ADMIN", "WAREHOUSE"], {
      message: "Type must be either ADMIN or WAREHOUSE",
    }),
    name: z.string().min(1, "Role name is required"),
    description: z.string().optional(),
    permissions: permissionsSchema,
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    permissions: permissionsSchema.optional(),
  }),
  params: z.object({
    id: z.string().cuid("Invalid role ID format"),
  }),
});

export const roleIdSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid role ID format"),
  }),
});
