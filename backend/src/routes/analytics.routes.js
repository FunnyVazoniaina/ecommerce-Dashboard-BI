const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controllers");

router.get("/kpis/overview", analyticsController.getOverview);
router.get("/kpis/highlights", analyticsController.getHighlights);
router.get("/filters/sales-by-period", analyticsController.getSalesByPeriod);
router.get("/filters/sales-by-category", analyticsController.getSalesByCategory);
router.get("/advanced/forecast", analyticsController.getForecast);
router.get("/advanced/recommendations", analyticsController.getRecommendations);
router.get("/charts/sales-by-month", analyticsController.getSalesByMonth);
router.get("/charts/top-products", analyticsController.getTopProducts);
router.get("/charts/sales-by-city", analyticsController.getSalesByCity);

module.exports = router;
