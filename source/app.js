import express, { json, urlencoded } from "express";
import { connectDB } from "./configs/dbConnection.js";
import { MainRouter } from "./routes/index.js";
import cors from "cors";
import path from "path";
import { errorHandler } from "./middleware/error.handler.js";
import { config } from "dotenv";
import { tenantResolver } from "./middleware/TenantResolver.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { requestContextMiddleware } from "./middleware/request-context.middleware.js";
import { requestLoggerMiddleware } from "./middleware/request-logger.middleware.js";

config();

const app = express();
const originUrl = String(process.env.FRONTEND_URL).split(",");
console.log({ originUrl });

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in the allowed list
    if (originUrl.includes(origin)) {
      return callback(null, true);
    }

    // Check if origin matches *.instabooking.in pattern
    if (/^http:\/\/[\w-]+\.localhost:5173$/.test(origin)) {
      return callback(null, true);
    }

    // Check if origin matches *.instabooking.in pattern
    // if (/^https:\/\/[\w-]+\.instabooking\.in$/.test(origin)) {
    //   return callback(null, true);
    // }

    // if (/^https:\/\/[\w-]+\.test.instabooking\.in$/.test(origin)) {
    //   return callback(null, true);
    // }

    // Origin not allowed
    callback(new Error("Not allowed by CORS"));
  }, // frontend domains
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
};

app.use(requestContextMiddleware);
app.use(requestLoggerMiddleware);


app.use(cors(corsOptions));
app.use(rateLimiter);

connectDB();
app.use(json());

app.use(urlencoded({ extended: true }));

app.get("/health", (req, res, next) => {
  res.status(200).send({
    status: true,
    msg: "Server is running",
  });
});

app.use("/api/v2", MainRouter);

app.use(errorHandler);

export { app };
