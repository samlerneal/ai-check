const MODULE_WEIGHTS = {
  region: 20,
  network: 10,
  ipSplit: 10,
  dns: 15,
  browser: 10,
  webrtc: 5,
  baseUrl: 15,
  proxy: 8,
  locale: 7
}

const WEB_MODULES = ['region', 'network', 'ipSplit', 'dns', 'browser', 'webrtc']
const FULL_MODULES = [...WEB_MODULES, 'baseUrl', 'proxy', 'locale']
const DEFAULT_PROBE_ENDPOINT = 'https://ai-check.mydaily.info'

const RISK_LEVELS = [
  { max: 19, key: 'lowRisk', className: 'low' },
  { max: 39, key: 'guardedRisk', className: 'guarded' },
  { max: 59, key: 'highRisk', className: 'high' },
  { max: 79, key: 'severeRisk', className: 'severe' },
  { max: 100, key: 'criticalRisk', className: 'critical' }
]

const TIMEZONE_COUNTRY_HINTS = {
  'Asia/Shanghai': 'CN',
  'Asia/Chongqing': 'CN',
  'Asia/Harbin': 'CN',
  'Asia/Urumqi': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Macau': 'MO',
  'Asia/Taipei': 'TW',
  'Asia/Singapore': 'SG',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'America/Los_Angeles': 'US',
  'America/New_York': 'US',
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Moscow': 'RU'
}

