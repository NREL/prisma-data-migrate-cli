import { PrismaClient } from "@prisma/client";
import type {
  ClientOtherOps,
  getPrismaClient,
} from "@prisma/client/runtime/library";

// weird type workaround required for this repo
// because if you don't use `prisma generate` then `PrismaClient extends any`
export const db = new PrismaClient() as Omit<
  InstanceType<ReturnType<typeof getPrismaClient>>,
  keyof ClientOtherOps
> &
  ClientOtherOps;
