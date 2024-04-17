import { Router, Request, Response } from "express";
import IssuesService from "./service.js";
import {
  errorPassthrough,
  handleValidationErrors,
  verifyToken,
} from "../utils/express.js";
import { body, param } from "express-validator";

const router = Router();

router.get(
  "/",
  errorPassthrough(async (req: Request, res: Response) => {
    const issuesService = new IssuesService();
    const issues = await issuesService.getIssues();
    const response = {
      data: issues,
    };
    res.status(200).send(response);
  })
);

router.get(
  "/featured",
  errorPassthrough(async (req: Request, res: Response) => {
    const issuesService = new IssuesService();
    const issues = await issuesService.getFeaturedIssues();
    const response = {
      data: issues,
    };
    res.status(200).send(response);
  })
);

router.get(
  "/following",
  errorPassthrough(verifyToken),
  errorPassthrough(async (req, res) => {
    const issuesService = new IssuesService();
    const issues = await issuesService.getFollowingIssuesFromUserId(
      req.userId as string
    );
    const response = {
      data: issues,
    };
    res.status(200).send(response);
  })
);

router.get(
  "/:id",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const { id } = req.params;
    const issuesService = new IssuesService();
    const issue = await issuesService.getIssueById(id);
    const response = {
      data: issue,
    };
    res.status(200).send(response);
  })
);

router.get(
  "/:id/bills",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const { id } = req.params;
    const issuesService = new IssuesService();
    const bills = await issuesService.getBillsForIssueId(id);
    const response = {
      data: bills,
    };
    res.status(200).send(response);
  })
);

router.post(
  "/:id/following",
  [body("following").isBoolean().exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const { id } = req.params;
    const issuesService = new IssuesService();
    if (req.body.following) {
      await issuesService.followIssue(id, req.userId as string);
    }
    if (req.body.following === false) {
      await issuesService.unfollowIssue(id, req.userId as string);
    }
    res.status(200).send({
      data: {
        success: true,
      },
    });
  })
);

export default router;
