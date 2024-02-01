import { Router, Request, Response } from "express";
import { body, param } from "express-validator";
import {
  errorPassthrough,
  handleValidationErrors,
  requireAuth,
} from "../utils/express.js";
import RepresentativesService from "./service.js";

const router = Router();

router.get(
  "/:id",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const rep = await representativesService.getRepById(req.params.id);
    res.status(200).send({
      data: {
        representative: rep,
      },
    });
  })
);

router.get(
  "/:id/stats",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const response = await representativesService.getRepStatsById(
      req.params.id
    );
    res.status(200).send({
      data: {
        stats: response,
      },
    });
  })
);

router.get(
  "/:id/votes",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const response = await representativesService.getRepVotesById(
      req.params.id
    );
    res.status(200).send({
      data: {
        votes: response,
      },
    });
  })
);

router.get(
  "/:id/bills/sponsored",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const response = await representativesService.getSponsoredBillsById(
      req.params.id
    );
    res.status(200).send({
      data: {
        bills: response,
      },
    });
  })
);

router.get(
  "/:id/bills/cosponsored",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const response = await representativesService.getCosponsoredBillsById(
      req.params.id
    );
    res.status(200).send({
      data: {
        bills: response,
      },
    });
  })
);

router.post(
  "/:id/following",
  [param("id").exists(), body("following").isBoolean()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    if (req.body.following) {
      await representativesService.followRep(
        req.params.id,
        req.session.userId as string
      );
    }
    if (req.body.following === false) {
      await representativesService.unfollowRep(
        req.params.id,
        req.session.userId as string
      );
    }

    res.status(201).send({
      data: {
        success: true,
      },
    });
  })
);

router.get(
  "/following",
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const reps = await representativesService.getFollowingReps(
      req.session.userId as string
    );
    res.status(200).send({
      data: {
        representatives: reps,
      },
    });
  })
);

router.get(
  "/local",
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const reps = await representativesService.getLocalReps(
      req.session.userId as string
    );
    res.status(200).send({
      data: {
        representatives: reps,
      },
    });
  })
);

router.get(
  "/:id/bills/:billId/vote",
  [param("id").exists(), param("billId").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const vote = await representativesService.getRepVoteOnBill(
      req.params.id,
      req.params.billId
    );
    res.status(200).send({
      data: {
        vote,
      },
    });
  })
);

export default router;
