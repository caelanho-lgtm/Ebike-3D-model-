import { prisma } from "./db.js";
import { getConfig } from "./config.js";
import { createServer } from "./server.js";

async function start(): Promise<void> {
  const config = getConfig();
  const app = await createServer(config);

  const shutdown = async () => {
    await app.close();
    await prisma.$disconnect();
  };

  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
