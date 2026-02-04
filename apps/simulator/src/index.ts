import { Hono } from "hono";

const app = new Hono();

const API_URL = process.env.API_URL || "http://localhost:8000";
const SERVICE_TOKEN = process.env.SERVICE_TOKEN;
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || "3000");

const levels = [
  "info",
  "info",
  "info",
  "info",
  "info",
  "info",
  "info",
  "info",
  "info",
  "info",
  "info",
  "debug",
  "debug",
  "debug",
  "debug",
  "debug",
  "debug",
  "warn",
  "warn",
  "warn",
  "error",
  "error",
];
const environments = ["production", "staging", "development"];
const paths = [
  "/api/users",
  "/api/products",
  "/api/orders",
  "/api/auth/login",
  "/api/health",
  "/api/checkout",
  "/api/cart",
  "/api/profile",
  "/api/search",
  "/api/settings",
];

const methods: Record<string, string[]> = {
  "/api/users": ["GET", "POST", "PATCH"],
  "/api/products": ["GET"],
  "/api/orders": ["POST", "GET"],
  "/api/auth/login": ["POST"],
  "/api/health": ["GET"],
  "/api/checkout": ["POST"],
  "/api/cart": ["GET", "POST", "DELETE"],
  "/api/profile": ["GET", "PATCH"],
  "/api/search": ["GET"],
  "/api/settings": ["GET", "PUT"],
};

const commonStatuses = [
  200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 201, 201, 201, 201, 201, 204, 204, 400, 401,
  404, 500,
];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomLog() {
  const path = getRandom(paths);
  const method = getRandom(methods[path] || ["GET"]);
  const level = getRandom(levels);
  const status = getRandom(commonStatuses);

  return {
    level,
    timestamp: Date.now(),
    environment: getRandom(environments),
    method,
    path,
    status,
    duration: Math.floor(Math.random() * 250), // 0-250ms
    message:
      level === "error"
        ? `Failed to process ${method} on ${path}`
        : `Successfully processed ${method} on ${path}`,
    sessionId: crypto.randomUUID().substring(0, 8),
    meta: {
      userAgent: "Mozilla/5.0 (Simulator)",
      userId: Math.floor(Math.random() * 1000).toString(),
    },
  };
}

let isSimulating = false;
let simulationInterval: Timer | null = null;

async function sendLog() {
  if (!SERVICE_TOKEN) {
    console.error("❌ SERVICE_TOKEN is not set. Simulation skipped.");
    return;
  }

  const log = generateRandomLog();

  try {
    const response = await fetch(`${API_URL}/api/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-deko-service-token": SERVICE_TOKEN,
      },
      body: JSON.stringify(log),
    });

    if (response.ok) {
      console.log(`✅ Log sent: ${log.method} ${log.path} (${log.status}) - ${log.level}`);
    } else {
      const error = await response.text();
      console.error(`❌ Failed to send log: ${response.status} ${response.statusText}`, error);
    }
  } catch (err) {
    console.error("❌ Error sending log:", err);
  }
}

function startSimulation() {
  if (isSimulating) return;
  isSimulating = true;
  console.log(`🚀 Starting simulation every ${INTERVAL_MS}ms...`);
  simulationInterval = setInterval(sendLog, INTERVAL_MS);
}

function stopSimulation() {
  if (!isSimulating) return;
  isSimulating = false;
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  console.log("🛑 Simulation stopped.");
}

// Routes
app.get("/", (c) => c.text("Log Ingest Simulator is running"));

app.get("/status", (c) =>
  c.json({
    isSimulating,
    apiUrl: API_URL,
    intervalMs: INTERVAL_MS,
    hasToken: !!SERVICE_TOKEN,
  }),
);

app.post("/start", (c) => {
  startSimulation();
  return c.text("Simulation started");
});

app.post("/stop", (c) => {
  stopSimulation();
  return c.text("Simulation stopped");
});

// Start simulation immediately if token is present
if (SERVICE_TOKEN) {
  startSimulation();
} else {
  console.warn(
    "⚠️ No SERVICE_TOKEN provided. Simulator will run idle. POST to /start after setting token.",
  );
}

export default {
  port: 5000,
  fetch: app.fetch,
};