const I18N = {
  zh: {
    heroEyebrow: 'Claude Code 专用 · 百分制风险分 · 关闭即删除',
    githubLink: 'GitHub',
    pageTitle: 'Claude Code 合规自查',
    heroLede: '一次点击完成浏览器与网络出口检测，再粘贴 Claude Code 脱敏配置 JSON，检查与 Anthropic 支持地区政策的一致性。发现问题后只给合规化整改建议。风险分越低越好。',
    privacyTitle: '数据声明',
    privacyCopy1: '检测结果只存在当前页面会话中。关闭页面后，检测结果、粘贴内容和评分都会被清除。',
    privacyCopy2: '本工具不使用 cookie、localStorage 或 IndexedDB 保存报告；本机配置 JSON 只在浏览器本地解析。',
    coverageTitle: '证据覆盖',
    workflowKicker: '流程',
    workflowTitle: '两步完成检测',
    clearSession: '清空本页结果',
    step1Number: '步骤 1 · 70/100',
    step1Title: '浏览器与网络检测',
    step1Copy: '点击后读取当前浏览器的语言、时区、平台信息和 WebRTC 候选地址，并连接默认网络检测服务检查出口国家或地区、ASN、IPv4/IPv6 分流。DNS 解析出口需要权威 DNS 事件源，接入后会自动纳入同一次检测。',
    runWebProbes: '开始环境与网络检测',
    step2Number: '步骤 2 · 30/100',
    step2Title: 'Claude Code 本机配置核对',
    step2Copy: '当前仅支持在 Claude Code 所在电脑终端运行命令并粘贴脱敏 JSON。页面只在浏览器本地解析，不会发送或保存。',
    commandLabel: '生成脱敏配置 JSON 的命令',
    copyCommand: '复制命令',
    diagnosticInputLabel: '粘贴脱敏配置 JSON',
    diagnosticPlaceholder: '{"env":{"ANTHROPIC_BASE_URL":"https://api.anthropic.com","HTTPS_PROXY":"set"},"locale":{"LANG":"en_US.UTF-8","AppleLocale":"en_US"},"timezone":"America/Los_Angeles"}',
    parseDiagnostic: '核对 Claude Code 配置',
    resultKicker: '结果',
    resultsTitle: '风险项、证据与合规化建议',
    basisKicker: '原理',
    basisTitle: '评分原理',
    principleRegionTitle: '出口地区',
    principleRegionCopy: '用 HTTP 出口国家、地区和 Anthropic Supported Countries allowlist 对比。不在清单或属于官方排除区域时直接满分扣分。',
    principleNetworkTitle: '出口网络画像',
    principleNetworkCopy: '先看出口国家是否支持，再看 ASN/AS 组织是否像共享代理、云厂商或中转网络。地区不支持优先于一致性。',
    principleIpTitle: 'IPv4 / IPv6',
    principleIpCopy: '分别检查 IPv4 与 IPv6 出口。任一路径落在限制地区都扣分；两条路径国家不一致也扣分。',
    principleDnsTitle: 'DNS 解析出口',
    principleDnsCopy: 'DNS resolver 需要 authoritative DNS 日志或外部 DNS 事件源。未接入时不伪造结果；接入后按 resolver 国家与 HTTP 出口一致性评分。',
    principleBrowserTitle: '浏览器语言与时区',
    principleBrowserCopy: '浏览器语言或时区如果直接指向限制地区会扣分；否则才作为与网络出口的一致性辅助信号。',
    principleWebRtcTitle: 'WebRTC',
    principleWebRtcCopy: '检查 WebRTC candidate 是否暴露可路由公网地址。它本身不能稳定判断国家，但可发现额外网络路径。',
    principleBaseUrlTitle: 'Claude Code BASE_URL',
    principleBaseUrlCopy: '检查 ANTHROPIC_BASE_URL 是否指向官方 API 或明确授权路径。不明端点、其他模型供应商或限制地区相关域名会扣分。',
    principleProxyTitle: '代理变量',
    principleProxyCopy: '检查 HTTP_PROXY、HTTPS_PROXY、ALL_PROXY、GRPC_PROXY。代理越多路径越不清晰；限制地区相关代理直接高风险。',
    principleLocaleTitle: '本机 Locale / shell 时区',
    principleLocaleCopy: '本机语言和时区如果指向限制地区会扣分；同时检查它们是否与浏览器和网络出口冲突。',
    principleIgnoredTitle: '不评分项',
    principleIgnoredCopy: '中文输入法、普通中文软件、用途自报等网页无法可靠检测或缺乏明确公开条款依据，不进入评分。',
    disclaimerKicker: '声明',
    disclaimerTitle: '合规使用声明',
    disclaimerCopy: '本工具严格遵守 Anthropic 使用条款、支持地区政策与 Claude Code 合规使用规范，致力于帮助用户发现并整改不一致配置，促进合规化使用；不提供规避限制、绕过检测或违反服务条款的操作建议。',
    defaultProbeNotConfigured: '默认网络检测服务尚未接入。当前可先完成 Claude Code 本机配置核对；部署服务后这里会一键运行。',
    networkServiceReady: '检测时会向默认网络检测服务发起请求；本机配置 JSON 不会发送到该服务。',
    networkServiceMissing: '默认网络检测服务尚未接入；接入后用户无需填写地址，点击按钮即可完成网络出口检测。',
    waitingStage: '等待开始检测',
    waitingCopy: '点击步骤 1 后才会读取浏览器和网络环境；完整检测需要再完成步骤 2。',
    coverageEmpty: '当前证据覆盖度 0%。步骤 1 浏览器与网络检测 70/100；步骤 2 本机配置 30/100。',
    stageFull: '阶段 2/2 · 完整风险分',
    stageWeb: '阶段 1/2 · 环境与网络风险分',
    scoreFullCopy: '{label}。已完成 Claude Code 本机配置核对，当前证据覆盖 {weight}/100。',
    scoreWebCopy: '{label}。已完成浏览器与网络出口检测，当前证据覆盖 {weight}/100；完成步骤 2 后生成完整风险分。',
    coverageCopy: '当前证据覆盖度 {coverage}%。步骤 1 浏览器与网络检测 70/100；步骤 2 本机配置 30/100。',
    lowRisk: '低风险',
    guardedRisk: '注意风险',
    highRisk: '高风险',
    severeRisk: '严重风险',
    criticalRisk: '极高风险',
    riskBandCopy: '分段：0-19 低风险，20-39 注意风险，40-59 高风险，60-79 严重风险，80-100 极高风险。',
    noFindings: '尚未开始检测。请先点击“开始环境与网络检测”。',
    noProbeDetails: '尚未产生检测明细。完成任一步骤后，这里会显示对应证据。',
    evidencePrefix: '证据：',
    advicePrefix: '合规化建议：',
    noRemediation: '无需整改。',
    improveCoverage: '补齐该检测项后可提高证据覆盖度。',
    browserProbe: '浏览器',
    webrtcProbe: 'WebRTC',
    httpProbe: 'HTTP 出口',
    ipv4Probe: 'IPv4 出口',
    ipv6Probe: 'IPv6 出口',
    dnsProbe: 'DNS 解析出口',
    notRead: '尚未读取。',
    notRun: '尚未运行。',
    networkNeeded: '需要网络检测服务。',
    dnsNeeded: 'DNS resolver 自动检测未接入；这是服务端增强项，不是你的操作缺失。',
    dnsUnavailableTitle: 'DNS 解析出口增强项未接入',
    dnsUnavailableDetail: '当前默认 Worker 无法直接获得用户 DNS resolver。要检测该项，需要接入可记录查询事件的 authoritative DNS 日志或外部 DNS 事件源。',
    dnsUnavailableAdvice: '如果需要完整覆盖网络 55 分证据，应部署 DNS 日志事件源；在未接入前，先以 HTTP 出口、ASN 与 IPv4/IPv6 结果作为主要合规依据。',
    dnsEventPending: 'DNS 事件尚未返回。',
    dnsCountryMissing: 'DNS 事件已返回，但缺少 resolver 国家/地区。',
    dnsCountryMissingAdvice: '在 DNS 事件源中接入 GeoIP/ASN 富化后再计入该项；只有 resolver 国家可判定时，DNS 评分才可靠。',
    diagnosticSummaryBaseUrl: 'BASE_URL',
    diagnosticSummaryProxy: '代理变量',
    diagnosticSummaryLocale: 'Locale',
    diagnosticSummaryTimezone: 'shell 时区',
    diagnosticEmpty: '诊断内容为空',
    diagnosticNotChecked: '尚未核对 Claude Code 本机配置。',
    commandCopied: '命令已复制。请在终端运行后，把输出的 JSON 粘贴到下方文本框。',
    commandCopyFailed: '复制失败，请手动选中命令复制。',
    statusMissing: '未覆盖',
    statusDisabled: '未接入',
    statusPending: '等待中',
    statusUnavailable: '不可用',
    statusError: '错误',
    statusOk: '正常'
  },
  en: {
    heroEyebrow: 'Claude Code only · 100-point risk score · deleted on close',
    githubLink: 'GitHub',
    pageTitle: 'Claude Code Compliance Check',
    heroLede: 'Run browser and network checks with one click, then paste a redacted Claude Code configuration JSON to review consistency with Anthropic supported regions. Findings focus only on compliant remediation. Lower scores are better.',
    privacyTitle: 'Data Statement',
    privacyCopy1: 'Results exist only in the current page session. Closing the page clears results, pasted text, and scores.',
    privacyCopy2: 'This tool does not use cookies, localStorage, or IndexedDB to save reports. The local configuration JSON is parsed only in your browser.',
    coverageTitle: 'Evidence Coverage',
    workflowKicker: 'Flow',
    workflowTitle: 'Two-Step Check',
    clearSession: 'Clear This Page',
    step1Number: 'Step 1 · 70/100',
    step1Title: 'Browser and Network Check',
    step1Copy: 'Reads browser language, timezone, platform, and WebRTC candidates, then contacts the default network probe to check exit country or region, ASN, and IPv4/IPv6 split. DNS resolver detection requires an authoritative DNS event source; once connected, it is included in the same check.',
    runWebProbes: 'Start Environment and Network Check',
    step2Number: 'Step 2 · 30/100',
    step2Title: 'Claude Code Local Configuration',
    step2Copy: 'This step currently supports the computer where Claude Code runs: run the command in that terminal, then paste the redacted JSON here. The page parses fields locally only. Nothing is uploaded or stored.',
    commandLabel: 'Command to generate redacted configuration JSON',
    copyCommand: 'Copy Command',
    diagnosticInputLabel: 'Paste redacted configuration JSON',
    diagnosticPlaceholder: '{"env":{"ANTHROPIC_BASE_URL":"https://api.anthropic.com","HTTPS_PROXY":"set"},"locale":{"LANG":"en_US.UTF-8","AppleLocale":"en_US"},"timezone":"America/Los_Angeles"}',
    parseDiagnostic: 'Check Claude Code Configuration',
    resultKicker: 'Results',
    resultsTitle: 'Risks, Evidence, and Compliant Remediation',
    basisKicker: 'Principles',
    basisTitle: 'Scoring Principles',
    principleRegionTitle: 'Exit region',
    principleRegionCopy: 'Compares HTTP exit country and region against Anthropic Supported Countries. Unsupported countries or official regional exceptions receive full risk for this item.',
    principleNetworkTitle: 'Exit network profile',
    principleNetworkCopy: 'Checks supported-region status first, then ASN/AS organization patterns such as shared proxy, cloud, or relay networks. Region risk takes priority over consistency.',
    principleIpTitle: 'IPv4 / IPv6',
    principleIpCopy: 'Checks IPv4 and IPv6 exits separately. Any path in a restricted region is scored, and country splits are also scored.',
    principleDnsTitle: 'DNS resolver exit',
    principleDnsCopy: 'DNS resolver evidence requires authoritative DNS logs or an external DNS event source. The tool does not fake this result; once connected, resolver country and HTTP exit consistency are scored.',
    principleBrowserTitle: 'Browser language and timezone',
    principleBrowserCopy: 'Browser language or timezone signals that directly point to a restricted region are scored. Otherwise they are used only as consistency signals against the network exit.',
    principleWebRtcTitle: 'WebRTC',
    principleWebRtcCopy: 'Checks whether WebRTC candidates expose routable public addresses. It cannot reliably geolocate the candidate country, but it can reveal extra network paths.',
    principleBaseUrlTitle: 'Claude Code BASE_URL',
    principleBaseUrlCopy: 'Checks whether ANTHROPIC_BASE_URL points to the official API or a clearly authorized path. Unknown endpoints, other model providers, or restricted-region domains are scored.',
    principleProxyTitle: 'Proxy variables',
    principleProxyCopy: 'Checks HTTP_PROXY, HTTPS_PROXY, ALL_PROXY, and GRPC_PROXY. More proxy variables make routing less clear; restricted-region proxy domains are high risk.',
    principleLocaleTitle: 'Local locale / shell timezone',
    principleLocaleCopy: 'Local language and timezone signals that point to restricted regions are scored, and conflicts with browser or network exit are also checked.',
    principleIgnoredTitle: 'Ignored items',
    principleIgnoredCopy: 'Chinese input methods, ordinary Chinese apps, and self-declared use cases are not scored because webpages cannot reliably detect them or there is no explicit public policy basis.',
    disclaimerKicker: 'Notice',
    disclaimerTitle: 'Compliance Notice',
    disclaimerCopy: 'This tool follows Anthropic terms, supported-region policy, and Claude Code compliance expectations. It helps users find and remediate inconsistent configurations and does not provide instructions to bypass restrictions or violate terms.',
    defaultProbeNotConfigured: 'The default network probe is not connected yet. You can still complete the Claude Code local configuration check; once deployed, this step will run with one click.',
    networkServiceReady: 'This check contacts the default network probe. The local configuration JSON is not sent to that service.',
    networkServiceMissing: 'The default network probe is not connected yet. Once connected, users can run the network check without entering a URL.',
    waitingStage: 'Waiting to start',
    waitingCopy: 'Click Step 1 to read browser and network signals. Complete Step 2 for the full score.',
    coverageEmpty: 'Current evidence coverage is 0%. Step 1 browser and network checks cover 70/100; Step 2 local configuration covers 30/100.',
    stageFull: 'Stage 2/2 · Full risk score',
    stageWeb: 'Stage 1/2 · Environment and network risk score',
    scoreFullCopy: '{label}. Claude Code local configuration has been checked. Current evidence coverage is {weight}/100.',
    scoreWebCopy: '{label}. Browser and network checks are complete. Current evidence coverage is {weight}/100; complete Step 2 for the full score.',
    coverageCopy: 'Current evidence coverage is {coverage}%. Step 1 browser and network checks cover 70/100; Step 2 local configuration covers 30/100.',
    lowRisk: 'Low risk',
    guardedRisk: 'Guarded risk',
    highRisk: 'High risk',
    severeRisk: 'Severe risk',
    criticalRisk: 'Critical risk',
    riskBandCopy: 'Bands: 0-19 low, 20-39 guarded, 40-59 high, 60-79 severe, 80-100 critical.',
    noFindings: 'No checks have started. Click “Start Environment and Network Check” first.',
    noProbeDetails: 'No probe details yet. Evidence appears here after a step is completed.',
    evidencePrefix: 'Evidence: ',
    advicePrefix: 'Compliant remediation: ',
    noRemediation: 'No remediation needed.',
    improveCoverage: 'Complete this item to improve evidence coverage.',
    browserProbe: 'Browser',
    webrtcProbe: 'WebRTC',
    httpProbe: 'HTTP exit',
    ipv4Probe: 'IPv4 exit',
    ipv6Probe: 'IPv6 exit',
    dnsProbe: 'DNS resolver exit',
    notRead: 'Not read yet.',
    notRun: 'Not run yet.',
    networkNeeded: 'Network probe required.',
    dnsNeeded: 'DNS resolver auto-detection is not connected. This is a service enhancement, not a missed user step.',
    dnsUnavailableTitle: 'DNS resolver detection is not connected',
    dnsUnavailableDetail: 'The current default Worker cannot directly observe a user DNS resolver. This item requires authoritative DNS query logs or an external DNS event source.',
    dnsUnavailableAdvice: 'To fully cover the network evidence weight, deploy a DNS event source. Until then, use HTTP exit, ASN, and IPv4/IPv6 results as the primary compliance evidence.',
    dnsEventPending: 'DNS event has not arrived yet.',
    dnsCountryMissing: 'The DNS event arrived, but resolver country or region is missing.',
    dnsCountryMissingAdvice: 'Add GeoIP/ASN enrichment to the DNS event source before scoring this item. DNS scoring is reliable only when resolver country can be determined.',
    diagnosticSummaryBaseUrl: 'BASE_URL',
    diagnosticSummaryProxy: 'Proxy variables',
    diagnosticSummaryLocale: 'Locale',
    diagnosticSummaryTimezone: 'shell timezone',
    diagnosticEmpty: 'Diagnostic content is empty',
    diagnosticNotChecked: 'Claude Code local configuration has not been checked.',
    commandCopied: 'Command copied. Run it in your terminal, then paste the JSON output below.',
    commandCopyFailed: 'Copy failed. Please select and copy the command manually.',
    statusMissing: 'missing',
    statusDisabled: 'not connected',
    statusPending: 'pending',
    statusUnavailable: 'unavailable',
    statusError: 'error',
    statusOk: 'ok'
  },
  ru: {
    heroEyebrow: 'Только Claude Code · риск по шкале 100 · удаляется при закрытии',
    githubLink: 'GitHub',
    pageTitle: 'Проверка соответствия Claude Code',
    heroLede: 'Одним нажатием проверьте браузер и сетевой выход, затем вставьте обезличенный JSON конфигурации Claude Code для проверки соответствия политике поддерживаемых регионов Anthropic. Рекомендации направлены только на легальное исправление. Чем ниже балл, тем лучше.',
    privacyTitle: 'Заявление о данных',
    privacyCopy1: 'Результаты существуют только в текущей сессии страницы. После закрытия страницы результаты, вставленный текст и оценки очищаются.',
    privacyCopy2: 'Инструмент не использует cookie, localStorage или IndexedDB для сохранения отчета. JSON локальной конфигурации разбирается только в браузере.',
    coverageTitle: 'Покрытие доказательств',
    workflowKicker: 'Процесс',
    workflowTitle: 'Проверка в два шага',
    clearSession: 'Очистить страницу',
    step1Number: 'Шаг 1 · 70/100',
    step1Title: 'Проверка браузера и сети',
    step1Copy: 'Считывает язык, часовой пояс, платформу и кандидаты WebRTC, затем обращается к сетевому probe-сервису для проверки страны или региона выхода, ASN и разделения IPv4/IPv6. DNS resolver требует источник authoritative DNS-событий; после подключения он входит в ту же проверку.',
    runWebProbes: 'Начать проверку среды и сети',
    step2Number: 'Шаг 2 · 30/100',
    step2Title: 'Локальная конфигурация Claude Code',
    step2Copy: 'Этот шаг сейчас поддерживает компьютер, где запущен Claude Code: выполните команду в этом терминале и вставьте обезличенный JSON сюда. Страница разбирает поля только локально. Ничего не загружается и не сохраняется.',
    commandLabel: 'Команда для создания обезличенного JSON конфигурации',
    copyCommand: 'Скопировать команду',
    diagnosticInputLabel: 'Вставьте обезличенный JSON конфигурации',
    diagnosticPlaceholder: '{"env":{"ANTHROPIC_BASE_URL":"https://api.anthropic.com","HTTPS_PROXY":"set"},"locale":{"LANG":"en_US.UTF-8","AppleLocale":"en_US"},"timezone":"America/Los_Angeles"}',
    parseDiagnostic: 'Проверить конфигурацию Claude Code',
    resultKicker: 'Результаты',
    resultsTitle: 'Риски, доказательства и легальное исправление',
    basisKicker: 'Принцип',
    basisTitle: 'Принципы оценки',
    principleRegionTitle: 'Регион выхода',
    principleRegionCopy: 'Сравнивает страну и регион HTTP-выхода со списком Anthropic Supported Countries. Неподдерживаемые страны и официальные региональные исключения получают полный риск по этому пункту.',
    principleNetworkTitle: 'Профиль сети выхода',
    principleNetworkCopy: 'Сначала проверяется поддержка региона, затем ASN/AS organization и признаки shared proxy, cloud или relay. Риск региона важнее внутренней согласованности.',
    principleIpTitle: 'IPv4 / IPv6',
    principleIpCopy: 'IPv4 и IPv6 проверяются отдельно. Любой путь в ограниченном регионе получает риск; различие стран между путями также учитывается.',
    principleDnsTitle: 'DNS resolver',
    principleDnsCopy: 'DNS resolver требует authoritative DNS logs или внешний источник DNS-событий. Инструмент не подделывает результат; после подключения оцениваются страна resolver и согласованность с HTTP-выходом.',
    principleBrowserTitle: 'Язык и часовой пояс браузера',
    principleBrowserCopy: 'Если язык или часовой пояс браузера прямо указывает на ограниченный регион, это получает риск. Иначе они используются как сигналы согласованности с сетевым выходом.',
    principleWebRtcTitle: 'WebRTC',
    principleWebRtcCopy: 'Проверяет, раскрывают ли WebRTC candidates маршрутизируемые публичные адреса. Страну candidate нельзя надежно определить, но можно выявить дополнительный сетевой путь.',
    principleBaseUrlTitle: 'Claude Code BASE_URL',
    principleBaseUrlCopy: 'Проверяет, указывает ли ANTHROPIC_BASE_URL на официальный API или явно авторизованный путь. Неизвестные endpoints, другие поставщики моделей или домены ограниченных регионов получают риск.',
    principleProxyTitle: 'Proxy-переменные',
    principleProxyCopy: 'Проверяет HTTP_PROXY, HTTPS_PROXY, ALL_PROXY и GRPC_PROXY. Чем больше proxy-переменных, тем менее ясен маршрут; proxy-домены ограниченных регионов дают высокий риск.',
    principleLocaleTitle: 'Locale / часовой пояс shell',
    principleLocaleCopy: 'Локальный язык и часовой пояс, указывающие на ограниченный регион, получают риск; также проверяются конфликты с браузером и сетевым выходом.',
    principleIgnoredTitle: 'Неоцениваемые пункты',
    principleIgnoredCopy: 'Китайские методы ввода, обычные китайские приложения и самоописание целей не оцениваются: веб-страница не может надежно это определить или нет явной публичной основы политики.',
    disclaimerKicker: 'Заявление',
    disclaimerTitle: 'Заявление о соответствии',
    disclaimerCopy: 'Инструмент следует условиям Anthropic, политике поддерживаемых регионов и ожиданиям соответствия Claude Code. Он помогает найти и исправить несогласованные настройки и не дает инструкций по обходу ограничений или нарушению условий.',
    defaultProbeNotConfigured: 'Сетевой probe-сервис еще не подключен. Можно выполнить проверку локальной конфигурации Claude Code; после развертывания этот шаг будет запускаться одним нажатием.',
    networkServiceReady: 'Проверка обращается к сетевому probe-сервису. JSON локальной конфигурации в этот сервис не отправляется.',
    networkServiceMissing: 'Сетевой probe-сервис еще не подключен. После подключения пользователю не нужно будет вводить URL.',
    waitingStage: 'Ожидание запуска',
    waitingCopy: 'Нажмите Шаг 1, чтобы считать сигналы браузера и сети. Завершите Шаг 2 для полной оценки.',
    coverageEmpty: 'Текущее покрытие доказательств 0%. Шаг 1 браузер и сеть покрывает 70/100; Шаг 2 локальная конфигурация покрывает 30/100.',
    stageFull: 'Этап 2/2 · полный риск',
    stageWeb: 'Этап 1/2 · риск среды и сети',
    scoreFullCopy: '{label}. Локальная конфигурация Claude Code проверена. Текущее покрытие доказательств {weight}/100.',
    scoreWebCopy: '{label}. Проверка браузера и сети завершена. Текущее покрытие доказательств {weight}/100; завершите Шаг 2 для полной оценки.',
    coverageCopy: 'Текущее покрытие доказательств {coverage}%. Шаг 1 браузер и сеть покрывает 70/100; Шаг 2 локальная конфигурация покрывает 30/100.',
    lowRisk: 'Низкий риск',
    guardedRisk: 'Повышенное внимание',
    highRisk: 'Высокий риск',
    severeRisk: 'Серьезный риск',
    criticalRisk: 'Критический риск',
    riskBandCopy: 'Диапазоны: 0-19 низкий, 20-39 внимание, 40-59 высокий, 60-79 серьезный, 80-100 критический.',
    noFindings: 'Проверка еще не началась. Сначала нажмите “Начать проверку среды и сети”.',
    noProbeDetails: 'Деталей проверки пока нет. Доказательства появятся после выполнения шага.',
    evidencePrefix: 'Доказательства: ',
    advicePrefix: 'Легальное исправление: ',
    noRemediation: 'Исправление не требуется.',
    improveCoverage: 'Завершите этот пункт, чтобы повысить покрытие доказательств.',
    browserProbe: 'Браузер',
    webrtcProbe: 'WebRTC',
    httpProbe: 'HTTP-выход',
    ipv4Probe: 'IPv4-выход',
    ipv6Probe: 'IPv6-выход',
    dnsProbe: 'DNS resolver',
    notRead: 'Еще не считано.',
    notRun: 'Еще не запускалось.',
    networkNeeded: 'Требуется сетевой probe-сервис.',
    dnsNeeded: 'Автоматическая проверка DNS resolver не подключена. Это расширение сервиса, а не пропущенный шаг пользователя.',
    dnsUnavailableTitle: 'Проверка DNS resolver не подключена',
    dnsUnavailableDetail: 'Текущий Worker не может напрямую увидеть DNS resolver пользователя. Для этого нужны authoritative DNS logs или внешний источник DNS-событий.',
    dnsUnavailableAdvice: 'Для полного покрытия сетевого веса разверните источник DNS-событий. До этого используйте HTTP-выход, ASN и IPv4/IPv6 как основные доказательства соответствия.',
    dnsEventPending: 'DNS-событие еще не получено.',
    dnsCountryMissing: 'DNS-событие получено, но страна или регион resolver отсутствует.',
    dnsCountryMissingAdvice: 'Добавьте GeoIP/ASN enrichment в источник DNS-событий перед оценкой этого пункта. Оценка DNS надежна только при известной стране resolver.',
    diagnosticSummaryBaseUrl: 'BASE_URL',
    diagnosticSummaryProxy: 'Proxy-переменные',
    diagnosticSummaryLocale: 'Locale',
    diagnosticSummaryTimezone: 'часовой пояс shell',
    diagnosticEmpty: 'Диагностические данные пусты',
    diagnosticNotChecked: 'Локальная конфигурация Claude Code еще не проверена.',
    commandCopied: 'Команда скопирована. Выполните ее в терминале и вставьте JSON ниже.',
    commandCopyFailed: 'Не удалось скопировать. Выделите и скопируйте команду вручную.',
    statusMissing: 'не покрыто',
    statusDisabled: 'не подключено',
    statusPending: 'ожидание',
    statusUnavailable: 'недоступно',
    statusError: 'ошибка',
    statusOk: 'ok'
  }
}

