import { Router, Request, Response } from "express";
import {
  errorPassthrough,
  handleValidationErrors,
  requireAuth,
} from "../utils/express.js";
import UsersService from "../users/service.js";
import VotesService from "./service.js";
import { body, param } from "express-validator";

const router = Router();

router.get(
  "/:billId/me",
  [param("billId").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const votesService = new VotesService();
    const vote = await votesService.getVoteByBillIdAndUserId(
      req.params.billId,
      req.session.userId as string
    );

    res.status(200).send({
      data: {
        vote,
      },
    });
  })
);

router.post(
  "/:billId",
  [param("billId").exists(), body("vote").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const votesService = new VotesService();
    const response = await votesService.upsertVote({
      ...(req.body as { position: boolean }),
      bill: { connect: { id: req.params.billId } },
      user: { connect: { id: req.session.userId as string } },
    });
    res.status(201).send({
      data: {
        vote: response,
      },
    });
  })
);

export default router;
