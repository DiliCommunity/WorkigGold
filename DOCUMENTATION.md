# WorkingGold — Документация

## Описание проекта

Админ-панель для фильтрации и отбора фриланс-заказов. Заказы приходят в Telegram через webhook, есть чат с заказчиками и статистика принятых/отклонённых заказов.

---

## Стек технологий

| Слой | Технология |
|------|------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| БД | PostgreSQL (Vercel Postgres) |
| ORM | Prisma — защита от SQL-инъекций |
| Парсинг | Python (отдельные скрипты) |
| Уведомления | Telegram Bot API |
| AI/Агенты | MCP, OpenAI API (опционально) |

---

## Безопасность: SQL-инъекции

Prisma — это ORM, который использует параметризованные запросы. Никакой сырой конкатенации строк в SQL нет.

### Как Prisma защищает от SQL-инъекций

1. **Параметризованные запросы** — значения передаются отдельно от запроса.
2. **Типизация** — параметры валидируются на этапе TypeScript.

### Пример безопасного кода (Prisma)

```typescript
// ✅ Безопасно — Prisma экранирует значения
const orders = await prisma.freelanceOrder.findMany({
  where: { title: { contains: userInput } }
});
```

### Чего избегать

```typescript
// ❌ Не использовать $queryRaw с конкатенацией
const result = await prisma.$queryRawUnsafe(
  `SELECT * FROM FreelanceOrder WHERE title = '${userInput}'`
);

// ✅ Если нужен raw SQL — использовать $queryRaw с параметрами
const result = await prisma.$queryRaw`
  SELECT * FROM "FreelanceOrder" WHERE title = ${userInput}
`;
```

### Рекомендации

- По умолчанию использовать методы Prisma (`findMany`, `create` и т.д.).
- Raw-запросы — только через параметризованный `$queryRaw` или `$executeRaw`.
- Избегать `$queryRawUnsafe` и `$executeRawUnsafe` с пользовательским вводом.

---

## Что уже сделано

- [x] Next.js приложение с App Router
- [x] Tailwind: тёмная тема, золотистый, зелёный, морской
- [x] Боковое меню (дашборд, заказы, чаты, статистика)
- [x] Страница дашборда
- [x] Страница заказов с карточками
- [x] Страница чатов и детальный чат
- [x] Страница статистики с модалкой «Принят / Отклонён»
- [x] Prisma-схема (Task, ProjectDeadline)
- [x] .env.example
- [x] Страница задач (API, БД)
- [x] Страница календаря дедлайнов (API, БД)

---

## Что сделать дальше

### 1. Backend и БД
- [ ] Настроить Supabase / Vercel Postgres и `DATABASE_URL`
- [ ] Выполнить `prisma migrate` / `prisma db push`
- [ ] API: CRUD заказов, статистики, сообщений

### 2. Telegram-бот
- [x] Регистрация бота через @BotFather
- [x] Webhook на `/api/telegram/webhook`
- [x] Логи агентов в Telegram (TELEGRAM_CHAT_ID)
- [x] Команды: /start, /parse, /status, /miniapp
- [x] Мини-приложение на `/mini-app`

### 3. Парсер фриланс-бирж
- [x] Парсеры: FL.ru (Фл-Разведчик), Kwork (Кворк-Сборщик), Habr (Хабр-Дозорный), Weblancer (Веблансер-Сканёр)
- [x] API `POST /api/parse` — запуск всех парсеров
- [ ] Cron / GitHub Actions для периодического запуска
- [x] Сохранение в БД, логи в Telegram

### 4. AI-агенты и MCP
- [ ] Прораб-агент: принимает задачу, делегирует worker-агентам
- [ ] Parser-агент: парсинг и нормализация
- [ ] Filter-агент: фильтрация по навыкам/бюджету
- [ ] Notifier-агент: уведомления в Telegram
- [ ] MCP-инструменты для агентов (поиск, анализ и т.п.)

### 5. Оптимизация
- [ ] Индексы в БД (platform, status, createdAt)
- [ ] Пагинация заказов
- [ ] Кэш (Redis) для частых запросов
- [ ] Очереди для парсинга (Bull, Inngest)

---

## Запуск проекта

```bash
# Установка зависимостей
npm install

# Копирование переменных окружения
cp .env.example .env
# Заполнить .env:
# - DATABASE_URL — PostgreSQL
# - TELEGRAM_BOT_TOKEN — токен от @BotFather
# - TELEGRAM_CHAT_ID — ID чата для логов агентов (ваш user ID или канал)

# Генерация Prisma Client
npx prisma generate

# Миграции (после настройки БД)
npx prisma db push

# Разработка
npm run dev
```

---

## Подключение Telegram Mini App

1. В @BotFather: `/mybots` → выберите бота → Bot Settings → Menu Button → Configure menu button.
2. URL: `https://ваш-домен.com/mini-app` (для локальной разработки можно ngrok).
3. Отправьте `/miniapp` в боте — откроется мини-приложение.

---

## Структура папок

```
WorkingGold/
├── app/                # Next.js App Router
│   ├── api/
│   │   ├── parse/      # Запуск парсеров
│   │   ├── orders/     # Список заказов
│   │   └── telegram/   # Webhook бота
│   ├── mini-app/       # Telegram Mini App
│   ├── page.tsx        # Дашборд
│   ├── orders/         # Список заказов
│   ├── chat/           # Чаты и детальный чат
│   └── stats/          # Статистика
├── components/
├── lib/
│   ├── prisma.ts       # Prisma client
│   ├── utils.ts
│   └── mock-data.ts
├── prisma/
│   └── schema.prisma
└── DOCUMENTATION.md
```
