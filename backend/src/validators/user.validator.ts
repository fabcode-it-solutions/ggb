import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    roleIds: z.array(z.string()).min(1, "At least one role is required"),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    isActive: z.boolean().optional(),
    roleIds: z.array(z.string()).optional(),
  }),
  params: z.object({
    id: z.string().cuid("Invalid user ID format"),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid user ID format"),
  }),
});