let currentLanguage = getInitialLanguage()

const FINDING_TRANSLATIONS = {
  en: {
    '出口地区与官方支持列表': 'Exit region and official supported list',
    '出口地区属于 Anthropic 官方排除区域': 'Exit region is an official Anthropic excluded region',
    '出口地区不在 Anthropic 支持列表': 'Exit region is not in Anthropic supported regions',
    '出口地区在支持列表内': 'Exit region is in the supported list',
    '出口网络画像': 'Exit network profile',
    '出口网络位于 Anthropic 非支持地区': 'Exit network is in an unsupported Anthropic region',
    '出口网络可能是共享代理或数据中心': 'Exit network may be a shared proxy or data center',
    '出口网络画像未发现明显中转特征': 'No obvious relay signal in exit network profile',
    'IPv4 / IPv6 一致性': 'IPv4 / IPv6 consistency',
    'IPv4 或 IPv6 出口位于 Anthropic 非支持地区': 'IPv4 or IPv6 exit is in an unsupported Anthropic region',
    'IPv4 或 IPv6 检测不完整': 'IPv4 or IPv6 check is incomplete',
    'IPv4 与 IPv6 出口国家不一致': 'IPv4 and IPv6 exit countries differ',
    'IPv4 与 IPv6 未发现国家分裂': 'No country split detected between IPv4 and IPv6',
    'DNS 解析出口': 'DNS resolver exit',
    'DNS 解析出口不在支持地区': 'DNS resolver exit is not in a supported region',
    'DNS 与 HTTP 出口国家不一致': 'DNS and HTTP exit countries differ',
    'DNS 解析出口与 HTTP 出口地区一致': 'DNS resolver exit matches HTTP exit region',
    '浏览器环境一致性': 'Browser environment consistency',
    '浏览器语言或时区指向 Anthropic 非支持地区': 'Browser language or timezone points to an unsupported Anthropic region',
    '浏览器环境存在一致性疑点': 'Browser environment has consistency concerns',
    '浏览器语言与时区未发现明显冲突': 'No obvious conflict in browser language and timezone',
    'WebRTC 网络泄漏': 'WebRTC network exposure',
    'WebRTC 暴露可路由候选地址': 'WebRTC exposes routable candidates',
    'WebRTC 未发现明显公网候选泄漏': 'No obvious public WebRTC candidate exposure',
    'Claude Code ANTHROPIC_BASE_URL': 'Claude Code ANTHROPIC_BASE_URL',
    'ANTHROPIC_BASE_URL 未设置': 'ANTHROPIC_BASE_URL is not set',
    'ANTHROPIC_BASE_URL 指向官方 API': 'ANTHROPIC_BASE_URL points to the official API',
    'ANTHROPIC_BASE_URL 指向不支持地区相关域名': 'ANTHROPIC_BASE_URL points to a domain associated with unsupported regions',
    'ANTHROPIC_BASE_URL 指向非官方端点': 'ANTHROPIC_BASE_URL points to a non-official endpoint',
    'Claude Code 代理环境变量': 'Claude Code proxy environment variables',
    '未发现 Claude Code 代理环境变量': 'No Claude Code proxy environment variables found',
    '代理变量指向不支持地区相关服务': 'Proxy variables point to services associated with unsupported regions',
    '代理变量较多，路径可能混乱': 'Many proxy variables are set; routing may be unclear',
    '检测到代理变量': 'Proxy variables detected',
    'Claude Code Locale / shell 时区': 'Claude Code locale / shell timezone',
    'Claude Code Locale 或 shell 时区指向 Anthropic 非支持地区': 'Claude Code locale or shell timezone points to an unsupported Anthropic region',
    'Claude Code Locale 或 shell 时区存在冲突': 'Claude Code locale or shell timezone has conflicts',
    'Claude Code Locale 与时区未发现明显冲突': 'No obvious conflict in Claude Code locale and timezone',
    '需要网络检测服务返回请求国家/地区。': 'The network probe must return the request country or region.',
    '需要网络检测服务返回 ASN 与 AS 组织。': 'The network probe must return ASN and AS organization.',
    '需要 IPv4 与 IPv6 网络检测服务。': 'IPv4 and IPv6 network probes are required.',
    '只检测到其中一条出口路径，无法确认是否存在 IPv6 分流。': 'Only one exit path was detected, so IPv6 split cannot be confirmed.',
    '部署 v4-only 和 v6-only 检测端点，确认两条出口路径地区一致。': 'Deploy v4-only and v6-only probe endpoints and confirm both paths use consistent regions.',
    '当前浏览器不支持或未开放 WebRTC 检测。': 'The current browser does not support or expose WebRTC checks.',
    '尚未核对 Claude Code 本机配置。': 'Claude Code local configuration has not been checked.',
    'Claude Code 默认不会被非官方 BASE_URL 改写。': 'Claude Code will not be redirected by a non-official BASE_URL by default.',
    '把 Anthropic 官方路径与其他模型供应商配置隔离；Claude Code 使用 Anthropic 时不要加载不明或不支持地区相关 BASE_URL。': 'Keep Anthropic official routing separate from other model providers. Do not load unknown or unsupported-region BASE_URL values for Claude Code.',
    '核验该端点是否为官方授权渠道；无法确认时，应恢复官方端点或取消该变量。': 'Verify whether the endpoint is an officially authorized channel. If not confirmed, restore the official endpoint or unset the variable.',
    '终端环境未设置常见代理变量。': 'No common proxy variables are set in the terminal environment.',
    '清理不明代理变量；保留主体明确、地区一致、可审计的网络配置。': 'Remove unclear proxy variables. Keep network settings with clear ownership, region consistency, and auditability.',
    '减少重复代理变量，明确 Claude Code 的实际出口路径。': 'Reduce duplicate proxy variables and clarify the actual Claude Code exit path.',
    '确认代理出口、DNS 与账号使用地区一致。': 'Confirm that proxy exit, DNS, and account usage region are consistent.',
    '按真实使用地区统一 LANG、LC_ALL、AppleLocale 与 shell 时区。': 'Align LANG, LC_ALL, AppleLocale, and shell timezone with the actual usage region.',
    '核验真实使用地区和网络出口；如确实不在支持地区，应暂停 Claude Code 直连路径，改用官方支持地区或授权云渠道。': 'Verify the real usage region and network exit. If it is truly outside supported regions, pause direct Claude Code access and use an officially supported region or authorized cloud channel.',
    '核验真实使用地区和网络出口；如确实位于官方排除区域，应暂停 Claude Code 直连路径，改用官方支持地区或授权云渠道。': 'Verify the real usage region and network exit. If it is truly in an official excluded region, pause direct Claude Code access and use an officially supported region or authorized cloud channel.',
    '使用可审计、地区一致、主体明确的网络出口；避免不明共享中转承载 Claude Code 请求。': 'Use an auditable, region-consistent network exit with clear ownership. Avoid unclear shared relays for Claude Code requests.',
    '先解决网络出口所在地合规问题；只有出口地区在支持列表内时，ASN/组织画像的一致性才有意义。': 'Fix the compliance status of the network exit location first. ASN and organization consistency only matters after the exit region is supported.',
    '先确认 IPv4 与 IPv6 两条路径都位于官方支持地区；如果任一路径不支持，应修复该出口路径后再检查一致性。': 'First confirm both IPv4 and IPv6 paths are in officially supported regions. If either path is unsupported, fix that path before checking consistency.',
    '按真实合规使用地区统一浏览器语言、系统地区与时区；如果真实环境位于非支持地区，应暂停 Claude Code 直连路径。': 'Align browser language, system region, and timezone with the real compliant usage region. If the real environment is in an unsupported region, pause direct Claude Code access.',
    '按真实合规使用地区统一 LANG、LC_ALL、AppleLocale 与 shell 时区；如果真实环境位于非支持地区，应暂停 Claude Code 直连路径。': 'Align LANG, LC_ALL, AppleLocale, and shell timezone with the real compliant usage region. If the real environment is in an unsupported region, pause direct Claude Code access.',
    '修复 DNS 解析路径，确保 Claude Code 所在网络的 DNS 与实际合规出口一致。': 'Fix DNS resolution so the Claude Code network DNS matches the actual compliant exit path.',
    '核查系统 DNS、代理 DNS 与活动网络配置，避免 DNS 泄漏造成地区画像冲突。': 'Review system DNS, proxy DNS, and active network settings to avoid DNS leaks that create region conflicts.',
    '按真实使用地区统一浏览器时区、系统时区与网络出口；语言本身不代表风险，只用于一致性判断。': 'Align browser timezone, system timezone, and network exit with the real usage region. Language is only a consistency signal.',
    '核查浏览器 WebRTC 策略；真实账号使用环境应避免与网络出口不一致的路径暴露。': 'Review browser WebRTC policy. A real account environment should avoid exposing paths inconsistent with the network exit.'
  },
  ru: {
    '出口地区与官方支持列表': 'Регион выхода и официальный список поддержки',
    '出口地区属于 Anthropic 官方排除区域': 'Регион выхода является официально исключенным регионом Anthropic',
    '出口地区不在 Anthropic 支持列表': 'Регион выхода не входит в поддерживаемые регионы Anthropic',
    '出口地区在支持列表内': 'Регион выхода входит в список поддержки',
    '出口网络画像': 'Профиль сети выхода',
    '出口网络位于 Anthropic 非支持地区': 'Сеть выхода находится в неподдерживаемом регионе Anthropic',
    '出口网络可能是共享代理或数据中心': 'Сеть выхода может быть общим proxy или дата-центром',
    '出口网络画像未发现明显中转特征': 'Явных признаков промежуточной сети не найдено',
    'IPv4 / IPv6 一致性': 'Согласованность IPv4 / IPv6',
    'IPv4 或 IPv6 出口位于 Anthropic 非支持地区': 'IPv4 или IPv6 выход находится в неподдерживаемом регионе Anthropic',
    'IPv4 或 IPv6 检测不完整': 'Проверка IPv4 или IPv6 неполная',
    'IPv4 与 IPv6 出口国家不一致': 'Страны выхода IPv4 и IPv6 различаются',
    'IPv4 与 IPv6 未发现国家分裂': 'Разделения страны между IPv4 и IPv6 не найдено',
    'DNS 解析出口': 'Выход DNS resolver',
    'DNS 解析出口不在支持地区': 'DNS resolver находится вне поддерживаемого региона',
    'DNS 与 HTTP 出口国家不一致': 'Страны DNS и HTTP выхода различаются',
    'DNS 解析出口与 HTTP 出口地区一致': 'DNS resolver совпадает с регионом HTTP выхода',
    '浏览器环境一致性': 'Согласованность среды браузера',
    '浏览器语言或时区指向 Anthropic 非支持地区': 'Язык или часовой пояс браузера указывает на неподдерживаемый регион Anthropic',
    '浏览器环境存在一致性疑点': 'В среде браузера есть признаки несогласованности',
    '浏览器语言与时区未发现明显冲突': 'Явного конфликта языка и часового пояса браузера не найдено',
    'WebRTC 网络泄漏': 'Сетевое раскрытие WebRTC',
    'WebRTC 暴露可路由候选地址': 'WebRTC раскрывает маршрутизируемые кандидаты',
    'WebRTC 未发现明显公网候选泄漏': 'Явного раскрытия публичных кандидатов WebRTC не найдено',
    'Claude Code ANTHROPIC_BASE_URL': 'Claude Code ANTHROPIC_BASE_URL',
    'ANTHROPIC_BASE_URL 未设置': 'ANTHROPIC_BASE_URL не задан',
    'ANTHROPIC_BASE_URL 指向官方 API': 'ANTHROPIC_BASE_URL указывает на официальный API',
    'ANTHROPIC_BASE_URL 指向不支持地区相关域名': 'ANTHROPIC_BASE_URL указывает на домен, связанный с неподдерживаемым регионом',
    'ANTHROPIC_BASE_URL 指向非官方端点': 'ANTHROPIC_BASE_URL указывает на неофициальный endpoint',
    'Claude Code 代理环境变量': 'Proxy-переменные Claude Code',
    '未发现 Claude Code 代理环境变量': 'Proxy-переменные Claude Code не найдены',
    '代理变量指向不支持地区相关服务': 'Proxy-переменные указывают на сервисы, связанные с неподдерживаемыми регионами',
    '代理变量较多，路径可能混乱': 'Задано много proxy-переменных; маршрут может быть неясным',
    '检测到代理变量': 'Обнаружены proxy-переменные',
    'Claude Code Locale / shell 时区': 'Locale Claude Code / часовой пояс shell',
    'Claude Code Locale 或 shell 时区指向 Anthropic 非支持地区': 'Locale Claude Code или часовой пояс shell указывает на неподдерживаемый регион Anthropic',
    'Claude Code Locale 或 shell 时区存在冲突': 'Locale Claude Code или часовой пояс shell конфликтуют',
    'Claude Code Locale 与时区未发现明显冲突': 'Явного конфликта locale и часового пояса Claude Code не найдено',
    '需要网络检测服务返回请求国家/地区。': 'Сетевой probe должен вернуть страну или регион запроса.',
    '需要网络检测服务返回 ASN 与 AS 组织。': 'Сетевой probe должен вернуть ASN и AS organization.',
    '需要 IPv4 与 IPv6 网络检测服务。': 'Требуются сетевые проверки IPv4 и IPv6.',
    '只检测到其中一条出口路径，无法确认是否存在 IPv6 分流。': 'Обнаружен только один маршрут выхода, поэтому разделение IPv6 подтвердить нельзя.',
    '部署 v4-only 和 v6-only 检测端点，确认两条出口路径地区一致。': 'Разверните v4-only и v6-only endpoints и подтвердите согласованность регионов.',
    '当前浏览器不支持或未开放 WebRTC 检测。': 'Текущий браузер не поддерживает или не открывает проверку WebRTC.',
    '尚未核对 Claude Code 本机配置。': 'Локальная конфигурация Claude Code еще не проверена.',
    'Claude Code 默认不会被非官方 BASE_URL 改写。': 'По умолчанию Claude Code не перенаправляется через неофициальный BASE_URL.',
    '把 Anthropic 官方路径与其他模型供应商配置隔离；Claude Code 使用 Anthropic 时不要加载不明或不支持地区相关 BASE_URL。': 'Отделяйте официальный маршрут Anthropic от конфигураций других поставщиков. Не загружайте неизвестные или неподдерживаемые BASE_URL для Claude Code.',
    '核验该端点是否为官方授权渠道；无法确认时，应恢复官方端点或取消该变量。': 'Проверьте, является ли endpoint официально авторизованным. Если это не подтверждено, верните официальный endpoint или удалите переменную.',
    '终端环境未设置常见代理变量。': 'В терминале не заданы распространенные proxy-переменные.',
    '清理不明代理变量；保留主体明确、地区一致、可审计的网络配置。': 'Удалите неясные proxy-переменные. Оставьте настройки с понятным владельцем, регионом и аудитом.',
    '减少重复代理变量，明确 Claude Code 的实际出口路径。': 'Сократите повторяющиеся proxy-переменные и уточните фактический маршрут выхода Claude Code.',
    '确认代理出口、DNS 与账号使用地区一致。': 'Проверьте согласованность proxy-выхода, DNS и региона использования аккаунта.',
    '按真实使用地区统一 LANG、LC_ALL、AppleLocale 与 shell 时区。': 'Согласуйте LANG, LC_ALL, AppleLocale и часовой пояс shell с реальным регионом использования.',
    '核验真实使用地区和网络出口；如确实不在支持地区，应暂停 Claude Code 直连路径，改用官方支持地区或授权云渠道。': 'Проверьте реальный регион использования и сетевой выход. Если он вне поддерживаемых регионов, приостановите прямой доступ Claude Code и используйте поддерживаемый регион или авторизованный облачный канал.',
    '核验真实使用地区和网络出口；如确实位于官方排除区域，应暂停 Claude Code 直连路径，改用官方支持地区或授权云渠道。': 'Проверьте реальный регион использования и сетевой выход. Если он находится в официально исключенном регионе, приостановите прямой доступ Claude Code и используйте поддерживаемый регион или авторизованный облачный канал.',
    '使用可审计、地区一致、主体明确的网络出口；避免不明共享中转承载 Claude Code 请求。': 'Используйте проверяемый, регионально согласованный сетевой выход с понятным владельцем. Избегайте неясных общих relay-сетей для Claude Code.',
    '先解决网络出口所在地合规问题；只有出口地区在支持列表内时，ASN/组织画像的一致性才有意义。': 'Сначала исправьте соответствие региона сетевого выхода. Согласованность ASN и организации имеет смысл только после того, как регион выхода поддерживается.',
    '先确认 IPv4 与 IPv6 两条路径都位于官方支持地区；如果任一路径不支持，应修复该出口路径后再检查一致性。': 'Сначала подтвердите, что IPv4 и IPv6 находятся в официально поддерживаемых регионах. Если один путь не поддерживается, исправьте его перед проверкой согласованности.',
    '按真实合规使用地区统一浏览器语言、系统地区与时区；如果真实环境位于非支持地区，应暂停 Claude Code 直连路径。': 'Согласуйте язык браузера, регион системы и часовой пояс с реальным допустимым регионом. Если реальная среда находится в неподдерживаемом регионе, приостановите прямой доступ Claude Code.',
    '按真实合规使用地区统一 LANG、LC_ALL、AppleLocale 与 shell 时区；如果真实环境位于非支持地区，应暂停 Claude Code 直连路径。': 'Согласуйте LANG, LC_ALL, AppleLocale и часовой пояс shell с реальным допустимым регионом. Если реальная среда находится в неподдерживаемом регионе, приостановите прямой доступ Claude Code.',
    '修复 DNS 解析路径，确保 Claude Code 所在网络的 DNS 与实际合规出口一致。': 'Исправьте DNS-маршрут, чтобы DNS сети Claude Code совпадал с фактическим корректным выходом.',
    '核查系统 DNS、代理 DNS 与活动网络配置，避免 DNS 泄漏造成地区画像冲突。': 'Проверьте системный DNS, proxy DNS и активные сетевые настройки, чтобы избежать DNS leak и конфликта регионов.',
    '按真实使用地区统一浏览器时区、系统时区与网络出口；语言本身不代表风险，只用于一致性判断。': 'Согласуйте часовой пояс браузера, системы и сетевой выход с реальным регионом. Язык является только сигналом согласованности.',
    '核查浏览器 WebRTC 策略；真实账号使用环境应避免与网络出口不一致的路径暴露。': 'Проверьте политику WebRTC браузера. Среда реального аккаунта не должна раскрывать маршруты, конфликтующие с сетевым выходом.'
  }
}

