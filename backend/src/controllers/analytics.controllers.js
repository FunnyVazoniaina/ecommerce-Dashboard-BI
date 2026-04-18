const pool = require("../config/db");

const handleError = (res, error, message = "Internal server error") => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message,
  });
};

const parseIntegerOrNull = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

exports.getOverview = async (_req, res) => {
  try {
    const query = `
      SELECT
        COALESCE(SUM(total), 0) AS total_revenue,
        COALESCE(SUM(quantity), 0) AS total_items_sold,
        COUNT(*) AS total_sales_rows
      FROM fact_sales;
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch overview KPIs");
  }
};

exports.getHighlights = async (_req, res) => {
  try {
    const query = `
      WITH top_product AS (
        SELECT
          dp.name,
          SUM(fs.total) AS total_revenue
        FROM fact_sales fs
        JOIN dim_product dp ON fs.product_id = dp.id
        GROUP BY dp.name
        ORDER BY total_revenue DESC
        LIMIT 1
      ),
      top_city AS (
        SELECT
          dc.city,
          SUM(fs.total) AS total_revenue
        FROM fact_sales fs
        JOIN dim_client dc ON fs.client_id = dc.id
        GROUP BY dc.city
        ORDER BY total_revenue DESC
        LIMIT 1
      ),
      best_month AS (
        SELECT
          dt.year,
          dt.month,
          SUM(fs.total) AS total_revenue
        FROM fact_sales fs
        JOIN dim_time dt ON fs.time_id = dt.id
        GROUP BY dt.year, dt.month
        ORDER BY total_revenue DESC
        LIMIT 1
      )
      SELECT
        COALESCE((SELECT name FROM top_product), 'Produit inconnu') AS top_product_name,
        COALESCE((SELECT total_revenue FROM top_product), 0) AS top_product_revenue,
        COALESCE((SELECT city FROM top_city), 'Ville inconnue') AS top_city_name,
        COALESCE((SELECT total_revenue FROM top_city), 0) AS top_city_revenue,
        COALESCE((SELECT month FROM best_month), 0) AS best_month_number,
        COALESCE((SELECT year FROM best_month), 0) AS best_month_year,
        COALESCE((SELECT total_revenue FROM best_month), 0) AS best_month_revenue;
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch highlights");
  }
};

exports.getSalesByMonth = async (_req, res) => {
  try {
    const query = `
      SELECT
        dt.year,
        dt.month,
        COUNT(*) AS total_sales,
        SUM(fs.total) AS total_revenue
      FROM fact_sales fs
      JOIN dim_time dt ON fs.time_id = dt.id
      GROUP BY dt.year, dt.month
      ORDER BY dt.year, dt.month;
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch sales by month");
  }
};

exports.getTopProducts = async (_req, res) => {
  try {
    const query = `
      SELECT
        dp.name,
        SUM(fs.quantity) AS total_quantity,
        SUM(fs.total) AS total_revenue
      FROM fact_sales fs
      JOIN dim_product dp ON fs.product_id = dp.id
      GROUP BY dp.name
      ORDER BY total_revenue DESC, total_quantity DESC
      LIMIT 5;
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch top products");
  }
};

exports.getSalesByCity = async (_req, res) => {
  try {
    const query = `
      SELECT
        dc.city,
        SUM(fs.total) AS total_revenue
      FROM fact_sales fs
      JOIN dim_client dc ON fs.client_id = dc.id
      GROUP BY dc.city
      ORDER BY total_revenue DESC;
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch sales by city");
  }
};

exports.getSalesByPeriod = async (req, res) => {
  try {
    const startYear = parseIntegerOrNull(req.query.startYear);
    const startMonth = parseIntegerOrNull(req.query.startMonth);
    const endYear = parseIntegerOrNull(req.query.endYear);
    const endMonth = parseIntegerOrNull(req.query.endMonth);

    const query = `
      SELECT
        dt.year,
        dt.month,
        COUNT(*) AS total_sales,
        SUM(fs.total) AS total_revenue
      FROM fact_sales fs
      JOIN dim_time dt ON fs.time_id = dt.id
      WHERE (
        $1::int IS NULL OR
        (dt.year > $1 OR (dt.year = $1 AND dt.month >= COALESCE($2, 1)))
      )
      AND (
        $3::int IS NULL OR
        (dt.year < $3 OR (dt.year = $3 AND dt.month <= COALESCE($4, 12)))
      )
      GROUP BY dt.year, dt.month
      ORDER BY dt.year, dt.month;
    `;

    const { rows } = await pool.query(query, [
      startYear,
      startMonth,
      endYear,
      endMonth,
    ]);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch sales by period");
  }
};

exports.getSalesByCategory = async (_req, res) => {
  try {
    const query = `
      SELECT
        COALESCE(dp.category, 'Non classe') AS category,
        SUM(fs.quantity) AS total_quantity,
        COUNT(*) AS total_sales,
        SUM(fs.total) AS total_revenue
      FROM fact_sales fs
      JOIN dim_product dp ON fs.product_id = dp.id
      GROUP BY COALESCE(dp.category, 'Non classe')
      ORDER BY total_revenue DESC, total_quantity DESC;
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch sales by category");
  }
};

