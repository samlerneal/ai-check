// Authoritative-only DNS collector for Claude Code Compliance Check.
// Answers only *.dns-probe.mydaily.info queries; refuses everything else.
// Extracts UUID token from query name, enriches resolver IP with GeoLite2,
// and POSTs the result to the Cloudflare Worker /v1/probes/dns-event.
//
// Dependencies:
//   github.com/miekg/dns        BSD-3-Clause
//   github.com/oschwald/geoip2-golang  ISC
//
// Build: go build -o ai-check-dns-collector .
// Test:  go test ./...

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/netip"
	"os"
	"os/signal"
	"regexp"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/miekg/dns"
	"github.com/oschwald/geoip2-golang/v2"
)

// --- Configuration -----------------------------------------------------------

type config struct {
	DNSListenAddr   string // e.g. ":53" or ":1053"
	ProbeDomain     string // e.g. "dns-probe.mydaily.info"
	WorkerEventURL  string // e.g. "https://ai-check.mydaily.info/v1/probes/dns-event"
	EventSecret     string // Bearer token for Worker
	GeoLite2Country string // path to GeoLite2-Country.mmdb
	GeoLite2ASN     string // path to GeoLite2-ASN.mmdb
	HealthAddr      string // e.g. "127.0.0.1:8080"
	ProbeARecord    net.IP // fixed A record answer for probe queries
}

