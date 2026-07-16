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
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function textValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function numberValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function formatMoney(amount: unknown, currency: string) {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
  }).format(value);
}

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function SumupTransactions() {
  const transactions = useLoaderData<typeof loader>();

  return (
    <s-page heading="Transactions SumUp">
      <s-section>
        <s-table>
          <s-table-header-row>
            <s-table-header>Heure</s-table-header>
            <s-table-header>Produit</s-table-header>
            <s-table-header>Prix</s-table-header>
            <s-table-header>Paiement</s-table-header>
            <s-table-header>Statut</s-table-header>
            <s-table-header>Transaction</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {transactions.flatMap((transaction) => {
              const raw = asRecord(transaction.raw);
              const payment =
                textValue(raw, ["simple_payment_type", "payment_type", "entry_mode"]) ||
                transaction.type;
              const items = transaction.items.length
                ? transaction.items
                : [
                    {
                      id: `${transaction.id}:summary`,
                      name: textValue(raw, ["product_summary"]) || "Produit SumUp",
                      quantity: 1,
                      raw: {},
                    },
                  ];

              return items.map((item) => {
                const itemRaw = asRecord(item.raw);
                const itemPrice =
                  numberValue(itemRaw, ["total_price", "total_with_vat", "price"]) ??
                  Number(transaction.amount);
                const productName =
                  item.quantity > 1 ? `${item.quantity} x ${item.name}` : item.name;

                return (
                  <s-table-row key={`${transaction.id}:${item.id}`}>
                    <s-table-cell>{formatDateTime(transaction.occurredAt)}</s-table-cell>
                    <s-table-cell>{productName}</s-table-cell>
                    <s-table-cell>{formatMoney(itemPrice, transaction.currency)}</s-table-cell>
                    <s-table-cell>{payment}</s-table-cell>
                    <s-table-cell>{transaction.status}</s-table-cell>
                    <s-table-cell>{transaction.transactionCode ?? transaction.sumupTransactionId}</s-table-cell>
                  </s-table-row>
                );
              });
            })}
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}
