import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "./services/api";

const chartPalette = ["#b05cff", "#ff4d9d", "#2f80ff", "#6d7bff", "#ff8f3d"];
const monthLabels = {
  1: "Janvier",
  2: "Fevrier",
  3: "Mars",
  4: "Avril",
  5: "Mai",
  6: "Juin",
  7: "Juillet",
  8: "Aout",
  9: "Septembre",
  10: "Octobre",
  11: "Novembre",
  12: "Decembre",
};

const formatCurrency = (value) =>
  `${new Intl.NumberFormat("fr-MG", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)} Ar`;

const formatNumber = (value) =>
  new Intl.NumberFormat("fr-FR").format(Number(value) || 0);

const formatPercent = (value) =>
  `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(Number(value) || 0)} %`;

const normalizeMonthlySales = (rows = []) =>
  rows.map((row) => ({
    year: Number(row.year) || 0,
    month_number: Number(row.month) || 0,
    month:
      monthLabels[Number(row.month)] || (row.month ? `${row.month}` : "-"),
    total_sales: Number(row.total_sales) || 0,
    total_revenue: Number(row.total_revenue) || 0,
  }));

const normalizeTopProducts = (rows = []) =>
  rows.map((row) => ({
    name: row.name || "Produit inconnu",
    total_quantity: Number(row.total_quantity) || 0,
    total_revenue: Number(row.total_revenue) || 0,
  }));

const normalizeSalesByCity = (rows = []) =>
  rows.map((row) => ({
    city: row.city || "Ville inconnue",
    total_sales: Number(row.total_sales) || 0,
    total_revenue: Number(row.total_revenue) || 0,
  }));

const normalizeCategorySales = (rows = []) =>
  rows.map((row) => ({
    category: row.category || "Non classe",
    total_quantity: Number(row.total_quantity) || 0,
    total_sales: Number(row.total_sales) || 0,
    total_revenue: Number(row.total_revenue) || 0,
  }));

const normalizeHighlights = (row = {}) => ({
  top_product_name: row.top_product_name || "Produit inconnu",
  top_product_revenue: Number(row.top_product_revenue) || 0,
  top_city_name: row.top_city_name || "Ville inconnue",
  top_city_revenue: Number(row.top_city_revenue) || 0,
  best_month_number: Number(row.best_month_number) || 0,
  best_month_year: Number(row.best_month_year) || 0,
  best_month_revenue: Number(row.best_month_revenue) || 0,
});

const normalizeForecast = (row = {}) => ({
  forecast_revenue: Number(row.forecast_revenue) || 0,
  recent_growth_rate: Number(row.recent_growth_rate) || 0,
});

const normalizeRecommendations = (row = {}) => ({
  least_product_name: row.least_product_name || "Produit inconnu",
  least_product_quantity: Number(row.least_product_quantity) || 0,
  least_product_revenue: Number(row.least_product_revenue) || 0,
  least_city_name: row.least_city_name || "Ville inconnue",
  least_city_quantity: Number(row.least_city_quantity) || 0,
  least_city_revenue: Number(row.least_city_revenue) || 0,
});

function Bloc({ title, action, children, className = "" }) {
  return (
    <section
      className={`rounded-[22px] border border-white/5 bg-[#141b33] p-3 shadow-[0_20px_45px_rgba(6,10,24,0.35)] ${className}`}
    >
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function CarteKpi({ titre, valeur, sousTitre, couleur }) {
  return (
    <div className="rounded-[18px] border border-white/5 bg-[#1a2240] p-3">
      <div
        className="mb-3 flex h-8 w-8 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${couleur}22` }}
      >
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: couleur }} />
      </div>
      <p className="text-lg font-bold text-white">{valeur}</p>
      <p className="mt-1 text-sm font-medium text-slate-200">{titre}</p>
      <p className="mt-1 text-[11px] text-slate-400">{sousTitre}</p>
    </div>
  );
}

function MiniCarte({ label, value, detail, color }) {
  return (
    <div className="rounded-[16px] border border-white/5 bg-[#1a2240] p-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px]" style={{ color }}>
        {detail}
      </p>
    </div>
  );
}

function TooltipCard({ active, payload, label, formatter = formatCurrency }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0e1428] px-3 py-2 shadow-lg">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">
        {formatter(payload[0].value)}
      </p>
    </div>
  );
}

