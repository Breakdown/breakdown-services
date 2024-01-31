import { Request, Response, Router } from "express";
import { body } from "express-validator";
import { errorPassthrough, handleValidationErrors } from "../utils/express.js";
import AuthService from "./AuthService.js";

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
    const authService = new AuthService(req.session);
    await authService.emailSignup({
      email: req.body.email,
      password: req.body.password,
      receivePromotions: req.body.receivePromotions,
    });
    req.session = authService.session;
    req.session.save();
    res.status(201).send({
      data: {
        success: true,
      },
    });
  })
);

router.post(
  "/email/signin",
  [body("email").exists().isEmail(), body("password").isString().exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const authService = new AuthService(req.session);
    await authService.emailSignin({
      email: req.body.email,
      password: req.body.password,
    });
    req.session = authService.session;
    req.session.save();
    res.status(201).send({
      data: {
        success: true,
      },
    });
  })
);

router.post(
  "/sms/signup",
  [body("phone").exists(), body("deviceId").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const authService = new AuthService(req.session);
    await authService.smsSignup({
      phone: req.body.phone,
      deviceId: req.body.deviceId,
    });
    req.session = authService.session;
    req.session.save();
    res.status(201).send({
      data: {
        success: true,
      },
    });
  })
);

router.post(
  "/sms/signin",
  [body("phone").exists(), body("deviceId").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const authService = new AuthService(req.session);
    await authService.smsSignin({
      phone: req.body.phone,
      deviceId: req.body.deviceId,
    });
    req.session = authService.session;
    req.session.save();
    res.status(201).send({
      data: {
        success: true,
      },
    });
  })
);

router.post(
  "/sms/signup/verify",
  [body("code").exists(), body("deviceId").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const authService = new AuthService(req.session);
    await authService.verifySmsSignup({
      deviceId: req.body.deviceId,
      code: req.body.code,
    });
    req.session = authService.session;
    req.session.save();
    res.status(201).send({
      data: {
        success: true,
      },
    });
  })
);

router.post(
  "/sms/signin/verify",
  [body("code").exists(), body("deviceId").exists()],
  errorPassthrough(handleValidationErrors),
  errorPassthrough(async (req: Request, res: Response) => {
    const authService = new AuthService(req.session);
    await authService.verifySmsSignin({
      deviceId: req.body.deviceId,
      code: req.body.code,
    });
    req.session = authService.session;
    req.session.save();
    res.status(201).send({
      data: {
        success: true,
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
