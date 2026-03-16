/**
 * Фильтр заказов по стеку программиста.
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
  "Web",
  "Telegram-боты",
];

const DEFAULT_SKILLS = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node",
  "node.js",
  "python",
  "api",
  "разработка",
  "программист",
  "frontend",
  "backend",
  "fullstack",
  "full-stack",
  "web",
  "приложение",
  "бот",
  "telegram",
  "sql",
  "postgresql",
  "prisma",
  "tailwind",
];

const EXCLUDE_KEYWORDS = [
  // Дизайн / 3D / визуал
  "autocad",
  "3d графика",
  "3d моделирование",
  "визуализация",
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

  // Тексты / реклама
  "перевод текста",
  "копирайтинг",
  "рерайтинг",
  "сео текст",
  "seo текст",
  "реклама в вк",
  "реклама и маркетинг",
  "таргетолог",
  "smm",

  // Продажи / офлайн-бизнес
  "архитектор",
  "авитолог",
  "автосалон",
  "отдел продаж",

  // Презентации
  "поверпоинт",
  "powerpoint",
  "презентация",

  // Строительство / сметы
  "смета",
  "сметчик",
  "составить смету",
  "строительн",
  "ремонт квартиры",
  "ремонт дома",

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

export function getFilterConfig() {
  return {
    skills: getSkillKeywords(),
    excludeKeywords: EXCLUDE_KEYWORDS,
  };
}
