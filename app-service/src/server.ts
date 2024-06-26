import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import helmet from "helmet";
import http from "http";
import router from "./router.js";
import {
  errorHandler,
  errorPassthrough,
  getDeviceId,
  headers,
  morganLogger,
} from "./utils/express.js";

const app = express();

// Helpers
app.use(headers);
app.use(helmet());
app.use(cookieParser());
app.use(morganLogger());

// Routes
app.use(
  "/",
  express.json({
    limit: "50mb",
  }),
  router
);
app.get(
  "/healthcheck",
  errorPassthrough((_: Request, res: Response) => res.sendStatus(200))
);
app.get(
  "*",
  errorPassthrough((_: Request, res: Response) => res.sendStatus(404))
);

// DeviceId mapper
app.use(getDeviceId);
// Fallback error handler
app.use(errorHandler);

const server = () => {
  const httpServer = http.createServer(app);

  httpServer.on("listening", () => {
    console.info(`app-service listening on port ${process.env.PORT}...`);
  });

  return httpServer;
};

export default server;
