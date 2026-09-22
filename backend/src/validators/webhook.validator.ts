import { z } from "zod";

// Create webhook schema
export const createWebhookSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, "Order ID is required"),
    responseData: z.record(z.string(), z.any()).optional(),
    errorMessage: z.string().optional(),
  }),
});

// Update webhook schema
export const updateWebhookSchema = z.object({
  body: z.object({
    status: z.enum(["NOT_UPDATED", "UPDATED"]).optional(),
    responseData: z.record(z.string(), z.any()).optional(),
    errorMessage: z.string().optional(),
  }),
});

// Retrigger webhook schema
export const retriggerWebhookSchema = z.object({
  body: z.object({
    webhookIds: z
      .array(z.string())
      .min(1, "At least one webhook ID is required"),
  }),
});

// Webhook ID param schema
export const webhookIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Webhook ID is required"),
  }),
});

// Webhook order ID param schema
export const webhookOrderIdSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, "Order ID is required"),
  }),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>["body"];
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>["body"];
export type RetriggerWebhookInput = z.infer<
  typeof retriggerWebhookSchema
>["body"];
