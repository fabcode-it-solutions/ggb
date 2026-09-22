// src/services/order.service.ts
import prisma from "../config/database";
import { logService } from "./log.service";
import { AppError } from "../middlewares/errorHandler";
type OrderStatus = "PENDING" | "PROCESSING" | "FULFILLED" | "CANCELLED";
type ReleasedFilter = "released" | "unreleased" | "error" | "";

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | "all";
  sku?: string;
  startDate?: string;
  endDate?: string;
  released?: ReleasedFilter;
}

export const orderService = {
  // ── List with pagination + filters ─────────────────────────────────────────
  async getOrders(filters: OrderFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search across orderNo, sku, customerName, customerEmail, shopifyOrderName
    if (filters.search) {
      where.OR = [
        { orderNo: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
        { customerName: { contains: filters.search, mode: "insensitive" } },
        { customerEmail: { contains: filters.search, mode: "insensitive" } },
        { shopifyOrderName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.status && filters.status !== "all") {
      where.status = filters.status;
    }

    if (filters.sku) {
      where.sku = { contains: filters.sku, mode: "insensitive" };
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters.released === "released") {
      where.shopifyOrderId = { not: null };
    } else if (filters.released === "unreleased") {
      where.shopifyOrderId = null;
      where.shopifySyncError = null;
    } else if (filters.released === "error") {
      where.shopifySyncError = { not: null };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
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

  // ── Create (DB only, no Shopify release) ───────────────────────────────────
  async createOrder(
    data: {
      orderNo: string;
      lineItems: { sku: string; quantity: number; price?: string; wipCount?: number | null; buildCount?: number | null }[];
      customerName: string;
      customerEmail: string;
      shippingAddress: {
        address1: string;
        address2?: string;
        city: string;
        province: string;
        zip: string;
        country: string;
      };
      orderTags?: string[];
      notes?: string;
    },
    createdBy: string,
  ) {
    const firstItem = data.lineItems[0];

    const enrichedLineItems = await Promise.all(
      data.lineItems.map(async (item) => {
        const product = await prisma.product
          .findFirst({
            where: { sku: item.sku },
            select: { ggbNumber: true, dealerNumber: true, wipCount: true, inventoryCount: true },
          })
          .catch(() => null);
        return {
          ...item,
          ggbNumber: product?.ggbNumber ?? null,
          dealerNumber: product?.dealerNumber ?? null,
          inventoryCount: product?.inventoryCount ?? null,
          // wipCount and buildCount come from item (manually input by admin)
        };
      }),
    );

    const firstEnriched = enrichedLineItems[0];

    const order = await prisma.order.create({
      data: {
        orderNo: data.orderNo,
        sku: firstEnriched.sku,
        quantity: firstEnriched.quantity,
        lineItems: enrichedLineItems,
        ggbNumber: firstEnriched.ggbNumber ?? null,
        dealerNumber: firstEnriched.dealerNumber ?? null,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        shippingAddress: data.shippingAddress,
        orderTags: data.orderTags ?? [],
        notes: data.notes || null,
        status: "PENDING",
      },
    });

    await logService.create({
      userId: createdBy,
      type: "CREATE",
      action: "Order created",
      note: `Order ${order.orderNo} (${order.sku}) created`,
      metadata: { orderId: order.id, orderNo: order.orderNo, sku: order.sku },
    });

    return order;
  },

  // ── Single order ────────────────────────────────────────────────────────────
  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError("Order not found", 404);
    return order;
  },

  // ── Update status ───────────────────────────────────────────────────────────
  async updateOrderStatus(id: string, status: OrderStatus, updatedBy: string) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError("Order not found", 404);

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });

    await logService.create({
      userId: updatedBy,
      type: "UPDATE",
      action: `Order status updated to ${status}`,
      note: `Order ${order.orderNo} (${order.sku}) status changed to ${status}`,
      metadata: {
        orderId: id,
        orderNo: order.orderNo,
        previousStatus: order.status,
        newStatus: status,
      },
    });

    return updated;
  },

  // ── Delete ──────────────────────────────────────────────────────────────────
  async deleteOrder(id: string, deletedBy: string) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError("Order not found", 404);

    await prisma.order.delete({ where: { id } });

    await logService.create({
      userId: deletedBy,
      type: "DELETE",
      action: "Order deleted",
      note: `Order ${order.orderNo} (${order.sku}) deleted`,
      metadata: { orderId: id, orderNo: order.orderNo, sku: order.sku },
    });

    return { message: "Order deleted successfully" };
  },

  // ── Release single order to Shopify ────────────────────────────────────────
  async releaseOrder(id: string, userId: string) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError("Order not found", 404);

    if (order.shopifyOrderId) {
      return {
        alreadyReleased: true,
        shopifyOrderId: order.shopifyOrderId,
        shopifyOrderName: order.shopifyOrderName,
      };
    }

    const proxyUrl = process.env.SHOPIFY_PROXY_URL ?? "";
    const apiKey = process.env.PROXY_API_KEY ?? "";
    if (!proxyUrl || !apiKey) {
      throw new AppError(
        "Release not configured: missing SHOPIFY_PROXY_URL or PROXY_API_KEY",
        500,
      );
    }

    const resp = await fetch(`${proxyUrl}/release-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ order_id: id }),
    });

    if (!resp.ok) {
      throw new AppError(
        `Release endpoint returned ${resp.status} ${resp.statusText}. Check SHOPIFY_PROXY_URL — it must point directly to the app server, not through the Shopify storefront proxy.`,
        502,
      );
    }

    const data = (await resp.json()) as {
      ok: boolean;
      shopifyOrderId?: string;
      shopifyOrderName?: string;
      error?: string;
    };

    if (!data.ok) throw new AppError(data.error ?? "Release failed", 502);

    await logService.create({
      userId,
      type: "UPDATE",
      action: "Order released to Shopify",
      note: `Order ${order.orderNo} released as ${data.shopifyOrderName}`,
      metadata: {
        orderId: id,
        orderNo: order.orderNo,
        shopifyOrderId: data.shopifyOrderId,
      },
    });

    return {
      shopifyOrderId: data.shopifyOrderId,
      shopifyOrderName: data.shopifyOrderName,
    };
  },

  // ── Bulk release orders to Shopify ──────────────────────────────────────────
  async bulkRelease(ids: string[], userId: string) {
    const proxyUrl = process.env.SHOPIFY_PROXY_URL ?? "";
    const apiKey = process.env.PROXY_API_KEY ?? "";
    if (!proxyUrl || !apiKey) {
      throw new AppError(
        "Release not configured: missing SHOPIFY_PROXY_URL or PROXY_API_KEY",
        500,
      );
    }

    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const resp = await fetch(`${proxyUrl}/release-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ order_id: id }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
        const data = (await resp.json()) as {
          ok: boolean;
          error?: string;
          shopifyOrderName?: string;
        };
        if (!data.ok) throw new Error(data.error ?? "Release failed");
        return { id, shopifyOrderName: data.shopifyOrderName };
      }),
    );

    const released = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    if (released > 0) {
      await logService.create({
        userId,
        type: "UPDATE",
        action: "Bulk order release",
        note: `${released} orders released, ${failed} failed`,
        metadata: { ids, released, failed },
      });
    }

    return { released, failed };
  },

  // ── Summary stats for dashboard ─────────────────────────────────────────────
  async getOrderStats() {
    const [total, pending, released, unreleased, syncError] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { shopifyOrderId: { not: null } } }),
        prisma.order.count({ where: { shopifyOrderId: null, shopifySyncError: null } }),
        prisma.order.count({ where: { shopifySyncError: { not: null } } }),
      ]);

    return { total, pending, released, unreleased, syncError };
  },
};
