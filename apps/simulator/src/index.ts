import { Hono } from "hono";

type SimulationMode = "steady" | "bursty" | "chaos";
type LogLevel = "debug" | "info" | "warn" | "error";
type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

type EndpointProfile = {
  pathTemplates: string[];
  methods: HttpMethod[];
  baseDurationMs: number;
  p95Multiplier: number;
  statusPool: number[];
  levelBias: LogLevel[];
  category: string;
};

const app = new Hono();

const API_URL = process.env.API_URL || "http://localhost:8000";
const SERVICE_TOKEN = process.env.SERVICE_TOKEN;
const BASE_INTERVAL_MS = parseInt(process.env.INTERVAL_MS || "2500", 10);
const VALID_MODES: SimulationMode[] = ["steady", "bursty", "chaos"];

// Endpoint profiles shape generated traffic so each route has distinct behavior.
const endpointProfiles: EndpointProfile[] = [
  {
    pathTemplates: ["/api/health"],
    methods: ["GET"],
    baseDurationMs: 10,
    p95Multiplier: 1.8,
    statusPool: [200, 200, 200, 200, 200, 503],
    levelBias: ["debug", "info", "info", "info", "warn"],
    category: "infrastructure",
  },
  {
    pathTemplates: ["/api/auth/login", "/api/auth/refresh"],
    methods: ["POST"],
    baseDurationMs: 90,
    p95Multiplier: 3.2,
    statusPool: [200, 200, 200, 401, 401, 429, 500],
    levelBias: ["info", "info", "warn", "error"],
    category: "auth",
  },
  {
    pathTemplates: ["/api/users", "/api/users/:id"],
    methods: ["GET", "PATCH"],
    baseDurationMs: 55,
    p95Multiplier: 2.6,
    statusPool: [200, 200, 200, 200, 404, 500],
    levelBias: ["debug", "info", "info", "warn", "error"],
    category: "user",
  },
  {
    pathTemplates: ["/api/products", "/api/products/:id", "/api/search"],
    methods: ["GET"],
    baseDurationMs: 45,
    p95Multiplier: 2.0,
    statusPool: [200, 200, 200, 200, 304, 404, 500],
    levelBias: ["debug", "info", "info", "info", "warn"],
    category: "catalog",
  },
  {
    pathTemplates: ["/api/cart", "/api/checkout", "/api/orders"],
    methods: ["GET", "POST", "DELETE"],
    baseDurationMs: 135,
    p95Multiplier: 4.0,
    statusPool: [200, 200, 201, 201, 400, 409, 422, 500],
    levelBias: ["info", "info", "warn", "error", "error"],
    category: "commerce",
  },
  {
    pathTemplates: ["/api/settings"],
    methods: ["GET", "PUT"],
    baseDurationMs: 65,
    p95Multiplier: 2.4,
    statusPool: [200, 200, 204, 400, 403, 500],
    levelBias: ["info", "info", "warn", "error"],
    category: "config",
  },
];

const environments = [
  "production",
  "production",
  "production",
  "staging",
  "development",
];
const regions = ["us-east-1", "eu-west-1", "ap-southeast-1"];
const browsers = ["chrome", "firefox", "safari", "edge"];

type SimulationStats = {
  sentEvents: number;
  sentBatches: number;
  failedBatches: number;
  droppedEvents: number;
  lastError: string | null;
  lastRunAt: string | null;
};

const stats: SimulationStats = {
  sentEvents: 0,
  sentBatches: 0,
  failedBatches: 0,
  droppedEvents: 0,
  lastError: null,
  lastRunAt: null,
};

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChance(probability: number): boolean {
  return Math.random() < probability;
}

function resolvePath(template: string): string {
  if (!template.includes(":id")) return template;
  return template.replace(":id", randomInt(1, 1000).toString());
}

function generateDuration(profile: EndpointProfile): number {
  // Tail latency sampling ensures p95/p99 charts are meaningful.
  const isTail = randomChance(0.08);
  const multiplier = isTail
    ? profile.p95Multiplier + Math.random() * 2.5
    : 0.6 + Math.random() * 1.4;
  return Math.max(1, Math.round(profile.baseDurationMs * multiplier));
}

function generateMessage(
  method: HttpMethod,
  path: string,
  status: number,
  level: LogLevel,
): string {
  if (status >= 500) {
    return `Upstream dependency failure while handling ${method} ${path}`;
  }

  if (status >= 400) {
    return `Client request rejected for ${method} ${path} with status ${status}`;
  }

  if (level === "debug") {
    return `Handled ${method} ${path} with detailed debug trace`;
  }

  if (status === 304) {
    return `Cache hit for ${method} ${path}`;
  }

  return `Request completed for ${method} ${path}`;
}

function generateRandomLog() {
  const profile = getRandom(endpointProfiles);
  const method = getRandom(profile.methods);
  const path = resolvePath(getRandom(profile.pathTemplates));
  const status = getRandom(profile.statusPool);

  const fallbackLevel: LogLevel =
    status >= 500 ? "error" : status >= 400 ? "warn" : "info";
  const level = getRandom([...profile.levelBias, fallbackLevel]);

  const duration = generateDuration(profile);
  const environment = getRandom(environments);

  return {
    level,
    timestamp: Date.now(),
    environment,
    method,
    path,
    status,
    duration,
    message: generateMessage(method, path, status, level),
    sessionId: crypto.randomUUID().slice(0, 8),
    meta: {
      region: getRandom(regions),
      browser: getRandom(browsers),
      category: profile.category,
      retryCount: randomChance(0.1) ? randomInt(1, 3) : 0,
      cacheHit: status === 304,
      upstream: randomChance(0.15) ? "payments-service" : "none",
    },
  };
}

