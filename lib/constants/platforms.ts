/**
 * Поддерживаемые биржи фриланса. Только они показываются в фильтрах и считаются в статистике.
 * Weblancer и прочие легаси — скрыты.
 */
export const SUPPORTED_PLATFORMS = [
  "FL.ru",
  "Freelance.ru",
  "Guru",
  "Kwork",
  "Telegram",
  "VK",
  "Reddit",
] as const;

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export function isSupportedPlatform(platform: string): platform is SupportedPlatform {
  return SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform);
}
