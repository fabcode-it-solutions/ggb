import { Request, Response, NextFunction } from "express";
import { logService } from "../services/log.service";
import { sendSuccess } from "../utils/response.util";

export const logController = {
  async getLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, type, page, limit, startDate, endDate } = req.query;
      const result = await logService.getLogs({
        userId: userId as string,
        type: type as any,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
};
