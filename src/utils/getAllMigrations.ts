import fs from "node:fs/promises";

export const getAllMigrations = async () =>
  (await fs.readdir("./prisma/migrations", { withFileTypes: true }))
    .filter((migration) => migration.isDirectory())
    .map((migration) => migration.name);
