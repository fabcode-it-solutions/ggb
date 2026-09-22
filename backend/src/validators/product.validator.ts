import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    inventoryType: z.enum(["SNOW", "SXS", "APPAREL"], {
      message: "Inventory type must be either SNOW or SXS",
    }),
    productType: z.enum([
      "OBSOLETE",
      "QUIET",
      "TRAIL",
      "MOUNTAIN",
      "SXS_QUIET",
      "SXS_TIPS",
      "SXS_DUAL",
      "S_SPORT_PRO",
      "SXS_OTHER",
      "SXS_SPORT",
      "SXS_TRAIL",
      "APPAREL",
    ]),
    sku: z.string().min(1, "SKU is required"),
    ggbNumber: z.number().int().optional(),
    dealerNumber: z.number().int().optional(),
    inventoryCount: z
      .number()
      .int()
      .min(0, "Inventory count must be a positive number"),
    wipCount: z.number().int().min(0).optional(),
    buildCount: z.number().int().min(0).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    productType: z
      .enum([
        "OBSOLETE",
        "QUIET",
        "TRAIL",
        "MOUNTAIN",
        "SXS_QUIET",
        "SXS_TIPS",
        "SXS_DUAL",
        "SXS_OTHER",
        "SXS_SPORT",
        "SXS_TRAIL",
        "APPAREL",
      ])
      .optional(),
    ggbNumber: z.number().int().min(0).optional(),
    dealerNumber: z.number().int().min(0).optional(),
    inventoryCount: z.number().int().min(0).optional(),
    wipCount: z.number().int().min(0).optional(),
    buildCount: z.number().int().min(0).optional(),
  }),
  params: z.object({
    id: z.string().cuid("Invalid product ID format"),
  }),
});

export const productionPlanningQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    inventoryType: z.enum(["SNOW", "SXS", "all"]).optional(),
  }),
});

const bulkProductUpdateItemSchema = z
  .object({
    id: z.string().cuid("Invalid product ID format"),
    ggbNumber: z.number().int().min(0).optional(),
    dealerNumber: z.number().int().min(0).optional(),
    wipCount: z.number().int().min(0).optional(),
    buildCount: z.number().int().min(0).optional(),
  })
  .refine(
    (value) =>
      value.ggbNumber !== undefined ||
      value.dealerNumber !== undefined ||
      value.wipCount !== undefined ||
      value.buildCount !== undefined,
    {
      message: "At least one editable field is required",
      path: ["id"],
    },
  );

export const bulkUpdateProductsSchema = z.object({
  body: z.object({
    updates: z
      .array(bulkProductUpdateItemSchema)
      .min(1, "At least one product update is required"),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid product ID format"),
  }),
});

export const productSkuSchema = z.object({
  params: z.object({
    sku: z.string().min(1, "SKU is required"),
  }),
});
