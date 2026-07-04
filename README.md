# Claude Code Compliance Check

A browser-based compliance self-check tool for Claude Code. It checks browser signals, network exit information, and redacted local Claude Code configuration against Anthropic's Supported Countries & Regions policy. The score is a 100-point risk score: lower is better.

This project is designed for compliant remediation. It does not provide bypass instructions, ban evasion guidance, or ways to violate Anthropic terms.

## 简体中文介绍

Claude Code Compliance Check 是一个面向 Claude Code 的合规一致性自查网页。它通过一次点击读取浏览器环境和网络出口信号，再让用户粘贴本机生成的脱敏配置 JSON，用于检查当前使用环境是否与 Anthropic 支持地区政策一致。

工具使用 Anthropic 官方支持地区清单作为 allowlist。所有未列入支持清单的国家、地区、territory，以及官方列明的区域例外，都会被识别为限制地区风险。检测结果只用于合规化整改建议。

## English Introduction

Claude Code Compliance Check is a compliance-oriented self-check page for Claude Code. It reads browser and network signals with one click, then lets the user paste a locally generated redacted configuration JSON to review whether the environment is consistent with Anthropic's supported-region policy.

The tool uses Anthropic's official supported countries and regions as an allowlist. Any country, territory, or official regional exception outside that list is treated as restricted-region risk. Findings focus on compliant remediation only.

## Русское описание

Claude Code Compliance Check — это веб-инструмент самопроверки соответствия для Claude Code. Он одним нажатием считывает сигналы браузера и сетевого выхода, затем позволяет вставить локально созданный обезличенный JSON конфигурации, чтобы проверить согласованность среды с политикой поддерживаемых регионов Anthropic.

Инструмент использует официальный список поддерживаемых стран и регионов Anthropic как allowlist. Любая страна, территория или официальное региональное исключение вне списка считается риском ограниченного региона. Рекомендации направлены только на легальное исправление конфигурации.

## Features

- Two-step check: browser/network signals first, redacted Claude Code local configuration second.
- One risk score circle, always on a 100-point scale.
- Evidence coverage indicator, so missing enhanced probes are visible instead of hidden.
- Built-in language switch for Simplified Chinese, English, and Russian.
- Supported-region detection based on Anthropic's official allowlist.
- Flags all non-supported Anthropic regions by default, including China, Hong Kong, Macau, and any other country or territory not present in the official list.
- Handles official regional exceptions when the probe returns enough region detail, such as excluded regions in Ukraine.
- No file upload. Users paste redacted JSON directly.
- No cookies, localStorage, IndexedDB, or backend report storage.
- Mobile use is supported: the browser/network check runs on mobile browsers, and local Claude Code settings can be provided from a mobile terminal, SSH app, remote-control environment, or manual field entry.

## Compliance Basis

Primary public sources:

- Anthropic Supported Countries & Regions: https://www.anthropic.com/supported-countries
- Anthropic Consumer Terms of Service: https://www.anthropic.com/legal/consumer-terms
- Anthropic Commercial Terms of Service: https://www.anthropic.com/legal/commercial-terms

The commercial and consumer terms incorporate the supported regions policy. The implementation therefore treats Anthropic's supported list as the source of truth. If Anthropic changes the list, update `SUPPORTED_COUNTRY_CODES` and `UNSUPPORTED_REGION_RULES` in `app.js`.

## Scoring Model

| Module | Weight |
|---|---:|
| Exit country or region against official support list | 20 |
| Exit network profile | 10 |
| IPv4 / IPv6 consistency | 10 |
| DNS resolver exit | 15 |
| Browser environment consistency | 10 |
| WebRTC network exposure | 5 |
| Claude Code `ANTHROPIC_BASE_URL` | 15 |
| Claude Code proxy environment variables | 8 |
| Claude Code locale and shell timezone | 7 |

DNS resolver exit is an enhanced server-side item. A standard Cloudflare Worker receives HTTP requests, but it does not receive the user's authoritative DNS query event. Until an authoritative DNS log or external DNS event sink is connected, the page marks DNS as not connected rather than treating it as a user failure.

## Privacy Model

- Browser and network checks run only after the user clicks the check button.
- The default network probe receives the user's network request metadata, such as exit IP, country, ASN, request time, and basic protocol information.
- Redacted Claude Code local configuration JSON is parsed only in the browser and is not sent to the Worker.
- Page state is kept in memory only. Closing the page clears results, pasted text, and scores.
- The frontend does not use cookies, localStorage, or IndexedDB.

## Local Use

Open the file directly:

```bash
open index.html
```

When opened via `file://`, the page uses the built-in default probe endpoint:

```text
https://ai-check.mydaily.info
```

The endpoint receives network request metadata needed for browser/network checks. Redacted Claude Code local configuration JSON is still parsed only in the browser and is not sent to the probe endpoint.

## Cloudflare Deployment

This repository includes a Cloudflare Worker with Static Assets:

- `worker.js`: network probe API and static asset fallback.
- `public/`: deployable frontend assets.
- `wrangler.toml`: deployment configuration.

The current example domain is:

```text
https://ai-check.mydaily.info
```

For your own deployment, copy `wrangler.example.toml` to `wrangler.toml`, then replace the route:

```toml
[[routes]]
pattern = "ai-check.example.com"
custom_domain = true
```

Then run:

```bash
npx wrangler login
npx wrangler deploy
```

In non-interactive environments such as CI, set `CLOUDFLARE_API_TOKEN` as a secret environment variable. Do not commit tokens or paste them into issue threads.

## Enhanced IPv4, IPv6, and DNS Probes

The default Worker can return the HTTP exit country, ASN, organization, region, city, timezone, Cloudflare colo, HTTP protocol, and TLS version.

