#!/usr/bin/env node
import { tsImport } from "tsx/esm/api";

// Silly workaround to avoid ever building out TS
const { default: main } = await tsImport(
  "../prisma-data-migrate-cli/src",
  import.meta.url
);
main();
