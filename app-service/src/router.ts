import { Router } from "express";
import authRouter from "./auth/router.js";
import billsRouter from "./bills/router.js";

const baseRouter = Router();

baseRouter.use("/auth", authRouter);
baseRouter.use("/bills", billsRouter);

export default baseRouter;
