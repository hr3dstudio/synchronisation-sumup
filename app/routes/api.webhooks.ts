import type { ActionFunctionArgs } from "react-router";
import { authenticate, sessionStorage } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session } = await authenticate.webhook(request);

  if (topic === "APP_UNINSTALLED" && session) {
    await sessionStorage.deleteSession(session.id);
  }

  console.log(`Webhook recu: ${topic} pour ${shop}`);
  return new Response();
};
