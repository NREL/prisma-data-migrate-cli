import "dotenv/config";
import "zx/globals";
import { runMain, defineCommand } from "citty";
import { create, apply, clientRewind } from "./commands";

const main = defineCommand({
  meta: {
    name: "prisma-data-migrate-cli",
    version: "0.0.0",
    description: "A CLI wrapper around Prisma migrate commands.",
  },
  subCommands: { create, apply, "client-rewind": clientRewind },
});

export default () => runMain(main);
