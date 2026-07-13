import { describe, expect, it } from "vitest";
import { verifyCronSecret } from "../app/utils/cron-auth.server";

describe("verifyCronSecret", () => {
  it("refuse les secrets manquants", () => {
    process.env.CRON_SECRET = "secret";
    expect(() => verifyCronSecret(new Request("https://app.test/api/cron/sumup-sync"))).toThrow();
  });

  it("accepte le secret dans l'en-tete Authorization", () => {
    process.env.CRON_SECRET = "secret";
    expect(() =>
      verifyCronSecret(
        new Request("https://app.test/api/cron/sumup-sync", {
          headers: { Authorization: "Bearer secret" },
        }),
      ),
    ).not.toThrow();
  });
});
