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

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(projectsRouter);
router.use(tasksRouter);
router.use(resourcesRouter);
router.use(invoicesRouter);
router.use(pricingRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);

export default router;
