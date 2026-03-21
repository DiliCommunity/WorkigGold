export interface ParsedOrder {
  title: string;
  description: string;
  platform: string;
  platformOrderId?: string;
  budget?: number;
  currency: string;
  clientName?: string | null;
  url?: string;
  /** Дата публикации заказчиком на бирже */
  postedAt?: Date | null;
  rawData?: Record<string, unknown>;
}

export interface ParserResult {
  platform: string;
  orders: ParsedOrder[];
  count: number;
  error?: string;
}
