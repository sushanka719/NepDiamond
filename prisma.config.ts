import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? "",
  },
  migrate: {
    async adapter(env) {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: env.DIRECT_URL });
      return new PrismaPg(pool, {
        schema: undefined,
      });
    },
  },
});
