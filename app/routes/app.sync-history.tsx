import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return prisma.syncRun.findMany({
    where: { shop: session.shop },
    take: 50,
    orderBy: { startedAt: "desc" },
  });
};

export default function SyncHistory() {
  const runs = useLoaderData<typeof loader>();

  return (
    <s-page heading="Historique">
      <s-section>
        <s-table>
          <s-table-header-row>
            <s-table-header>Source</s-table-header>
            <s-table-header>Statut</s-table-header>
            <s-table-header>Simulation</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {runs.map((run) => (
              <s-table-row key={run.id}>
                <s-table-cell>{run.source}</s-table-cell>
                <s-table-cell>{run.status}</s-table-cell>
                <s-table-cell>{run.dryRun ? "oui" : "non"}</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}