func loadConfig() config {
	cfg := config{
		DNSListenAddr:   envOrDefault("DNS_LISTEN_ADDR", ":53"),
		ProbeDomain:     envOrDefault("DNS_PROBE_DOMAIN", "dns-probe.mydaily.info"),
		WorkerEventURL:  envOrDefault("WORKER_EVENT_URL", "https://ai-check.mydaily.info/v1/probes/dns-event"),
		EventSecret:     os.Getenv("DNS_EVENT_SECRET"),
		GeoLite2Country: os.Getenv("GEOLITE2_COUNTRY_DB"),
		GeoLite2ASN:     os.Getenv("GEOLITE2_ASN_DB"),
		HealthAddr:      envOrDefault("HEALTH_ADDR", "127.0.0.1:8080"),
		ProbeARecord:    net.ParseIP("127.0.0.1"),
	}
	return cfg
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// --- GeoIP enricher ----------------------------------------------------------

type geoEnricher struct {
	countryDB *geoip2.Reader
	asnDB     *geoip2.Reader
}

func newGeoEnricher(countryPath, asnPath string) (*geoEnricher, error) {
	var countryDB, asnDB *geoip2.Reader
	var err error

	if countryPath != "" {
		countryDB, err = geoip2.Open(countryPath)
		if err != nil {
			slog.Warn("failed to open GeoLite2 Country database, continuing without country enrichment", "path", countryPath, "error", err)
		}
	}
	if asnPath != "" {
		asnDB, err = geoip2.Open(asnPath)
		if err != nil {
			slog.Warn("failed to open GeoLite2 ASN database, continuing without ASN enrichment", "path", asnPath, "error", err)
		}
	}

	return &geoEnricher{countryDB: countryDB, asnDB: asnDB}, nil
}

type geoResult struct {
	Country       string
	ASN           uint
	ASOrganization string
}

func (g *geoEnricher) enrich(ip net.IP) geoResult {
	if g == nil {
		return geoResult{}
	}

	var result geoResult

	addr, ok := netip.AddrFromSlice(ip)
	if !ok {
		return result
	}
	addr = addr.Unmap()

	if g.countryDB != nil {
		record, err := g.countryDB.Country(addr)
		if err == nil {
			result.Country = record.Country.ISOCode
		}
	}

	if g.asnDB != nil {
		record, err := g.asnDB.ASN(addr)
		if err == nil {
			result.ASN = record.AutonomousSystemNumber
			result.ASOrganization = record.AutonomousSystemOrganization
		}
	}

	return result
}

func (g *geoEnricher) close() {
	if g == nil {
		return
	}
	if g.countryDB != nil {
		g.countryDB.Close()
	}
	if g.asnDB != nil {
		g.asnDB.Close()
	}
}

// --- Worker event POST -------------------------------------------------------

type dnsEvent struct {
	Token          string `json:"token"`
	ResolverIP     string `json:"resolverIp"`
	ResolverCountry string `json:"resolverCountry,omitempty"`
	ASN            uint   `json:"asn,omitempty"`
	ASOrganization  string `json:"asOrganization,omitempty"`
}

func postToWorker(ctx context.Context, eventURL, secret string, event dnsEvent) error {
	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, eventURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json; charset=utf-8")
	if secret != "" {
		req.Header.Set("Authorization", "Bearer "+secret)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("post to worker: %w", err)
	}
	defer resp.Body.Close()

	return handleWorkerResponse(resp.StatusCode, resp.Body)
}

func handleWorkerResponse(statusCode int, body io.Reader) error {
	if statusCode < 200 || statusCode >= 300 {
		return fmt.Errorf("worker returned HTTP %d", statusCode)
	}

	var result struct {
		Status  string `json:"status"`
		Message string `json:"message"`
	}
	if err := json.NewDecoder(body).Decode(&result); err != nil {
		return fmt.Errorf("decode worker response: %w", err)
	}
	if result.Status != "" && result.Status != "ok" {
		if result.Message != "" {
			return fmt.Errorf("worker returned status %s: %s", result.Status, result.Message)
		}
		return fmt.Errorf("worker returned status %s", result.Status)
	}

	return nil
}

// --- DNS handler -------------------------------------------------------------

var uuidPattern = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

type dnsCollector struct {
	cfg      config
	geo      *geoEnricher
	rateLimit *perIPRateLimiter
}

func newDNSCollector(cfg config, geo *geoEnricher) *dnsCollector {
	return &dnsCollector{
		cfg:       cfg,
		geo:       geo,
		rateLimit: newPerIPRateLimiter(10, 60), // 10 queries per 60 seconds per IP
	}
}

// ServeDNS implements dns.Handler.
func (c *dnsCollector) ServeDNS(w dns.ResponseWriter, r *dns.Msg) {
	m := new(dns.Msg)
	m.SetReply(r)
	m.Authoritative = true

	// Get remote address early for logging and GeoIP.
	remoteAddr := w.RemoteAddr()

	// Check rate limit.
	if !c.rateLimit.allow(remoteAddr) {
		m.SetRcode(r, dns.RcodeRefused)
		w.WriteMsg(m)
		return
	}

	// If no questions, refuse.
	if len(r.Question) == 0 {
		m.SetRcode(r, dns.RcodeRefused)
		w.WriteMsg(m)
		return
	}

	qname := r.Question[0].Name

	// Non-probe domains → REFUSED.
	if !c.matchesProbeDomain(qname) {
		m.SetRcode(r, dns.RcodeRefused)
		w.WriteMsg(m)
		return
	}

	// Extract token from the first label.
	token := extractToken(qname)

	// Check UUID validity.
	if !isValidUUID(token) {
		// Return fixed A record but do NOT POST to Worker.
		c.addProbeARecord(m, qname)
		w.WriteMsg(m)
		return
	}

	// Valid token: resolve the client IP and enrich.
	clientIP := extractIP(remoteAddr)

	// Enrich asynchronously — DNS response must be fast.
	go c.handleProbeQuery(token, clientIP)

	// Return fixed A record.
	c.addProbeARecord(m, qname)
	w.WriteMsg(m)
}

func (c *dnsCollector) addProbeARecord(m *dns.Msg, qname string) {
	rr := &dns.A{
		Hdr: dns.RR_Header{
			Name:   qname,
			Rrtype: dns.TypeA,
			Class:  dns.ClassINET,
			Ttl:    60,
		},
		A: c.cfg.ProbeARecord,
	}
	m.Answer = append(m.Answer, rr)
}

func (c *dnsCollector) handleProbeQuery(token string, clientIP net.IP) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// GeoIP enrichment.
	geoResult := geoResult{}
	if c.geo != nil {
		geoResult = c.geo.enrich(clientIP)
	}

	// Build and POST the event.
	event := dnsEvent{
		Token:           token,
		ResolverIP:      clientIP.String(),
		ResolverCountry: geoResult.Country,
		ASN:             geoResult.ASN,
		ASOrganization:  geoResult.ASOrganization,
	}

	var err error
	for attempt := 0; attempt < 4; attempt += 1 {
		err = postToWorker(ctx, c.cfg.WorkerEventURL, c.cfg.EventSecret, event)
		if err == nil {
			break
		}
		if !strings.Contains(err.Error(), "Unknown or expired DNS token") {
			break
		}
		time.Sleep(time.Duration(attempt+1) * time.Second)
	}
	if err != nil {
		slog.Error("failed to post DNS event to worker",
			"token_prefix", token[:8],
			"error_type", fmt.Sprintf("%T", err),
			"error", err,
		)
		return
	}

	slog.Info("DNS event posted",
		"token_prefix", token[:8],
		"country", geoResult.Country,
		"asn", geoResult.ASN,
	)
}

