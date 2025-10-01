import { serve } from "@hono/node-server";
import {
  APP_TIMEOUT,
  cache,
  config,
  configureLogging,
  corsMiddleware,
  handleError,
  limiter,
  logger,
  NotFoundError,
  requestMiddleware,
  shutdown,
  TIMEOUT_ERROR,
} from "@intmax2-function/shared";
import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { name } from "../package.json";
import { routes } from "./routes";

const { PORT: port } = config;

const app = new Hono();

app.use(corsMiddleware);
app.use(secureHeaders());
app.use(limiter);
app.use(timeout(APP_TIMEOUT, TIMEOUT_ERROR));
app.use(requestMiddleware);

app.use(prettyJSON());

configureLogging(app);

app.notFound(() => {
  throw new NotFoundError();
});

app.onError(handleError);

routes.forEach(({ path, route }) => {
  app.route(path, route);
});

logger.info("%s server is running on port %d", name.toLocaleUpperCase(), port);

const server = serve({
  fetch: app.fetch,
  port,
});

process.on("SIGTERM", () => shutdown(server, () => cache.flushAll()));
process.on("SIGINT", () => shutdown(server, () => cache.flushAll()));
