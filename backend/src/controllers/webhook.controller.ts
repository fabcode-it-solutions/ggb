import { Request, Response, NextFunction } from "express";
import { webhookService } from "../services/webhook.service";
import { sendSuccess } from "../utils/response.util";

export const webhookController = {
  // Create webhook
  async createWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const createdBy = req.user!.id;
      const webhook = await webhookService.createWebhook(req.body, createdBy);
      sendSuccess(res, webhook, "Webhook created successfully", 201);
    } catch (error) {
      next(error);
    }
  },

  // Get all webhooks
  async getAllWebhooks(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page, limit, status, orderId } = req.query;
      const result = await webhookService.getAllWebhooks({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as any,
        orderId: orderId as string,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  // Get webhook by ID
  async getWebhookById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const webhook = await webhookService.getWebhookById(id);
      sendSuccess(res, webhook);
    } catch (error) {
      next(error);
    }
  },

  // Get webhook by order ID
  async getWebhookByOrderId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { orderId } = req.params;
      const webhooks = await webhookService.getWebhookByOrderId(orderId);
      sendSuccess(res, webhooks);
    } catch (error) {
      next(error);
    }
  },

  // Update webhook
  async updateWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updatedBy = req.user!.id;
      const webhook = await webhookService.updateWebhook(
        id,
        req.body,
        updatedBy
      );
      sendSuccess(res, webhook, "Webhook updated successfully");
    } catch (error) {
      next(error);
    }
  },

  // Delete webhook
  async deleteWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = req.user!.id;
      const result = await webhookService.deleteWebhook(id, deletedBy);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  // Retrigger single webhook
  async retriggerWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const webhook = await webhookService.retriggerWebhook(id, userId);
      sendSuccess(res, webhook, "Webhook retriggered successfully");
    } catch (error) {
      next(error);
    }
  },

  // Retrigger multiple webhooks
  async retriggerMultipleWebhooks(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { webhookIds } = req.body;
      const userId = req.user!.id;
      const result = await webhookService.retriggerMultipleWebhooks(
        webhookIds,
        userId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  // Get webhook statistics
  async getWebhookStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await webhookService.getWebhookStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  },

  // Get recent failures
  async getRecentFailures(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const failures = await webhookService.getRecentFailures(limit);
      sendSuccess(res, failures);
    } catch (error) {
      next(error);
    }
  },
};
