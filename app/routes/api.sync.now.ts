import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { synchronizeInventory } from "../services/inventory-sync.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const run = await synchronizeInventory({
    shop: session.shop,
    admin,
    source: "manual",
    dryRun: true,
  });
  return Response.json(run);
};
