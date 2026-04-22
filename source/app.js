import express, { json, urlencoded } from "express";
import { connectDB } from "./configs/dbConnection.js";
import { MainRouter } from "./routes/index.js";
import cors from "cors";
import path from "path";
import { errorHandler } from "./middleware/error.handler.js";
import { config } from "dotenv";
import { tenantResolver } from "./middleware/TenantResolver.js";

config();

const app = express();
const originUrl = String(process.env.FRONTEND_URL).split(",");
console.log({ originUrl });

const corsOptions = {
  origin: originUrl, // frontend domains
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));

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
