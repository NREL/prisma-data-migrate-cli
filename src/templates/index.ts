import path from "node:path";

export const templates = {
  "typed-data-migration.ts": path.resolve(
    import.meta.dirname,
    "typed-data-migration.ts",
  ),
  "untyped-data-migration.ts": path.resolve(
    import.meta.dirname,
    "untyped-data-migration.ts",
  ),
};
