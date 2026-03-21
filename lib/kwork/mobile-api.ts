/**
 * Минимальный клиент к api.kwork.ru (как в kwork-api), без WebSocket и node-persist —
 * пригодно для Vercel / serverless.
 *
 * Учётные данные: KWORK_LOGIN, KWORK_PASSWORD в .env (на Vercel — в Environment Variables).
 * Опционально: KWORK_PHONE_LAST — последние цифры телефона, если Kwork просит подтверждение (код 192).
 */

const KWORK_API_BASE = "https://api.kwork.ru/";
/** Тот же Basic, что в пакете kwork-api (mobile API) */
const KWORK_MOBILE_AUTHORIZATION = "Basic bW9iaWxlX2FwaTpxRnZmUmw3dw==";

type KworkJson = Record<string, unknown> & {
  success?: boolean;
  error_code?: string | number;
  response?: unknown;
  paging?: { pages?: number };
};

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

async function kworkPost(method: string, params: Record<string, string | number | undefined>): Promise<KworkJson | null> {
  const url = `${KWORK_API_BASE}${method}${buildQuery(params)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: KWORK_MOBILE_AUTHORIZATION,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as KworkJson;
  } catch {
    return null;
  }
}

export async function kworkSignIn(
  login: string,
  password: string,
  phoneLast?: string
): Promise<{ token: string } | { error: string }> {
  let data = await kworkPost("signIn", { login, password });
  if (!data) return { error: "Нет ответа от api.kwork.ru (signIn)" };

  if (String(data.error_code) === "192" && phoneLast) {
    const retry = await kworkPost("signIn", { login, password, phone_last: phoneLast });
    if (!retry) return { error: "Нет ответа от api.kwork.ru (signIn, повтор с phone_last)" };
    data = retry;
  }

  if (data.success && data.response && typeof data.response === "object" && data.response !== null) {
    const r = data.response as { token?: string };
    if (r.token) return { token: r.token };
  }

  const errMsg =
    (data.response && typeof data.response === "object" && "message" in data.response
      ? String((data.response as { message?: string }).message)
      : null) || String(data.error_code || "signIn failed");
  return { error: errMsg };
}

/** Элемент списка проектов с биржи (поля могут отличаться — мапим гибко) */
export type KworkProjectRaw = Record<string, unknown>;

export async function kworkFetchProjectsPages(
  token: string,
  maxPages = 5
): Promise<KworkProjectRaw[]> {
  const all: KworkProjectRaw[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages && page < maxPages) {
    const data = await kworkPost("projects", {
      token,
      categories: "",
      page,
    });
    if (!data) break;

    const paging = data.paging as { pages?: number } | undefined;
    if (paging?.pages != null) totalPages = Math.min(paging.pages, maxPages);

    const list = data.response;
    if (Array.isArray(list)) {
      for (const item of list) {
        if (item && typeof item === "object") all.push(item as KworkProjectRaw);
      }
    } else if (list && typeof list === "object" && Array.isArray((list as { data?: unknown }).data)) {
      for (const item of (list as { data: unknown[] }).data) {
        if (item && typeof item === "object") all.push(item as KworkProjectRaw);
      }
    }

    page += 1;
    if (!Array.isArray(list) || list.length === 0) break;
  }

  return all;
}

export function mapKworkProjectToOrder(p: KworkProjectRaw): {
  id: string;
  title: string;
  description: string;
  budget?: number;
  currency: string;
  url: string;
  postedAt?: Date | null;
} | null {
  const id =
    String(p.id ?? p.project_id ?? p.PID ?? "");
  if (!id || id === "undefined") return null;

  const title = String(
    p.name ?? p.title ?? p.subject ?? p.header ?? ""
  ).trim();
  if (title.length < 3) return null;

  const description = String(p.description ?? p.desc ?? p.text ?? title).trim().slice(0, 2000);

  let budget: number | undefined;
  const price = p.price ?? p.budget ?? p.cost;
  if (typeof price === "number" && !Number.isNaN(price)) budget = price;
  else if (typeof price === "string") {
    const n = parseFloat(price.replace(/\s/g, "").replace(",", "."));
    if (!Number.isNaN(n)) budget = n;
  }

  const currency = String(p.currency ?? "RUB").toUpperCase().includes("USD") ? "USD" : "RUB";

  const urlPath = p.url ?? p.link ?? p.href;
  let url: string;
  if (typeof urlPath === "string" && urlPath.startsWith("http")) url = urlPath;
  else if (typeof urlPath === "string" && urlPath.startsWith("/")) url = `https://kwork.ru${urlPath}`;
  else url = `https://kwork.ru/projects/${id}/view`;

  // Kwork API: created_at, date, publish_date, published_at (ISO или timestamp)
  let postedAt: Date | undefined;
  const dateVal = p.created_at ?? p.date ?? p.publish_date ?? p.published_at;
  if (typeof dateVal === "string" || typeof dateVal === "number") {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) postedAt = d;
  }

  return { id, title, description, budget, currency, url, postedAt };
}

export function getKworkCredentialsFromEnv(): {
  login: string;
  password: string;
  phoneLast?: string;
} | null {
  const login = process.env.KWORK_LOGIN?.trim();
  const password = process.env.KWORK_PASSWORD?.trim();
  if (!login || !password) return null;
  const phoneLast = process.env.KWORK_PHONE_LAST?.trim();
  return { login, password, phoneLast: phoneLast || undefined };
}
