import { unauthenticated } from "../shopify.server";
import { synchronizeInventory } from "./inventory-sync.server";

const DEFAULT_INTERVAL_MINUTES = 5;
const DEFAULT_LOOKBACK_MINUTES = 720;

type SchedulerGlobal = typeof globalThis & {
  __sumupInternalSchedulerStarted?: boolean;
};

function numberFromEnv(name: string, defaultValue: number) {
  const value = Number(process.env[name] ?? "");
  return Number.isFinite(value) && value > 0 ? value : defaultValue;
}

function enabled() {
  return process.env.INTERNAL_SUMUP_SYNC_ENABLED !== "false";
}

async function runInternalSumupSync() {
  const shop = process.env.SHOPIFY_SHOP;
  if (!shop) {
    console.warn("Internal SumUp sync skipped: SHOPIFY_SHOP missing");
    return;
  }

  try {
    const { admin } = await unauthenticated.admin(shop);
    const run = await synchronizeInventory({
      shop,
      admin,
      source: "cron",
      lookbackMinutes: numberFromEnv("INTERNAL_SUMUP_SYNC_LOOKBACK_MINUTES", DEFAULT_LOOKBACK_MINUTES),
    });
    console.log("Internal SumUp sync completed", {
      runId: run.id,
      status: run.status,
      scannedCount: run.scannedCount,
      adjustedCount: run.adjustedCount,
      interventionCount: run.interventionCount,
      dryRun: run.dryRun,
    });
  } catch (error) {
    console.error("Internal SumUp sync failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export function startInternalSumupScheduler() {
  const schedulerGlobal = globalThis as SchedulerGlobal;
  if (schedulerGlobal.__sumupInternalSchedulerStarted || !enabled()) return;
  schedulerGlobal.__sumupInternalSchedulerStarted = true;

  const intervalMinutes = numberFromEnv(
    "INTERNAL_SUMUP_SYNC_INTERVAL_MINUTES",
    DEFAULT_INTERVAL_MINUTES,
  );
  const interval = intervalMinutes * 60 * 1000;

  setTimeout(runInternalSumupSync, 30_000);
  const timer = setInterval(runInternalSumupSync, interval);
  timer.unref?.();

  console.log("Internal SumUp sync scheduler started", {
    intervalMinutes,
    lookbackMinutes: numberFromEnv(
      "INTERNAL_SUMUP_SYNC_LOOKBACK_MINUTES",
      DEFAULT_LOOKBACK_MINUTES,
    ),
  });
}
