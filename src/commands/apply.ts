import { defineCommand } from "citty";
import { getAllAppliedMigrations } from "../utils/getAllAppliedMigrations";
import { getAllMigrations } from "../utils/getAllMigrations";
import difference from "lodash/difference";
import { fileExists } from "../utils/fileExists";
import { runTransactionsFromModule } from "../utils/runTransactionsFromModule";

export const apply = defineCommand({
  meta: {
    description: "Apply any unapplied migrations against your database.",
  },
  args: {},
  async run() {
    const appliedMigrations = await getAllAppliedMigrations();
    const allMigrations = await getAllMigrations();

    const unaccountedForMigrations = difference(
      appliedMigrations,
      allMigrations
    ).sort();

    // Exit if there are migrations in the database that aren't in the repo.
    if (unaccountedForMigrations.length > 0) {
      console.error(
        `Unaccounted for migrations: ${JSON.stringify(unaccountedForMigrations)}`
      );
      console.error("No migrations applied, exiting early.");
      process.exit(255);
    }

    // Exit if there are applied unapplied migrations between applied migrations
    if (
      !allMigrations.every(
        (migration, index) =>
          appliedMigrations[index] === undefined ||
          migration === appliedMigrations[index]
      )
    ) {
      console.error(
        "Out-of-order migrations found between the database & repository."
      );
      console.error("No migrations applied, exiting early.");
      process.exit(255);
    }

    const unappliedMigrations = difference(
      allMigrations,
      appliedMigrations
    ).sort();

    for (const migrationName of unappliedMigrations) {
      const migrationDirectory = path.resolve(
        process.cwd(),
        "./prisma/migrations",
        migrationName
      );
      const migrationSqlPath = path.resolve(
        migrationDirectory,
        "migration.sql"
      );

      await $`prisma db execute --file ${migrationSqlPath}`;
      await $`prisma migrate resolve --applied ${migrationName}`;

      const migrationScriptPath = path.resolve(
        migrationDirectory,
        "data-migration.ts"
      );

      if (await fileExists(migrationScriptPath)) {
        await runTransactionsFromModule(migrationScriptPath);
      }
    }
  },
});