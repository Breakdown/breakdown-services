import { Router, Request, Response } from "express";
import { body, param } from "express-validator";
import {
  errorPassthrough,
  handleValidationErrors,
  requireAuth,
} from "../utils/express.js";
import RepresentativesService from "./RepsService.js";

const router = Router();

router.get(
  "/:id",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const representativesService = new RepresentativesService();
    const rep = await representativesService.getRepById(req.params.id);
    res.status(201).send({
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
    res.status(201).send({
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
    res.status(201).send({
      data: {
        votes: response,
      },
    });
  })
);

export default router;
