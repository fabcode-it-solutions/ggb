import prisma from "../config/database";
import logger from "../utils/logger.util";

type LogType = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "ERROR";

interface CreateLogParams {
  userId?: string;
  type: LogType;
  action: string;
  note?: string;
  metadata?: any;
}

export const logService = {
  async create(params: CreateLogParams): Promise<void> {
    try {
      await prisma.log.create({
        data: {
          userId: params.userId,
          type: params.type,
          action: params.action,
          note: params.note,
          metadata: params.metadata || {},
        },
      });
    } catch (error) {
      logger.error("Failed to create log:", error);
      // Don't throw error - logging failures shouldn't break the app
    }
  },

  async getLogs(filters: {
    userId?: string;
    type?: LogType | "all";
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.type && filters.type !== "all") where.type = filters.type;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};

      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }

      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }
    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.log.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
