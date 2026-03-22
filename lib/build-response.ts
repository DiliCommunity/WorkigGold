/**
 * Сборка текста отклика для заказа.
 * Данные резюме берутся из env (RESUME_*).
 */

export interface ResumeConfig {
  name: string;
  skills: string;
  experience: string;
  portfolioUrl: string;
  email: string;
  phone?: string;
  intro?: string;
}

export function getResumeConfig(): ResumeConfig | null {
  const name = process.env.RESUME_NAME?.trim();
  const skills = process.env.RESUME_SKILLS?.trim();
  const experience = process.env.RESUME_EXPERIENCE?.trim();
  const portfolioUrl = process.env.RESUME_PORTFOLIO_URL?.trim();
  const email = process.env.RESUME_EMAIL?.trim();
  const phone = process.env.RESUME_PHONE?.trim();
  const intro = process.env.RESUME_INTRO?.trim();

  if (!name || !skills || !experience || !email) return null;

  return {
    name,
    skills: skills || "",
    experience: experience || "",
    portfolioUrl: portfolioUrl || "",
    email,
    phone: phone || undefined,
    intro: intro || undefined,
  };
}

export function buildResponseText(
  order: { title?: string; description?: string; platform?: string },
  config: ResumeConfig
): string {
  const lines: string[] = [];

  // Приветствие (можно упомянуть проект)
  const greeting = config.intro || `Добрый день!

Готов выполнить ваш проект «${order.title || "заказ"}».`;
  lines.push(greeting.trim());
  lines.push("");

  // Резюме
  lines.push("---");
  lines.push(`О себе: ${config.name}`);
  lines.push(`Навыки: ${config.skills}`);
  lines.push(`Опыт: ${config.experience}`);
  if (config.portfolioUrl) {
    lines.push(`Портфолио: ${config.portfolioUrl}`);
  }
  lines.push(`Контакты: ${config.email}${config.phone ? `, ${config.phone}` : ""}`);
  lines.push("---");
  lines.push("");
  lines.push("Буду рад обсудить детали.");

  return lines.join("\n");
}
