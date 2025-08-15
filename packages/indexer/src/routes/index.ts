import { BASE_PATH, healthRoute } from "@intmax2-function/shared";
import { route as indexerRoute } from "./indexer.route";
import { route as proxyRoute } from "./proxy.route";
import { route as timeRoute } from "./time.route";

export const routes = [
  {
    path: `${BASE_PATH}/health`,
    route: healthRoute,
  },
  {
    path: `${BASE_PATH}/indexer`,
    route: indexerRoute,
  },
  {
    path: `${BASE_PATH}/proxy`,
    route: proxyRoute,
  },
  {
    path: `${BASE_PATH}/time`,
    route: timeRoute,
  },
];
