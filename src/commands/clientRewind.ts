import { defineCommand } from "citty";
import { getAllMigrations } from "../utils/getAllMigrations";
import path from "node:path";
import { fileExists } from "../utils/fileExists";
import { asyncFind } from "../utils/asyncFind";

export const clientRewind = defineCommand({
  meta: {
    description:
      "Rewind the client to the point in time with a specific data-migration.",
  },
  args: {
    name: {
      alias: ["n"],
      type: "string",
      description:
        "The name of a particular migration to rewind to. Defaults to the most recent migration with a snapshot.prisma file.",
    },
  },
  async run({ args }) {
    const getSnapshotPath = (migrationName: string) =>
      path.resolve(
        process.cwd(),
        "prisma/migrations",
        migrationName,
        "snapshot.prisma"
      );

    const migrationName =
      args.name ??
      (await asyncFind((await getAllMigrations()).reverse(), (migration) =>
        fileExists(getSnapshotPath(migration))
      ));

    if (!migrationName) {
      console.error(`There is no existing migration with a snapshot.prisma.`);
      process.exit(255);
    }

    const snapshotPath = getSnapshotPath(migrationName);

    if (!(await fileExists(snapshotPath))) {
      console.error(
        `There is no snapshot.prisma file at migration ${migrationName}`
      );
      process.exit(255);
    }

    try {
      await $`prisma generate --schema ${snapshotPath}`;
      console.log(
        `Types for @prisma/client rewound to migration ${migrationName}`
      );
    } catch (e) {
      if (
        e instanceof Error &&
        "exitCode" in e &&
        typeof e.exitCode === "number"
      ) {
        console.error(`Failure in underlying "prisma generate" command.`);
        process.exit(e.exitCode);
      } else throw e;
    }
  },
});