const SUPPORTED_COUNTRY_CODES = new Set([
  'AL', 'DZ', 'AD', 'AO', 'AG', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BS', 'BH',
  'BD', 'BB', 'BE', 'BZ', 'BJ', 'BT', 'BO', 'BA', 'BW', 'BR', 'BN', 'BG',
  'BF', 'BI', 'CV', 'KH', 'CM', 'CA', 'CF', 'TD', 'CL', 'CO', 'KM', 'CG',
  'CR', 'CI', 'HR', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV',
  'GQ', 'ER', 'EE', 'SZ', 'ET', 'FJ', 'FI', 'FR', 'GA', 'GM', 'GE', 'DE',
  'GH', 'GR', 'GD', 'GT', 'GN', 'GW', 'GY', 'HT', 'HN', 'HU', 'IS', 'IN',
  'ID', 'IQ', 'IE', 'IL', 'IT', 'JM', 'JP', 'JO', 'KZ', 'KE', 'KI', 'KW',
  'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MG', 'MW',
  'MY', 'MV', 'ML', 'MT', 'MH', 'MR', 'MU', 'MX', 'FM', 'MD', 'MC', 'MN',
  'ME', 'MA', 'MZ', 'NA', 'NR', 'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'MK',
  'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL', 'PT',
  'QA', 'RO', 'RW', 'KN', 'LC', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS',
  'SC', 'SL', 'SG', 'SK', 'SI', 'SO', 'SB', 'ZA', 'KR', 'SS', 'ES', 'LK',
  'SD', 'SR', 'SE', 'CH', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TO', 'TT',
  'TN', 'TR', 'TM', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ', 'VU',
  'VA', 'VN', 'ZM', 'ZW'
])

const UNSUPPORTED_REGION_RULES = [
  {
    country: 'UA',
    label: 'Crimea, Donetsk, Kherson, Luhansk, or Zaporizhzhia',
    patterns: [/crimea/i, /donetsk/i, /kherson/i, /luhansk/i, /zaporizhzhia/i]
  }
]

const LANGUAGE_REGION_HINTS = {
  ar: ['BH', 'DZ', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'MA', 'MR', 'OM', 'PS', 'QA', 'SA', 'SD', 'TN', 'AE'],
  bn: ['BD', 'IN'],
  de: ['AT', 'CH', 'DE', 'LI', 'LU'],
  en: ['AG', 'AU', 'BB', 'BS', 'BZ', 'CA', 'GB', 'GD', 'GY', 'IE', 'JM', 'KN', 'LC', 'NZ', 'SG', 'TT', 'US', 'VC', 'ZA', 'ZW'],
  es: ['AR', 'BO', 'CL', 'CO', 'CR', 'DO', 'EC', 'ES', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'SV', 'UY'],
  fr: ['BE', 'BJ', 'BF', 'BI', 'CA', 'CF', 'CG', 'CH', 'CI', 'DJ', 'FR', 'GA', 'GN', 'HT', 'KM', 'LU', 'MC', 'MG', 'ML', 'NE', 'RW', 'SC', 'SN', 'TG'],
  hi: ['IN'],
  id: ['ID'],
  it: ['IT', 'SM', 'CH', 'VA'],
  ja: ['JP'],
  ko: ['KR'],
  ms: ['BN', 'MY', 'SG'],
  nl: ['BE', 'NL'],
  pt: ['BR', 'CV', 'PT', 'ST'],
  ru: ['KZ', 'KG', 'TJ', 'TM', 'UZ'],
  th: ['TH'],
  tr: ['TR'],
  uk: ['UA'],
  vi: ['VN'],
  zh: ['TW', 'SG', 'MY']
}

