const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const healthRoutes = require("./routes/health.routes");
const analyticsRoutes = require("./routes/analytics.routes");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api", analyticsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

module.exports = app;