function LigneClassement({ index, label, value, salesCount, color }) {
  return (
    <div className="grid grid-cols-[22px_1fr_auto_auto] items-center gap-2 border-b border-white/5 py-1.5 last:border-b-0">
      <div
        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {index + 1}
      </div>
      <p className="truncate text-xs text-slate-300">{label}</p>
      <p className="text-right text-xs text-slate-400">
        {formatNumber(salesCount)} ventes
      </p>
      <p className="text-xs font-semibold text-white">{formatCurrency(value)}</p>
    </div>
  );
}

function LigneMensuelle({ label, revenue, sales }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-white/5 py-1.5 last:border-b-0">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="text-xs font-semibold text-white">{formatCurrency(revenue)}</p>
      <p className="text-right text-xs text-slate-400">
        {formatNumber(sales)} ventes
      </p>
    </div>
  );
}

function SelectFiltre({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-white/8 bg-[#0e1428] px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#9b5cff]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function App() {
  const [overview, setOverview] = useState(null);
  const [highlights, setHighlights] = useState(null);
  const [salesByMonth, setSalesByMonth] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesByCity, setSalesByCity] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [periodSales, setPeriodSales] = useState([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      const results = await Promise.allSettled([
        api.get("/kpis/overview"),
        api.get("/kpis/highlights"),
        api.get("/filters/sales-by-category"),
        api.get("/advanced/forecast"),
        api.get("/advanced/recommendations"),
        api.get("/charts/sales-by-month"),
        api.get("/charts/top-products"),
        api.get("/charts/sales-by-city"),
      ]);

      const [
        overviewRes,
        highlightsRes,
        salesByCategoryRes,
        forecastRes,
        recommendationsRes,
        salesMonthRes,
        topProductsRes,
        salesCityRes,
      ] = results;

      if (overviewRes.status === "fulfilled") setOverview(overviewRes.value.data.data);
      if (highlightsRes.status === "fulfilled") {
        setHighlights(normalizeHighlights(highlightsRes.value.data.data));
      }
      if (salesByCategoryRes.status === "fulfilled") {
        setSalesByCategory(normalizeCategorySales(salesByCategoryRes.value.data.data));
      }
      if (forecastRes.status === "fulfilled") {
        setForecast(normalizeForecast(forecastRes.value.data.data));
      }
      if (recommendationsRes.status === "fulfilled") {
        setRecommendations(normalizeRecommendations(recommendationsRes.value.data.data));
      }
      if (salesMonthRes.status === "fulfilled") {
        const normalized = normalizeMonthlySales(salesMonthRes.value.data.data);
        setSalesByMonth(normalized);
        if (normalized.length) {
          setPeriodStart(
            `${normalized[0].year}-${String(normalized[0].month_number).padStart(2, "0")}`,
          );
          const last = normalized.at(-1);
          setPeriodEnd(
            `${last.year}-${String(last.month_number).padStart(2, "0")}`,
          );
        }
      }
      if (topProductsRes.status === "fulfilled") {
        setTopProducts(normalizeTopProducts(topProductsRes.value.data.data));
      }
      if (salesCityRes.status === "fulfilled") {
        setSalesByCity(normalizeSalesByCity(salesCityRes.value.data.data));
      }

      if (results.some((result) => result.status === "rejected")) {
        setError("Certaines donnees n'ont pas pu etre chargees.");
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchPeriodSales = async () => {
      if (!periodStart || !periodEnd) return;
      const [startYear, startMonth] = periodStart.split("-");
      const [endYear, endMonth] = periodEnd.split("-");
      try {
        const response = await api.get("/filters/sales-by-period", {
          params: { startYear, startMonth, endYear, endMonth },
        });
        setPeriodSales(normalizeMonthlySales(response.data.data));
      } catch (periodError) {
        console.error("Failed to load period sales:", periodError);
      }
    };
    fetchPeriodSales();
  }, [periodStart, periodEnd]);

  const revenue = overview?.total_revenue ?? 0;
  const itemsSold = overview?.total_items_sold ?? 0;
  const salesRows = overview?.total_sales_rows ?? 0;
  const averageBasket = salesRows ? revenue / salesRows : 0;
  const bestMonth = salesByMonth.reduce(
    (best, current) =>
      current.total_revenue > best.total_revenue ? current : best,
    { month: "-", year: 0, total_revenue: 0 },
  );
  const rankedProducts = topProducts.slice(0, 4);
  const rankedCities = salesByCity.slice(0, 4);
  const citySalesVolume = [...salesByCity]
    .sort((a, b) => b.total_sales - a.total_sales)
    .slice(0, 6);
  const monthlySalesList = salesByMonth
    .slice(-4)
    .reverse()
    .map((item) => ({
      label: item.year ? `${item.month} ${item.year}` : item.month,
      total_sales: item.total_sales,
      total_revenue: item.total_revenue,
    }));
  const periodOptions = salesByMonth.map((item) => ({
    value: `${item.year}-${String(item.month_number).padStart(2, "0")}`,
    label: `${item.month} ${item.year}`,
  }));
  const periodRevenue = periodSales.reduce((sum, item) => sum + item.total_revenue, 0);
  const periodTransactions = periodSales.reduce((sum, item) => sum + item.total_sales, 0);
  const allCategories = salesByCategory;
  const displayBestMonth =
    monthLabels[highlights?.best_month_number] || bestMonth.month;
  const categoryPieData = allCategories.map((item, index) => ({
    name: item.category,
    value: item.total_revenue,
    fill: chartPalette[index % chartPalette.length],
  }));
  const topProductShare = revenue
    ? ((rankedProducts[0]?.total_revenue || 0) / revenue) * 100
    : 0;
  const topCityShare = revenue
    ? ((highlights?.top_city_revenue || 0) / revenue) * 100
    : 0;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090f1d] px-4">
        <div className="rounded-[24px] border border-white/10 bg-[#141b33] px-8 py-6 shadow-lg">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-[#b05cff]" />
          <p className="mt-4 text-center text-sm font-medium text-slate-300">
            Chargement du tableau de bord...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-[#090f1d] text-white">
      <div className="h-screen p-3">
        <section className="flex h-full min-h-0 flex-col gap-2 overflow-hidden rounded-[34px] border border-white/5 bg-[#0f1528] p-4 shadow-[0_25px_70px_rgba(0,0,0,0.32)]">
          <header className="grid gap-3 lg:grid-cols-[1fr_210px] lg:items-center">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-lg font-bold text-white">
                  Data<span className="text-[#b05cff]">Vue</span>
                </p>
                <p className="mt-1 text-[11px] text-slate-400">Pilotage</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div
                className={`rounded-[18px] border px-4 py-2 text-xs ${
                  error
                    ? "border-red-400/20 bg-red-500/10 text-red-200"
                    : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {error || "Donnees chargees"}
              </div>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 gap-2 xl:grid-cols-[1.72fr_0.8fr]">
            <div className="grid min-h-0 gap-2">
              <Bloc
                title="Indicateurs principaux"
                action={
                  <span className="rounded-full bg-[#1a2240] px-3 py-1 text-[11px] text-slate-300">
                    Quotidien
                  </span>
                }
              >
                <div className="grid gap-2 xl:grid-cols-4">
                  <CarteKpi
                    titre="Chiffre d'affaires"
                    valeur={formatCurrency(revenue)}
                    sousTitre="Revenu total"
                    couleur="#ff4d9d"
                  />
                  <CarteKpi
                    titre="Articles vendus"
                    valeur={formatNumber(itemsSold)}
                    sousTitre="Volume ecoule"
                    couleur="#b05cff"
                  />
                  <CarteKpi
                    titre="Panier moyen"
                    valeur={formatCurrency(averageBasket)}
                    sousTitre="Valeur moyenne"
                    couleur="#2f80ff"
                  />
                  <CarteKpi
                    titre="Nombre de ventes"
                    valeur={formatNumber(salesRows)}
                    sousTitre="Transactions"
                    couleur="#0f766e"
                  />
                </div>
              </Bloc>

              <div className="grid min-h-0 gap-2 xl:grid-cols-[1.28fr_0.72fr]">
                <Bloc
                  title="Evolution mensuelle"
                  action={
                    <span className="rounded-full bg-[#1a2240] px-3 py-1 text-[11px] text-slate-300">
                      Annuel
                    </span>
                  }
                >
                  <div className="h-[164px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesByMonth}
                        margin={{ top: 8, right: 10, left: 6, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#202845" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#7f8cb0", fontSize: 11 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={62}
                          tick={{ fill: "#7f8cb0", fontSize: 11 }}
                          tickFormatter={(value) => formatNumber(value)}
                        />
                        <Tooltip content={<TooltipCard />} />
                        <Line
                          type="monotone"
                          dataKey="total_revenue"
                          stroke="#b05cff"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 4, fill: "#ff4d9d" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Bloc>

                <Bloc title="Ventes par categorie">
                  <div className="h-[164px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryPieData}
                          dataKey="value"
                          innerRadius={32}
                          outerRadius={48}
                          stroke="none"
                          paddingAngle={4}
                        >
                          {categoryPieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="-mt-22 text-center">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      Categories
                    </p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {allCategories.length}
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-[1fr_auto_auto] gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    <p>Categorie</p>
                    <p className="text-right"></p>
                    <p className="text-right">Chiffre d'affaires</p>
                  </div>
                  <div className="mt-2 max-h-[164px] space-y-1 overflow-y-auto pr-1">
                    {allCategories.map((category, index) => (
                      <div
                        key={category.category}
                        className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 text-slate-300">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                chartPalette[index % chartPalette.length],
                            }}
                          />
                          {category.category}
                        </div>
                        <span className="text-right text-slate-400">
                          {formatNumber(category.total_sales)} ventes
                        </span>
                        <span className="text-white">
                          {formatCurrency(category.total_revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Bloc>
              </div>

              <Bloc
                title="Details analytiques"
                action={
                  <span className="rounded-full bg-[#1a2240] px-3 py-1 text-[11px] text-slate-300">
                    Recents
                  </span>
                }
              >
                <div className="grid gap-2 xl:grid-cols-[1.05fr_0.95fr]">
                  <div>
                    <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      Diagramme des ventes par ville
                    </p>
                    <div className="h-[158px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={salesByCity}
                          margin={{ top: 4, right: 10, left: 6, bottom: 0 }}
                          barCategoryGap={12}
                        >
                          <CartesianGrid stroke="#202845" vertical={false} />
                          <XAxis
                            dataKey="city"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#7f8cb0", fontSize: 11 }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            width={60}
                            tick={{ fill: "#7f8cb0", fontSize: 11 }}
                            tickFormatter={(value) => formatNumber(value)}
                          />
                          <Tooltip content={<TooltipCard />} />
                          <Bar
                            dataKey="total_revenue"
                            radius={[6, 6, 0, 0]}
                            fill="#2f80ff"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid gap-2 xl:grid-cols-[0.9fr_1.1fr]">
                    <div>
                      <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        Evolution des 4 derniers mois
                      </p>
                      <div className="mb-2 grid grid-cols-[1fr_auto_auto] gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        <p>Mois observe</p>
                        <p></p>
                        <p className="text-right">Nombre de ventes</p>
                      </div>
                      {monthlySalesList.map((month) => (
                        <LigneMensuelle
                          key={month.label}
                          label={month.label}
                          revenue={month.total_revenue}
                          sales={month.total_sales}
                        />
                      ))}
                    </div>
                    <div>
                      <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        Top 4 des produits par chiffre d'affaires
                      </p>
                      <div className="mb-2 grid grid-cols-[1fr_auto_auto] gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        <p>Produit</p>
                        <p className="text-right"></p>
                        <p className="text-right">Chiffre d'affaires</p>
                      </div>
                      {rankedProducts.map((product, index) => (
                        <LigneClassement
                          key={`${product.name}-${index}`}
                          index={index}
                          label={product.name}
                          value={product.total_revenue}
                          salesCount={product.total_quantity}
                          color={chartPalette[index % chartPalette.length]}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Bloc>
            </div>

            <div className="grid min-h-0 auto-rows-min gap-2">
              <Bloc
                title="Nombre de ventes par ville"
              >
                <div className="h-[104px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={citySalesVolume}
                      margin={{ top: 8, right: 8, left: 6, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="citySalesSurface" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff9b50" stopOpacity={0.65} />
                          <stop offset="55%" stopColor="#ff4d9d" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#2f80ff" stopOpacity={0.04} />
                        </linearGradient>
                        <linearGradient id="citySalesGlow" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#ff8f3d" />
                          <stop offset="50%" stopColor="#ff4d9d" />
                          <stop offset="100%" stopColor="#2f80ff" />
                        </linearGradient>
                        <linearGradient id="citySalesShadow" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#7a3cff" />
                          <stop offset="100%" stopColor="#123f8f" />
                        </linearGradient>
                        <filter id="citySalesDepth" x="-20%" y="-20%" width="140%" height="160%">
                          <feDropShadow
                            dx="0"
                            dy="8"
                            stdDeviation="8"
                            floodColor="#050816"
                            floodOpacity="0.55"
                          />
                        </filter>
                      </defs>
                      <CartesianGrid stroke="#202845" vertical={false} strokeDasharray="4 4" />
                      <XAxis
                        dataKey="city"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#7f8cb0", fontSize: 10 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={60}
                        tick={{ fill: "#7f8cb0", fontSize: 10 }}
                        tickFormatter={(value) => formatNumber(value)}
                      />
                      <Tooltip
                        content={
                          <TooltipCard formatter={(value) => formatNumber(value)} />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="total_sales"
                        stroke="none"
                        fill="url(#citySalesSurface)"
                        fillOpacity={1}
                      />
                      <Line
                        type="monotone"
                        dataKey="total_sales"
                        stroke="url(#citySalesShadow)"
                        strokeWidth={8}
                        strokeOpacity={0.25}
                        dot={false}
                        activeDot={false}
                        filter="url(#citySalesDepth)"
                      />
                      <Line
                        dataKey="total_sales"
                        type="monotone"
                        stroke="url(#citySalesGlow)"
                        strokeWidth={3}
                        dot={{
                          r: 3.5,
                          fill: "#0f1528",
                          stroke: "#ffb26d",
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 6,
                          stroke: "#0f1528",
                          strokeWidth: 2,
                          fill: "#ff8f3d",
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  {citySalesVolume.slice(0, 3).map((city) => (
                    <div
                      key={`city-sales-${city.city}`}
                      className="flex items-center justify-between text-xs text-slate-300"
                    >
                      <span className="truncate">{city.city}</span>
                      <span className="font-semibold text-white">
                        {formatNumber(city.total_sales)} ventes
                      </span>
                    </div>
                  ))}
                </div>
              </Bloc>

              <Bloc title="Highlights">
                <div className="grid gap-2">
                  <MiniCarte
                    label="Produit leader"
                    value={highlights?.top_product_name || "-"}
                    detail={formatCurrency(
                      highlights?.top_product_revenue ||
                        rankedProducts[0]?.total_revenue ||
                        0,
                    )}
                    color="#b05cff"
                  />
                  <MiniCarte
                    label="Ville leader"
                    value={highlights?.top_city_name || "-"}
                    detail={formatCurrency(
                      highlights?.top_city_revenue ||
                        rankedCities[0]?.total_revenue ||
                        0,
                    )}
                    color="#2f80ff"
                  />
                  <MiniCarte
                    label="Meilleur mois"
                    value={`${displayBestMonth}${
                      highlights?.best_month_year ? ` ${highlights.best_month_year}` : ""
                    }`}
                    detail={formatCurrency(
                      highlights?.best_month_revenue || bestMonth.total_revenue || 0,
                    )}
                    color="#ff4d9d"
                  />
                </div>
              </Bloc>

              <Bloc title="Filtres et previsions">
                <div className="grid gap-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <SelectFiltre
                      label="Debut"
                      value={periodStart}
                      onChange={(event) => setPeriodStart(event.target.value)}
                      options={periodOptions}
                    />
                    <SelectFiltre
                      label="Fin"
                      value={periodEnd}
                      onChange={(event) => setPeriodEnd(event.target.value)}
                      options={periodOptions}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <MiniCarte
                      label="Chiffre d'affaires "
                      value={formatCurrency(periodRevenue)}
                      detail={`${formatNumber(periodTransactions)} ventes`}
                      color="#0f766e"
                    />
                    <MiniCarte
                      label="Prevision"
                      value={formatCurrency(forecast?.forecast_revenue || 0)}
                      detail={`Croissance: ${formatNumber(
                        forecast?.recent_growth_rate || 0,
                      )}%`}
                      color="#ff8f3d"
                    />
                    <MiniCarte
                      label="Poids du top produit"
                      value={formatPercent(topProductShare)}
                      detail={formatCurrency(
                        rankedProducts[0]?.total_revenue || 0,
                      )}
                      color="#2f80ff"
                    />
                    <MiniCarte
                      label="Poids de la ville leader"
                      value={formatPercent(topCityShare)}
                      detail={formatCurrency(
                        highlights?.top_city_revenue || 0,
                      )}
                      color="#b05cff"
                    />
                    <MiniCarte
                      label="Produit le moins achete"
                      value={recommendations?.least_product_name || "Produit inconnu"}
                      detail={`${formatNumber(
                        recommendations?.least_product_quantity || 0,
                      )} articles | ${formatCurrency(
                        recommendations?.least_product_revenue || 0,
                      )}`}
                      color="#6d7bff"
                    />
                    <MiniCarte
                      label="Ville qui consomme le moins"
                      value={recommendations?.least_city_name || "Ville inconnue"}
                      detail={`${formatNumber(
                        recommendations?.least_city_quantity || 0,
                      )} articles | ${formatCurrency(
                        recommendations?.least_city_revenue || 0,
                      )}`}
                      color="#4f8dfd"
                    />
                  </div>
                </div>
              </Bloc>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