const HIGH_RISK_BASE_URL_PATTERNS = [
  /\.cn$/i,
  /deepseek/i,
  /qwen/i,
  /aliyun/i,
  /alibaba/i,
  /baidu/i,
  /bytedance/i,
  /volcengine/i,
  /moonshot/i,
  /kimi/i,
  /minimax/i,
  /tencent/i,
  /zhipu/i,
  /douyin/i
]

const HIGH_RISK_NETWORK_PATTERNS = [
  /hosting/i,
  /datacenter/i,
  /vpn/i,
  /proxy/i,
  /relay/i,
  /colo/i,
  /cloud/i,
  /vps/i,
  /sharktech/i,
  /m247/i
]

const state = {
  browser: null,
  webrtc: null,
  network: null,
  ipv4: null,
  ipv6: null,
  dns: null,
  diagnostic: null,
  endpoint: ''
}

function getInitialLanguage() {
  const languages = (Array.isArray(navigator.languages) && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || 'zh']
  for (const lang of languages) {
    const normalized = String(lang).toLowerCase().replace(/_/g, '-')
    if (/^zh([-_]|$)/.test(normalized)) return 'zh'
    if (/^en([-_]|$)/.test(normalized)) return 'en'
    if (/^ru([-_]|$)/.test(normalized)) return 'ru'
  }
  return 'zh'
}

function t(key, params = {}) {
  const template = I18N[currentLanguage]?.[key] || I18N.zh[key] || key
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template
  )
}

function localizeFindingText(text) {
  if (currentLanguage === 'zh') {
    return text
  }
  const exact = FINDING_TRANSLATIONS[currentLanguage]?.[text]
  if (exact) {
    return exact
  }
  return localizeDynamicFindingText(text)
}

function localizeDynamicFindingText(text) {
  const replacements = currentLanguage === 'ru'
    ? [
        [/HTTP 出口证据：(.+)。/, 'Доказательство HTTP-выхода: $1.'],
        [/网络证据：(.+)；AS 组织为 (.+)。/, 'Доказательство сети: $1; AS organization: $2.'],
        [/IP 证据：IPv4 (.+)，IPv6 (.+)；(.+)。/, 'IP-доказательство: IPv4 $1, IPv6 $2; $3.'],
        [/浏览器证据：(.+)；(.+)。/, 'Доказательство браузера: $1; $2.'],
        [/本机配置证据：(.+)；(.+)。/, 'Доказательство локальной конфигурации: $1; $2.'],
        [/([A-Z]{2}) 未出现在 Anthropic Supported Countries & Regions 官方清单中/g, '$1 не входит в официальный список Anthropic Supported Countries & Regions'],
        [/([A-Z]{2})\/(.+) 属于 Anthropic 官方支持地区政策中的排除区域：(.+)/g, '$1/$2 является исключенным регионом в политике Anthropic: $3'],
        [/AS 组织为 (.+)，符合共享代理、云厂商或中转网络的弱特征。/, 'AS organization: $1; есть слабые признаки shared proxy, cloud или relay-сети.'],
        [/AS 组织：(.+)。/, 'AS organization: $1.'],
        [/IPv4 为 (.+)，IPv6 为 (.+)。/, 'IPv4: $1, IPv6: $2.'],
        [/IPv4 (.+)，IPv6 (.+)。/, 'IPv4 $1, IPv6 $2.'],
        [/DNS 证据：(.+)。/, 'DNS-доказательство: $1.'],
        [/DNS 解析出口为 (.+)，HTTP 出口为 (.+)。/, 'DNS resolver: $1, HTTP-выход: $2.'],
        [/DNS 解析出口国家\/地区：(.+)。/, 'Страна или регион DNS resolver: $1.'],
        [/发现 (.+) 个非 mDNS、非私有 candidate。/, 'Найдено $1 non-mDNS и непублично-приватных candidate.'],
        [/(.+) 个 candidate，未发现可路由公网地址。/, '$1 candidate; маршрутизируемый публичный адрес не найден.'],
        [/检测到 (.+)。/, 'Обнаружено: $1.'],
        [/语言偏好与 HTTP 出口国家 (.+) 不完全一致/, 'Языковые предпочтения не полностью совпадают со страной HTTP-выхода $1'],
        [/IP 时区 (.+) 与浏览器时区 (.+) 不一致/, 'Часовой пояс IP $1 не совпадает с часовым поясом браузера $2'],
        [/浏览器暴露 WebDriver 自动化标记/, 'Браузер раскрывает признак автоматизации WebDriver'],
        [/Locale 指向 zh_CN，但 HTTP 出口不是 CN/, 'Locale указывает на zh_CN, но HTTP-выход не CN'],
        [/shell 时区 (.+) 与浏览器时区 (.+) 不一致/, 'Часовой пояс shell $1 не совпадает с часовым поясом браузера $2'],
        [/IP 时区 (.+) 与 shell 时区 (.+) 不一致/, 'Часовой пояс IP $1 не совпадает с часовым поясом shell $2'],
        [/DNS 事件尚未返回。/, 'DNS-событие еще не получено.'],
        [/DNS resolver event did not arrive before timeout\./, 'DNS-событие не пришло до истечения времени ожидания.'],
        [/WebRTC 检测失败。/, 'Проверка WebRTC не удалась.'],
        [/需要网络检测服务返回请求国家\/地区。/, 'Сетевой probe должен вернуть страну или регион запроса.'],
        [/需要网络检测服务返回 ASN 与 AS 组织。/, 'Сетевой probe должен вернуть ASN и AS organization.'],
        [/shell 时区未设置/, 'shell timezone not set'],
        [/LANG 未设置/, 'LANG not set'],
        [/AppleLocale 未设置/, 'AppleLocale not set'],
        [/非 URL 值/, 'non-URL value'],
        [/；/g, '; '],
        [/未知/g, 'unknown'],
        [/未设置/g, 'not set']
      ]
    : [
        [/HTTP 出口证据：(.+)。/, 'HTTP exit evidence: $1.'],
        [/网络证据：(.+)；AS 组织为 (.+)。/, 'Network evidence: $1; AS organization is $2.'],
        [/IP 证据：IPv4 (.+)，IPv6 (.+)；(.+)。/, 'IP evidence: IPv4 $1, IPv6 $2; $3.'],
        [/浏览器证据：(.+)；(.+)。/, 'Browser evidence: $1; $2.'],
        [/本机配置证据：(.+)；(.+)。/, 'Local configuration evidence: $1; $2.'],
        [/([A-Z]{2}) 未出现在 Anthropic Supported Countries & Regions 官方清单中/g, '$1 is not in the official Anthropic Supported Countries & Regions list'],
        [/([A-Z]{2})\/(.+) 属于 Anthropic 官方支持地区政策中的排除区域：(.+)/g, '$1/$2 is an excluded region in Anthropic policy: $3'],
        [/AS 组织为 (.+)，符合共享代理、云厂商或中转网络的弱特征。/, 'AS organization is $1, which weakly matches shared proxy, cloud, or relay network patterns.'],
        [/AS 组织：(.+)。/, 'AS organization: $1.'],
        [/IPv4 为 (.+)，IPv6 为 (.+)。/, 'IPv4 is $1, IPv6 is $2.'],
        [/IPv4 (.+)，IPv6 (.+)。/, 'IPv4 $1, IPv6 $2.'],
        [/DNS 证据：(.+)。/, 'DNS evidence: $1.'],
        [/DNS 解析出口为 (.+)，HTTP 出口为 (.+)。/, 'DNS resolver exit is $1, HTTP exit is $2.'],
        [/DNS 解析出口国家\/地区：(.+)。/, 'DNS resolver country or region: $1.'],
        [/发现 (.+) 个非 mDNS、非私有 candidate。/, 'Found $1 non-mDNS, non-private candidates.'],
        [/(.+) 个 candidate，未发现可路由公网地址。/, '$1 candidates; no routable public address found.'],
        [/检测到 (.+)。/, 'Detected $1.'],
        [/语言偏好与 HTTP 出口国家 (.+) 不完全一致/, 'Language preferences are not fully consistent with HTTP exit country $1'],
        [/IP 时区 (.+) 与浏览器时区 (.+) 不一致/, 'IP timezone $1 differs from browser timezone $2'],
        [/浏览器暴露 WebDriver 自动化标记/, 'Browser exposes the WebDriver automation flag'],
        [/Locale 指向 zh_CN，但 HTTP 出口不是 CN/, 'Locale points to zh_CN, but the HTTP exit is not CN'],
        [/shell 时区 (.+) 与浏览器时区 (.+) 不一致/, 'shell timezone $1 differs from browser timezone $2'],
        [/IP 时区 (.+) 与 shell 时区 (.+) 不一致/, 'IP timezone $1 differs from shell timezone $2'],
        [/DNS 事件尚未返回。/, 'DNS event has not arrived yet.'],
        [/DNS resolver event did not arrive before timeout\./, 'DNS resolver event did not arrive before timeout.'],
        [/WebRTC 检测失败。/, 'WebRTC check failed.'],
        [/需要网络检测服务返回请求国家\/地区。/, 'The network probe must return the request country or region.'],
        [/需要网络检测服务返回 ASN 与 AS 组织。/, 'The network probe must return ASN and AS organization.'],
        [/shell 时区未设置/, 'shell timezone not set'],
        [/LANG 未设置/, 'LANG not set'],
        [/AppleLocale 未设置/, 'AppleLocale not set'],
        [/非 URL 值/, 'non-URL value'],
        [/；/g, '; '],
        [/未知/g, 'unknown'],
        [/未设置/g, 'not set']
      ]
  return replacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text)
}

function translateStaticContent() {
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : currentLanguage
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n)
  })
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder))
  })
  updateLanguageButtons()
}

function updateLanguageButtons() {
  document.querySelectorAll('.language-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.language === currentLanguage)
  })
}

function setLanguage(language) {
  currentLanguage = I18N[language] ? language : 'zh'
  translateStaticContent()
  updateNetworkServiceUi()
  renderAll()
}

function normalizeCountryCode(value) {
  return String(value || '').trim().toUpperCase()
}

function isSupportedCountry(value) {
  const code = normalizeCountryCode(value)
  return Boolean(code && SUPPORTED_COUNTRY_CODES.has(code))
}

function getUnsupportedRegionRule(network) {
  const country = normalizeCountryCode(network?.country)
  const region = String(network?.region || '').trim()
  if (!country || !region) {
    return null
  }
  return UNSUPPORTED_REGION_RULES.find((rule) => (
    rule.country === country && rule.patterns.some((pattern) => pattern.test(region))
  )) || null
}

function getCountrySupportIssue(country, region = '') {
  const code = normalizeCountryCode(country)
  if (!code) {
    return null
  }
  const regionRule = getUnsupportedRegionRule({ country: code, region })
  if (regionRule) {
    return {
      country: code,
      region,
      reason: 'excluded-region',
      label: `${code}/${region}`,
      detail: `${code}/${region} 属于 Anthropic 官方支持地区政策中的排除区域：${regionRule.label}`
    }
  }
  if (!isSupportedCountry(code)) {
    return {
      country: code,
      region,
      reason: 'unsupported-country',
      label: code,
      detail: `${code} 未出现在 Anthropic Supported Countries & Regions 官方清单中`
    }
  }
  return null
}

function getProbeSupportIssue(probe) {
  if (!probe || probe.status !== 'ok') {
    return null
  }
  return getCountrySupportIssue(probe.country, probe.region)
}

function getUnsupportedCountries(countries) {
  const uniqueCountries = [...new Set(countries.map(normalizeCountryCode).filter(Boolean))]
  return uniqueCountries
    .map((country) => getCountrySupportIssue(country))
    .filter(Boolean)
}

function inferTimezoneCountry(timezone) {
  return TIMEZONE_COUNTRY_HINTS[timezone] || ''
}

function inferBrowserSupportIssues(browser) {
  if (!browser || browser.status !== 'ok') {
    return []
  }
  const languageCountries = inferLanguageCountries(browser.languages)
  const timezoneCountry = inferTimezoneCountry(browser.timeZone)
  return getUnsupportedCountries([...languageCountries, timezoneCountry])
}

function inferDiagnosticSupportIssues(diagnostic) {
  if (!diagnostic) {
    return []
  }
  const countries = inferLanguageCountries([
    diagnostic.locale.LANG,
    diagnostic.locale.LC_ALL,
    diagnostic.locale.AppleLocale
  ].filter(Boolean))
  const timezoneCountry = inferTimezoneCountry(diagnostic.timezone)
  return getUnsupportedCountries([...countries, timezoneCountry])
}

