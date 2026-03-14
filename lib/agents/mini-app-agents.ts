/**
 * Конфигурация агентов для mini-app и веб: фильтры и платформы
 */

export interface MiniAppAgent {
  id: string;
  name: string;
  platform: string;
  platformFilter: string | null; // null = все, "FL.ru" = только FL.ru
  description: string;
}

/** Агенты-сборщики: можно фильтровать заказы по платформе */
export const MINI_APP_AGENTS: MiniAppAgent[] = [
  { id: "fl-razvedchik", name: "Фл-Разведчик", platform: "FL.ru", platformFilter: "FL.ru", description: "Сканирует FL.ru" },
  { id: "kwork-sborschik", name: "Кворк-Сборщик", platform: "Kwork", platformFilter: "Kwork", description: "Собирает заказы Kwork" },
  { id: "habr-dozorny", name: "Хабр-Дозорный", platform: "Habr", platformFilter: "Habr Freelance", description: "Мониторит Habr" },
  { id: "weblancer-skaner", name: "Веблансер-Сканёр", platform: "Weblancer", platformFilter: "Weblancer", description: "Сканирует Weblancer" },
  { id: "dispatcher", name: "Диспетчер", platform: "Все", platformFilter: null, description: "Все платформы" },
  { id: "vestnik", name: "Вестник", platform: "Уведомления", platformFilter: null, description: "Уведомления в бот" },
];

export const GATHER_AGENT_IDS = ["fl-razvedchik", "kwork-sborschik", "habr-dozorny", "weblancer-skaner"];
