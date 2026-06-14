import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import clientsRouter from "./clients";
import projectsRouter from "./projects";
import tasksRouter from "./tasks";
import resourcesRouter from "./resources";
import invoicesRouter from "./invoices";
import pricingRouter from "./pricing";
import analyticsRouter from "./analytics";
import notificationsRouter from "./notifications";
import chatRouter from "./chat";
import contactRouter from "./contact";

const router: IRouter = Router();

import { cacheMiddleware } from "../lib/cache";

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(cacheMiddleware(10), clientsRouter);
router.use(cacheMiddleware(10), projectsRouter);
router.use(cacheMiddleware(10), tasksRouter);
router.use(cacheMiddleware(10), resourcesRouter);
router.use(cacheMiddleware(10), invoicesRouter);
router.use(cacheMiddleware(30), analyticsRouter);
router.use(pricingRouter);
router.use(notificationsRouter);
router.use(chatRouter);
router.use(contactRouter);

export default router;
