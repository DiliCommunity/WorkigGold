export interface ParsedOrder {
  title: string;
  description: string;
  platform: string;
  platformOrderId?: string;
  budget?: number;
  currency: string;
  url?: string;
  rawData?: Record<string, unknown>;
}

export interface ParserResult {
  platform: string;
  orders: ParsedOrder[];
  count: number;
  error?: string;
}
