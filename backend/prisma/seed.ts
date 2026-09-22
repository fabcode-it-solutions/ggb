// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Hash the password
  const hashedPassword = await bcrypt.hash("DEV@2025", 10);

  // Create Admin Role
  console.log("Creating Admin role...");
  const adminRole = await prisma.role.upsert({
    where: { name: "Administrator" },
    update: {},
    create: {
      type: "ADMIN",
      name: "Administrator",
      description: "Full system access with all permissions",
      permissions: {
        roles: true,
        inventory: true,
        dashboard: true,
        analytics: true,
        users: true,
        logs: true,
      },
    },
  });
  console.log("✅ Admin role created:", adminRole.id);

  // Create Warehouse Role
  console.log("Creating Warehouse role...");
  const warehouseRole = await prisma.role.upsert({
    where: { name: "Warehouse Manager" },
    update: {},
    create: {
      type: "WAREHOUSE",
      name: "Warehouse Manager",
      description: "Warehouse and inventory management access",
      permissions: {
        roles: false,
        inventory: true,
        dashboard: true,
        analytics: false,
        users: false,
        logs: false,
      },
    },
  });
  console.log("✅ Warehouse role created:", warehouseRole.id);

  // Create Admin User
  console.log("Creating admin user...");
  const adminUser = await prisma.user.upsert({
    where: { email: "fabdevteam.qa@gmail.com" },
    update: {
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      isActive: true,
    },
    create: {
      email: "fabdevteam.qa@gmail.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      isActive: true,
    },
  });
  console.log("✅ Admin user created:", adminUser.id);

  // Assign Admin Role to User
  console.log("Assigning admin role to user...");
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        // ✅ Fixed: Correct unique constraint name
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });
  console.log("✅ Admin role assigned to user");

  // Create initial log entry
  await prisma.log.create({
    data: {
      userId: adminUser.id,
      type: "CREATE",
      action: "SEED_DATABASE",
      note: "Database seeded with initial admin user and roles",
      metadata: {
        seededAt: new Date().toISOString(),
        version: "1.0.0",
      },
    },
  });
  console.log("✅ Initial log created");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📧 Admin Credentials:");
  console.log("   Email: fabdevteam.qa@gmail.com");
  console.log("   Password: DEV@2025");
  console.log("\n⚠️  Remember to change the password after first login!\n");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
