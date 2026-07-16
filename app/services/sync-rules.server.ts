import type { SumupTransactionDto } from "./sumup-client.server";

function refundedAmount(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return 0;
  const record = raw as Record<string, unknown>;
  const events = Array.isArray(record.transaction_events)
    ? record.transaction_events
    : Array.isArray(record.events)
      ? record.events
      : [];

  return events.reduce((total, event) => {
    if (!event || typeof event !== "object" || Array.isArray(event)) return total;
    const eventRecord = event as Record<string, unknown>;
    const eventType = String(eventRecord.event_type ?? eventRecord.type ?? "").toLowerCase();
    const eventStatus = String(eventRecord.status ?? "").toLowerCase();
    const amount = Number(eventRecord.amount ?? 0);
    if (
      Number.isFinite(amount) &&
      (eventType.includes("refund") || eventStatus.includes("refund"))
    ) {
      return total + Math.abs(amount);
    }
    return total;
  }, 0);
}

export function isRefund(transaction: Pick<SumupTransactionDto, "type" | "amount" | "raw">) {
  if (transaction.type.toLowerCase().includes("refund") || transaction.amount < 0) {
    return true;
  }

  const refunded = refundedAmount(transaction.raw);
  return refunded > 0 && refunded >= Math.abs(transaction.amount);
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
