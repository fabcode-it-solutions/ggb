import prisma from "../config/database";
import { AppError } from "../middlewares/errorHandler";
import { logService } from "./log.service";
import axios from "axios";

type WebhookStatus = "NOT_UPDATED" | "UPDATED";

interface CreateWebhookDto {
  orderId: string;
  responseData?: Record<string, any>;
  errorMessage?: string;
}

interface UpdateWebhookDto {
  status?: WebhookStatus;
  responseData?: Record<string, any>;
  errorMessage?: string;
}

export const webhookService = {
  // Create webhook trigger
  async createWebhook(data: CreateWebhookDto, createdBy: string) {
    const { orderId, responseData, errorMessage } = data;

    const webhook = await prisma.webhookTrigger.create({
      data: {
        orderId,
        status: "NOT_UPDATED",
        attempts: 0,
        responseData: responseData || undefined,
        errorMessage: errorMessage || undefined,
      },
    });

    // Log the action
    await logService.create({
      userId: createdBy,
      type: "CREATE",
      action: "Created webhook trigger",
      note: `Created webhook for order: ${orderId}`,
      metadata: { webhookId: webhook.id, orderId },
    });

    return webhook;
  },

  // Get all webhooks with filters
  async getAllWebhooks(filters: {
    page?: number;
    limit?: number;
    status?: WebhookStatus | "all";
    orderId?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by status
    if (filters.status && filters.status !== "all") {
      where.status = filters.status;
    }

    // Filter by orderId (partial match)
    if (filters.orderId) {
      where.orderId = {
        contains: filters.orderId,
        mode: "insensitive",
      };
    }

    const [webhooks, total] = await Promise.all([
      prisma.webhookTrigger.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.webhookTrigger.count({ where }),
    ]);

    return {
      data: webhooks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Get webhook by ID
  async getWebhookById(webhookId: string) {
    const webhook = await prisma.webhookTrigger.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new AppError("Webhook not found", 404);
    }

    return webhook;
  },

  // Get webhook by order ID
  async getWebhookByOrderId(orderId: string) {
    const webhooks = await prisma.webhookTrigger.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    if (webhooks.length === 0) {
      throw new AppError("No webhooks found for this order ID", 404);
    }

    return webhooks;
  },

  // Update webhook
  async updateWebhook(
    webhookId: string,
    data: UpdateWebhookDto,
    updatedBy: string
  ) {
    const webhook = await prisma.webhookTrigger.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new AppError("Webhook not found", 404);
    }

    const updatedWebhook = await prisma.webhookTrigger.update({
      where: { id: webhookId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.responseData && { responseData: data.responseData }),
        ...(data.errorMessage !== undefined && {
          errorMessage: data.errorMessage,
        }),
      },
    });

    // Log the action
    await logService.create({
      userId: updatedBy,
      type: "UPDATE",
      action: "Updated webhook trigger",
      note: `Updated webhook for order: ${webhook.orderId}`,
      metadata: { webhookId, changes: data },
    });

    return updatedWebhook;
  },

  // Delete webhook
  async deleteWebhook(webhookId: string, deletedBy: string) {
    const webhook = await prisma.webhookTrigger.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new AppError("Webhook not found", 404);
    }

    await prisma.webhookTrigger.delete({
      where: { id: webhookId },
    });

    // Log the action
    await logService.create({
      userId: deletedBy,
      type: "DELETE",
      action: "Deleted webhook trigger",
      note: `Deleted webhook for order: ${webhook.orderId}`,
      metadata: { webhookId, orderId: webhook.orderId },
    });

    return { message: "Webhook deleted successfully" };
  },

  // Retrigger single webhook
  async retriggerWebhook(webhookId: string, userId: string) {
    const webhook = await prisma.webhookTrigger.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new AppError("Webhook not found", 404);
    }

    // Only allow retriggering for NOT_UPDATED status
    if (webhook.status === "UPDATED") {
      throw new AppError("Cannot retrigger already updated webhooks", 400);
    }

    // Call the webhook endpoint (if you have a webhook URL configured)
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl) {
      // If no webhook URL configured, just increment attempts
      const updatedWebhook = await prisma.webhookTrigger.update({
        where: { id: webhookId },
        data: {
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          errorMessage: "No webhook URL configured",
        },
      });

      await logService.create({
        userId,
        type: "UPDATE",
        action: "Webhook retrigger attempted",
        note: `Retrigger failed: No webhook URL configured for order ${webhook.orderId}`,
        metadata: { webhookId, orderId: webhook.orderId },
      });

      return updatedWebhook;
    }

    try {
      // Call the webhook
      const response = await axios.post(
        webhookUrl,
        {
          orderId: webhook.orderId,
          webhookId: webhook.id,
          attempts: webhook.attempts + 1,
          timestamp: new Date().toISOString(),
        },
        {
          timeout: 10000, // 10 second timeout
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": process.env.WEBHOOK_SECRET || "",
          },
        }
      );

      // Update webhook as successful
      const updatedWebhook = await prisma.webhookTrigger.update({
        where: { id: webhookId },
        data: {
          status: "UPDATED",
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          responseData: response.data,
          errorMessage: null,
        },
      });

      await logService.create({
        userId,
        type: "UPDATE",
        action: "Webhook retriggered successfully",
        note: `Successfully retriggered webhook for order ${webhook.orderId}`,
        metadata: {
          webhookId,
          orderId: webhook.orderId,
          statusCode: response.status,
        },
      });

      return updatedWebhook;
    } catch (error: any) {
      // Update webhook with error
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unknown error occurred";

      const updatedWebhook = await prisma.webhookTrigger.update({
        where: { id: webhookId },
        data: {
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          errorMessage,
          responseData: error.response?.data || null,
        },
      });

      await logService.create({
        userId,
        type: "ERROR",
        action: "Webhook retrigger failed",
        note: `Failed to retrigger webhook for order ${webhook.orderId}`,
        metadata: {
          webhookId,
          orderId: webhook.orderId,
          error: errorMessage,
        },
      });

      return updatedWebhook;
    }
  },

  // Retrigger multiple webhooks
  async retriggerMultipleWebhooks(webhookIds: string[], userId: string) {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const webhookId of webhookIds) {
      try {
        await this.retriggerWebhook(webhookId, userId);
        results.success.push(webhookId);
      } catch (error: any) {
        results.failed.push({
          id: webhookId,
          error: error.message || "Unknown error",
        });
      }
    }

    // Log the bulk action
    await logService.create({
      userId,
      type: "UPDATE",
      action: "Bulk webhook retrigger",
      note: `Retriggered ${results.success.length} webhooks, ${results.failed.length} failed`,
      metadata: { results },
    });

    return {
      message: `Retriggered ${results.success.length} webhooks successfully`,
      results,
    };
  },

  // Get webhook statistics
  async getWebhookStats() {
    const [total, notUpdated, updated, failedRecently] = await Promise.all([
      prisma.webhookTrigger.count(),
      prisma.webhookTrigger.count({
        where: { status: "NOT_UPDATED" },
      }),
      prisma.webhookTrigger.count({
        where: { status: "UPDATED" },
      }),
      prisma.webhookTrigger.count({
        where: {
          status: "NOT_UPDATED",
          attempts: { gte: 3 },
        },
      }),
    ]);

    return {
      total,
      notUpdated,
      updated,
      failedRecently,
      successRate:
        total > 0 ? ((updated / total) * 100).toFixed(2) + "%" : "0%",
    };
  },

  // Get recent webhook failures
  async getRecentFailures(limit: number = 10) {
    const failures = await prisma.webhookTrigger.findMany({
      where: {
        status: "NOT_UPDATED",
        attempts: { gt: 0 },
      },
      orderBy: { lastAttemptAt: "desc" },
      take: limit,
    });

    return failures;
  },
};
