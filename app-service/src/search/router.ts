import { Router, Request, Response } from "express";
import IssuesService from "./service.js";
import {
  errorPassthrough,
  handleValidationErrors,
  verifyToken,
} from "../utils/express.js";
import { body, param } from "express-validator";
import MeilisearchService from "./service.js";

const router = Router();

router.get(
  "/",
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const searchService = new MeilisearchService();
    if (!req.query.q) {
      res.status(200).send({ data: [] });
    }
    const searchResults = await searchService.search(req.query.q as string);
    const response = {
      data: searchResults,
    };
    res.status(200).send(response);
  })
);

export default router;
