import { tsImport } from "tsx/esm/api";
import path from "node:path";
import { moduleIsValid } from "./moduleIsValid";
import { attemptTransaction } from "./attemptTransaction";
import { defineCommand, runMain } from "citty";

runMain(
  defineCommand({
    args: {
      modulePath: {
        type: "string",
        required: true,
      },
    },
    async run({ args: { modulePath } }) {
      // module is a semi-protected keyword
      const module1 = await (async () => {
        try {
          return (await tsImport(
            path.relative(
              path.dirname(import.meta.url),
              `file://${modulePath}`
            ),
            import.meta.url
          )) as unknown;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          console.error(`Module at ${modulePath} failed to import.`);
          process.exit(255);
        }
      })();

      if (!moduleIsValid(module1)) {
        console.error(
          `Module at ${modulePath} is not of a valid shape. Please refer to the documentation.`
        );
        process.exit(255);
      }

      const migration = module1.default;

      if (Array.isArray(migration)) {
        for (const transaction of migration) {
          try {
            await attemptTransaction(transaction);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            console.error(
              `Data migration script at ${modulePath} failed to complete.`
            );
            const index = migration.indexOf(transaction);
            if (index > 0) {
              console.error(
                `Index ${index} failed, so data-migration script may be partially applied.`
              );
            }
            process.exit(255);
          }
        }
      } else {
        await attemptTransaction(migration);
      }
    },
  })
);
