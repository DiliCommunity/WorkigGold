/**
 * Фильтр заказов по стеку программиста.
 * Настраивается в env FILTER_SKILLS (через запятую) или здесь по умолчанию.
 */

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
  "перевод текста",
  "копирайтинг",
  "рерайтинг",
  "сео текст",
  "реклама в вк",
  "таргетолог",
  "smm",
  "архитектор",
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
