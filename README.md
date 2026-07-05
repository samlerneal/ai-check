# Claude Code Compliance Check

> A browser-based compliance self-check for Claude Code environments. It helps users review browser signals, network exit signals, DNS resolver evidence, and redacted local Claude Code configuration against Anthropic's supported-region policy.

[简体中文](README.zh-CN.md) · [Русский](README.ru.md)

[Use the hosted check](https://ai-check.mydaily.info) · [Anthropic Supported Countries & Regions](https://www.anthropic.com/supported-countries)

## What It Is

Claude Code Compliance Check is a lightweight, privacy-conscious page for checking whether a Claude Code environment appears consistent with Anthropic's supported countries and regions.

The tool uses Anthropic's supported countries and regions page as an allowlist. Countries, territories, and official regional exceptions outside that list are treated as restricted-region risk signals. The score is a 100-point risk score: lower is better.

This project is designed for compliant remediation. It does not provide bypass instructions, ban evasion guidance, or ways to violate Anthropic terms.

## What It Checks

- Browser language, timezone, platform, and WebRTC candidate exposure.
- HTTP network exit country or region, ASN, organization, protocol, and Cloudflare metadata.
- IPv4 and IPv6 exit consistency when probe origins are configured.
- DNS resolver exit when an authoritative DNS event source is connected.
- Redacted Claude Code local configuration pasted by the user, including `ANTHROPIC_BASE_URL`, proxy variables, locale, and shell timezone.

The page supports all Anthropic restricted-region checks by treating the official supported-region list as the source of truth. If Anthropic updates that list, update `SUPPORTED_COUNTRY_CODES` and `UNSUPPORTED_REGION_RULES` in `app.js`.

## How To Use

1. Open the [hosted check](https://ai-check.mydaily.info).
2. Run the browser and network check.
3. On the computer where Claude Code runs, copy the generated command, run it in the terminal, and paste the redacted JSON output back into the page.
4. Review the risk score, evidence, and compliant remediation suggestions.

The local Claude Code configuration step currently supports the computer where Claude Code runs. Other unverified runtime paths are not exposed until they have a reliable user path.

## Data Statement

- Browser and network checks run only after the user clicks the check button.
- The hosted network probe receives request metadata needed for network checks, such as exit IP-derived country, ASN, request time, protocol, and related Cloudflare request metadata.
- Redacted Claude Code configuration JSON is parsed only in the browser.
- The frontend does not upload pasted Claude Code JSON.
- The frontend does not use cookies, `localStorage`, or `IndexedDB`.
- Page state lives in memory only. Closing the page clears results, pasted text, and scores.

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

Risk bands:

| Score | Meaning |
|---:|---|
| 0-19 | Low risk |
| 20-39 | Attention needed |
| 40-59 | High risk |
| 60-79 | Severe risk |
| 80-100 | Critical risk |

## Self-Hosting

This repository includes a Cloudflare Worker with Static Assets:

- `worker.js`: network probe API and static asset fallback.
- `public/`: deployable frontend assets.
- `wrangler.example.toml`: deployment configuration template.

To deploy your own instance:

```bash
cp wrangler.example.toml wrangler.toml
npx wrangler login
npx wrangler deploy
```

Before deploying, update your local `wrangler.toml` with your own domain, KV namespace, and DNS probe domain. Do not commit the real `wrangler.toml`; it is ignored by default.

Required Worker configuration for DNS evidence:

```toml
[[kv_namespaces]]
binding = "DNS_EVENTS"
id = "your_kv_namespace_id"
```

Required Worker variable:

```text
DNS_PROBE_DOMAIN=dns-probe.example.com
```

Required Worker secret:

```bash
npx wrangler secret put DNS_EVENT_SECRET
```

Optional Worker secret:

```text
DNS_COLLECTOR_IP=203.0.113.10
```

DNS resolver detection requires an authoritative DNS event source. A normal browser page or standard HTTP request cannot directly reveal the user's DNS resolver. If DNS evidence is not connected, the page marks that item as not connected instead of inventing a result.

## Repository Layout

```text
index.html              Development entry page
styles.css              Frontend styles
app.js                  Frontend detection and scoring logic
worker.js               Cloudflare Worker probe API
public/                 Cloudflare Static Assets copy
collector/              Optional authoritative DNS collector source
wrangler.example.toml   Cloudflare deployment config template
LICENSE                 MIT License
```

## Compliance Basis

Primary public sources:

- [Anthropic Supported Countries & Regions](https://www.anthropic.com/supported-countries)
- [Anthropic Consumer Terms of Service](https://www.anthropic.com/legal/consumer-terms)
- [Anthropic Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms)

## Disclaimer

This project is not affiliated with Anthropic. It is a compliance self-check tool intended to help users find and remediate inconsistent Claude Code environment settings. It does not provide instructions to bypass restrictions, evade enforcement, or violate Anthropic terms.

## License

MIT License. See [LICENSE](LICENSE).
