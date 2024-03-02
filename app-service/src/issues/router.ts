import { Router, Request, Response } from "express";
import IssuesService from "./service.js";
import {
  cacheGenericResponse,
  cacheUserSpecificResponse,
  errorPassthrough,
  genericCachedRequest,
  handleValidationErrors,
  requireAuth,
  userSpecificCachedRequest,
} from "../utils/express.js";
import { param } from "express-validator";

const router = Router();

router.get(
  "/",
  errorPassthrough(requireAuth),
  errorPassthrough(genericCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const issuesService = new IssuesService();
    const issues = await issuesService.getIssues();
    const response = {
      data: issues,
    };
    await cacheGenericResponse(req, response);
    res.status(200).send(response);
  })
);

router.get(
  "/:id",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(genericCachedRequest),
  // errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const { id } = req.params;
    const issuesService = new IssuesService();
    const issue = await issuesService.getIssueById(id);
    const response = {
      data: issue,
    };
    await cacheGenericResponse(req, response);
    res.status(200).send(response);
  })
);

router.get(
  "/:id/bills",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  // errorPassthrough(requireAuth),
  errorPassthrough(genericCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const { id } = req.params;
    const issuesService = new IssuesService();
    const bills = await issuesService.getBillsForIssueId(id);
    const response = {
      data: bills,
    };
    await cacheGenericResponse(req, response);
    res.status(200).send();
  })
);

router.get(
  "/following",
  errorPassthrough(requireAuth),
  errorPassthrough(userSpecificCachedRequest),
  errorPassthrough(async (req, res) => {
    const issuesService = new IssuesService();
    const issues = await issuesService.getFollowingIssuesFromUserId(
      req.session.userId as string
    );
    const response = {
      data: issues,
    };
    await cacheUserSpecificResponse(
      req,
      response,
      req.session.userId as string
    );
    res.status(200).send(response);
  })
);

export default router;
