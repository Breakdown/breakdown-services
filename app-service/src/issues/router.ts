import { Router, Request, Response } from "express";
import IssuesService from "./service.js";
import {
  errorPassthrough,
  handleValidationErrors,
  requireAuth,
} from "../utils/express.js";
import { param } from "express-validator";

const router = Router();

router.get(
  "/",
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const issuesService = new IssuesService();
    const issues = await issuesService.getIssues();
    res.status(200).send({
      data: issues,
    });
  })
);

router.get(
  "/:id",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const { id } = req.params;
    const issuesService = new IssuesService();
    const issue = await issuesService.getIssueById(id);
    res.status(200).send({
      data: issue,
    });
  })
);

router.get(
  "/:id/bills",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const { id } = req.params;
    const issuesService = new IssuesService();
    const bills = await issuesService.getBillsForIssueId(id);
    res.status(200).send({
      data: bills,
    });
  })
);

router.get(
  "/following",
  errorPassthrough(requireAuth),
  errorPassthrough(async (req, res) => {
    const issuesService = new IssuesService();
    const issues = await issuesService.getFollowingIssuesFromUserId(
      req.session.userId as string
    );
    res.status(200).send({
      data: issues,
    });
  })
);

export default router;
