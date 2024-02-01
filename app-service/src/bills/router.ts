import { Router, Request, Response } from "express";
import { body, param } from "express-validator";
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
    res.status(200).send({
      data: {
        bill,
      },
    });
  })
);

router.get(
  "/:id/sponsor",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const sponsor = await billsService.getBillSponsor(req.params.id);
    res.status(200).send({
      data: {
        sponsor,
      },
    });
  })
);

router.post(
  "/:id/seen",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    await billsService.billSeenByUser(
      req.params.id,
      req.session.userId as string
    );
    res.status(201).send({
      data: {
        success: true,
      },
    });
  })
);

router.post(
  "/:id/follow",
  [param("id").exists(), body("following").isBoolean()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    if (req.body.following) {
      await billsService.followBill(
        req.params.id,
        req.session.userId as string
      );
    }
    if (req.body.following === false) {
      await billsService.unfollowBill(
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
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const bills = await billsService.getFollowingBills(
      req.session.userId as string
    );
    res.status(200).send({
      data: {
        bills,
      },
    });
  })
);
export default router;
