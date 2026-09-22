// src/controllers/order.controller.ts
import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import { sendSuccess } from "../utils/response.util";

export const orderController = {
  async createOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const order = await orderService.createOrder(req.body, req.user!.id);
      sendSuccess(res, order, "Order created successfully");
    } catch (error) {
      next(error);
    }
  },

  async getOrders(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { page, limit, search, status, sku, startDate, endDate, released } =
        req.query;
      const result = await orderService.getOrders({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string | undefined,
        status: status as any,
        sku: sku as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        released: released as any,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getOrderById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const order = await orderService.getOrderById(req.params.id);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  async updateOrderStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedBy = req.user!.id;
      const order = await orderService.updateOrderStatus(id, status, updatedBy);
      sendSuccess(res, order, "Order status updated successfully");
    } catch (error) {
      next(error);
    }
  },

  async deleteOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await orderService.deleteOrder(
        req.params.id,
        req.user!.id,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getOrderStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const stats = await orderService.getOrderStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  },

  async releaseOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await orderService.releaseOrder(
        req.params.id,
        req.user!.id,
      );
      sendSuccess(res, result, "Order released to Shopify");
    } catch (error) {
      next(error);
    }
  },

  async bulkRelease(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { ids } = req.body as { ids: string[] };
      const result = await orderService.bulkRelease(ids, req.user!.id);
      sendSuccess(res, result, `${result.released} orders released`);
    } catch (error) {
      next(error);
    }
  },
};
