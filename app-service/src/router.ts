import { Router } from "express";
import authRouter from "./auth/router.js";

const baseRouter = Router();

baseRouter.use("/auth", authRouter);

export default baseRouter;
