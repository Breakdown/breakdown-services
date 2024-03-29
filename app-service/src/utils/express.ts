import { Request, Response, NextFunction, RequestHandler } from "express";
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

// Base server headers
export const headers = (req: Request, res: Response, next: NextFunction) => {
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Credentials, Set-Cookie, Cookie, Cookies, Cross-Origin, Access-Control-Allow-Credentials, Authorization, Access-Control-Allow-Origin"
  );
  console.log("origin", req.headers.origin);
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

export const requireAuth = (req: Request, _: Response, next: NextFunction) => {
  // console.log("requireAuth");
  // console.log(req.headers);
  console.log(req.session);
  try {
    if (!req.session?.userId) {
      throw new UnauthorizedError("Not authorized");
    }
    next();
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
  console.log("caching", req.method, req.originalUrl);
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
  const requestKey = `${req.method}:${req.originalUrl}-${userId}`;
  // Cache response
  const cacheService = new CacheService();
  return await cacheService.set(requestKey, JSON.stringify(data));
};

export const genericCachedRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("hitting cache", req.method, req.originalUrl);
  const requestKey = `${req.method}:${req.originalUrl}`;
  // Get from cache
  const cacheService = new CacheService();
  const cachedResponse = await cacheService.getJson(requestKey);
  console.log(cachedResponse);
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
  const requestKey = `${req.method}:${req.originalUrl}:${req.session.userId}`;
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

// Session Layer
const RedisStore = connectRedis(session);
const redisClient = new Redis({
  port: parseInt(process.env.REDIS_PORT || "6379"),
  host: process.env.REDIS_HOST || "localhost",
});
export const sessionStore = new RedisStore({ client: redisClient });
export const sessionLayer = () =>
  session({
    unset: "destroy",
    name: "breakdown_sid",
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // isProduction() || isSandbox(), // if true only transmit cookie over https
      httpOnly: true, // if true prevent client side JS from reading the cookie
      maxAge: 1000 * 60 * 60 * 24 * 30, // session max age in milliseconds - 30d - expire after 30d inactivity
      path: "/",
      sameSite: "none",
    },
  });

// Extend express session type
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

declare global {
  namespace Express {
    export interface Request {
      deviceId?: string;
    }
  }
}

// Morgan logger
export const morganLogger = () =>
  morgan(":method :url :status - :response-time ms", {
    immediate: false,
  });

export type BreakdownSession = Session & Partial<SessionData>;
