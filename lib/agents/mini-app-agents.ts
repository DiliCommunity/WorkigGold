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
  {
    id: "freelance-ru-skaner",
    name: "Фрилансру-Сканёр",
    platform: "Freelance.ru",
    platformFilter: "Freelance.ru",
    description: "Сканирует freelance.ru",
  },
  { id: "kwork-sborschik", name: "Кворк-Сборщик", platform: "Kwork", platformFilter: "Kwork", description: "Собирает заказы Kwork" },
  { id: "guru-skaner", name: "Гуру-Сканёр", platform: "Guru", platformFilter: "Guru", description: "Сканирует guru.com" },
  { id: "dispatcher", name: "Диспетчер", platform: "Все", platformFilter: null, description: "Все платформы" },
  { id: "vestnik", name: "Вестник", platform: "Уведомления", platformFilter: null, description: "Уведомления в бот" },
];

export const GATHER_AGENT_IDS = ["fl-razvedchik", "freelance-ru-skaner", "kwork-sborschik", "guru-skaner"];
