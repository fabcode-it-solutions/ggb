import { z } from "zod";
import { InventoryType, ProductType } from "@/types";

export const createProductSchema = z.object({
  inventoryType: z.nativeEnum(InventoryType, {
    message: "Invalid inventory type",
  }),
  productType: z.nativeEnum(ProductType, {
    message: "Invalid product type",
  }),
  sku: z.string().min(1, "SKU is required"),
  ggbNumber: z.number().optional(),
  dealerNumber: z.number().optional(),
  inventoryCount: z.number().int().min(0, "Inventory count must be at least 0"),
  wipCount: z.number().int().min(0, "WIP count must be at least 0"),
  buildCount: z.number().int().min(0, "Build count must be at least 0").optional(),
  shopifyProductId: z.string().optional(),
  shopifyOrderId: z.string().optional(),
});

export const updateProductSchema = z.object({
  inventoryType: z.nativeEnum(InventoryType).optional(),
  productType: z.nativeEnum(ProductType).optional(),
  sku: z.string().min(1, "SKU is required").optional(),
  ggbNumber: z.number().optional(),
  dealerNumber: z.number().optional(),
  inventoryCount: z
    .number()
    .int()
    .min(0, "Inventory count must be at least 0")
    .optional(),
  wipCount: z.number().int().min(0, "WIP count must be at least 0").optional(),
  buildCount: z.number().int().min(0, "Build count must be at least 0").optional(),
  shopifyProductId: z.string().optional(),
  shopifyOrderId: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