function getDefaultEndpoint() {
  const configuredEndpoint = DEFAULT_PROBE_ENDPOINT.trim()
  if (configuredEndpoint) {
    return configuredEndpoint
  }
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    return location.origin
  }
  return ''
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName)
  if (className) {
    element.className = className
  }
  if (text !== undefined) {
    element.textContent = text
  }
  return element
}

function readBrowserProbe() {
  const languages = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || 'unknown']
  const resolved = Intl.DateTimeFormat().resolvedOptions()
  return {
    status: 'ok',
    timeZone: resolved.timeZone || 'unknown',
    locale: resolved.locale || navigator.language || 'unknown',
    languages,
    platform: navigator.userAgentData?.platform || navigator.platform || 'unknown',
    userAgent: navigator.userAgent || 'unknown',
    webdriver: Boolean(navigator.webdriver)
  }
}

async function readUserAgentHints() {
  if (!navigator.userAgentData?.getHighEntropyValues) {
    return
  }
  try {
    const hints = await navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness', 'platformVersion'])
    state.browser = {
      ...state.browser,
      uaHints: {
        architecture: hints.architecture || 'unknown',
        bitness: hints.bitness || 'unknown',
        platformVersion: hints.platformVersion || 'unknown'
      }
    }
  } catch (error) {
    state.browser = {
      ...state.browser,
      uaHintsError: '浏览器拒绝高熵 UA hints'
    }
  }
}

async function runWebRtcProbe() {
  if (!window.RTCPeerConnection) {
    state.webrtc = { status: 'unsupported', candidates: [] }
    return
  }

  const candidates = []
  const pc = new RTCPeerConnection({ iceServers: [] })

  try {
    pc.createDataChannel('probe')
    pc.onicecandidate = (event) => {
      if (!event.candidate?.candidate) {
        return
      }
      candidates.push(parseIceCandidate(event.candidate.candidate))
    }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await new Promise((resolve) => window.setTimeout(resolve, 1200))
    state.webrtc = {
      status: 'ok',
      candidates
    }
  } catch (error) {
    state.webrtc = {
      status: 'error',
      error: 'WebRTC 检测失败',
      candidates
    }
  } finally {
    pc.close()
  }
}

function parseIceCandidate(candidateLine) {
  const typeMatch = candidateLine.match(/\styp\s([a-z]+)/i)
  const addressMatch = candidateLine.match(/candidate:\S+\s+\d+\s+\S+\s+\d+\s+([^\s]+)\s+\d+/i)
  const address = addressMatch?.[1] || 'unknown'
  return {
    type: typeMatch?.[1] || 'unknown',
    address,
    isMdns: /\.local$/i.test(address),
    isPrivate: isPrivateAddress(address)
  }
}

function isPrivateAddress(value) {
  return /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|::1|fc|fd|fe80)/i.test(value)
}

async function fetchJson(path, options = {}) {
  if (!state.endpoint) {
    throw new Error(t('defaultProbeNotConfigured'))
  }
  const requestUrl = /^https?:\/\//i.test(path)
    ? path
    : `${state.endpoint.replace(/\/+$/, '')}${path}`
  const response = await fetch(requestUrl, {
    ...options,
    headers: {
      accept: 'application/json',
      ...(options.headers || {})
    }
  })
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    try {
      const errorBody = await response.json()
      errorMessage = errorBody.message || errorBody.error?.message || errorMessage
    } catch (error) {
      errorMessage = `${t('networkNeeded')} ${errorMessage}`
    }
    throw new Error(errorMessage)
  }
  return response.json()
}

async function runNetworkProbes() {
  try {
    const networkData = await fetchJson('/v1/probes/network')
    state.network = { status: 'ok', ...networkData }
  } catch (error) {
    state.network = { status: 'error', error: error.message }
  }

  const ipv4Path = state.network?.ipv4ProbeUrl || '/v1/probes/ipv4'
  const ipv6Path = state.network?.ipv6ProbeUrl || '/v1/probes/ipv6'
  await Promise.all([
    fetchJson(ipv4Path)
      .then((data) => { state.ipv4 = { status: 'ok', ...data } })
      .catch((error) => { state.ipv4 = { status: 'error', error: error.message } }),
    fetchJson(ipv6Path)
      .then((data) => { state.ipv6 = { status: 'ok', ...data } })
      .catch((error) => { state.ipv6 = { status: 'error', error: error.message } }),
    runDnsProbe()
  ])
}

async function runDnsProbe() {
  try {
    const tokenResponse = await fetchJson('/v1/probes/dns-token', { method: 'POST' })
    if (!tokenResponse.lookupUrl || tokenResponse.status === 'unavailable') {
      state.dns = { status: 'unavailable', messageKey: 'dnsUnavailableDetail' }
      return
    }
    await triggerDnsLookup(tokenResponse.lookupUrl)
    const result = await pollDnsResult(tokenResponse.token)
    state.dns = { status: result.status || 'ok', ...result }
  } catch (error) {
    const isDnsUnavailable = /DNS resolver detection requires|authoritative DNS/i.test(error.message)
    state.dns = isDnsUnavailable
      ? { status: 'unavailable', messageKey: 'dnsUnavailableDetail' }
      : { status: 'error', error: error.message }
  }
}

async function pollDnsResult(token) {
  const maxAttempts = 8
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await fetchJson(`/v1/probes/dns-result/${encodeURIComponent(token)}`)
    if (result.status && result.status !== 'pending') {
      return result
    }
    await delay(900)
  }
  return {
    status: 'pending',
    message: 'DNS resolver event did not arrive before timeout.'
  }
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function triggerDnsLookup(url) {
  return new Promise((resolve) => {
    const image = new Image()
    const finish = () => resolve()
    image.onload = finish
    image.onerror = finish
    image.src = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
    window.setTimeout(resolve, 1200)
  })
}

function parseDiagnosticInput(rawText) {
  const text = rawText.trim()
  if (!text) {
    throw new Error(t('diagnosticEmpty'))
  }

  try {
    return normalizeDiagnostic(JSON.parse(text))
  } catch (error) {
    return parseDiagnosticText(text)
  }
}

function normalizeDiagnostic(data) {
  const env = data.env || data.environment || {}
  const locale = data.locale || {}
  return {
    importedAt: new Date().toISOString(),
    env: {
      ANTHROPIC_BASE_URL: safeValue(env.ANTHROPIC_BASE_URL),
      HTTP_PROXY: safeValue(env.HTTP_PROXY || env.http_proxy),
      HTTPS_PROXY: safeValue(env.HTTPS_PROXY || env.https_proxy),
      ALL_PROXY: safeValue(env.ALL_PROXY || env.all_proxy),
      GRPC_PROXY: safeValue(env.GRPC_PROXY || env.grpc_proxy)
    },
    locale: {
      LANG: safeValue(locale.LANG || data.LANG),
      LC_ALL: safeValue(locale.LC_ALL || data.LC_ALL),
      AppleLocale: safeValue(locale.AppleLocale || data.AppleLocale)
    },
    timezone: safeValue(data.timezone || data.timeZone || data.TZ)
  }
}

