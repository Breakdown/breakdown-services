import { Router, Request, Response } from "express";
import {
  cacheUserSpecificResponse,
  errorPassthrough,
  handleValidationErrors,
  requireAuth,
  userSpecificCachedRequest,
} from "../utils/express.js";
import UsersService from "./service.js";

const router = Router();

router.get(
  "/me",
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(userSpecificCachedRequest),
  errorPassthrough(async (req: Request, res: Response) => {
    const usersService = new UsersService(req.session.userId as string);
    const me = await usersService.getMe();
    const data = {
      data: {
        user: me,
      },
    };
    await cacheUserSpecificResponse(req, data, req.session.userId as string);
    res.status(200).send(data);
  })
);

router.patch(
  "/me",
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const usersService = new UsersService(req.session.userId as string);
    const me = await usersService.patchMe(req.body);
    res.status(201).send({
      data: {
        user: me,
      },
    });
  })
);

export default router;
