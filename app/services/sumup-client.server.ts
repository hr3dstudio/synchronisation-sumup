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

type SumupHistoryTransaction = {
  id: string;
  transaction_code?: string;
  type?: string;
  status?: string;
  simple_status?: string;
  amount?: number;
  currency?: string;
  timestamp?: string;
};

type SumupDetailedProduct = {
  description?: string;
  name?: string;
  price?: number;
  quantity?: number;
  total_price?: number;
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
    const transactions = Array.isArray(payload.items) ? payload.items : [];
    return Promise.all(
      transactions.map((transaction: SumupHistoryTransaction) =>
        this.withTransactionDetails(transaction),
      ),
    );
  }

  private async withTransactionDetails(
    transaction: SumupHistoryTransaction,
  ): Promise<SumupTransactionDto> {
    if (!transaction.transaction_code) {
      return this.toTransactionDto(transaction);
    }

    const url = new URL(`/v0.1/me/transactions`, this.baseUrl);
    url.searchParams.set("merchant_code", this.merchantCode);
    url.searchParams.set("transaction_code", transaction.transaction_code);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`SumUp transaction detail API error ${response.status}`);
    }

    const detail = await response.json();
    return this.toTransactionDto({ ...transaction, ...detail }, detail);
  }

  private toTransactionDto(
    transaction: SumupHistoryTransaction,
    raw: Record<string, unknown> = transaction as Record<string, unknown>,
  ): SumupTransactionDto {
    const products = Array.isArray(raw.products) ? raw.products : [];
    return {
      id: transaction.id,
      transaction_code: transaction.transaction_code,
      type: transaction.type ?? "PAYMENT",
      status: transaction.status ?? transaction.simple_status ?? "UNKNOWN",
      amount: Number(transaction.amount ?? 0),
      currency: transaction.currency ?? "EUR",
      timestamp: transaction.timestamp ?? new Date().toISOString(),
      items: products.map((product: SumupDetailedProduct, index: number) => ({
        id: `${transaction.id}:${index}`,
        name: product.name ?? product.description ?? "Produit SumUp",
        quantity: Number(product.quantity ?? 1),
        raw: product,
      })),
      raw,
    };
  }
}
