import { defineCommand } from "citty";
import { getAllMigrations } from "../utils/getAllMigrations";
import difference from "lodash/difference";
import fs from "node:fs/promises";
import path from "node:path";
import { templates } from "../templates";
import { fileExists } from "../utils/fileExists";

export const create = defineCommand({
  meta: {
    description: "Generate an initial migration, without running it.",
  },
  args: {
    withData: {
      alias: ["with-data", "wd"],
      type: "boolean",
      description: "Does this migration need data-migration scripting?",
      default: false,
    },
    typeSafe: {
      alias: ["type-safe", "t"],
      type: "boolean",
      description:
        "Does this migration require a type-safe data-migration using a snapshot of the Prisma schema?",
      default: false,
    },
  },
  async run({ args }) {
    if (args.typeSafe && !args.withData) {
      console.error(
        `The "--type-safe, -t" argument requires the "--with-data, --wd" argument.`
      );
      process.exit(255);
    }

    if (!(await fileExists(path.resolve(process.cwd(), "./prisma")))) {
      console.error(
        `This CLI must be run from your project root, which should have a "prisma" directory.`
      );
      process.exit(255);
    }

    const allInitialMigrations = await getAllMigrations();

    // Run the underlying Prisma migration generator command
    // TODO - Better process the stdio, and avoid printing
    // messages from Prisma like:
    // > "You can now edit it and apply it by running prisma migrate dev."
    try {
      await $`prisma migrate dev --create-only`.stdio(
        "inherit",
        "inherit",
        "inherit"
      );
    } catch (e) {
      if (
        e instanceof Error &&
        "exitCode" in e &&
        typeof e.exitCode === "number"
      ) {
        process.exit(e.exitCode);
      } else throw e;
    }

    if (!args.withData) {
      process.exit(0);
    }

    const allNewMigrations = await getAllMigrations();

    const newMigrations = difference(allNewMigrations, allInitialMigrations);

    if (newMigrations.length !== 1) {
      console.error("Migration failed to generate as expected.");
      process.exit(255);
    }

    const [migration] = newMigrations;

    await fs.copyFile(
      templates[
        args.typeSafe ? "typed-data-migration.ts" : "untyped-data-migration.ts"
      ],
      path.resolve(
        process.cwd(),
        `./prisma/migrations/${migration}/data-migration.ts`
      )
    );

    if (args.typeSafe) {
      await fs.copyFile(
        path.resolve(process.cwd(), "./prisma/schema.prisma"),
        path.resolve(
          process.cwd(),
          `./prisma/migrations/${migration}/snapshot.prisma`
        )
      );
    }
  },
});
