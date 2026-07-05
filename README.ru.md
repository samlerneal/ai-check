# Claude Code Compliance Check

> Браузерный инструмент самопроверки соответствия для среды Claude Code. Он помогает проверить сигналы браузера, сетевой выход, DNS resolver evidence и обезличенную локальную конфигурацию Claude Code относительно политики поддерживаемых регионов Anthropic.

[English](README.md) · [简体中文](README.zh-CN.md)

[Открыть проверку](https://ai-check.mydaily.info) · [Anthropic Supported Countries & Regions](https://www.anthropic.com/supported-countries)

## Что Это

Claude Code Compliance Check — это легкая веб-страница для проверки того, выглядит ли среда Claude Code согласованной с политикой поддерживаемых стран и регионов Anthropic.

Инструмент использует страницу Anthropic Supported Countries & Regions как allowlist. Страны, территории и официальные региональные исключения вне этого списка считаются сигналами риска ограниченного региона. Оценка — это риск по шкале 100: чем ниже, тем лучше.

Проект предназначен для легального исправления конфигурации. Он не дает инструкций по обходу ограничений, уклонению от блокировок или нарушению условий Anthropic.

## Что Проверяется

- Язык браузера, часовой пояс, платформа и раскрытие WebRTC candidates.
- Страна или регион HTTP-сетевого выхода, ASN, организация, протокол и Cloudflare metadata.
- Согласованность IPv4 и IPv6 выхода, если настроены probe origins.
- DNS resolver exit, если подключен authoritative DNS event source.
- Обезличенная локальная конфигурация Claude Code, которую вставляет пользователь: `ANTHROPIC_BASE_URL`, proxy-переменные, locale и часовой пояс shell.

Инструмент покрывает все проверки ограниченных регионов Anthropic через официальный список поддерживаемых регионов. Если Anthropic обновит список, обновите `SUPPORTED_COUNTRY_CODES` и `UNSUPPORTED_REGION_RULES` в `app.js`.

## Как Использовать

1. Откройте [размещенную страницу проверки](https://ai-check.mydaily.info).
2. Запустите проверку браузера и сети.
3. На компьютере, где запущен Claude Code, скопируйте команду, выполните ее в терминале и вставьте обезличенный JSON обратно на страницу.
4. Просмотрите риск, доказательства и рекомендации по легальному исправлению.

Проверка локальной конфигурации сейчас поддерживает компьютер, где запущен Claude Code. Другие непроверенные runtime-пути не показываются, пока для них нет надежного пользовательского пути.

## Заявление О Данных

- Проверки браузера и сети запускаются только после нажатия кнопки.
- Сетевой probe получает request metadata, необходимую для проверки сети, например страну по выходному IP, ASN, время запроса, протокол и связанные Cloudflare request metadata.
- Обезличенный JSON конфигурации Claude Code разбирается только в браузере.
- Frontend не загружает вставленный Claude Code JSON.
- Frontend не использует cookies, `localStorage` или `IndexedDB`.
- Состояние страницы хранится только в памяти. Закрытие страницы очищает результаты, вставленный текст и оценки.

## Модель Оценки

| Модуль | Вес |
|---|---:|
| Страна или регион выхода относительно официального списка | 20 |
| Профиль сети выхода | 10 |
| Согласованность IPv4 / IPv6 | 10 |
| DNS resolver exit | 15 |
| Согласованность среды браузера | 10 |
| Раскрытие сети через WebRTC | 5 |
| Claude Code `ANTHROPIC_BASE_URL` | 15 |
| Proxy-переменные Claude Code | 8 |
| Locale и часовой пояс shell Claude Code | 7 |

Диапазоны риска:

| Балл | Значение |
|---:|---|
| 0-19 | Низкий риск |
| 20-39 | Требует внимания |
| 40-59 | Высокий риск |
| 60-79 | Серьезный риск |
| 80-100 | Критический риск |

## Self-Hosting

Репозиторий содержит Cloudflare Worker со Static Assets:

- `worker.js`: network probe API и fallback для static assets.
- `public/`: frontend assets для деплоя.
- `wrangler.example.toml`: шаблон конфигурации деплоя.

Развертывание своего экземпляра:

```bash
cp wrangler.example.toml wrangler.toml
npx wrangler login
npx wrangler deploy
```

Перед деплоем обновите локальный `wrangler.toml`: укажите свой домен, KV namespace и DNS probe domain. Не коммитьте настоящий `wrangler.toml`; он по умолчанию находится в `.gitignore`.

Конфигурация Worker для DNS evidence:

```toml
[[kv_namespaces]]
binding = "DNS_EVENTS"
id = "your_kv_namespace_id"
```

Обязательная переменная Worker:

```text
DNS_PROBE_DOMAIN=dns-probe.example.com
```

Обязательный Worker secret:

```bash
npx wrangler secret put DNS_EVENT_SECRET
```

Опциональный Worker secret:

```text
DNS_COLLECTOR_IP=203.0.113.10
```

Для определения DNS resolver нужен authoritative DNS event source. Обычная браузерная страница или обычный HTTP-запрос не может напрямую раскрыть DNS resolver пользователя. Если DNS evidence не подключен, страница отмечает пункт как неподключенный, а не подделывает результат.

## Структура Репозитория

```text
index.html              Страница входа для разработки
styles.css              Стили frontend
app.js                  Логика проверки и оценки
worker.js               Cloudflare Worker probe API
public/                 Копия Cloudflare Static Assets
collector/              Опциональный authoritative DNS collector source
wrangler.example.toml   Шаблон Cloudflare deployment config
LICENSE                 MIT License
```

## Основа Соответствия

Основные публичные источники:

- [Anthropic Supported Countries & Regions](https://www.anthropic.com/supported-countries)
- [Anthropic Consumer Terms of Service](https://www.anthropic.com/legal/consumer-terms)
- [Anthropic Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms)

## Disclaimer

Проект не связан с Anthropic. Это инструмент самопроверки соответствия, который помогает пользователям находить и исправлять несогласованные настройки среды Claude Code. Он не предоставляет инструкции по обходу ограничений, уклонению от enforcement или нарушению условий сервиса.

## License

MIT License. См. [LICENSE](LICENSE).
