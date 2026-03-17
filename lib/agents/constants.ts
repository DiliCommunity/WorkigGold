/**
 * Имена агентов — связаны с их действиями и биржами
 */

export const AGENTS = {
  /** Прораб — верхний уровень, чат с пользователем, координация */
  PRORAB: {
    id: "prorab",
    name: "Прораб",
    description: "Координирует всех агентов, принимает задачи от пользователя",
    platform: "All",
    role: "coordination" as const,
  },
  /** FL.ru — парсер объявлений с биржи */
  FL_RAZVEDCHIK: {
    id: "fl-razvedchik",
    name: "Фл-Разведчик",
    description: "Сканирует FL.ru и собирает свежие заказы",
    platform: "FL.ru",
  },
  /** Kwork — парсер объявлений */
  KWORK_SBORSCHIK: {
    id: "kwork-sborschik",
    name: "Кворк-Сборщик",
    description: "Собирает заказы с Kwork",
    platform: "Kwork",
  },
  /** Freelance.ru — парсер */
  FREELANCE_RU_SKANER: {
    id: "freelance-ru-skaner",
    name: "Фрилансру-Сканёр",
    description: "Сканирует проекты на freelance.ru",
    platform: "Freelance.ru",
  },
  /** Weblancer — парсер */
  WEBLANCER_SKANER: {
    id: "weblancer-skaner",
    name: "Веблансер-Сканёр",
    description: "Сканирует заказы на Weblancer",
    platform: "Weblancer",
  },
  /** Guru — парсер */
  GURU_SKANER: {
    id: "guru-skaner",
    name: "Гуру-Сканёр",
    description: "Сканирует заказы на guru.com",
    platform: "Guru",
  },
  /** Общий оркестратор */
  DISPATCHER: {
    id: "dispatcher",
    name: "Диспетчер",
    description: "Запускает парсеры и сводит результаты",
    platform: "All",
  },
  /** Отправка уведомлений в Telegram */
  VESTNIK: {
    id: "vestnik",
    name: "Вестник",
    description: "Отправляет уведомления в Telegram",
    platform: "Telegram",
  },
} as const;

export type AgentId = keyof typeof AGENTS;
