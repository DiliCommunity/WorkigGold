export type KeywordFilterConfig = {
  include: string[];
  exclude: string[];
  /**
   * Минимальное число совпадений include, чтобы считать заказ релевантным.
   * По умолчанию 1.
   */
  minIncludeMatches?: number;
};

export type KeywordFilterResult = {
  matches: boolean;
  includeMatches: string[];
  excludeMatches: string[];
  score: number; // простой скоринг: include*10 - exclude*50
};

function normalizeKeyword(s: string): string {
  return s.trim().toLowerCase();
}

export function normalizeConfig(cfg: KeywordFilterConfig): KeywordFilterConfig {
  const include = cfg.include.map(normalizeKeyword).filter(Boolean);
  const exclude = cfg.exclude.map(normalizeKeyword).filter(Boolean);
  const minIncludeMatches = Math.max(1, cfg.minIncludeMatches ?? 1);
  return { include, exclude, minIncludeMatches };
}

export function scoreTextAgainstKeywords(text: string, cfg: KeywordFilterConfig): KeywordFilterResult {
  const normalized = normalizeConfig(cfg);
  const t = text.toLowerCase();

  const includeMatches = normalized.include.filter((k) => t.includes(k));
  const excludeMatches = normalized.exclude.filter((k) => t.includes(k));

  const score = includeMatches.length * 10 - excludeMatches.length * 50;
  const matches = includeMatches.length >= (normalized.minIncludeMatches ?? 1) && excludeMatches.length === 0;

  return { matches, includeMatches, excludeMatches, score };
}

