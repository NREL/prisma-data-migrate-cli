import { db } from "./db";

export const getAllAppliedMigrations = async () =>
  (
    await db.$queryRaw<Array<{ migration_name: string }>>`
    SELECT ("migration_name") from "_prisma_migrations"
  `
  )
    .map(({ migration_name }) => migration_name)
    .sort();
