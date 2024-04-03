import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { SignedJWT } from "./jwt.js";
import bcrypt from "bcryptjs";
import session, { Session, SessionData } from "express-session";
import connectRedis from "connect-redis";
import { Result, ValidationError, validationResult } from "express-validator";
import {
  BadRequestError,
  InternalError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "./errors/index.js";
import { Redis } from "ioredis";
import morgan from "morgan";
import CacheService from "../cache/service.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Base server headers
export const headers = (req: Request, res: Response, next: NextFunction) => {
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Credentials, Cross-Origin, Access-Control-Allow-Credentials, Authorization, Access-Control-Allow-Origin, x-access-token"
  );
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
};

// Validation error handler
export const handleValidationErrors = (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  const validationErrors: Result<ValidationError> = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw new UnprocessableEntityError("Validation failed", 422, {
      validationErrors: validationErrors.array(),
    });
  }
  next();
};

// Error wrapping Higher order function
// This is used to pass our custom errors into the error handler middleware below
export const errorPassthrough =
  (fn: RequestHandler) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // No idea why eslint is warning here
      // Awaiting definitely does have an affect, since
      // RequestHandler can be (and always is in our case) async
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };

interface StructuredResponse {
  data: any;
}

export const cacheGenericResponse = async (
  req: Request,
  data: StructuredResponse
) => {
  const requestKey = `${req.method}:${req.originalUrl}`;
  // Cache response
  const cacheService = new CacheService();
  return await cacheService.set(requestKey, JSON.stringify(data));
};

export const cacheUserSpecificResponse = async (
  req: Request,
  data: StructuredResponse,
  userId: string
) => {
  const requestKey = `${req.method}:${req.originalUrl}:${userId}`;
  // Cache response
  const cacheService = new CacheService();
  return await cacheService.set(requestKey, JSON.stringify(data));
};

export const genericCachedRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestKey = `${req.method}:${req.originalUrl}`;
  // Get from cache
  const cacheService = new CacheService();
  const cachedResponse = await cacheService.getJson(requestKey);
  if (cachedResponse) {
    return res.status(200).send(cachedResponse);
  }
  next();
};

export const userSpecificCachedRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestKey = `${req.method}:${req.originalUrl}:${req.userId}`;
  // Get from cache
  const cacheService = new CacheService();
  const cachedResponse = cacheService.getJson(requestKey);
  if (cachedResponse) {
    return res.status(200).send(cachedResponse);
  }
  next();
};

export const getDeviceId = (req: Request, _: Response, next: NextFunction) => {
  const deviceId = req.headers["x-device-id"] || "";
  // Set on request object
  if (typeof deviceId === "string" && deviceId.length > 0) {
    req.deviceId = deviceId;
  }

  next();
};

// Error handler
export const errorHandler = (
  error:
    | InternalError
    | BadRequestError
    | NotFoundError
    | UnauthorizedError
    | UnprocessableEntityError,
  req: Request,
  res: Response,
  _: NextFunction
) => {
  console.error(`Error: ${req.method} - ${req.path}`);
  console.error(error);

  const { name, message, details } = error;
  const response = {
    error: {
      name,
      message,
      details,
    },
  };
  return res.status(error.code || 404).send(response);
};

// Extend Express Request type
declare global {
  namespace Express {
    export interface Request {
      deviceId?: string;
      userId?: string;
    }
  }
}

// Morgan logger
export const morganLogger = () =>
  morgan(":method :url :status - :response-time ms", {
    immediate: false,
  });

export type BreakdownSession = Session & Partial<SessionData>;

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["x-access-token"];

  if (!token) {
    throw new UnauthorizedError("Unauthorized: No token provided", 403);
  }

  try {
    const decoded = jwt.verify(token as string, JWT_SECRET);
    req.userId = (decoded as SignedJWT)?.id;
    next();
  } catch (err) {
    throw new UnauthorizedError("Unauthorized: Invalid JWT", 401);
  }
};
