package main

import (
	"net"
	"strings"
	"testing"

	"github.com/miekg/dns"
)

// --- Token extraction --------------------------------------------------------

func TestExtractToken(t *testing.T) {
	tests := []struct {
		qname string
		want  string
	}{
		{"abc123.dns-probe.mydaily.info.", "abc123"},
		{"00000000-0000-4000-8000-000000000000.dns-probe.mydaily.info.", "00000000-0000-4000-8000-000000000000"},
		{"dns-probe.mydaily.info.", "dns-probe"},
		{".", ""},
		{"_acme-challenge.dns-probe.mydaily.info.", "_acme-challenge"},
	}
	for _, tt := range tests {
		got := extractToken(tt.qname)
		if got != tt.want {
			t.Errorf("extractToken(%q) = %q, want %q", tt.qname, got, tt.want)
		}
	}
}

// --- UUID validation ---------------------------------------------------------

func TestIsValidUUID(t *testing.T) {
	tests := []struct {
		token string
		valid bool
	}{
		{"00000000-0000-4000-8000-000000000000", true},
		{"00000000-0000-4000-9000-000000000000", true},
		{"12345678-1234-4234-8234-123456789abc", true},
		{"62b1cd8c-972e-4e2b-9e03-ba247a55ead5", true},
		{"FFFFFFFF-FFFF-4FFF-8FFF-FFFFFFFFFFFF", true},
		{"", false},
		{"not-a-uuid", false},
		{"00000000-0000-4000-8000-00000000000", false},  // too short
		{"00000000-0000-4000-8000-0000000000000", false}, // too long
		{"00000000-0000-5000-8000-000000000000", false}, // version 5, not 4
		{"00000000-0000-4000-c000-000000000000", false}, // invalid variant
	}
	for _, tt := range tests {
		got := isValidUUID(tt.token)
		if got != tt.valid {
			t.Errorf("isValidUUID(%q) = %v, want %v", tt.token, got, tt.valid)
		}
	}
}

func TestPostToWorkerReturnsJSONError(t *testing.T) {
	err := handleWorkerResponse(200, strings.NewReader(`{"status":"error","message":"Unknown or expired DNS token."}`))
	if err == nil {
		t.Fatal("expected worker JSON error")
	}
	if !strings.Contains(err.Error(), "Unknown or expired DNS token") {
		t.Fatalf("expected token visibility error, got %v", err)
	}
}

// --- Probe domain matching ---------------------------------------------------

func TestMatchesProbeDomain(t *testing.T) {
	cfg := config{ProbeDomain: "dns-probe.mydaily.info"}
	c := newDNSCollector(cfg, nil)

	tests := []struct {
		qname   string
		matches bool
	}{
		{"abc.dns-probe.mydaily.info.", true},
		{"00000000-0000-4000-8000-000000000000.dns-probe.mydaily.info.", true},
		{"abc.DNS-PROBE.mydaily.info.", true}, // case insensitive
		{"dns-probe.mydaily.info.", false},    // no subdomain token
		{"example.com.", false},
		{"google.com.", false},
		{"sub.example.dns-probe.mydaily.info.", false}, // extra level
		{"dns-probe.mydaily.info.example.com.", false},
	}
	for _, tt := range tests {
		got := c.matchesProbeDomain(tt.qname)
		if got != tt.matches {
			t.Errorf("matchesProbeDomain(%q) = %v, want %v", tt.qname, got, tt.matches)
		}
	}
}

// --- Custom probe domain -----------------------------------------------------

func TestMatchesProbeDomainCustom(t *testing.T) {
	cfg := config{ProbeDomain: "probe.example.com"}
	c := newDNSCollector(cfg, nil)

	if !c.matchesProbeDomain("token123.probe.example.com.") {
		t.Error("should match custom probe domain")
	}
	if c.matchesProbeDomain("token123.other.example.com.") {
		t.Error("should not match non-probe domain")
	}
}

// --- DNS handler: probe query returns A record -------------------------------

// testResponseWriter captures the written DNS message.
type testResponseWriter struct {
	msg  *dns.Msg
	addr net.Addr
}

