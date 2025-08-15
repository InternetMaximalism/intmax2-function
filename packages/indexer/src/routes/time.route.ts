import { Hono } from "hono";
import * as timeController from "../controllers/time.controller";

export const route = new Hono();

route.get("/", timeController.getTime);
