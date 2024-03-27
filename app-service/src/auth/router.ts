import { Request, Response, Router } from "express";
import { body } from "express-validator";
import {
  errorPassthrough,
  getDeviceId,
  handleValidationErrors,
} from "../utils/express.js";
import AuthService from "./service.js";
import UnauthorizedError from "../utils/errors/UnauthorizedError.js";

const router = Router();

// router.post(
//   "/apple/signin",
//   [
//     body("email").optional(),
//     body("identityToken").exists(),
//     body("authorizationCode").exists(),
//     body("familyName").optional(),
//     body("givenName").optional(),
//     body("realUserStatus").isInt().optional(),
//   ],
//   errorPassthrough(handleValidationErrors),
//   errorPassthrough(async (req: Request, res: Response) => {
//     const authService = new AuthService();
//     const userId = await authService.appleSignin({
//       email: req.body.email,
//       identityToken: req.body.identityToken,
//       authorizationCode: req.body.authorizationCode,
//       familyName: req.body.familyName,
//       givenName: req.body.givenName,
//       realUserStatus: req.body.realUserStatus,
//     });
//     req.session.userId = userId;
//     req.session.save();
//     res.status(201).send({
//       data: {
//         success: true,
//       },
//     });
//   })
// );
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
    req.session.userId = userId;
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
    const authService = new AuthService();
    const userId = await authService.emailSignin({
      email: req.body.email,
      password: req.body.password,
    });
    console.log("setting userId", userId);
    req.session.userId = userId;
    req.session.save();
    console.log("session after", req.session);
    res.status(201).send({
      data: {
        success: true,
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
    req.session.userId = userId;
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
    req.session.userId = userId;
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
