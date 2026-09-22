import prisma from "../config/database";

export const dashboardService = {
  // Get dashboard statistics
  async getStats() {
    const [
      totalProducts,
      totalUsers,
      activeUsers,
      pendingWebhooks,
      totalInventoryCount,
      lowStockCount,
      recentLogsCount,
    ] = await Promise.all([
      // Total products
      prisma.product.count(),

      // Total users
      prisma.user.count(),

      // Active users
      prisma.user.count({ where: { isActive: true } }),

      // Pending webhooks (NOT_UPDATED status)
      prisma.webhookTrigger.count({
        where: { status: "NOT_UPDATED" },
      }),

      // Total inventory count (sum of all inventoryCount)
      prisma.product.aggregate({
        _sum: { inventoryCount: true },
      }),

      // Low stock count (inventoryCount < 10)
      prisma.product.count({
        where: { inventoryCount: { lt: 10 } },
      }),

      // Recent logs count (last 24 hours)
      prisma.log.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalProducts,
      totalUsers,
      activeUsers,
      pendingWebhooks,
      totalInventoryCount: totalInventoryCount._sum.inventoryCount || 0,
      lowStockCount,
      recentLogsCount,
    };
  },

  // Get inventory statistics by type
  async getInventoryStats() {
    const [snowProducts, sxsProducts, totalCounts, wipCounts] =
      await Promise.all([
        // Count SNOW products
        prisma.product.count({
          where: { inventoryType: "SNOW" },
        }),

        // Count SXS products
        prisma.product.count({
          where: { inventoryType: "SXS" },
        }),

        // Total inventory count
        prisma.product.aggregate({
          _sum: { inventoryCount: true },
        }),

        // Total WIP count
        prisma.product.aggregate({
          _sum: { wipCount: true },
        }),
      ]);

    return {
      snowProducts,
      sxsProducts,
      totalInventory: totalCounts._sum.inventoryCount || 0,
      wipCount: wipCounts._sum.wipCount || 0,
    };
  },

  // Get recent activity (logs by day for the last N days)
  async getRecentActivity(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.log.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Group logs by date
    const activityMap = new Map<string, number>();

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      activityMap.set(dateStr, 0);
    }

    // Add actual counts
    logs.forEach(
      (log: { createdAt: string | number | Date; _count: { id: number } }) => {
        const dateStr = new Date(log.createdAt).toISOString().split("T")[0];
        const currentCount = activityMap.get(dateStr) || 0;
        activityMap.set(dateStr, currentCount + log._count.id);
      }
    );

    // Convert to array and sort by date
    const activity = Array.from(activityMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return activity;
  },

  // Get product type breakdown
  async getProductTypeBreakdown() {
    const breakdown = await prisma.product.groupBy({
      by: ["inventoryType", "productType"],
      _count: {
        id: true,
      },
      _sum: {
        inventoryCount: true,
        wipCount: true,
      },
    });

    return breakdown.map(
      (item: {
        inventoryType: any;
        productType: any;
        _count: { id: any };
        _sum: { inventoryCount: any; wipCount: any };
      }) => ({
        inventoryType: item.inventoryType,
        productType: item.productType,
        count: item._count.id,
        inventoryCount: item._sum.inventoryCount || 0,
        wipCount: item._sum.wipCount || 0,
      })
    );
  },

  // Get recent logs (last N logs)
  async getRecentLogs(limit: number = 10) {
    const logs = await prisma.log.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
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
    });

    return logs;
  },

  // Get user statistics by role
  async getUserStats() {
    const stats = await prisma.userRole.groupBy({
      by: ["roleId"],
      _count: {
        userId: true,
      },
    });

    const statsWithRoles = await Promise.all(
      stats.map(async (stat: { roleId: any; _count: { userId: any } }) => {
        const role = await prisma.role.findUnique({
          where: { id: stat.roleId },
          select: { name: true, type: true },
        });
        return {
          roleName: role?.name || "Unknown",
          roleType: role?.type || "Unknown",
          userCount: stat._count.userId,
        };
      })
    );

    return statsWithRoles;
  },
};
