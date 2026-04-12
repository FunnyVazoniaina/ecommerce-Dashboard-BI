const app = require("./app");
const pool = require("./config/db");
require("dotenv").config();

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();