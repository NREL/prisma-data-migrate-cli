# prisma-data-migrate-cli

This CLI exposes the processes described in the [Data migrations article from Prisma](https://www.prisma.io/docs/orm/prisma-migrate/workflows/data-migration) as a wrapper CLI around Prisma.

## Table of Contents

- [Installation](#installation)
- [Commands](#commands)
  - [apply](#apply)
  - [create](#create)
  - [client-rewind](#client-rewind)
- [Usage](#usage)
  - [Usage example](#usage-example)
  - [Usage recommendations](#usage-recommendations)
- [Caveats](#caveats)
- [License](#license)

## Installation

`npm i prisma-data-migrate-cli`

or

`yarn add prisma-data-migrate-cli`

Make sure you add a commit hash to the URL, otherwise every installation will will pull the latest version available on the `main` branch.

## Commands

### `apply`

This is the core command provided by this CLI. This should be a drop-in-replacement for [`prisma migrate deploy`](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#migrate-deploy). This command applies migrations one-by-one to your database schema, but in between each migration, it will check for the existence of a `data-migration.ts` file and run that script. This allows you to add data-migrations to your CI/CD pipeline.

#### Syntax

```sh
prisma-data-migrate-cli apply
```

### `create`

This is an optional helper command, meant to create a `data-migration.ts` file stub inside the directory for the latest migration.

#### Syntax

```sh
prisma-data-migrate-cli create [options]
```

#### Options

- `--snapshot`, `--s`: Declare if you would like a `snapshot.prisma` file added to represent your schema types. If you do not use this option, then your transaction client will be limited to the commands `$queryRaw` & `$updateRaw`. Defaults to false.

### `client-rewind`

This is optional helper command, meant to roll-back the generated types for your `prisma/client` package to that of a `snapshot.prisma` file.

#### Syntax

```sh
prisma-data-migrate-cli client-rewind [options]
```

#### Options

- `--name`, `--n`: The name of a migration with a `snapshot.prisma` file that you would like to rewind your generated database client types back to. Defaults to the latest migration with a `snapshot.prisma` file.

## Usage

Integrating this CLI into your application requires a few steps. First, this expects that you use the [expand and contract pattern](https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern) for your migrations. So you would make a standard Prisma migration _expanding_ your database model to include new fields. And then you would append a data-migration (using this CLI) on to that migration. Finally, you would make a new migration to _contract_ your data models to remove fields that are no longer necessary.

### Usage example

For instance, imagine you had a Prisma schema with this model.

```prisma
model User {
  id   Int    @id @default(autoincrement())
  name String
}
```

But you want to update the `User` table to have separate `firstName` & `lastName` columns.

First, create your schema _expansion_ by adding the new fields.

```diff
model User {
  id        Int    @id @default(autoincrement())
  name      String
+ firstName String
+ lastName  String
}
```

Now generate your standard migration with `prisma migrate dev --create-only --name expand-user-names`. Next, add a data-migration onto that migration by running `prisma-data-migrate-cli-create --snapshot`. That will add a `snapshot.prisma` and template `data-migration.ts` file alongside the existing `migration.sql` file.

The `data-migration.ts` file is just a single function that represents a database transaction. Update that file to look like this.

```ts
import type { PrismaClient } from "@prisma/client";

// Do not change the function signature
export default async (tx: PrismaClient) => {
  const users = await tx.user.findMany();
  for (const user of users) {
    const [firstName, ...lastName] = user.name.split(" ");
    await tx.user.update({
      data: {
        firstName,
        lastName: lastName.join(" "),
      },
      where: { id: user.id },
    });
  }
};
```

Now, you can perform your model _contraction_ by updating your Prisma schema to remove the `name` property.

```diff
model User {
  id        Int    @id @default(autoincrement())
- name      String
  firstName String
  lastName  String
}
```

Once you are satisfied with your data migration, you can run `prisma-data-migrate-cli apply` to apply each `migration.sql` file and then their `data-migration.ts` file in order.

#### **Have caution continuing onto the final step**

_Finally, you may_ run `prisma migrate dev --create-only --name contract-user-name`. **But be WARNED** Due to [odd behavior in the existing Prisma CLI](https://github.com/prisma/prisma/issues/11184), running `prisma migrate dev --create-only` will _only_ create a new migration _without running it._ **HOWEVER**, any migrations in your repository which have not been run **will be run when this command is executed.** This means that if you chose to not yet run `prisma-data-migrate-cli apply`, then the `prisma migrate` process will run for the expansion migration (`expand-user-names`), **but will not run your `data-migration.ts` file because that process exists outside of Prisma's CLI.** If you try to run `prisma-data-migrate-cli apply` after a migration has been marked by Prisma as applied, the `data-migration.ts` file **will not run.** The logic this CLI uses to determine if a migration needs to be run or not when the `apply` command is invoked relies on the `_prisma_migrations` table created and utilized by Prisma itself.

### Usage recommendations

It is heavily recommend that dependents of this CLI utilize package-scripts to organize these commands into a series of sensible defaults for developers of their application. It is recommended that you only interface with your database schema via these commands.

It is also recommended that you update your `tsconfig.json` file to add an [exclude path](https://www.typescriptlang.org/tsconfig/#exclude) equal to `"prisma/migrations"`. That way type errors coming from your data-model contractions don't flag in your CI/CD.

#### Example

```json
  "scripts": {
    "db:migrate:create": "prisma format && prisma migrate dev --create-only",
    "db:migrate:create:with-data": "prisma format && prisma migrate dev --create-only && prisma-data-migrate-cli create --snapshot",
    "db:migrate:apply": "prisma-data-migrate-cli apply",
    "db:client:rewind": "prisma-data-migrate-cli client-rewind",
  }
```

## Caveats

- Currently there is no command to run _only_ a specific data-migration if your migration history has become out of sync by running the wrong `prisma migrate` command directly.
- There is not yet support for [multi-file schemas](https://www.prisma.io/blog/organize-your-prisma-schema-with-multi-file-support)
- If you are using SQLite and your database file is identified with a relative path, you must either change it to be an absolute path or not use snapshots.

## License

BSD 3-Clause License

Copyright (c) 2022, Alliance for Sustainable Energy LLC, All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

- Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

- Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