func (w *testResponseWriter) LocalAddr() net.Addr {
	return &net.UDPAddr{IP: net.ParseIP("127.0.0.1"), Port: 53}
}

func (w *testResponseWriter) RemoteAddr() net.Addr {
	if w.addr != nil {
		return w.addr
	}
	return &net.UDPAddr{IP: net.ParseIP("203.0.113.10"), Port: 12345}
}

func (w *testResponseWriter) WriteMsg(m *dns.Msg) error {
	w.msg = m
	return nil
}

func (w *testResponseWriter) Write(b []byte) (int, error) {
	return len(b), nil
}

func (w *testResponseWriter) Close() error { return nil }

func (w *testResponseWriter) TsigStatus() error { return nil }
func (w *testResponseWriter) TsigTimersOnly(b bool) {}
func (w *testResponseWriter) Hijack() {}

func TestServeDNSProbeQueryValidToken(t *testing.T) {
	cfg := config{
		ProbeDomain:  "dns-probe.mydaily.info",
		ProbeARecord: net.ParseIP("127.0.0.1"),
	}
	c := newDNSCollector(cfg, nil)

	r := new(dns.Msg)
	r.SetQuestion("00000000-0000-4000-8000-000000000000.dns-probe.mydaily.info.", dns.TypeA)

	w := &testResponseWriter{}

	c.ServeDNS(w, r)

	if w.msg == nil {
		t.Fatal("no response written")
	}
	if w.msg.Rcode != dns.RcodeSuccess {
		t.Errorf("expected NOERROR, got rcode=%d", w.msg.Rcode)
	}
	if !w.msg.Authoritative {
		t.Error("expected authoritative flag")
	}
	if len(w.msg.Answer) == 0 {
		t.Fatal("expected at least one answer record")
	}
	a, ok := w.msg.Answer[0].(*dns.A)
	if !ok {
		t.Fatalf("expected A record, got %T", w.msg.Answer[0])
	}
	if !a.A.Equal(net.ParseIP("127.0.0.1")) {
		t.Errorf("expected 127.0.0.1, got %s", a.A.String())
	}
}

func TestServeDNSProbeQueryInvalidToken(t *testing.T) {
	cfg := config{
		ProbeDomain:  "dns-probe.mydaily.info",
		ProbeARecord: net.ParseIP("127.0.0.1"),
	}
	c := newDNSCollector(cfg, nil)

	r := new(dns.Msg)
	r.SetQuestion("not-a-uuid.dns-probe.mydaily.info.", dns.TypeA)

	w := &testResponseWriter{}

	c.ServeDNS(w, r)

	if w.msg == nil {
		t.Fatal("no response written")
	}
	// Should still return NOERROR with A record for invalid token.
	if w.msg.Rcode != dns.RcodeSuccess {
		t.Errorf("expected NOERROR for invalid token, got rcode=%d", w.msg.Rcode)
	}
	if len(w.msg.Answer) == 0 {
		t.Error("expected answer record even for invalid token")
	}
}

// --- DNS handler: non-probe query returns REFUSED ----------------------------

func TestServeDNSNonProbeDomainRefused(t *testing.T) {
	cfg := config{
		ProbeDomain:  "dns-probe.mydaily.info",
		ProbeARecord: net.ParseIP("127.0.0.1"),
	}
	c := newDNSCollector(cfg, nil)

	r := new(dns.Msg)
	r.SetQuestion("example.com.", dns.TypeA)

	w := &testResponseWriter{}

	c.ServeDNS(w, r)

	if w.msg == nil {
		t.Fatal("no response written")
	}
	if w.msg.Rcode != dns.RcodeRefused {
		t.Errorf("expected REFUSED for non-probe domain, got rcode=%d", w.msg.Rcode)
	}
	if len(w.msg.Answer) != 0 {
		t.Error("expected no answer records for non-probe domain")
	}
}

// --- DNS handler: empty question ---------------------------------------------

func TestServeDNSEmptyQuestion(t *testing.T) {
	cfg := config{ProbeDomain: "dns-probe.mydaily.info"}
	c := newDNSCollector(cfg, nil)

	r := new(dns.Msg)
	// No questions set.

	w := &testResponseWriter{}
	c.ServeDNS(w, r)

	if w.msg == nil {
		t.Fatal("no response written")
	}
	if w.msg.Rcode != dns.RcodeRefused {
		t.Errorf("expected REFUSED for empty question, got rcode=%d", w.msg.Rcode)
	}
}

