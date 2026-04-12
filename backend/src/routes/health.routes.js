const express = require("express");
const router = express.Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

module.exports = router;