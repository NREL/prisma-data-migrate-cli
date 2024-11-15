import path from "node:path";

// MAJOR UPDATE, I need to run $`prisma generate` for the types of the client
// and then run the modules via $`tsx ...` so that they get the properly typed DB clients
export const runDataMigration = async (
  modulePath: string,
  schemaSnapshotPath?: string
) => {
  if (schemaSnapshotPath) {
    try {
      await $`prisma generate --schema ${schemaSnapshotPath}`;
    } catch (e) {
      console.error(
        `"prisma generate" is always run for data-migrations which have a snapshot.prisma file. However, the snapshot at ${schemaSnapshotPath} at failed client generation, so the migration cannot be complete.`
      );
      process.exit(255);
    }
  }

  // This module has to be rerun manually via tsx because if we just ran `prisma generate`
  // then it might rely on an entirely different @prisma/client than is in the current import cache
  await $`tsx ${path.resolve(import.meta.dirname, "runTransactionsFromModule.ts")} --modulePath ${modulePath}`.stdio(
    "inherit",
    "inherit",
    "inherit"
  );
};