For stronger IPv4/IPv6 evidence, configure dedicated v4-only and v6-only probe origins and set Worker variables:

```text
IPV4_PROBE_ORIGIN=https://v4-probe.example.com
IPV6_PROBE_ORIGIN=https://v6-probe.example.com
```

For DNS resolver detection, add an authoritative DNS logging service or external DNS event sink. The Worker already exposes the token, event ingest, and result polling API:

- `POST /v1/probes/dns-token`: creates a short-lived token and lookup URL.
- `POST /v1/probes/dns-event`: receives the authoritative DNS event from your DNS logger.
- `GET /v1/probes/dns-result/{token}`: returns the resolver result to the browser and deletes the one-time event.

Required Worker configuration:

```toml
[[kv_namespaces]]
binding = "DNS_EVENTS"
id = "your_kv_namespace_id"
```

Required Worker variables:

```text
DNS_PROBE_DOMAIN=dns-probe.example.com
```

Required Worker secret (must be configured; the dns-event endpoint rejects requests when not set):

```bash
npx wrangler secret put DNS_EVENT_SECRET
```

Optional Worker secret:

```text
DNS_COLLECTOR_IP=203.0.113.10
```

If `DNS_COLLECTOR_IP` is set, `POST /v1/probes/dns-event` only accepts requests from that source IP. For collectors whose outbound path can use both IPv4 and IPv6, provide a comma-separated allowlist, for example `203.0.113.10,2001:db8::10`. This is an additional layer on top of `DNS_EVENT_SECRET` bearer-token authentication. Do not commit real IP addresses or secret values.

End-to-end DNS resolver flow:

1. Prepare a controlled probe domain, such as `dns-probe.mydaily.info`.
2. In Cloudflare DNS, delegate that subdomain to an authoritative DNS logger. The lowest-friction practical route is a tiny VPS running an authoritative DNS listener, with `NS` records for `dns-probe.mydaily.info`.
3. Configure the Worker with `DNS_PROBE_DOMAIN=dns-probe.mydaily.info`, a `DNS_EVENTS` KV namespace, and a `DNS_EVENT_SECRET`.
4. The browser calls `/v1/probes/dns-token` and receives a one-time URL like `https://{token}.dns-probe.mydaily.info/pixel.gif`.
5. Loading that URL forces the user's resolver to query the authoritative DNS logger.
6. The DNS logger extracts `{token}` from the query name, records the resolver IP, enriches it with country/ASN/organization through a GeoIP source, and calls `POST /v1/probes/dns-event` with `Authorization: Bearer <DNS_EVENT_SECRET>`.
7. The browser polls `/v1/probes/dns-result/{token}`.
8. The Worker returns the resolver result and deletes the event after the first successful read.

Example DNS event body:

```json
{
  "token": "00000000-0000-4000-8000-000000000000",
  "resolverIp": "203.0.113.10",
  "resolverCountry": "US",
  "resolverRegion": "California",
  "asn": 13335,
  "asOrganization": "Cloudflare"
}
```

A normal Cloudflare Worker cannot directly receive authoritative DNS queries. That is the technical reason DNS cannot be solved by frontend JavaScript alone. The real implementation requires one of these event sources:

- Recommended for this project: delegate `dns-probe.mydaily.info` to a small authoritative DNS collector that logs queries, enriches resolver IP metadata, and posts events to `/v1/probes/dns-event`.
- Operational alternative: use a DNS provider or log pipeline that can expose authoritative query logs and call `/v1/probes/dns-event`.
- Enterprise alternative: use Cloudflare DNS log delivery if the account plan exposes authoritative DNS query logs with resolver metadata.

Do not replace this with a simple HTTP request to a random subdomain. That only proves the browser can reach the host; it does not reveal the user's DNS resolver.

## Mobile Detection Notes

Mobile browsers can automatically run these checks:

- Browser language, timezone, platform, and user-agent hints exposed by the mobile browser.
- HTTP exit country/region, ASN, organization, and IPv4/IPv6 results from the network probe.
- WebRTC candidate exposure, subject to the mobile browser's WebRTC support.

Claude Code local configuration cannot be read directly from a mobile browser sandbox. The site therefore supports three mobile-safe ways to provide the same evidence:

- Run the command in the mobile terminal or SSH app where Claude Code is actually used, then paste the redacted JSON.
- Run the command in a remote-control shell connected to the Claude Code host, then paste the redacted JSON on the phone.
- If command execution is unavailable, enter the visible `ANTHROPIC_BASE_URL`, proxy, locale, and shell timezone fields manually; the page builds the same local JSON shape and scores it locally.

## Open Source Safety Checklist

Before publishing to GitHub:

- Keep `.wrangler/` out of Git. It may contain local Cloudflare account cache.
- Do not commit `.env`, API tokens, proxy credentials, or Cloudflare secrets.
- Review `wrangler.example.toml` and replace the example domain in your local `wrangler.toml` if this is a fork.
- Keep the compliance disclaimer visible in the website and README.
- Re-check Anthropic's supported regions page before a public release.

## Files

```text
index.html        Development entry page
styles.css        Frontend styles
app.js            Frontend detection and scoring logic
worker.js         Cloudflare Worker probe API
public/           Cloudflare Static Assets copy
wrangler.example.toml Cloudflare deployment config template
.gitignore        Public-release ignore rules
LICENSE           MIT License
```

## License

MIT License. See `LICENSE`.

## Disclaimer

This project is not affiliated with Anthropic. It is a compliance self-check tool intended to help users find and remediate inconsistent Claude Code environment settings. It does not provide instructions to bypass restrictions, evade enforcement, or violate Anthropic terms.
