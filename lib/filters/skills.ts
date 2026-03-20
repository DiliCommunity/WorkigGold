/**
 * Фильтр заказов по стеку программиста.
 * Строгий режим: только заказы, явно совпадающие с навыками.
 * Настраивается в env FILTER_SKILLS (через запятую) или здесь по умолчанию.
 */

export const STACK_DISPLAY = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "API",
  "PostgreSQL",
  "Telegram-боты",
];

// Ядро стека — только то, что реально делаешь (Full-Stack, React, Node, боты)
const DEFAULT_SKILLS = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "nextjs",
  "node.js",
  "node ",
  "python",
  "rest api",
  "api ",
  "frontend",
  "backend",
  "fullstack",
  "full-stack",
  "full stack",
  "fastapi",
  "aiogram",
  "telegram bot",
  "telegram-бот",
  "telegram бот",
  "telegram бота",
  "postgresql",
  "postgres",
  "prisma",
  "tailwind",
  "веб-приложен",
  "веб приложен",
  "разработка сайт",
  "разработка веб",
  "landing",
  "лендинг",
  "парсер",
  "скрипт",
  "бот ",
];

const EXCLUDE_KEYWORDS = [
  // Дизайн / 3D / визуал
  "autocad",
  "3d графика",
  "3d моделирован",
  "визуализаци",
  "архитектур",
  "чертёж",
  "дизайн интерьера",
  "фотошоп",
  "illustrator",
  "рисунок",
  "графика",
  "моушн",
  "видеомонтаж",
  "монтаж видео",
  "озвучка",

  // Тексты / реклама / маркетинг
  "перевод текста",
  "копирайтинг",
  "рерайтинг",
  "сео текст",
  "seo текст",
  "реклама в вк",
  "реклама и маркетинг",
  "таргетолог",
  "smm",
  "продвижение услуг",
  "банкротств",
  "лидогенерац",
  "публикация объявлений",
  "разместить объявлени",

  // Продажи / офлайн
  "архитектор",
  "авитолог",
  "автосалон",
  "отдел продаж",

  // Презентации
  "поверпоинт",
  "powerpoint",
  "презентация",

  // Строительство / сметы / инженерия
  "смета",
  "сметчик",
  "составить смету",
  "строительн",
  "ремонт квартиры",
  "ремонт дома",
  "вентиляци",
  "сити-ферм",
  "сити ферм",
  "маршрутные карты",
  "технологический процесс",
  "насос",
  "инженери",
  "проектировщик",
  "автокад",
  "loginom",
  "логином",

  // 1C / CRM / Bitrix
  "1с",
  "1с программист",
  "1c",
  "битрикс24",
  "bitrix24",
  "amo crm",
  "amocrm",
  "crm-система",
  "crm система",

  // Маркетплейсы / карточки товаров
  "wildberries",
  "wb",
  "вайлдберриз",
  "ozon",
  "озон",
  "яндекс маркет",
  "yandex market",
  "маркетплейс",
  "карточки товара",
  "карточка товара",
  "заполнять карточки",
  "контент-менеджер",
  "контент менеджер",

  // CMS / конструктора
  "drupal",
  "друпал",
  "wordpress",
  "вордпресс",
  "tilda",
  "тильда",
  "bitrix",
  "битрикс",
];

function getSkillKeywords(): string[] {
  const env = process.env.FILTER_SKILLS;
  if (env && env.trim()) {
    return env.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }
  return DEFAULT_SKILLS;
}

export function matchesProgrammerStack(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  const skills = getSkillKeywords();
  const hasSkill = skills.some((s) => text.includes(s));
  const hasExcluded = EXCLUDE_KEYWORDS.some((s) => text.includes(s));
  return hasSkill && !hasExcluded;
}

/** Минимум совпадений include, чтобы заказ прошёл (строгий режим) */
export const DEFAULT_MIN_INCLUDE_MATCHES = 2;

export function getFilterConfig() {
  return {
    skills: getSkillKeywords(),
    excludeKeywords: EXCLUDE_KEYWORDS,
    minIncludeMatches: DEFAULT_MIN_INCLUDE_MATCHES,
  };
}
