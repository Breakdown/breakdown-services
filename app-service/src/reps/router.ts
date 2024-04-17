import { Router, Request, Response } from "express";
import { body, param } from "express-validator";
import {
  errorPassthrough,
  handleValidationErrors,
  verifyToken,
} from "../utils/express.js";
import RepresentativesService from "./service.js";

const router = Router();

router.get(
  "/featured",
  errorPassthrough(async (request: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const reps = await representativesService.getFeaturedReps({
      limit: request.query.limit ? Number(request.query.limit) : undefined,
      offset: request.query.offset ? Number(request.query.offset) : undefined,
    });
    const data = {
      data: reps,
    };

    res.status(200).send(data);
  })
);

router.get(
  "/following",
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const reps = await representativesService.getFollowingReps(
      req.userId as string
    );
    const data = {
      data: reps,
    };
    res.status(200).send(data);
  })
);

router.get(
  "/me/bills/sponsored",
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const bills = await representativesService.getMyRepsSponsoredBills(
      req.userId as string
    );
    const data = {
      data: bills,
    };
    res.status(200).send(data);
  })
);

router.get(
  "/local",
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const reps = await representativesService.getLocalReps(
      req.userId as string
    );
    const data = {
      data: reps,
    };
    res.status(200).send(data);
  })
);

router.get(
  "/:id",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const rep = await representativesService.getRepById(req.params.id);
    const response = {
      data: rep,
    };
    res.status(200).send(response);
  })
);

router.get(
  "/:id/stats",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const response = await representativesService.getRepStatsById(
      req.params.id
    );
    const data = {
      data: response,
    };
    res.status(200).send(data);
  })
);

router.get(
  "/:id/votes",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const response = await representativesService.getRepVotesById(
      req.params.id
    );
    const data = {
      data: response,
    };
    res.status(200).send();
  })
);

router.get(
  "/:id/bills/sponsored",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const response = await representativesService.getSponsoredBillsById(
      req.params.id
    );

    const data = {
      data: response,
    };
    res.status(200).send(data);
  })
);

router.get(
  "/:id/bills/cosponsored",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const response = await representativesService.getCosponsoredBillsById(
      req.params.id
    );
    const data = {
      data: response,
    };
    res.status(200).send(data);
  })
);

router.post(
  "/:id/following",
  [param("id").exists(), body("following").isBoolean()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    if (req.body.following) {
      await representativesService.followRep(
        req.params.id,
        req.userId as string
      );
    }
    if (req.body.following === false) {
      await representativesService.unfollowRep(
        req.params.id,
        req.userId as string
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
  "/:id/bills/:billId/vote",
  [param("id").exists(), param("billId").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const vote = await representativesService.getRepVoteOnBill(
      req.params.id,
      req.params.billId
    );

    const data = {
      data: vote,
    };
    res.status(200).send(data);
  })
);

export default router;