exports.getForecast = async (_req, res) => {
  try {
    const query = `
      WITH monthly_sales AS (
        SELECT
          dt.year,
          dt.month,
          COUNT(*) AS total_sales,
          SUM(fs.total) AS total_revenue
        FROM fact_sales fs
        JOIN dim_time dt ON fs.time_id = dt.id
        GROUP BY dt.year, dt.month
        ORDER BY dt.year, dt.month
      ),
      latest_three AS (
        SELECT *
        FROM monthly_sales
        ORDER BY year DESC, month DESC
        LIMIT 3
      ),
      latest_two AS (
        SELECT *
        FROM monthly_sales
        ORDER BY year DESC, month DESC
        LIMIT 2
      ),
      current_month AS (
        SELECT *
        FROM monthly_sales
        ORDER BY year DESC, month DESC
        LIMIT 1
      )
      SELECT
        COALESCE((SELECT ROUND(AVG(total_revenue)) FROM latest_three), 0) AS forecast_revenue,
        COALESCE((SELECT ROUND(AVG(total_sales)) FROM latest_three), 0) AS forecast_sales_count,
        COALESCE((SELECT year FROM current_month), 0) AS current_year,
        COALESCE((SELECT month FROM current_month), 0) AS current_month,
        COALESCE((
          SELECT ROUND(
            (
              (MAX(total_revenue) - MIN(total_revenue)) /
              NULLIF(MIN(total_revenue), 0)
            ) * 100,
            2
          )
          FROM latest_two
        ), 0) AS recent_growth_rate,
        COALESCE((
          SELECT ROUND(
            (
              (MAX(total_sales) - MIN(total_sales))::numeric /
              NULLIF(MIN(total_sales), 0)
            ) * 100,
            2
          )
          FROM latest_two
        ), 0) AS sales_growth_rate;
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch forecast");
  }
};

exports.getRecommendations = async (_req, res) => {
  try {
    const query = `
      WITH top_category AS (
        SELECT
          COALESCE(dp.category, 'Non classe') AS category,
          SUM(fs.total) AS total_revenue
        FROM fact_sales fs
        JOIN dim_product dp ON fs.product_id = dp.id
        GROUP BY COALESCE(dp.category, 'Non classe')
        ORDER BY total_revenue DESC
        LIMIT 1
      ),
      top_product AS (
        SELECT
          dp.name,
          SUM(fs.quantity) AS total_quantity,
          SUM(fs.total) AS total_revenue
        FROM fact_sales fs
        JOIN dim_product dp ON fs.product_id = dp.id
        GROUP BY dp.name
        ORDER BY total_revenue DESC, total_quantity DESC
        LIMIT 1
      ),
      top_city AS (
        SELECT
          dc.city,
          SUM(fs.total) AS total_revenue
        FROM fact_sales fs
        JOIN dim_client dc ON fs.client_id = dc.id
        GROUP BY dc.city
        ORDER BY total_revenue DESC
        LIMIT 1
      )
      SELECT
        COALESCE((SELECT category FROM top_category), 'Non classe') AS focus_category,
        COALESCE((SELECT total_revenue FROM top_category), 0) AS focus_category_revenue,
        COALESCE((SELECT name FROM top_product), 'Produit inconnu') AS focus_product,
        COALESCE((SELECT total_revenue FROM top_product), 0) AS focus_product_revenue,
        COALESCE((SELECT city FROM top_city), 'Ville inconnue') AS focus_city,
        COALESCE((SELECT total_revenue FROM top_city), 0) AS focus_city_revenue;
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch recommendations");
  }
};
