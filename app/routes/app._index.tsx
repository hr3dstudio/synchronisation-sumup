import type { LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [lastRun, openInterventions] = await Promise.all([
    prisma.syncRun.findFirst({
      where: { shop: session.shop },
      orderBy: { startedAt: "desc" },
    }),
    prisma.manualIntervention.count({
      where: { shop: session.shop, status: "OPEN" },
    }),
  ]);
  return { lastRun, openInterventions };
};

export default function Dashboard() {
  const { lastRun, openInterventions } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Synchronisation SumUp">
      <s-section heading="Etat de la synchronisation">
        <s-stack gap="base">
          <s-text>Derniere execution : {lastRun?.status ?? "aucune"}</s-text>
          <s-text>Interventions ouvertes : {openInterventions}</s-text>
          <Form method="post" action="/api/sync/now">
            <s-button variant="primary" accessibilityLabel="Lancer une simulation" type="submit">
              Lancer une simulation
            </s-button>
          </Form>
        </s-stack>
      </s-section>
    </s-page>
  );
}
