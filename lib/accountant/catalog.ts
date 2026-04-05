/**
 * Справочник платных услуг бирж (ориентиры). Цены меняются — проверяйте на сайтах.
 * Обновляйте при необходимости в коде или через расширение UI позже.
 */
export type ServiceKind = "subscription" | "response" | "promo" | "commission";

export type ExchangeService = {
  id: string;
  platform: string;
  name: string;
  kind: ServiceKind;
  /** Минимальная / типичная цена в ₽ (или диапазон в name) */
  priceRub: number;
  period?: string;
  note: string;
  docUrl?: string;
};

export const EXCHANGE_SERVICES: ExchangeService[] = [
  {
    id: "kwork-response",
    platform: "Kwork",
    name: "Отклик / предложение к проекту",
    kind: "response",
    priceRub: 0,
    note: "Часто бесплатно лимитированно; платные опции и комиссия с заказа — см. тарифы Kwork.",
    docUrl: "https://kwork.ru/pages/terms",
  },
  {
    id: "kwork-commission",
    platform: "Kwork",
    name: "Комиссия платформы с заказа",
    kind: "commission",
    priceRub: 0,
    note: "Процент от суммы сделки (зависит от оборота с клиентом, типично ~12–20%).",
    docUrl: "https://blog.kwork.ru",
  },
  {
    id: "fl-pro",
    platform: "FL.ru",
    name: "PRO / подписка исполнителя (если доступна)",
    kind: "subscription",
    priceRub: 990,
    period: "мес",
    note: "Тарифы FL.ru периодически обновляются — смотрите раздел оплаты в кабинете.",
    docUrl: "https://www.fl.ru/",
  },
  {
    id: "fl-response",
    platform: "FL.ru",
    name: "Платный отклик / выделение (при наличии)",
    kind: "response",
    priceRub: 49,
    note: "У некоторых проектов отклик платный; сумма указывается в карточке заказа.",
    docUrl: "https://www.fl.ru/projects/",
  },
  {
    id: "freelance-ru-plus",
    platform: "Freelance.ru",
    name: "Плюс / расширенные возможности",
    kind: "subscription",
    priceRub: 590,
    period: "мес",
    note: "Ориентир; актуальные пакеты — в настройках аккаунта на Freelance.ru.",
    docUrl: "https://freelance.ru/",
  },
  {
    id: "freelance-ru-response",
    platform: "Freelance.ru",
    name: "Платный отклик на проект",
    kind: "response",
    priceRub: 30,
    note: "Если заказчик включил платные отклики — цена видна перед отправкой.",
    docUrl: "https://freelance.ru/",
  },
  {
    id: "guru-membership",
    platform: "Guru",
    name: "Membership / пакеты для фрилансеров",
    kind: "subscription",
    priceRub: 2000,
    period: "год",
    note: "Guru в USD; сумма в ₽ ориентировочная по курсу. Проверяйте guru.com.",
    docUrl: "https://www.guru.com/pricing/",
  },
  {
    id: "guru-bids",
    platform: "Guru",
    name: "Connects / отклики",
    kind: "response",
    priceRub: 150,
    note: "Система «connects» — покупка пакетов для подачи заявок.",
    docUrl: "https://www.guru.com/help/",
  },
];

export const PLANNED_EXCHANGES = [
  {
    name: "Habr Career (хабр)",
    freeParsing: "частично",
    pros: ["IT-аудитория", "много вакансий с зарплатой", "RSS и открытые страницы"],
    cons: ["не классическая биржа проектов", "ограничения на автоматизацию", "ToS"],
  },
  {
    name: "Хабр Фриланс",
    freeParsing: "да (публичные страницы)",
    pros: ["тех. заказы", "знакомый стек"],
    cons: ["меньше объёма чем у гигантов", "структура HTML может меняться"],
  },
  {
    name: "Upwork",
    freeParsing: "нет (логин, антибот)",
    pros: ["крупный рынок", "USD"],
    cons: ["Connects платные", "нужен аккаунт", "парсинг против правил"],
  },
  {
    name: "Fiverr",
    freeParsing: "ограничено",
    pros: ["пакетные услуги"],
    cons: ["не проектная модель как на FL", "парсинг сложный"],
  },
  {
    name: "Truelancer / PeoplePerHour",
    freeParsing: "частично",
    pros: ["доп. каналы"],
    cons: ["мало RU", "модерация и блокировки"],
  },
] as const;