// --- DNS handler: real-world non-probe domains -------------------------------

func TestServeDNSRealWorldNonProbeRefused(t *testing.T) {
	cfg := config{
		ProbeDomain:  "dns-probe.mydaily.info",
		ProbeARecord: net.ParseIP("127.0.0.1"),
	}
	c := newDNSCollector(cfg, nil)

	nonProbeNames := []string{
		"google.com.",
		"www.example.com.",
		"cloudflare.com.",
		"github.com.",
		"anthropic.com.",
	}

	for _, name := range nonProbeNames {
		r := new(dns.Msg)
		r.SetQuestion(name, dns.TypeA)
		w := &testResponseWriter{}
		c.ServeDNS(w, r)

		if w.msg == nil {
			t.Fatalf("no response written for %s", name)
		}
		if w.msg.Rcode != dns.RcodeRefused {
			t.Errorf("expected REFUSED for %s, got rcode=%d", name, w.msg.Rcode)
		}
		if len(w.msg.Answer) != 0 {
			t.Errorf("expected no answer for %s, got %d records", name, len(w.msg.Answer))
		}
	}
}

// --- DNS handler: TXT / AAAA queries on probe domain -------------------------

func TestServeDNSProbeQueryTXT(t *testing.T) {
	cfg := config{
		ProbeDomain:  "dns-probe.mydaily.info",
		ProbeARecord: net.ParseIP("127.0.0.1"),
	}
	c := newDNSCollector(cfg, nil)

	r := new(dns.Msg)
	token := "00000000-0000-4000-8000-000000000000"
	r.SetQuestion(token+".dns-probe.mydaily.info.", dns.TypeTXT)

	w := &testResponseWriter{}
	c.ServeDNS(w, r)

	if w.msg == nil {
		t.Fatal("no response written")
	}
	// Should respond with NOERROR; A record is added regardless of query type.
	if w.msg.Rcode != dns.RcodeSuccess {
		t.Errorf("expected NOERROR for TXT query, got rcode=%d", w.msg.Rcode)
	}
}

// --- Configuration defaults --------------------------------------------------

func TestConfigDefaults(t *testing.T) {
	// Unset relevant env vars for this test.
	for _, key := range []string{
		"DNS_LISTEN_ADDR", "DNS_PROBE_DOMAIN", "WORKER_EVENT_URL",
		"GEOLITE2_COUNTRY_DB", "GEOLITE2_ASN_DB", "HEALTH_ADDR",
	} {
		t.Setenv(key, "")
	}
	// DNS_EVENT_SECRET must not have a default.

	cfg := loadConfig()

	if cfg.DNSListenAddr != ":53" {
		t.Errorf("default DNSListenAddr = %q, want :53", cfg.DNSListenAddr)
	}
	if cfg.ProbeDomain != "dns-probe.mydaily.info" {
		t.Errorf("default ProbeDomain = %q", cfg.ProbeDomain)
	}
	if cfg.WorkerEventURL != "https://ai-check.mydaily.info/v1/probes/dns-event" {
		t.Errorf("default WorkerEventURL = %q", cfg.WorkerEventURL)
	}
	if cfg.EventSecret != "" {
		t.Error("DNS_EVENT_SECRET must not have a hardcoded default")
	}
	if cfg.HealthAddr != "127.0.0.1:8080" {
		t.Errorf("default HealthAddr = %q, want 127.0.0.1:8080", cfg.HealthAddr)
	}
	if !cfg.ProbeARecord.Equal(net.ParseIP("127.0.0.1")) {
		t.Error("default ProbeARecord should be 127.0.0.1")
	}
}

// --- Configuration overrides -------------------------------------------------

