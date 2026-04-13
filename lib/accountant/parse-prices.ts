/**
 * Ориентиры цен с публичных страниц бирж: эвристика по HTML давала неверные суммы.
 * Используйте справочник `catalog.ts` и ручные правки в БД (AccountantPriceOverride).
 */
export type ParsedPriceRow = {
  id: string;
  priceRub: number | null;
  period?: string;
  note: string;
  sourceUrl: string;
};

export async function parseExchangePriceHints(): Promise<{
  updates: ParsedPriceRow[];
  errors: string[];
}> {
  return { updates: [], errors: [] };
}
