import type { PrismaClient } from "@prisma/client";

// Do not change the function signature
export default async (tx: Pick<PrismaClient, "$queryRaw" | "$executeRaw">) => {
  // Migrate your data here.
};
