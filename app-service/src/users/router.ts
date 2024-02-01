import { Router, Request, Response } from "express";
import {
  errorPassthrough,
  handleValidationErrors,
  requireAuth,
} from "../utils/express.js";
import UsersService from "./UsersService.js";

const router = Router();

router.get(
  "/me",
  errorPassthrough(handleValidationErrors),
  errorPassthrough(requireAuth),
  errorPassthrough(async (req: Request, res: Response) => {
    const usersService = new UsersService(req.session.userId as string);
    const me = await usersService.getMe();
    res.status(200).send({
      data: {
        user: me,
      },
    });
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
