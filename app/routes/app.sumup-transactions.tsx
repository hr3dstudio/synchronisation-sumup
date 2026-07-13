import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return prisma.sumupTransaction.findMany({
    where: { shop: session.shop },
    take: 50,
    orderBy: { occurredAt: "desc" },
  });
};

export default function SumupTransactions() {
  const transactions = useLoaderData<typeof loader>();

  return (
    <s-page heading="Transactions SumUp">
      <s-section>
        <s-table>
          <s-table-header-row>
            <s-table-header>Transaction</s-table-header>
            <s-table-header>Statut</s-table-header>
            <s-table-header>Montant</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {transactions.map((transaction) => (
              <s-table-row key={transaction.id}>
                <s-table-cell>{transaction.sumupTransactionId}</s-table-cell>
                <s-table-cell>{transaction.status}</s-table-cell>
                <s-table-cell>{String(transaction.amount)} {transaction.currency}</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}
