import { unauthenticated } from "../shopify.server";
import { synchronizeInventory } from "./inventory-sync.server";

const shop = process.env.SHOPIFY_SHOP;

if (!shop) {
  throw new Error("SHOPIFY_SHOP doit etre defini pour npm run sync:sumup.");
}

const { admin } = await unauthenticated.admin(shop);
const run = await synchronizeInventory({ shop, admin, source: "manual" });
console.log(JSON.stringify(run, null, 2));
