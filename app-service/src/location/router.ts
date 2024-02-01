import { Router, Request, Response } from "express";
import { body, param } from "express-validator";
import {
  errorPassthrough,
  handleValidationErrors,
  requireAuth,
} from "../utils/express.js";
import LocationService from "./service.js";

const router = Router();

router.post(
  "/latlon",
  [body("lat").exists(), body("lon").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const locationService = new LocationService();
    await locationService.submitUserLocationLatLon(
      req.session.userId as string,
      req.body.lat,
      req.body.lon
    );
    res.status(201).send({
      data: {
        success: true,
      },
    });
  })
);

router.post(
  "/address",
  [body("address").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const locationService = new LocationService();
    await locationService.submitUserLocationAddress(
      req.session.userId as string,
      req.body.address
    );
    res.status(201).send({
      data: {
        success: true,
      },
    });
  })
);

export default router;
