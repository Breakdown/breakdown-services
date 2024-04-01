import { Router, Request, Response } from "express";
import { body, param } from "express-validator";
import {
  cacheGenericResponse,
  cacheUserSpecificResponse,
  errorPassthrough,
  genericCachedRequest,
  handleValidationErrors,
  verifyToken,
  userSpecificCachedRequest,
} from "../utils/express.js";
import BillsService from "./service.js";

const router = Router();

router.get(
  "/me",
  errorPassthrough(verifyToken),
  errorPassthrough(userSpecificCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const bills = await billsService.getBillsForUser(req.userId as string);
    const response = {
      data: bills,
    };
    await cacheUserSpecificResponse(req, response, req.userId as string);
    res.status(200).send(response);
  })
);

router.get(
  "/following",
  errorPassthrough(verifyToken),
  errorPassthrough(userSpecificCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const bills = await billsService.getFollowingBills(req.userId as string);
    const response = {
      data: bills,
    };
    await cacheUserSpecificResponse(req, response, req.userId as string);
    res.status(200).send(response);
  })
);

router.get(
  "/upcoming",
  errorPassthrough(verifyToken),
  errorPassthrough(genericCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const bills = await billsService.getUpcomingBills();
    const response = {
      data: bills,
    };
    await cacheGenericResponse(req, response);
    res.status(200).send(response);
  })
);

router.get(
  "/rep-sponsored",
  errorPassthrough(verifyToken),
  errorPassthrough(userSpecificCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const bills = await billsService.getUserRelevantSponsoredBills(
      req.userId as string
    );
    const response = {
      data: bills,
    };
    await cacheUserSpecificResponse(req, response, req.userId as string);
    res.status(200).send(response);
  })
);

router.get(
  "/:id",
  [param("id").exists()],
  // errorPassthrough(handleValidationErrors),
  // errorPassthrough(verifyToken),
  errorPassthrough(genericCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const bill = await billsService.getBillById(req.params.id);
    const response = {
      data: bill,
    };

    await cacheGenericResponse(req, response);
    res.status(200).send(response);
  })
);

router.get(
  "/:id/sponsor",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  // errorPassthrough(verifyToken),
  errorPassthrough(genericCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const sponsor = await billsService.getBillSponsor(req.params.id);
    const response = {
      data: sponsor,
    };
    await cacheGenericResponse(req, response);
    res.status(200).send(response);
  })
);

router.post(
  "/:id/seen",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    await billsService.billSeenByUser(req.params.id, req.userId as string);
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
  errorPassthrough(verifyToken),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    if (req.body.following) {
      await billsService.followBill(req.params.id, req.userId as string);
    }
    if (req.body.following === false) {
      await billsService.unfollowBill(req.params.id, req.userId as string);
    }
    res.status(201).send({
      data: {
        success: true,
      },
    });
  })
);

export default router;
