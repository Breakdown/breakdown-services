import { Request, Response, Router } from "express";
import { body } from "express-validator";
import {
  errorPassthrough,
  getDeviceId,
  handleValidationErrors,
  verifyToken,
} from "../utils/express.js";
import AuthService from "./service.js";
import UnauthorizedError from "../utils/errors/UnauthorizedError.js";
import { generateJwt } from "../utils/jwt.js";

const router = Router();

router.post(
  "/email/signup",
  [
    body("email").exists(),
    body("password")
      .exists()
      .isLength({ min: 8 })
      .withMessage("Password must be minimum 8 characters"),
    body("receivePromotions").isBoolean(),
  ],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const authService = new AuthService();
    const userId = await authService.emailSignup({
      email: req.body.email,
      password: req.body.password,
      receivePromotions: req.body.receivePromotions,
    });
    res.status(201).send({
      data: {
        accessToken: generateJwt(userId),
      },
    });
  })
);

router.post(
  "/email/signin",
  [body("email").exists().isEmail(), body("password").isString().exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const authService = new AuthService();
    const userId = await authService.emailSignin({
      email: req.body.email,
      password: req.body.password,
    });
    res.status(201).send({
      data: {
        accessToken: generateJwt(userId),
      },
    });
  })
);

router.post(
  "/sms/signup",
  [body("phone").exists()],
  getDeviceId,
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const authService = new AuthService();
    if (!req.deviceId) {
      throw new UnauthorizedError("DeviceId not found");
    }
    await authService.smsSignup({
      phone: req.body.phone,
      deviceId: req.deviceId,
    });
    res.status(201).send({
      data: {
        success: true,
      },
    });
  })
);

router.post(
  "/sms/signin",
  [body("phone").exists()],
  getDeviceId,
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const authService = new AuthService();
    if (!req.deviceId) {
      throw new UnauthorizedError("DeviceId not found");
    }
    await authService.smsSignin({
      phone: req.body.phone,
      deviceId: req.deviceId,
    });
    res.status(201).send({
      data: {
        success: true,
      },
    });
  })
);

router.post(
  "/sms/signup/verify",
  [body("code").exists()],
  getDeviceId,
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const authService = new AuthService();
    if (!req.deviceId) {
      throw new UnauthorizedError("DeviceId not found");
    }
    const userId = await authService.verifySmsSignup({
      deviceId: req.deviceId,
      code: req.body.code,
    });
    res.status(201).send({
      data: {
        accessToken: generateJwt(userId),
      },
    });
  })
);

router.post(
  "/sms/signin/verify",
  [body("code").exists()],
  getDeviceId,
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const authService = new AuthService();
    if (!req.deviceId) {
      throw new UnauthorizedError("DeviceId not found");
    }
    const userId = await authService.verifySmsSignin({
      deviceId: req.deviceId,
      code: req.body.code,
    });
    res.status(201).send({
      data: {
        accessToken: generateJwt(userId),
      },
    });
  })
);

router.post(
  "/signout",
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.status(201).send({
        data: {
          success: true,
        },
      });
    });
  })
);

export default router;
