import prisma from "../config/database";
import { AppError } from "../middlewares/errorHandler";
import {
  InventoryType,
  ProductType,
  ProductionPlanningItem,
} from "../types";
import { logService } from "./log.service";

interface CreateProductDto {
  inventoryType: InventoryType;
  productType: Exclude<ProductType, "all">;
  sku: string;
  ggbNumber?: number;
  dealerNumber?: number;
  inventoryCount: number;
  wipCount?: number;
  buildCount?: number;
}

interface UpdateProductDto {
  productType?: Exclude<ProductType, "all">;
  ggbNumber?: number;
  dealerNumber?: number;
  inventoryCount?: number;
  wipCount?: number;
  buildCount?: number;
}

interface BulkUpdateProductDto {
  id: string;
  ggbNumber?: number;
  dealerNumber?: number;
  wipCount?: number;
  buildCount?: number;
}

export const productService = {
  // Create product
  async createProduct(data: CreateProductDto, createdBy: string) {
    const {
      sku,
      inventoryType,
      productType,
      ggbNumber,
      dealerNumber,
      inventoryCount,
      wipCount,
      buildCount,
    } = data;

    // Check if SKU already exists
    const existingProduct = await prisma.product.findFirst({
      where: { sku },
    });

    if (existingProduct) {
      throw new AppError("Product with this SKU already exists", 409);
    }

    const product = await prisma.product.create({
      data: {
        sku,
        inventoryType,
        productType,
        ggbNumber,
        dealerNumber,
        inventoryCount,
        wipCount: wipCount || 0,
        buildCount: buildCount || 0,
        updatedBy: createdBy,
      },
    });

    // Log the action
    await logService.create({
      userId: createdBy,
      type: "CREATE",
      action: "Created new product",
      note: `Created product: ${product.sku}`,
      metadata: { productId: product.id },
    });

    return product;
  },

  normalizeSku(value: string) {
    return value.trim().toLowerCase();
  },
  // Put this function in the same class/service
  naturalSort(a: string, b: string, order: string = "asc"): number {
    const aParts = a.match(/(\d+|\D+)/g) || [];
    const bParts = b.match(/(\d+|\D+)/g) || [];

    const maxLength = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < maxLength; i++) {
      const aPart = aParts[i] || "";
      const bPart = bParts[i] || "";

      const aNum = parseInt(aPart);
      const bNum = parseInt(bPart);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        if (aNum !== bNum) {
          return order === "asc" ? aNum - bNum : bNum - aNum;
        }
      } else {
        const comparison = aPart.localeCompare(bPart);
        if (comparison !== 0) {
          return order === "asc" ? comparison : -comparison;
        }
      }
    }

    return 0;
  },

  // Get all products with filters
  async getAllProducts(filters: {
    page?: number;
    limit?: number;
    inventoryType?: InventoryType;
    productType?: Exclude<ProductType, "all"> | "all";
    search?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.inventoryType) {
      where.inventoryType = filters.inventoryType;
    }

    if (filters.productType && filters.productType !== "all") {
      where.productType = filters.productType;
    }
    const searchNumber = Number(filters.search);
    const isNumberSearch = !isNaN(searchNumber);
    const isAnInteger = Number.isInteger(searchNumber);
    if (filters.search) {
      where.OR = [
        { sku: { contains: filters.search, mode: "insensitive" } },
        {
          shopifyProductId: {
            contains: String(filters.search),
            mode: "insensitive",
          },
        },
      ];
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Get ALL products
    let products = await prisma.product.findMany({
      where,
      include: {
        updater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Natural sort by SKU
    products.sort((a, b) => this.naturalSort(a.sku, b.sku, "asc"));

    // Apply pagination
    products = products.slice(skip, skip + limit);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getProductionPlanning(filters: {
    page?: number;
    limit?: number;
    inventoryType?: "SNOW" | "SXS" | "all";
    search?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const inventoryTypes =
      filters.inventoryType && filters.inventoryType !== "all"
        ? [filters.inventoryType]
        : ["SNOW", "SXS"];

    const where: any = {
      inventoryType: { in: inventoryTypes },
    };

    if (filters.search) {
      where.OR = [
        { sku: { contains: filters.search, mode: "insensitive" } },
        {
          shopifyProductId: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const total = await prisma.product.count({ where });

    let products = await prisma.product.findMany({
      where,
      include: {
        updater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    products.sort((a, b) => this.naturalSort(a.sku, b.sku, "asc"));
    const paginatedProducts = products.slice(skip, skip + limit);

    const requiredBySku = new Map<string, number>();
    if (paginatedProducts.length > 0) {
      const skuSet = new Set(
        paginatedProducts.map((product) => this.normalizeSku(product.sku)),
      );

      const orders = await prisma.order.findMany({
        select: {
          lineItems: true,
        },
      });

      for (const order of orders) {
        const lineItems = Array.isArray(order.lineItems) ? order.lineItems : [];
        for (const lineItem of lineItems) {
          const sku =
            typeof lineItem === "object" &&
            lineItem !== null &&
            "sku" in lineItem &&
            typeof lineItem.sku === "string"
              ? this.normalizeSku(lineItem.sku)
              : null;
          const quantity =
            typeof lineItem === "object" &&
            lineItem !== null &&
            "quantity" in lineItem &&
            typeof lineItem.quantity === "number"
              ? lineItem.quantity
              : 0;

          if (!sku || !skuSet.has(sku)) continue;
          requiredBySku.set(sku, (requiredBySku.get(sku) || 0) + quantity);
        }
      }
    }

    const data: ProductionPlanningItem[] = paginatedProducts.map((product) => ({
      ...product,
      inventoryType: product.inventoryType as "SNOW" | "SXS",
      productType: product.productType as Exclude<ProductType, "all">,
      ggbNumber: product.ggbNumber ?? null,
      dealerNumber: product.dealerNumber ?? null,
      buildCount: product.buildCount ?? 0,
      requiredQty: requiredBySku.get(this.normalizeSku(product.sku)) || 0,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  },

  // Get product by ID
  async getProductById(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        updater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  },

  // Get product by SKU
  async getProductBySku(sku: string) {
    const product = await prisma.product.findFirst({
      where: { sku },
      include: {
        updater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  },

  // Update product
  async updateProduct(
    productId: string,
    data: UpdateProductDto,
    updatedBy: string,
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const updateData: any = {
      updatedBy,
    };

    if (data.productType) updateData.productType = data.productType;
    if (data.ggbNumber !== undefined) updateData.ggbNumber = data.ggbNumber;
    if (data.dealerNumber !== undefined)
      updateData.dealerNumber = data.dealerNumber;
    if (data.inventoryCount !== undefined)
      updateData.inventoryCount = data.inventoryCount;
    if (data.wipCount !== undefined) updateData.wipCount = data.wipCount;
    if (data.buildCount !== undefined) updateData.buildCount = data.buildCount;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        updater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log the action
    await logService.create({
      userId: updatedBy,
      type: "UPDATE",
      action: "Updated product",
      note: `Updated product: ${updatedProduct.sku}`,
      metadata: { productId, changes: data },
    });

    return updatedProduct;
  },

  async bulkUpdateProducts(data: BulkUpdateProductDto[], updatedBy: string) {
    if (data.length === 0) {
      throw new AppError("At least one product update is required", 400);
    }

    const productIds = data.map((item) => item.id);
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
      },
    });

    if (existingProducts.length !== productIds.length) {
      throw new AppError("One or more products were not found", 404);
    }

    await prisma.$transaction(
      data.map((item) =>
        prisma.product.update({
          where: { id: item.id },
          data: {
            updatedBy,
            ...(item.ggbNumber !== undefined
              ? { ggbNumber: item.ggbNumber }
              : {}),
            ...(item.dealerNumber !== undefined
              ? { dealerNumber: item.dealerNumber }
              : {}),
            ...(item.wipCount !== undefined ? { wipCount: item.wipCount } : {}),
            ...(item.buildCount !== undefined
              ? { buildCount: item.buildCount }
              : {}),
          },
        }),
      ),
    );

    await logService.create({
      userId: updatedBy,
      type: "UPDATE",
      action: "Bulk updated products",
      note: `Bulk updated ${data.length} products`,
      metadata: {
        productIds,
        changes: data,
      },
    });

    return {
      updatedCount: data.length,
    };
  },

  // Delete product
  async deleteProduct(productId: string, deletedBy: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    // Log the action
    await logService.create({
      userId: deletedBy,
      type: "DELETE",
      action: "Deleted product",
      note: `Deleted product: ${product.sku}`,
      metadata: { productId },
    });

    return { message: "Product deleted successfully" };
  },

  // Get inventory summary
  async getInventorySummary() {
    const summary = await prisma.product.groupBy({
      by: ["inventoryType", "productType"],
      _sum: {
        inventoryCount: true,
        wipCount: true,
      },
      _count: {
        id: true,
      },
    });

    return summary;
  },
};
