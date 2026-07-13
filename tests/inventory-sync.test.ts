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
    expect(isRefund({ type: "REFUND", amount: 10 })).toBe(true);
    expect(isRefund({ type: "PAYMENT", amount: -10 })).toBe(true);
  });

  it("cree une cle d'idempotence par transaction, ligne et delta", () => {
    expect(createIdempotencyKey("tx", "line", -1)).toBe("tx:line:-1");
  });
});