function parseDiagnosticText(text) {
  const lines = text.split(/\r?\n/)
  const env = {}
  const locale = {}
  let timezone = ''

  lines.forEach((line) => {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) {
      if (/Asia\/|America\/|Europe\/|Africa\/|Australia\/|Pacific\//.test(line)) {
        timezone = line.trim()
      }
      return
    }

    const key = match[1]
    const value = match[2].replace(/^['"]|['"]$/g, '').trim()
    if (key.includes('PROXY') || key === 'ANTHROPIC_BASE_URL') {
      env[key] = value
    }
    if (['LANG', 'LC_ALL', 'AppleLocale'].includes(key)) {
      locale[key] = value
    }
    if (key === 'TZ') {
      timezone = value
    }
  })

  return normalizeDiagnostic({ env, locale, timezone })
}

function safeValue(value) {
  if (!value) {
    return ''
  }
  const text = String(value).trim()
  if (/token|sk-|key=/i.test(text)) {
    return 'set:redacted'
  }
  return text
}

function scoreRegion(network) {
  const country = normalizeCountryCode(network?.country)
  if (!network || network.status !== 'ok' || !country) {
    return unavailableResult('出口地区与官方支持列表', MODULE_WEIGHTS.region, '需要网络检测服务返回请求国家/地区。')
  }
  const supportIssue = getProbeSupportIssue(network)
  if (supportIssue?.reason === 'excluded-region') {
    return problemResult(
      '出口地区属于 Anthropic 官方排除区域',
      MODULE_WEIGHTS.region,
      `HTTP 出口证据：${supportIssue.detail}。`,
      '核验真实使用地区和网络出口；如确实位于官方排除区域，应暂停 Claude Code 直连路径，改用官方支持地区或授权云渠道。'
    )
  }
  if (supportIssue) {
    return problemResult(
      '出口地区不在 Anthropic 支持列表',
      MODULE_WEIGHTS.region,
      `HTTP 出口证据：${supportIssue.detail}。`,
      '核验真实使用地区和网络出口；如确实不在支持地区，应暂停 Claude Code 直连路径，改用官方支持地区或授权云渠道。'
    )
  }
  return okResult('出口地区在支持列表内', MODULE_WEIGHTS.region, `HTTP 出口国家/地区为 ${country}。`)
}

function scoreNetwork(network) {
  if (!network || network.status !== 'ok') {
    return unavailableResult('出口网络画像', MODULE_WEIGHTS.network, '需要网络检测服务返回 ASN 与 AS 组织。')
  }
  const organization = String(network.asOrganization || network.organization || '').trim()
  const supportIssue = getProbeSupportIssue(network)
  if (supportIssue) {
    return problemResult(
      '出口网络位于 Anthropic 非支持地区',
      MODULE_WEIGHTS.network,
      `网络证据：${supportIssue.detail}；AS 组织为 ${organization || '未知'}。`,
      '先解决网络出口所在地合规问题；只有出口地区在支持列表内时，ASN/组织画像的一致性才有意义。'
    )
  }
  const isHighRisk = HIGH_RISK_NETWORK_PATTERNS.some((pattern) => pattern.test(organization))
  if (isHighRisk) {
    return partialProblemResult(
      '出口网络可能是共享代理或数据中心',
      MODULE_WEIGHTS.network,
      Math.round(MODULE_WEIGHTS.network * 0.7),
      `AS 组织为 ${organization || '未知'}，符合共享代理、云厂商或中转网络的弱特征。`,
      '使用可审计、地区一致、主体明确的网络出口；避免不明共享中转承载 Claude Code 请求。'
    )
  }
  return okResult('出口网络画像未发现明显中转特征', MODULE_WEIGHTS.network, `AS 组织：${organization || '未知'}。`)
}

function scoreIpSplit(ipv4, ipv6) {
  if ((!ipv4 || ipv4.status !== 'ok') && (!ipv6 || ipv6.status !== 'ok')) {
    return unavailableResult('IPv4 / IPv6 一致性', MODULE_WEIGHTS.ipSplit, '需要 IPv4 与 IPv6 网络检测服务。')
  }
  if (!ipv4 || ipv4.status !== 'ok' || !ipv6 || ipv6.status !== 'ok') {
    return partialProblemResult(
      'IPv4 或 IPv6 检测不完整',
      MODULE_WEIGHTS.ipSplit,
      3,
      '只检测到其中一条出口路径，无法确认是否存在 IPv6 分流。',
      '部署 v4-only 和 v6-only 检测端点，确认两条出口路径地区一致。'
    )
  }
  const v4Country = normalizeCountryCode(ipv4.country)
  const v6Country = normalizeCountryCode(ipv6.country)
  const supportIssues = [getProbeSupportIssue(ipv4), getProbeSupportIssue(ipv6)].filter(Boolean)
  if (supportIssues.length) {
    return problemResult(
      'IPv4 或 IPv6 出口位于 Anthropic 非支持地区',
      MODULE_WEIGHTS.ipSplit,
      `IP 证据：IPv4 ${v4Country || '未知'}，IPv6 ${v6Country || '未知'}；${supportIssues.map((issue) => issue.detail).join('；')}。`,
      '先确认 IPv4 与 IPv6 两条路径都位于官方支持地区；如果任一路径不支持，应修复该出口路径后再检查一致性。'
    )
  }
  if (v4Country && v6Country && v4Country !== v6Country) {
    return problemResult(
      'IPv4 与 IPv6 出口国家不一致',
      MODULE_WEIGHTS.ipSplit,
      `IPv4 为 ${v4Country}，IPv6 为 ${v6Country}。`,
      '统一 IPv4 与 IPv6 出口策略；如果无法保证一致，先关闭或修复异常的 IPv6 路径。'
    )
  }
  return okResult('IPv4 与 IPv6 未发现国家分裂', MODULE_WEIGHTS.ipSplit, `IPv4 ${v4Country || '未知'}，IPv6 ${v6Country || '未知'}。`)
}

function scoreDns(dns, network) {
  if (!dns || dns.status === 'unavailable') {
    return disabledResult(t('dnsUnavailableTitle'), MODULE_WEIGHTS.dns, t('dnsUnavailableDetail'), t('dnsUnavailableAdvice'))
  }
  if (dns.status === 'pending') {
    return unavailableResult('DNS 解析出口', MODULE_WEIGHTS.dns, dns.message || t('dnsEventPending'), t('dnsUnavailableAdvice'))
  }
  if (dns.status !== 'ok') {
    return disabledResult('DNS 解析出口', MODULE_WEIGHTS.dns, dns.error || t('dnsNeeded'), t('dnsUnavailableAdvice'))
  }
  const resolverCountry = normalizeCountryCode(dns.resolverCountry || dns.country)
  const httpCountry = normalizeCountryCode(network?.country)
  if (!resolverCountry) {
    return unavailableResult('DNS 解析出口', MODULE_WEIGHTS.dns, t('dnsCountryMissing'), t('dnsCountryMissingAdvice'))
  }
  const supportIssue = getCountrySupportIssue(resolverCountry, dns.region || dns.resolverRegion)
  if (supportIssue) {
    return problemResult(
      'DNS 解析出口不在支持地区',
      MODULE_WEIGHTS.dns,
      `DNS 证据：${supportIssue.detail}。`,
      '修复 DNS 解析路径，确保 Claude Code 所在网络的 DNS 与实际合规出口一致。'
    )
  }
  if (resolverCountry && httpCountry && resolverCountry !== httpCountry) {
    return partialProblemResult(
      'DNS 与 HTTP 出口国家不一致',
      MODULE_WEIGHTS.dns,
      10,
      `DNS 解析出口为 ${resolverCountry}，HTTP 出口为 ${httpCountry}。`,
      '核查系统 DNS、代理 DNS 与活动网络配置，避免 DNS 泄漏造成地区画像冲突。'
    )
  }
  return okResult('DNS 解析出口与 HTTP 出口地区一致', MODULE_WEIGHTS.dns, `DNS 解析出口国家/地区：${resolverCountry || '未知'}。`)
}

function scoreBrowser(browser, network) {
  if (!browser || browser.status !== 'ok') {
    return unavailableResult('浏览器环境一致性', MODULE_WEIGHTS.browser, '浏览器环境扫描未完成。')
  }
  let risk = 0
  const notes = []
  const browserCountryHints = inferLanguageCountries(browser.languages)
  const httpCountry = normalizeCountryCode(network?.country)
  const browserSupportIssues = inferBrowserSupportIssues(browser)

  if (browserSupportIssues.length) {
    return problemResult(
      '浏览器语言或时区指向 Anthropic 非支持地区',
      MODULE_WEIGHTS.browser,
      `浏览器证据：${browser.languages.join(', ')} · ${browser.timeZone}；${browserSupportIssues.map((issue) => issue.detail).join('；')}。`,
      '按真实合规使用地区统一浏览器语言、系统地区与时区；如果真实环境位于非支持地区，应暂停 Claude Code 直连路径。'
    )
  }

  if (browser.webdriver) {
    risk += 3
    notes.push('浏览器暴露 WebDriver 自动化标记')
  }

  if (httpCountry && browserCountryHints.length && !browserCountryHints.includes(httpCountry)) {
    risk += 3
    notes.push(`语言偏好与 HTTP 出口国家 ${httpCountry} 不完全一致`)
  }

  if (network?.timezone && browser.timeZone && !isTimezoneCompatible(network.timezone, browser.timeZone)) {
    risk += 4
    notes.push(`IP 时区 ${network.timezone} 与浏览器时区 ${browser.timeZone} 不一致`)
  }

  if (risk > 0) {
    return partialProblemResult(
      '浏览器环境存在一致性疑点',
      MODULE_WEIGHTS.browser,
      Math.min(risk, MODULE_WEIGHTS.browser),
      notes.join('；') || '检测到弱一致性问题。',
      '按真实使用地区统一浏览器时区、系统时区与网络出口；语言本身不代表风险，只用于一致性判断。'
    )
  }

  return okResult('浏览器语言与时区未发现明显冲突', MODULE_WEIGHTS.browser, `${browser.languages.join(', ')} · ${browser.timeZone}`)
}

function inferLanguageCountries(languages) {
  const countries = new Set()
  languages.forEach((language) => {
    const parts = String(language).replace(/\..*$/, '').split(/[-_]/)
    const base = parts[0]?.toLowerCase()
    const region = parts[1]?.toUpperCase()
    if (region && /^[A-Z]{2}$/.test(region)) {
      countries.add(region)
      return
    }
    ;(LANGUAGE_REGION_HINTS[base] || []).forEach((country) => countries.add(country))
  })
  return [...countries]
}

function isTimezoneCompatible(ipTimezone, browserTimezone) {
  if (!ipTimezone || !browserTimezone) {
    return true
  }
  if (ipTimezone === browserTimezone) {
    return true
  }
  const ipRegion = String(ipTimezone).split('/')[0]
  const browserRegion = String(browserTimezone).split('/')[0]
  return ipRegion === browserRegion
}

function scoreWebRtc(webrtc) {
  if (!webrtc || webrtc.status === 'unsupported') {
    return unavailableResult('WebRTC 网络泄漏', MODULE_WEIGHTS.webrtc, '当前浏览器不支持或未开放 WebRTC 检测。')
  }
  if (webrtc.status === 'error') {
    return unavailableResult('WebRTC 网络泄漏', MODULE_WEIGHTS.webrtc, webrtc.error || 'WebRTC 检测失败。')
  }
  const exposed = webrtc.candidates.filter((candidate) => !candidate.isMdns && !candidate.isPrivate)
  if (exposed.length) {
    return partialProblemResult(
      'WebRTC 暴露可路由候选地址',
      MODULE_WEIGHTS.webrtc,
      MODULE_WEIGHTS.webrtc,
      `发现 ${exposed.length} 个非 mDNS、非私有 candidate。`,
      '核查浏览器 WebRTC 策略；真实账号使用环境应避免与网络出口不一致的路径暴露。'
    )
  }
  return okResult('WebRTC 未发现明显公网候选泄漏', MODULE_WEIGHTS.webrtc, `${webrtc.candidates.length} 个 candidate，未发现可路由公网地址。`)
}

function scoreBaseUrl(diagnostic) {
  if (!diagnostic) {
    return unavailableResult('Claude Code ANTHROPIC_BASE_URL', MODULE_WEIGHTS.baseUrl, '尚未核对 Claude Code 本机配置。')
  }
  const value = diagnostic.env.ANTHROPIC_BASE_URL
  if (!value) {
    return okResult('ANTHROPIC_BASE_URL 未设置', MODULE_WEIGHTS.baseUrl, 'Claude Code 默认不会被非官方 BASE_URL 改写。')
  }
  const host = extractHost(value)
  if (host === 'api.anthropic.com') {
    return okResult('ANTHROPIC_BASE_URL 指向官方 API', MODULE_WEIGHTS.baseUrl, host)
  }
  const isHighRisk = HIGH_RISK_BASE_URL_PATTERNS.some((pattern) => pattern.test(host || value))
  if (isHighRisk) {
    return problemResult(
      'ANTHROPIC_BASE_URL 指向不支持地区相关域名',
      MODULE_WEIGHTS.baseUrl,
      `检测到 ${host || '非 URL 值'}。`,
      '把 Anthropic 官方路径与其他模型供应商配置隔离；Claude Code 使用 Anthropic 时不要加载不明或不支持地区相关 BASE_URL。'
    )
  }
  return partialProblemResult(
    'ANTHROPIC_BASE_URL 指向非官方端点',
    MODULE_WEIGHTS.baseUrl,
    10,
    `检测到 ${host || '非 URL 值'}。`,
    '核验该端点是否为官方授权渠道；无法确认时，应恢复官方端点或取消该变量。'
  )
}

function scoreProxy(diagnostic) {
  if (!diagnostic) {
    return unavailableResult('Claude Code 代理环境变量', MODULE_WEIGHTS.proxy, '尚未核对 Claude Code 本机配置。')
  }
  const proxies = ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'GRPC_PROXY']
    .map((key) => [key, diagnostic.env[key]])
    .filter(([, value]) => Boolean(value))
  if (!proxies.length) {
    return okResult('未发现 Claude Code 代理环境变量', MODULE_WEIGHTS.proxy, '终端环境未设置常见代理变量。')
  }
  const risky = proxies.filter(([, value]) => {
    const host = extractHost(value)
    return HIGH_RISK_BASE_URL_PATTERNS.some((pattern) => pattern.test(host || value))
  })
  if (risky.length) {
    return problemResult(
      '代理变量指向不支持地区相关服务',
      MODULE_WEIGHTS.proxy,
      risky.map(([key, value]) => `${key}=${redactUrl(value)}`).join('；'),
      '清理不明代理变量；保留主体明确、地区一致、可审计的网络配置。'
    )
  }
  if (proxies.length >= 3) {
    return partialProblemResult(
      '代理变量较多，路径可能混乱',
      MODULE_WEIGHTS.proxy,
      4,
      proxies.map(([key, value]) => `${key}=${redactUrl(value)}`).join('；'),
      '减少重复代理变量，明确 Claude Code 的实际出口路径。'
    )
  }
  return partialProblemResult(
    '检测到代理变量',
    MODULE_WEIGHTS.proxy,
    2,
    proxies.map(([key, value]) => `${key}=${redactUrl(value)}`).join('；'),
    '确认代理出口、DNS 与账号使用地区一致。'
  )
}

function scoreLocale(diagnostic, network, browser) {
  if (!diagnostic) {
    return unavailableResult('Claude Code Locale / shell 时区', MODULE_WEIGHTS.locale, '尚未核对 Claude Code 本机配置。')
  }
  let risk = 0
  const notes = []
  const lang = `${diagnostic.locale.LANG} ${diagnostic.locale.LC_ALL} ${diagnostic.locale.AppleLocale}`.toLowerCase()
  const shellTimezone = diagnostic.timezone
  const httpCountry = normalizeCountryCode(network?.country)
  const diagnosticSupportIssues = inferDiagnosticSupportIssues(diagnostic)

  if (diagnosticSupportIssues.length) {
    return problemResult(
      'Claude Code Locale 或 shell 时区指向 Anthropic 非支持地区',
      MODULE_WEIGHTS.locale,
      `本机配置证据：${diagnostic.locale.LANG || 'LANG 未设置'} / ${diagnostic.locale.AppleLocale || 'AppleLocale 未设置'} · ${shellTimezone || 'shell 时区未设置'}；${diagnosticSupportIssues.map((issue) => issue.detail).join('；')}。`,
      '按真实合规使用地区统一 LANG、LC_ALL、AppleLocale 与 shell 时区；如果真实环境位于非支持地区，应暂停 Claude Code 直连路径。'
    )
  }

  if (/zh_cn|zh-cn/.test(lang) && httpCountry && httpCountry !== 'CN') {
    risk += 3
    notes.push('Locale 指向 zh_CN，但 HTTP 出口不是 CN')
  }

  if (shellTimezone && browser?.timeZone && !isTimezoneCompatible(shellTimezone, browser.timeZone)) {
    risk += 3
    notes.push(`shell 时区 ${shellTimezone} 与浏览器时区 ${browser.timeZone} 不一致`)
  }

  if (network?.timezone && shellTimezone && !isTimezoneCompatible(network.timezone, shellTimezone)) {
    risk += 3
    notes.push(`IP 时区 ${network.timezone} 与 shell 时区 ${shellTimezone} 不一致`)
  }

  if (risk > 0) {
    return partialProblemResult(
      'Claude Code Locale 或 shell 时区存在冲突',
      MODULE_WEIGHTS.locale,
      Math.min(risk, MODULE_WEIGHTS.locale),
      notes.join('；'),
      '按真实使用地区统一 LANG、LC_ALL、AppleLocale 与 shell 时区。'
    )
  }
  return okResult('Claude Code Locale 与时区未发现明显冲突', MODULE_WEIGHTS.locale, `${diagnostic.locale.LANG || 'LANG 未设置'} · ${shellTimezone || 'shell 时区未设置'}`)
}

