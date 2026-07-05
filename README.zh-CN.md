# Claude Code 合规自查

> 面向 Claude Code 使用环境的浏览器端合规自查工具。它帮助用户核对浏览器信号、网络出口信号、DNS 解析证据，以及脱敏后的 Claude Code 本机配置是否与 Anthropic 支持地区政策一致。

[English](README.md) · [Русский](README.ru.md)

[打开在线检测](https://ai-check.mydaily.info) · [Anthropic Supported Countries & Regions](https://www.anthropic.com/supported-countries)

## 这是什么

Claude Code 合规自查是一个轻量、注重隐私的网页工具，用于检查当前 Claude Code 使用环境是否与 Anthropic 支持国家和地区政策保持一致。

工具以 Anthropic 官方支持国家和地区页面作为 allowlist。未出现在支持清单中的国家、地区、territory，以及官方列明的区域例外，都会被视为限制地区风险信号。评分是百分制风险分：越低越好。

本项目定位是合规化整改辅助工具。它不提供规避限制、绕过检测、逃避封禁或违反 Anthropic 条款的操作建议。

## 检测什么

- 浏览器语言、时区、平台与 WebRTC candidate 暴露情况。
- HTTP 网络出口国家或地区、ASN、组织、协议与 Cloudflare 请求元数据。
- 配置探针后，检测 IPv4 与 IPv6 出口一致性。
- 接入 authoritative DNS 事件源后，检测 DNS resolver 出口。
- 用户粘贴的脱敏 Claude Code 本机配置，包括 `ANTHROPIC_BASE_URL`、代理变量、Locale 与 shell 时区。

本工具通过官方支持地区清单覆盖所有 Anthropic 限制地区判断。如果 Anthropic 更新支持清单，需要同步更新 `app.js` 中的 `SUPPORTED_COUNTRY_CODES` 与 `UNSUPPORTED_REGION_RULES`。

## 如何使用

1. 打开[在线检测页面](https://ai-check.mydaily.info)。
2. 运行浏览器与网络检测。
3. 在 Claude Code 所在电脑终端复制并运行页面生成的命令，把输出的脱敏 JSON 粘贴回网页。
4. 查看风险分、证据和合规化整改建议。

本机配置核对目前仅支持 Claude Code 所在电脑端。其他尚未验证的运行路径在具备稳定可操作方案前不会展示。

## 数据声明

- 浏览器与网络检测只在用户点击按钮后运行。
- 在线网络探针会收到完成网络检测所需的请求元数据，例如基于出口 IP 推断的国家、ASN、请求时间、协议和相关 Cloudflare 请求信息。
- 脱敏 Claude Code 配置 JSON 只在浏览器本地解析。
- 前端不会上传用户粘贴的 Claude Code JSON。
- 前端不使用 cookie、`localStorage` 或 `IndexedDB`。
- 页面状态只存在内存中。关闭页面后，结果、粘贴内容和评分都会被清除。

## 评分模型

| 模块 | 权重 |
|---|---:|
| 出口国家或地区是否在官方支持清单内 | 20 |
| 出口网络画像 | 10 |
| IPv4 / IPv6 一致性 | 10 |
| DNS resolver 出口 | 15 |
| 浏览器环境一致性 | 10 |
| WebRTC 网络暴露 | 5 |
| Claude Code `ANTHROPIC_BASE_URL` | 15 |
| Claude Code 代理环境变量 | 8 |
| Claude Code Locale 与 shell 时区 | 7 |

风险分段：

| 分数 | 含义 |
|---:|---|
| 0-19 | 低风险 |
| 20-39 | 注意风险 |
| 40-59 | 高风险 |
| 60-79 | 严重风险 |
| 80-100 | 极高风险 |

## 自部署

仓库包含 Cloudflare Worker 与 Static Assets：

- `worker.js`：网络探针 API 与静态资源 fallback。
- `public/`：可部署的前端资源。
- `wrangler.example.toml`：部署配置模板。

部署自己的实例：

```bash
cp wrangler.example.toml wrangler.toml
npx wrangler login
npx wrangler deploy
```

部署前，请在本地 `wrangler.toml` 中替换自己的域名、KV namespace 和 DNS probe domain。不要提交真实 `wrangler.toml`；该文件默认已被 `.gitignore` 忽略。

DNS 证据所需 Worker 配置：

```toml
[[kv_namespaces]]
binding = "DNS_EVENTS"
id = "your_kv_namespace_id"
```

必需 Worker 变量：

```text
DNS_PROBE_DOMAIN=dns-probe.example.com
```

必需 Worker secret：

```bash
npx wrangler secret put DNS_EVENT_SECRET
```

可选 Worker secret：

```text
DNS_COLLECTOR_IP=203.0.113.10
```

DNS resolver 检测需要 authoritative DNS 事件源。普通网页或普通 HTTP 请求无法直接识别用户 DNS resolver。如果 DNS 证据未接入，页面会把该项标记为未接入，而不是伪造结果。

## 仓库结构

```text
index.html              开发入口页面
styles.css              前端样式
app.js                  前端检测与评分逻辑
worker.js               Cloudflare Worker 探针 API
public/                 Cloudflare Static Assets 副本
collector/              可选 authoritative DNS collector 源码
wrangler.example.toml   Cloudflare 部署配置模板
LICENSE                 MIT License
```

## 合规依据

主要公开来源：

- [Anthropic Supported Countries & Regions](https://www.anthropic.com/supported-countries)
- [Anthropic Consumer Terms of Service](https://www.anthropic.com/legal/consumer-terms)
- [Anthropic Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms)

## 免责声明

本项目不隶属于 Anthropic。它是一个合规自查工具，用于帮助用户发现并整改 Claude Code 使用环境中的不一致配置；不提供规避限制、逃避执行或违反服务条款的操作指引。

## License

MIT License。详见 [LICENSE](LICENSE)。
