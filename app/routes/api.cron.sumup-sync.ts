import type { LoaderFunctionArgs } from "react-router";
import { unauthenticated } from "../shopify.server";
import { synchronizeInventory } from "../services/inventory-sync.server";
import { verifyCronSecret } from "../utils/cron-auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  verifyCronSecret(request);
  const shop = process.env.SHOPIFY_SHOP;
  if (!shop) return new Response("SHOPIFY_SHOP missing", { status: 500 });

  try {
    const { admin } = await unauthenticated.admin(shop);
    const run = await synchronizeInventory({ shop, admin, source: "cron" });
    return Response.json(run);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    console.error("Cron SumUp sync failed", { shop, message });
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
};
