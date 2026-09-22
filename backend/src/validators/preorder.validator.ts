// app/lib/validations/preorder.ts

import { z } from "zod";

// ─── Shipping address (reused shape from order) ───────────────────────────────

export const shippingAddressSchema = z.object({
  address1: z.string().min(1, "Street address is required"),
  address2: z.string().optional().default(""),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "State / Province is required"),
  zip: z.string().min(1, "ZIP / Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

// ─── Create ───────────────────────────────────────────────────────────────────

export const createPreOrderSchema = z.object({
  orderNo: z.string().min(1, "Order number is required").max(100),

  sku: z.string().min(1, "Part number (SKU) is required").max(100),

  // orderedQty — how many the customer wants
  orderedQty: z
    .number({ invalid_type_error: "Ordered quantity must be a number" })
    .int("Must be a whole number")
    .min(1, "Ordered quantity must be at least 1"),

  // warehouseQty — how many are physically in the warehouse for this SKU.
  // Tracked independently; starts at 0 and is updated manually by warehouse staff.
  warehouseQty: z
    .number({ invalid_type_error: "Warehouse quantity must be a number" })
    .int("Must be a whole number")
    .min(0, "Warehouse quantity cannot be negative")
    .default(0),

  customerName: z.string().min(1, "Customer name is required").max(200),
  customerEmail: z
    .string()
    .min(1, "Email is required")
    .email("Must be a valid email"),

  shippingAddress: shippingAddressSchema,

  orderTags: z
    .array(z.string().min(1).max(50))
    .max(20, "Maximum 20 tags")
    .default([]),

  notes: z
    .string()
    .max(1000, "Notes must be under 1000 characters")
    .optional()
    .default(""),
});

// ─── Update ───────────────────────────────────────────────────────────────────

export const updatePreOrderSchema = createPreOrderSchema.partial().extend({
  status: z
    .enum(["PENDING", "CONFIRMED", "READY", "FULFILLED", "CANCELLED"])
    .optional(),
  // Allow warehouse qty to be updated independently (warehouse staff workflow)
  warehouseQty: z.number().int().min(0).optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreatePreOrderInput = z.infer<typeof createPreOrderSchema>;
export type UpdatePreOrderInput = z.infer<typeof updatePreOrderSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
