import { Router, Request, Response } from "express";
import { param } from "express-validator";
import {
  errorPassthrough,
  handleValidationErrors,
  requireAuth,
} from "../utils/express.js";
import BillsService from "./BillsService.js";

const router = Router();

router.get(
  "/:id",
  [param("id").exists()],
  // errorPassthrough(handleValidationErrors),
  // errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const bill = await billsService.getBillById(req.params.id);
    res.status(201).send({
      data: {
        bill,
      },
    });
  })
);

export default router;