func TestConfigOverrides(t *testing.T) {
	t.Setenv("DNS_LISTEN_ADDR", ":1053")
	t.Setenv("DNS_PROBE_DOMAIN", "probe.custom.example")
	t.Setenv("WORKER_EVENT_URL", "https://custom.example/event")
	t.Setenv("GEOLITE2_COUNTRY_DB", "/tmp/Country.mmdb")
	t.Setenv("GEOLITE2_ASN_DB", "/tmp/ASN.mmdb")
	t.Setenv("HEALTH_ADDR", "0.0.0.0:9090")

	cfg := loadConfig()

	if cfg.DNSListenAddr != ":1053" {
		t.Errorf("DNSListenAddr = %q, want :1053", cfg.DNSListenAddr)
	}
	if cfg.ProbeDomain != "probe.custom.example" {
		t.Errorf("ProbeDomain = %q", cfg.ProbeDomain)
	}
	if cfg.WorkerEventURL != "https://custom.example/event" {
		t.Errorf("WorkerEventURL = %q", cfg.WorkerEventURL)
	}
	if cfg.GeoLite2Country != "/tmp/Country.mmdb" {
		t.Errorf("GeoLite2Country = %q", cfg.GeoLite2Country)
	}
	if cfg.GeoLite2ASN != "/tmp/ASN.mmdb" {
		t.Errorf("GeoLite2ASN = %q", cfg.GeoLite2ASN)
	}
	if cfg.HealthAddr != "0.0.0.0:9090" {
		t.Errorf("HealthAddr = %q", cfg.HealthAddr)
	}
}

// --- Environment variable: DNS_EVENT_SECRET no default -----------------------

func TestEventSecretNoDefault(t *testing.T) {
	t.Setenv("DNS_EVENT_SECRET", "")
	cfg := loadConfig()
	if cfg.EventSecret != "" {
		t.Error("DNS_EVENT_SECRET must be empty when not set")
	}

	t.Setenv("DNS_EVENT_SECRET", "test-secret-value")
	cfg = loadConfig()
	if cfg.EventSecret != "test-secret-value" {
		t.Errorf("DNS_EVENT_SECRET should be 'test-secret-value', got %q", cfg.EventSecret)
	}
}

// --- extractIP ---------------------------------------------------------------

func TestExtractIP(t *testing.T) {
	udpAddr := &net.UDPAddr{IP: net.ParseIP("203.0.113.42"), Port: 12345}
	if ip := extractIP(udpAddr); !ip.Equal(net.ParseIP("203.0.113.42")) {
		t.Errorf("extractIP(UDPAddr) = %s, want 203.0.113.42", ip)
	}

	tcpAddr := &net.TCPAddr{IP: net.ParseIP("198.51.100.7"), Port: 54321}
	if ip := extractIP(tcpAddr); !ip.Equal(net.ParseIP("198.51.100.7")) {
		t.Errorf("extractIP(TCPAddr) = %s, want 198.51.100.7", ip)
	}
}

// --- Rate limiter ------------------------------------------------------------

func TestRateLimiterAllow(t *testing.T) {
	rl := newPerIPRateLimiter(3, 60)

	addr := &net.UDPAddr{IP: net.ParseIP("10.0.0.1"), Port: 9999}

	for i := 0; i < 3; i++ {
		if !rl.allow(addr) {
			t.Errorf("request %d should be allowed", i+1)
		}
	}

	if rl.allow(addr) {
		t.Error("request 4 should be denied")
	}
}

func TestRateLimiterSeparateIPs(t *testing.T) {
	rl := newPerIPRateLimiter(1, 60)

	addr1 := &net.UDPAddr{IP: net.ParseIP("10.0.0.1"), Port: 1}
	addr2 := &net.UDPAddr{IP: net.ParseIP("10.0.0.2"), Port: 1}

	if !rl.allow(addr1) {
		t.Error("first IP first request should be allowed")
	}
	if !rl.allow(addr2) {
		t.Error("second IP first request should be allowed")
	}
	if rl.allow(addr1) {
		t.Error("first IP second request should be denied")
	}
}

// --- matchesProbeDomain edge cases -------------------------------------------

func TestMatchesProbeDomainEdgeCases(t *testing.T) {
	cfg := config{ProbeDomain: "dns-probe.mydaily.info."} // trailing dot in config
	c := newDNSCollector(cfg, nil)

	if !c.matchesProbeDomain("abc.dns-probe.mydaily.info.") {
		t.Error("should match with trailing dot in config")
	}
}
