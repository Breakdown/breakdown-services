import { Router, Request, Response } from "express";
import { body, param } from "express-validator";
import {
  cacheGenericResponse,
  cacheUserSpecificResponse,
  errorPassthrough,
  genericCachedRequest,
  handleValidationErrors,
  requireAuth,
  userSpecificCachedRequest,
} from "../utils/express.js";
import BillsService from "./service.js";

const router = Router();

router.get(
  "/me",
  errorPassthrough(requireAuth),
  errorPassthrough(userSpecificCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const bills = await billsService.getBillsForUser(
      req.session.userId as string
    );
    const response = {
      data: {
        bills,
      },
    };
    await cacheUserSpecificResponse(
      req,
      response,
      req.session.userId as string
    );
    res.status(200).send(response);
  })
);

router.get(
  "/:id",
  [param("id").exists()],
  // errorPassthrough(handleValidationErrors),
  // errorPassthrough(requireAuth),
  errorPassthrough(genericCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const bill = await billsService.getBillById(req.params.id);
    const response = {
      data: {
        bill,
      },
    };

    await cacheGenericResponse(req, response);
    res.status(200).send(response);
  })
);

router.get(
  "/:id/sponsor",
  [param("id").exists()],
  errorPassthrough(handleValidationErrors),
  // errorPassthrough(requireAuth),
  errorPassthrough(genericCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const sponsor = await billsService.getBillSponsor(req.params.id);
    const response = {
      data: {
        sponsor,
      },
    };
    await cacheGenericResponse(req, response);
    res.status(200).send(response);
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
  errorPassthrough(requireAuth),
  errorPassthrough(userSpecificCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const bills = await billsService.getFollowingBills(
      req.session.userId as string
    );
    const response = {
      data: {
        bills,
      },
    };
    await cacheUserSpecificResponse(
      req,
      response,
      req.session.userId as string
    );
    res.status(200).send(response);
  })
);

router.get(
  "/upcoming",
  errorPassthrough(genericCachedRequest),
  errorPassthrough(requireAuth),
  errorPassthrough(genericCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const billsService = new BillsService();
    const bills = await billsService.getUpcomingBills();
    const response = {
      data: {
        bills,
      },
    };
    await cacheGenericResponse(req, response);
    res.status(200).send(response);
  })
);

export default router;
