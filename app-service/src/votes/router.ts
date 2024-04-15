import { Router, Request, Response } from "express";
import {
  errorPassthrough,
  handleValidationErrors,
  verifyToken,
} from "../utils/express.js";
import UsersService from "../users/service.js";
import VotesService from "./service.js";
import { body, param } from "express-validator";

const router = Router();

router.get(
  "/me",
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const votesService = new VotesService();
    const user = await votesService.getVotesForUser(req.userId as string);
    res.status(200).send({
      data: user,
    });
  })
);

router.get(
  "/:billId/me",
  [param("billId").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const votesService = new VotesService();
    const vote = await votesService.getVoteByBillIdAndUserId(
      req.params.billId,
      req.userId as string
    );

    res.status(200).send({
      data: vote,
    });
  })
);

router.post(
  "/:billId",
  [param("billId").exists(), body("position").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const votesService = new VotesService();
    const response = await votesService.upsertVote({
      ...(req.body as { position: boolean }),
      bill: { connect: { id: req.params.billId } },
      user: { connect: { id: req.userId as string } },
    });
    res.status(201).send({
      data: response,
    });
  })
);

export default router;
