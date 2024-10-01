import type { Prisma } from "@prisma/client";

export type Transaction = (client: Prisma.TransactionClient) => Promise<void>;