function extractHost(value) {
  if (!value || value === 'set:redacted') {
    return ''
  }
  try {
    return new URL(value).hostname.toLowerCase()
  } catch (error) {
    const withoutProtocol = String(value).replace(/^[a-z]+:\/\//i, '')
    return withoutProtocol.split(/[/:]/)[0].toLowerCase()
  }
}

function redactUrl(value) {
  if (!value) {
    return ''
  }
  if (value === 'set:redacted') {
    return value
  }
  const host = extractHost(value)
  if (!host) {
    return 'set'
  }
  return host
}

function okResult(title, weight, detail) {
  return {
    title,
    weight,
    score: 0,
    status: 'ok',
    detail,
    advice: t('noRemediation')
  }
}

function partialProblemResult(title, weight, score, detail, advice) {
  return {
    title,
    weight,
    score: Math.min(score, weight),
    status: score >= weight * 0.7 ? 'danger' : 'warn',
    detail,
    advice
  }
}

function problemResult(title, weight, detail, advice) {
  return {
    title,
    weight,
    score: weight,
    status: 'danger',
    detail,
    advice
  }
}

function unavailableResult(title, weight, detail, advice = t('improveCoverage')) {
  return {
    title,
    weight,
    score: 0,
    status: 'missing',
    detail,
    advice
  }
}

function disabledResult(title, weight, detail, advice) {
  return {
    title,
    weight,
    score: 0,
    status: 'disabled',
    detail,
    advice
  }
}

function getModuleResults() {
  return {
    region: scoreRegion(state.network),
    network: scoreNetwork(state.network),
    ipSplit: scoreIpSplit(state.ipv4, state.ipv6),
    dns: scoreDns(state.dns, state.network),
    browser: scoreBrowser(state.browser, state.network),
    webrtc: scoreWebRtc(state.webrtc),
    baseUrl: scoreBaseUrl(state.diagnostic),
    proxy: scoreProxy(state.diagnostic),
    locale: scoreLocale(state.diagnostic, state.network, state.browser)
  }
}

function calculateRiskScore(results, moduleNames, totalWeight) {
  const availableModules = moduleNames.filter((name) => !['missing', 'disabled'].includes(results[name].status))
  const availableWeight = availableModules.reduce((total, name) => total + results[name].weight, 0)
  const rawScore = availableModules.reduce((total, name) => total + results[name].score, 0)
  const normalizedScore = availableWeight ? Math.round((rawScore / availableWeight) * 100) : 0
  const coverage = Math.round((availableWeight / totalWeight) * 100)
  return {
    rawScore,
    availableWeight,
    normalizedScore,
    coverage
  }
}

function getRiskLabel(score) {
  return t(getRiskLevel(score).key)
}

function getRiskLevel(score) {
  return RISK_LEVELS.find((level) => score <= level.max) || RISK_LEVELS[RISK_LEVELS.length - 1]
}

function hasAnyEvidence() {
  return Boolean(state.browser || state.webrtc || state.network || state.ipv4 || state.ipv6 || state.dns || state.diagnostic)
}

function hasNetworkEvidence() {
  return Boolean(state.network || state.ipv4 || state.ipv6 || state.dns)
}

function updateNetworkServiceUi() {
  const note = document.getElementById('network-service-note')
  if (!note) {
    return
  }
  note.textContent = getDefaultEndpoint()
    ? t('networkServiceReady')
    : t('networkServiceMissing')
}

function updateScoreRing(score) {
  const ring = document.getElementById('risk-score-ring')
  ring.classList.remove('low', 'warn', 'high', 'danger', 'critical', 'muted')
  if (score === null) {
    ring.classList.add('muted')
    ring.style.setProperty('--score-angle', '0deg')
    document.getElementById('risk-score').textContent = '--'
    return
  }
  const riskLevel = getRiskLevel(score)
  if (riskLevel.className === 'guarded') {
    ring.classList.add('warn')
  } else if (riskLevel.className === 'high') {
    ring.classList.add('high')
  } else if (riskLevel.className === 'severe') {
    ring.classList.add('danger')
  } else if (riskLevel.className === 'critical') {
    ring.classList.add('critical')
  }
  ring.style.setProperty('--score-angle', `${score * 3.6}deg`)
  document.getElementById('risk-score').textContent = String(score)
}

function updateScores(results) {
  if (!hasAnyEvidence()) {
    updateScoreRing(null)
    document.getElementById('risk-stage').textContent = t('waitingStage')
    document.getElementById('risk-score-copy').textContent = t('waitingCopy')
    document.getElementById('coverage-fill').style.width = '0%'
    document.getElementById('coverage-copy').textContent = t('coverageEmpty')
    return
  }

  const webScore = calculateRiskScore(results, WEB_MODULES, 70)
  const fullScore = calculateRiskScore(results, FULL_MODULES, 100)
  const activeScore = state.diagnostic ? fullScore : webScore
  const stageTitle = state.diagnostic
    ? t('stageFull')
    : t('stageWeb')
  const scoreCopy = state.diagnostic
    ? t('scoreFullCopy', { label: getRiskLabel(activeScore.normalizedScore), weight: fullScore.availableWeight })
    : t('scoreWebCopy', { label: getRiskLabel(activeScore.normalizedScore), weight: fullScore.availableWeight })

  updateScoreRing(activeScore.normalizedScore)
  document.getElementById('risk-stage').textContent = stageTitle
  document.getElementById('risk-score-copy').textContent = scoreCopy
  const coverage = fullScore.coverage
  document.getElementById('coverage-fill').style.width = `${coverage}%`
  document.getElementById('coverage-copy').textContent = t('coverageCopy', { coverage })
}

function renderFindings(results) {
  const container = document.getElementById('findings-list')
  container.replaceChildren()
  if (!hasAnyEvidence()) {
    container.append(createElement('p', 'empty-state', t('noFindings')))
    return
  }

  const ordered = FULL_MODULES
    .map((name) => ({ name, ...results[name] }))
    .sort((a, b) => {
      const statusRank = { danger: 0, warn: 1, missing: 2, disabled: 3, ok: 4 }
      return statusRank[a.status] - statusRank[b.status] || b.score - a.score
    })

  ordered.forEach((result) => {
    const item = createElement('article', `finding ${result.status === 'danger' ? 'danger' : result.status === 'warn' ? 'warn' : result.status === 'ok' ? 'ok' : ''}`)
    const header = createElement('header')
    header.append(
      createElement('h3', '', localizeFindingText(result.title)),
      createElement('span', `badge ${result.status === 'danger' ? 'danger' : result.status === 'warn' ? 'warn' : ''}`, `${result.score}/${result.weight}`)
    )
    item.append(
      header,
      createElement('p', 'finding-copy', `${t('evidencePrefix')}${localizeFindingText(result.detail)}`),
      createElement('p', 'finding-copy', `${t('advicePrefix')}${localizeFindingText(result.advice)}`)
    )
    container.append(item)
  })
}

function renderProbeDetails() {
  const container = document.getElementById('probe-grid')
  container.replaceChildren()
  if (!hasAnyEvidence()) {
    container.append(createElement('p', 'empty-state', t('noProbeDetails')))
    return
  }
  const rows = [
    [t('browserProbe'), state.browser, formatBrowserProbe],
    [t('webrtcProbe'), state.webrtc, formatWebRtcProbe],
    [t('httpProbe'), state.network, formatNetworkProbe],
    [t('ipv4Probe'), state.ipv4, formatNetworkProbe],
    [t('ipv6Probe'), state.ipv6, formatNetworkProbe],
    [t('dnsProbe'), state.dns, formatDnsProbe]
  ]
  rows.forEach(([title, value, formatter]) => {
    const card = createElement('article', 'probe-card')
    const header = createElement('header')
    header.append(
      createElement('h3', '', title),
      createElement('span', `badge ${value?.status === 'error' || value?.status === 'unavailable' ? 'warn' : ''}`, t(`status${capitalizeStatus(value?.status || 'Missing')}`))
    )
    card.append(header, createElement('p', 'probe-copy', formatter(value)))
    container.append(card)
  })
}

function formatBrowserProbe(value) {
  if (!value) {
    return t('notRead')
  }
  return `${value.languages.join(', ')} · ${value.timeZone} · ${value.platform}${value.webdriver ? ' · WebDriver' : ''}`
}

function formatWebRtcProbe(value) {
  if (!value) {
    return t('notRun')
  }
  if (value.status !== 'ok') {
    return value.error || t('notRun')
  }
  return `${value.candidates.length} 个 candidate；${value.candidates.filter((candidate) => candidate.isMdns).length} 个 mDNS。`
}

function formatNetworkProbe(value) {
  if (!value) {
    return t('networkNeeded')
  }
  if (value.status === 'error') {
    return value.error
  }
  return `${value.ip || 'IP 未返回'} · ${value.country || '国家未知'} · ASN ${value.asn || '未知'} · ${value.asOrganization || value.organization || '组织未知'}`
}

function formatDnsProbe(value) {
  if (!value) {
    return t('dnsNeeded')
  }
  if (value.status === 'unavailable') {
    return t(value.messageKey || 'dnsUnavailableDetail')
  }
  if (value.status === 'error') {
    return value.error
  }
  return `${value.resolverIp || value.ip || 'resolver IP 未返回'} · ${value.resolverCountry || value.country || '国家未知'} · ASN ${value.asn || '未知'}`
}

function capitalizeStatus(status) {
  return String(status || '').charAt(0).toUpperCase() + String(status || '').slice(1)
}

function renderDiagnosticSummary() {
  const summary = document.getElementById('diagnostic-summary')
  if (!state.diagnostic) {
    summary.textContent = t('diagnosticNotChecked')
    return
  }
  const env = state.diagnostic.env
  const locale = state.diagnostic.locale
  summary.textContent = [
    `${t('diagnosticSummaryBaseUrl')}: ${redactUrl(env.ANTHROPIC_BASE_URL) || localizeFindingText('未设置')}`,
    `${t('diagnosticSummaryProxy')}: ${['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'GRPC_PROXY'].filter((key) => env[key]).join(', ') || localizeFindingText('未设置')}`,
    `${t('diagnosticSummaryLocale')}: ${locale.LANG || localizeFindingText('LANG 未设置')} / ${locale.AppleLocale || localizeFindingText('AppleLocale 未设置')}`,
    `${t('diagnosticSummaryTimezone')}: ${state.diagnostic.timezone || localizeFindingText('未设置')}`
  ].join('；')
}

function renderAll() {
  const results = getModuleResults()
  updateScores(results)
  renderFindings(results)
  renderDiagnosticSummary()
}

async function runLocalProbes() {
  state.browser = readBrowserProbe()
  await readUserAgentHints()
  await runWebRtcProbe()
  renderAll()
}

async function runNetworkEnhancedProbes() {
  state.endpoint = getDefaultEndpoint()
  if (state.endpoint) {
    await runNetworkProbes()
  } else {
    const message = t('defaultProbeNotConfigured')
    state.network = { status: 'error', error: message }
    state.ipv4 = { status: 'error', error: message }
    state.ipv6 = { status: 'error', error: message }
    state.dns = { status: 'unavailable', messageKey: 'dnsUnavailableDetail' }
  }
}

async function runWebProbes() {
  state.browser = readBrowserProbe()
  await Promise.all([
    readUserAgentHints(),
    runWebRtcProbe(),
    runNetworkEnhancedProbes()
  ])
  renderAll()
}

function clearSession() {
  state.browser = null
  state.webrtc = null
  state.network = null
  state.ipv4 = null
  state.ipv6 = null
  state.dns = null
  state.diagnostic = null
  document.getElementById('diagnostic-input').value = ''
  renderAll()
}

async function copyDiagnosticCommand() {
  const command = document.getElementById('diagnostic-command').value
  try {
    await navigator.clipboard.writeText(command)
    document.getElementById('diagnostic-summary').textContent = t('commandCopied')
  } catch (error) {
    const commandInput = document.getElementById('diagnostic-command')
    commandInput.focus()
    commandInput.select()
    document.getElementById('diagnostic-summary').textContent = t('commandCopyFailed')
  }
}

function bindEvents() {
  document.querySelectorAll('.language-button').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.language))
  })
  document.getElementById('run-web-probes').addEventListener('click', () => {
    runWebProbes()
  })
  document.getElementById('clear-session').addEventListener('click', clearSession)
  document.getElementById('copy-diagnostic-command').addEventListener('click', () => {
    copyDiagnosticCommand()
  })
  document.getElementById('parse-diagnostic').addEventListener('click', () => {
    try {
      state.diagnostic = parseDiagnosticInput(document.getElementById('diagnostic-input').value)
      renderAll()
    } catch (error) {
      document.getElementById('diagnostic-summary').textContent = error.message
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  bindEvents()
  translateStaticContent()
  updateNetworkServiceUi()
  renderAll()
})
