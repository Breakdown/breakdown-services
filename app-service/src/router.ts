import { Router } from "express";
import authRouter from "./auth/router.js";
import billsRouter from "./bills/router.js";
import issuesRouter from "./issues/router.js";
import locationRouter from "./location/router.js";
import repsRouter from "./reps/router.js";
import usersRouter from "./users/router.js";
import votesRouter from "./votes/router.js";
import searchRouter from "./search/router.js";

const baseRouter = Router();

baseRouter.use("/auth", authRouter);
baseRouter.use("/bills", billsRouter);
baseRouter.use("/issues", issuesRouter);
baseRouter.use("/location", locationRouter);
baseRouter.use("/reps", repsRouter);
baseRouter.use("/users", usersRouter);
baseRouter.use("/votes", votesRouter);
baseRouter.use("/search", searchRouter);

export default baseRouter;
