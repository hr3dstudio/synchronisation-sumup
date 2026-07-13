import type { SumupTransactionDto } from "./sumup-client.server";

export function isRefund(transaction: Pick<SumupTransactionDto, "type" | "amount">) {
  return transaction.type.toLowerCase().includes("refund") || transaction.amount < 0;
}

export function stockDelta(
  quantity: number,
  refund: boolean,
  autoRestockFullRefunds: boolean,
) {
  if (refund) {
    return autoRestockFullRefunds ? Math.abs(quantity) : 0;
  }
  return -Math.abs(quantity);
}

export function createIdempotencyKey(
  transactionId: string,
  lineId: string,
  delta: number,
) {
  return `${transactionId}:${lineId}:${delta}`;
}
