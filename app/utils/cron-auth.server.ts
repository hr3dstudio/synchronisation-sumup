export function verifyCronSecret(request: Request) {
  const expected = process.env.CRON_SECRET;
  const header = request.headers.get("Authorization") ?? "";
  if (!expected || header !== `Bearer ${expected}`) {
    throw new Response("Unauthorized", { status: 401 });
  }
}
