import { describe, expect, it } from "vitest";
import { createIdempotencyKey, isRefund, stockDelta } from "../app/services/sync-rules.server";

describe("inventory sync rules", () => {
  it("deduit le stock pour une vente", () => {
    expect(stockDelta(2, false, false)).toBe(-2);
  });

  it("ne restocke pas les remboursements par defaut", () => {
    expect(stockDelta(2, true, false)).toBe(0);
  });

  it("peut restocker les remboursements quand l'option est active", () => {
    expect(stockDelta(2, true, true)).toBe(2);
  });

  it("detecte les remboursements par type ou montant", () => {
    expect(isRefund({ type: "REFUND", status: "SUCCESSFUL", amount: 10 })).toBe(true);
    expect(isRefund({ type: "PAYMENT", status: "SUCCESSFUL", amount: -10 })).toBe(true);
    expect(isRefund({ type: "PAYMENT", status: "REFUNDED", amount: 10 })).toBe(true);
  });

  it("detecte les paiements entierement rembourses par evenement SumUp", () => {
    expect(
      isRefund({
        type: "PAYMENT",
        status: "SUCCESSFUL",
        amount: 4,
        raw: {
          transaction_events: [
            {
              event_type: "REFUND",
              status: "REFUNDED",
              amount: 4,
            },
          ],
        },
      }),
    ).toBe(true);
  });

  it("cree une cle d'idempotence par transaction, ligne et delta", () => {
    expect(createIdempotencyKey("tx", "line", -1)).toBe("tx:line:-1");
  });
});
