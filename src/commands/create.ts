import { defineCommand } from "citty";
import { getAllMigrations } from "../utils/getAllMigrations";
import fs from "node:fs/promises";
import path from "node:path";
import { templates } from "../templates";
import { fileExists } from "../utils/fileExists";

export const create = defineCommand({
  meta: {
    description:
      "Generate a data-migration to add to the latest generated migration.",
  },
  args: {
    typeSafe: {
      alias: ["snapshot", "s"],
      type: "boolean",
      description:
        "Should this migration receive a snapshot.prisma file representing the database at that point in time.",
      default: false,
    },
  },
  async run({ args }) {
    if (!(await fileExists(path.resolve(process.cwd(), "prisma")))) {
      console.error(
        `This CLI must be run from your project root, which should have a "prisma" directory.`
      );
      process.exit(255);
    }

    const [migration] = (await getAllMigrations()).reverse();

    if (!migration) {
      console.error("No migrations found.");
      process.exit(255);
    }

    await fs.copyFile(
      templates[
        args.typeSafe ? "typed-data-migration.ts" : "untyped-data-migration.ts"
      ],
      path.resolve(
        process.cwd(),
        `./prisma/migrations/${migration}/data-migration.ts`
      )
    );

    console.log(
      `New data-migration.ts file added to latest migration ${migration}`
    );

    if (!args.typeSafe) return;
    await fs.copyFile(
      path.resolve(process.cwd(), "prisma/schema.prisma"),
      path.resolve(
        process.cwd(),
        "prisma/migrations",
        migration!,
        "snapshot.prisma"
      )
    );

    console.log(
      `New snapshot.prisma file added to latest migration ${migration}`
    );
  },
});