// matchesProbeDomain checks whether qname has exactly one label before the probe domain.
func (c *dnsCollector) matchesProbeDomain(qname string) bool {
	base := strings.TrimSuffix(c.cfg.ProbeDomain, ".") + "."
	lower := strings.ToLower(qname)
	if !strings.HasSuffix(lower, strings.ToLower("."+base)) {
		return false
	}
	// Count labels before the probe domain — exactly 1 expected (the token).
	before := strings.TrimSuffix(lower, strings.ToLower("."+base))
	labels := dns.SplitDomainName(before + ".")
	return len(labels) == 1
}

// extractToken returns the first label of a DNS name as the candidate token.
func extractToken(qname string) string {
	labels := dns.SplitDomainName(qname)
	if len(labels) == 0 {
		return ""
	}
	return labels[0]
}

// isValidUUID checks the canonical UUID v4 format on a lowercase string.
func isValidUUID(token string) bool {
	return uuidPattern.MatchString(strings.ToLower(token))
}

// extractIP returns the IP from a net.Addr, stripping the port.
func extractIP(addr net.Addr) net.IP {
	switch a := addr.(type) {
	case *net.UDPAddr:
		return a.IP
	case *net.TCPAddr:
		return a.IP
	default:
		host, _, err := net.SplitHostPort(addr.String())
		if err != nil {
			return net.ParseIP(addr.String())
		}
		return net.ParseIP(host)
	}
}

// --- Rate limiter (per-IP sliding window) ------------------------------------

type perIPRateLimiter struct {
	mu       sync.Mutex
	windows  map[string]*rateWindow
	maxReqs  int
	interval time.Duration
}

type rateWindow struct {
	count    int
	resetAt  time.Time
}

func newPerIPRateLimiter(maxReqs int, intervalSeconds int) *perIPRateLimiter {
	return &perIPRateLimiter{
		windows:  make(map[string]*rateWindow),
		maxReqs:  maxReqs,
		interval: time.Duration(intervalSeconds) * time.Second,
	}
}

func (r *perIPRateLimiter) allow(addr net.Addr) bool {
	ip := extractIP(addr).String()
	if ip == "" {
		return true // don't block unresolvable addresses
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	w, ok := r.windows[ip]
	if !ok || now.After(w.resetAt) {
		r.windows[ip] = &rateWindow{count: 1, resetAt: now.Add(r.interval)}
		return true
	}

	if w.count >= r.maxReqs {
		return false
	}

	w.count++
	return true
}

// --- Health check ------------------------------------------------------------

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func startHealthServer(addr string) *http.Server {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)

	srv := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
	}

	go func() {
		slog.Info("health check server starting", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("health check server error", "error", err)
		}
	}()

	return srv
}

// --- Main --------------------------------------------------------------------

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	cfg := loadConfig()

	if cfg.WorkerEventURL == "" {
		slog.Warn("WORKER_EVENT_URL is empty; DNS events will not be delivered")
	}
	if cfg.EventSecret == "" {
		slog.Warn("DNS_EVENT_SECRET is not set; worker will reject unauthenticated events")
	}

	// Open GeoIP databases.
	geo, err := newGeoEnricher(cfg.GeoLite2Country, cfg.GeoLite2ASN)
	if err != nil {
		slog.Error("failed to initialize GeoIP enricher", "error", err)
		os.Exit(1)
	}
	defer geo.close()

	// Create DNS collector.
	collector := newDNSCollector(cfg, geo)

	// Start DNS servers (UDP + TCP).
	dnsHandler := dns.HandlerFunc(collector.ServeDNS)

	udpServer := &dns.Server{
		Addr:    cfg.DNSListenAddr,
		Net:     "udp",
		Handler: dnsHandler,
	}

	tcpServer := &dns.Server{
		Addr:    cfg.DNSListenAddr,
		Net:     "tcp",
		Handler: dnsHandler,
	}

	errCh := make(chan error, 2)

	go func() {
		slog.Info("DNS server starting (UDP)", "addr", cfg.DNSListenAddr)
		if err := udpServer.ListenAndServe(); err != nil {
			errCh <- fmt.Errorf("UDP DNS server: %w", err)
		}
	}()

	go func() {
		slog.Info("DNS server starting (TCP)", "addr", cfg.DNSListenAddr)
		if err := tcpServer.ListenAndServe(); err != nil {
			errCh <- fmt.Errorf("TCP DNS server: %w", err)
		}
	}()

	// Start health check server.
	healthSrv := startHealthServer(cfg.HealthAddr)

	// Wait for shutdown signal.
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-sigCh:
		slog.Info("received signal, shutting down", "signal", sig.String())
	case err := <-errCh:
		slog.Error("server error, shutting down", "error", err)
	}

	// Graceful shutdown.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	udpServer.Shutdown()
	tcpServer.Shutdown()
	healthSrv.Shutdown(shutdownCtx)

	slog.Info("shutdown complete")
}
