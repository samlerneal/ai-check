const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type, authorization'
}

const DNS_TOKEN_TTL_SECONDS = 300

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: JSON_HEADERS })
    }

    const url = new URL(request.url)
    if (url.pathname === '/v1/probes/network') {
      return jsonResponse({
        ...buildNetworkProbe(request),
        ipv4ProbeUrl: env.IPV4_PROBE_ORIGIN ? `${env.IPV4_PROBE_ORIGIN.replace(/\/+$/, '')}/v1/probes/ipv4` : '',
        ipv6ProbeUrl: env.IPV6_PROBE_ORIGIN ? `${env.IPV6_PROBE_ORIGIN.replace(/\/+$/, '')}/v1/probes/ipv6` : ''
      })
    }
    if (url.pathname === '/v1/probes/ipv4' || url.pathname === '/v1/probes/ipv6') {
      return jsonResponse(buildNetworkProbe(request))
    }
    if (url.pathname === '/v1/probes/dns-token' && request.method === 'POST') {
      return jsonResponse(await buildDnsToken(request, env))
    }
    if (url.pathname === '/v1/probes/dns-event' && request.method === 'POST') {
      return jsonResponse(await recordDnsEvent(request, env))
    }
    if (url.pathname.startsWith('/v1/probes/dns-result/')) {
      return jsonResponse(await getDnsResult(url, env))
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Probe endpoint not found' } }, 404)
  }
}

function buildNetworkProbe(request) {
  const cf = request.cf || {}
  return {
    ip: request.headers.get('cf-connecting-ip') || '',
    country: cf.country || '',
    asn: cf.asn || '',
    asOrganization: cf.asOrganization || '',
    city: cf.city || '',
    region: cf.region || '',
    timezone: cf.timezone || '',
    colo: cf.colo || '',
    httpProtocol: request.cf?.httpProtocol || '',
    tlsVersion: request.cf?.tlsVersion || ''
  }
}

async function buildDnsToken(request, env) {
  const token = crypto.randomUUID()
  const baseDomain = env.DNS_PROBE_DOMAIN || ''
  const hasEventStore = Boolean(env.DNS_EVENTS)
  const lookupUrl = baseDomain && hasEventStore
    ? `https://${token}.${baseDomain}/pixel.gif`
    : ''

  if (hasEventStore) {
    await env.DNS_EVENTS.put(`dns:${token}`, JSON.stringify({
      status: 'pending',
      token,
      createdAt: new Date().toISOString()
    }), { expirationTtl: DNS_TOKEN_TTL_SECONDS })
  }

  return {
    status: lookupUrl ? 'pending' : 'unavailable',
    token,
    lookupUrl,
    expiresInSeconds: DNS_TOKEN_TTL_SECONDS,
    note: lookupUrl
      ? 'Trigger the lookup URL and poll dns-result for the authoritative DNS event.'
      : 'DNS resolver detection requires DNS_PROBE_DOMAIN and a DNS_EVENTS KV binding, plus an authoritative DNS event sink that POSTs to /v1/probes/dns-event.'
  }
}

async function recordDnsEvent(request, env) {
  if (!env.DNS_EVENTS) {
    return { status: 'unavailable', message: 'DNS_EVENTS KV binding is not configured.' }
  }

  if (env.DNS_COLLECTOR_IP) {
    const collectorIps = String(env.DNS_COLLECTOR_IP)
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean)
    const clientIp = String(request.headers.get('cf-connecting-ip') || '')
    if (!collectorIps.includes(clientIp)) {
      return { status: 'error', message: 'Unauthorized source IP for DNS event.' }
    }
  }

  if (!env.DNS_EVENT_SECRET) {
    return { status: 'error', message: 'DNS_EVENT_SECRET is not configured.' }
  }

  const expected = `Bearer ${env.DNS_EVENT_SECRET}`
  if (!constantTimeEquals(request.headers.get('authorization') || '', expected)) {
    return { status: 'error', message: 'Unauthorized DNS event.' }
  }

  let body
  try {
    body = await request.json()
  } catch (error) {
    return { status: 'error', message: 'Invalid JSON body.' }
  }

  const token = String(body.token || '').trim()
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return { status: 'error', message: 'Invalid DNS token.' }
  }

  const stored = await env.DNS_EVENTS.get(`dns:${token}`)
  if (!stored) {
    return { status: 'error', message: 'Unknown or expired DNS token.' }
  }

  const existing = JSON.parse(stored)
  if (existing.status === 'ok') {
    return { status: 'error', message: 'DNS event already recorded for this token.' }
  }

  const event = {
    status: 'ok',
    token,
    resolverIp: String(body.resolverIp || body.ip || ''),
    resolverCountry: String(body.resolverCountry || body.country || ''),
    resolverRegion: String(body.resolverRegion || body.region || ''),
    asn: body.asn || '',
    asOrganization: String(body.asOrganization || body.organization || ''),
    observedAt: new Date().toISOString()
  }

  await env.DNS_EVENTS.put(`dns:${token}`, JSON.stringify(event), { expirationTtl: DNS_TOKEN_TTL_SECONDS })
  return { status: 'ok' }
}

function constantTimeEquals(left, right) {
  const leftText = String(left)
  const rightText = String(right)
  let mismatch = leftText.length === rightText.length ? 0 : 1
  const length = Math.max(leftText.length, rightText.length)
  for (let index = 0; index < length; index += 1) {
    mismatch |= (leftText.charCodeAt(index) || 0) ^ (rightText.charCodeAt(index) || 0)
  }
  return mismatch === 0
}

async function getDnsResult(url, env) {
  if (!env.DNS_EVENTS) {
    return {
      status: 'unavailable',
      message: 'DNS resolver detection requires DNS_EVENTS KV and an authoritative DNS event sink.'
    }
  }

  const token = decodeURIComponent(url.pathname.split('/').pop() || '')
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return { status: 'error', message: 'Invalid DNS token.' }
  }

  const stored = await env.DNS_EVENTS.get(`dns:${token}`)
  if (!stored) {
    return { status: 'pending', message: 'DNS event has not arrived yet.' }
  }

  const result = JSON.parse(stored)
  if (result.status === 'ok') {
    await env.DNS_EVENTS.delete(`dns:${token}`)
  }
  return result
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: JSON_HEADERS
  })
}
