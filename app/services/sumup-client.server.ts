export type SumupTransactionItemDto = {
  id: string;
  product_id?: string;
  name: string;
  sku?: string;
  quantity: number;
  raw?: unknown;
};

export type SumupTransactionDto = {
  id: string;
  transaction_code?: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: string;
  items?: SumupTransactionItemDto[];
  raw?: unknown;
};

export class SumupClient {
  constructor(
    private readonly apiKey = process.env.SUMUP_API_KEY!,
    private readonly merchantCode = process.env.SUMUP_MERCHANT_CODE!,
    private readonly baseUrl = "https://api.sumup.com",
  ) {}

  async transactions(since: Date): Promise<SumupTransactionDto[]> {
    const url = new URL(`/v0.1/me/transactions/history`, this.baseUrl);
    url.searchParams.set("merchant_code", this.merchantCode);
    url.searchParams.set("newest_time", new Date().toISOString());
    url.searchParams.set("oldest_time", since.toISOString());

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`SumUp API error ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload.items) ? payload.items : [];
  }
}