function getBatchSize(mode: SimulationMode): number {
  if (mode === "steady") {
    return randomChance(0.85) ? randomInt(1, 4) : randomInt(5, 8);
  }

  if (mode === "bursty") {
    return randomChance(0.65) ? randomInt(4, 12) : randomInt(13, 30);
  }

  return randomChance(0.5) ? randomInt(8, 20) : randomInt(21, 45);
}

function getNextDelayMs(mode: SimulationMode): number {
  if (mode === "steady") {
    const jitter = randomInt(-250, 250);
    return Math.max(250, BASE_INTERVAL_MS + jitter);
  }

  if (mode === "bursty") {
    return randomChance(0.4)
      ? randomInt(150, 600)
      : randomInt(BASE_INTERVAL_MS, BASE_INTERVAL_MS * 2);
  }

  return randomInt(80, Math.max(120, BASE_INTERVAL_MS));
}

let isSimulating = false;
let currentMode: SimulationMode =
  VALID_MODES.find((mode) => mode === process.env.MODE) ?? "steady";
let loopTimer: ReturnType<typeof setTimeout> | null = null;

async function sendBatch(batchSize: number) {
  if (!SERVICE_TOKEN) {
    stats.lastError = "SERVICE_TOKEN is not set";
    return;
  }

  const logs = Array.from({ length: batchSize }, () => generateRandomLog());

  try {
    const response = await fetch(`${API_URL}/api/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-deko-service-token": SERVICE_TOKEN,
      },
      // Send arrays so ingest batch logic and dashboard distributions are exercised.
      body: JSON.stringify(logs),
    });

    if (!response.ok) {
      stats.failedBatches += 1;
      stats.lastError = `${response.status} ${response.statusText}`;
      const error = await response.text();
      console.error(
        `Failed batch (${batchSize} events): ${response.status} ${response.statusText}`,
        error,
      );
      return;
    }

    const payload = (await response.json()) as {
      data?: {
        accepted?: number;
        rejected?: number;
      };
    };

    const accepted = payload.data?.accepted ?? batchSize;
    const rejected = payload.data?.rejected ?? 0;

    stats.sentBatches += 1;
    stats.sentEvents += accepted;
    stats.droppedEvents += rejected;
    stats.lastRunAt = new Date().toISOString();
    stats.lastError = null;

    console.log(
      `Batch sent: size=${batchSize} accepted=${accepted} rejected=${rejected} mode=${currentMode}`,
    );
  } catch (error) {
    stats.failedBatches += 1;
    stats.lastError = error instanceof Error ? error.message : String(error);
    console.error("Error sending simulator batch:", error);
  }
}

function scheduleNextTick() {
  if (!isSimulating) return;
  const delayMs = getNextDelayMs(currentMode);

  loopTimer = setTimeout(async () => {
    await sendBatch(getBatchSize(currentMode));
    scheduleNextTick();
  }, delayMs);
}

function startSimulation() {
  if (isSimulating) return;

  isSimulating = true;
  console.log(
    `Starting simulator: mode=${currentMode} baseIntervalMs=${BASE_INTERVAL_MS}`,
  );

  // Send one batch immediately so data appears quickly after startup.
  void sendBatch(getBatchSize(currentMode));
  scheduleNextTick();
}

function stopSimulation() {
  if (!isSimulating) return;

  isSimulating = false;
  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }

  console.log("Simulator stopped.");
}

function parseMode(input: string | undefined): SimulationMode | null {
  if (!input) return null;
  return VALID_MODES.includes(input as SimulationMode)
    ? (input as SimulationMode)
    : null;
}

// Routes
app.get("/", (c) => c.text("Deko log simulator is running"));

app.get("/status", (c) => {
  return c.json({
    isSimulating,
    mode: currentMode,
    apiUrl: API_URL,
    baseIntervalMs: BASE_INTERVAL_MS,
    hasToken: !!SERVICE_TOKEN,
    stats,
  });
});

app.post("/start", (c) => {
  startSimulation();
  return c.json({
    message: "Simulation started",
    mode: currentMode,
  });
});

app.post("/stop", (c) => {
  stopSimulation();
  return c.json({ message: "Simulation stopped" });
});

app.post("/tick", async (c) => {
  const countParam = new URL(c.req.url).searchParams.get("count");
  const count = countParam ? Math.max(1, Math.min(100, Number(countParam))) : 1;

  if (!Number.isFinite(count)) {
    return c.json({ error: "Invalid count query parameter" }, 400);
  }

  await sendBatch(count);
  return c.json({
    message: "Manual batch sent",
    count,
    mode: currentMode,
  });
});

app.post("/mode/:mode", (c) => {
  const mode = parseMode(c.req.param("mode"));

  if (!mode) {
    return c.json(
      {
        error: "Invalid mode",
        validModes: VALID_MODES,
      },
      400,
    );
  }

  currentMode = mode;
  return c.json({
    message: "Simulation mode updated",
    mode: currentMode,
  });
});

// Start simulation immediately if token is present
if (SERVICE_TOKEN) {
  startSimulation();
} else {
  console.warn(
    "No SERVICE_TOKEN provided. Simulator is idle. Set SERVICE_TOKEN and call POST /start.",
  );
}

export default {
  port: 5000,
  fetch: app.fetch,
};
