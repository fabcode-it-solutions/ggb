import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";
import { sendSuccess } from "../utils/response.util";

export const dashboardController = {
  async getStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await dashboardService.getStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  },

  async getInventoryStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await dashboardService.getInventoryStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  },

  async getRecentActivity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const activity = await dashboardService.getRecentActivity(days);
      sendSuccess(res, activity);
    } catch (error) {
      next(error);
    }
  },

  async getProductTypeBreakdown(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const breakdown = await dashboardService.getProductTypeBreakdown();
      sendSuccess(res, breakdown);
    } catch (error) {
      next(error);
    }
  },

  async getRecentLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const logs = await dashboardService.getRecentLogs(limit);
      sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  },

  async getUserStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await dashboardService.getUserStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  },
};
