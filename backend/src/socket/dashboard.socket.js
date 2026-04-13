const { Server } = require("socket.io");
const { buildSocketCorsOptions } = require("../config/cors");
const { getDashboardSnapshot } = require("../services/analytics.service");

const DASHBOARD_EVENT = "dashboard:snapshot";
const DASHBOARD_ERROR_EVENT = "dashboard:error";
const REFRESH_EVENT = "dashboard:request-refresh";

const getRefreshInterval = () => {
  const parsed = Number.parseInt(process.env.DASHBOARD_REFRESH_INTERVAL_MS, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return 10000;
  }

  return parsed;
};

const emitSnapshot = async (target) => {
  const snapshot = await getDashboardSnapshot();

  target.emit(DASHBOARD_EVENT, {
    updatedAt: new Date().toISOString(),
    data: snapshot,
  });
};

const attachDashboardSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: buildSocketCorsOptions(),
  });

  io.on("connection", (socket) => {
    emitSnapshot(socket).catch((error) => {
      console.error("Failed to send initial dashboard snapshot:", error);
      socket.emit(DASHBOARD_ERROR_EVENT, {
        message: "Failed to load live dashboard data",
      });
    });

    socket.on(REFRESH_EVENT, async () => {
      try {
        await emitSnapshot(socket);
      } catch (error) {
        console.error("Failed to refresh dashboard snapshot:", error);
        socket.emit(DASHBOARD_ERROR_EVENT, {
          message: "Failed to refresh live dashboard data",
        });
      }
    });
  });

  const refreshTimer = setInterval(async () => {
    try {
      await emitSnapshot(io);
    } catch (error) {
      console.error("Failed to broadcast dashboard snapshot:", error);
      io.emit(DASHBOARD_ERROR_EVENT, {
        message: "Failed to broadcast live dashboard data",
      });
    }
  }, getRefreshInterval());

  io.on("close", () => {
    clearInterval(refreshTimer);
  });

  return io;
};

module.exports = {
  attachDashboardSocket,
  DASHBOARD_ERROR_EVENT,
  DASHBOARD_EVENT,
  REFRESH_EVENT,
};
