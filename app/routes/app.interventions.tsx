import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return prisma.manualIntervention.findMany({
    where: { shop: session.shop },
    take: 50,
    orderBy: { createdAt: "desc" },
  });
};

export default function Interventions() {
  const interventions = useLoaderData<typeof loader>();

  return (
    <s-page heading="Interventions">
      <s-section>
        <s-table>
          <s-table-header-row>
            <s-table-header>Titre</s-table-header>
            <s-table-header>Type</s-table-header>
            <s-table-header>Statut</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {interventions.map((intervention) => (
              <s-table-row key={intervention.id}>
                <s-table-cell>{intervention.title}</s-table-cell>
                <s-table-cell>{intervention.type}</s-table-cell>
                <s-table-cell>{intervention.status}</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}
