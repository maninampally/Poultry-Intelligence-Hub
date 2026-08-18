import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import farmsRouter from "./farms";
import batchesRouter from "./batches";
import mortalityRouter from "./mortality";
import feedRouter from "./feed";
import weightRouter from "./weight";
import costsRouter from "./costs";
import vaccinationsRouter from "./vaccinations";
import salesRouter from "./sales";
import insightsRouter from "./insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(farmsRouter);
router.use(batchesRouter);
router.use(mortalityRouter);
router.use(feedRouter);
router.use(weightRouter);
router.use(costsRouter);
router.use(vaccinationsRouter);
router.use(salesRouter);
router.use(insightsRouter);

export default router;
