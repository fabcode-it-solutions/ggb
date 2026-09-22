// src/validators/order.validator.ts
import { z } from "zod";

// ─── Shared sub-schema ────────────────────────────────────────────────────────

const shippingAddressSchema = z.object({
  address1: z.string().min(1),
  address2: z.string().optional().default(""),
  city: z.string().min(1),
  province: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1),
});

// ─── List / filter query ──────────────────────────────────────────────────────

export const listOrdersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z
      .enum(["PENDING", "PROCESSING", "FULFILLED", "CANCELLED", "all"])
      .optional(),
    sku: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    released: z.enum(["released", "unreleased", "error", ""]).optional(),
  }),
});

export const releaseOrderSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Order ID is required"),
  }),
});

export const bulkReleaseSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1)).min(1, "At least one order ID is required"),
  }),
});

// ─── Line item ────────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(100),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.string().optional().default(""),
  ggbNumber: z.number().int().nullable().optional(),
  dealerNumber: z.number().int().nullable().optional(),
  wipCount: z.number().int().nullable().optional(),
  buildCount: z.number().int().nullable().optional(),
  inventoryCount: z.number().int().nullable().optional(),
});

// ─── Create ───────────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  body: z.object({
    orderNo: z.string().min(1, "Order number is required").max(100),
    lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
    customerName: z.string().min(1, "Customer name is required").max(200),
    customerEmail: z.string().email("Invalid email address"),
    shippingAddress: shippingAddressSchema,
    orderTags: z.array(z.string()).default([]),
    notes: z.string().max(1000).optional(),
  }),
});

// ─── Update status ────────────────────────────────────────────────────────────

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Order ID is required"),
  }),
  body: z.object({
    status: z.enum(["PENDING", "PROCESSING", "FULFILLED", "CANCELLED"], {
      message: "Invalid status",
    }),
  }),
});

// ─── ID param ─────────────────────────────────────────────────────────────────

export const orderIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Order ID is required"),
  }),
});

// ─── Exported types ───────────────────────────────────────────────────────────

export type CreateOrderInput = z.infer<typeof createOrderSchema>["body"];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>["body"];
