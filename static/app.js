/* ── STATE ──────────────────────────────────────────────────── */
let state = {
  sessionId: null,
  tickers: [],
  domains: [],
  metrics: [],
  selectedTicker: null,
  selectedDomain: null,
  summaryCache: {}
};

/* ── DOM HELPERS ────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ── FORMATTERS ─────────────────────────────────────────────── */
function formatDollar(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return n;
  if (num >= 1_000_000) return '$' + (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000)     return '$' + (num / 1_000).toFixed(1) + 'K';
  return '$' + num.toFixed(2);
}

function formatInt(n) {
  const num = parseInt(n);
  return isNaN(num) ? n : num.toLocaleString();
}

/* ── MARKDOWN PARSER ────────────────────────────────────────── */
function parseMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code>$1</code>')
    .replace(/^> (.+)$/gm,     '<blockquote>$1</blockquote>')
    .replace(/^---$/gm,        '<hr/>')
    .replace(/^- (.+)$/gm,     '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs,'<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hbuolp])(.+)$/gm, (m, p) => p.trim() ? `<p>${p}</p>` : '');
}

/* ── SKELETON HTML ──────────────────────────────────────────── */
function skeletonHTML() {
  return `
    <div style="padding:1.5rem 0">
      <div class="skeleton skeleton-line long"></div>
      <div class="skeleton skeleton-line medium"></div>
      <div class="skeleton skeleton-line long"></div>
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton skeleton-line medium"></div>
      <div class="skeleton skeleton-line long"></div>
    </div>`;
}

/* ── TOAST ──────────────────────────────────────────────────── */
function showToast(msg, type = 'info') {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'error' ? '✕' : type === 'success' ? '✓' : '●';
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ── STATUS DOT ─────────────────────────────────────────────── */
function setStatus(live, text) {
  $('status-dot').className = 'status-dot' + (live ? ' live' : '');
  $('status-text').textContent = text;
}

/* ── UPLOAD HANDLING ────────────────────────────────────────── */
const dropZone  = $('drop-zone');
const fileInput = $('file-input');

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', e => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

document.querySelector('.btn-upload').addEventListener('click', () => fileInput.click());

async function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['csv', 'json'].includes(ext)) {
    showToast('Only CSV and JSON files are supported', 'error');
    return;
  }

  const progress = $('upload-progress');
  const fill     = $('progress-fill');
  const label    = $('progress-label');

  progress.classList.add('visible');
  fill.style.width = '0%';
  await new Promise(r => setTimeout(r, 50));
  fill.style.transition = 'width 0.6s ease';
  fill.style.width = '60%';
  label.textContent = 'UPLOADING...';
  setStatus(true, 'UPLOADING');

  try {
    const formData = new FormData();
    formData.append('file', file);

    const resp = await fetch('/api/upload', { method: 'POST', body: formData });
    fill.style.width = '85%';

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.detail || 'Upload failed');
    }

    const data = await resp.json();
    fill.style.width = '100%';
    label.textContent = 'PROCESSING...';
    await new Promise(r => setTimeout(r, 400));

    state.sessionId = data.session_id;
    state.tickers   = data.tickers  || [];
    state.domains   = data.domains  || [];

    showToast(`${data.trade_count} trades loaded successfully`, 'success');
    progress.classList.remove('visible');
    initDashboard();

  } catch (err) {
    fill.style.width = '100%';
    fill.style.background = '#ff5a6e';
    label.textContent = 'ERROR';
    showToast(err.message, 'error');
    setStatus(false, 'ERROR');
    setTimeout(() => {
      progress.classList.remove('visible');
      fill.style.background = '';
      fill.style.width = '0%';
    }, 2000);
  }
}

/* ── DASHBOARD INIT ─────────────────────────────────────────── */
function initDashboard() {
  $('upload-section').style.display = 'none';
  $('dashboard-section').style.display = 'block';
  $('session-id-display').textContent = `SESSION: ${state.sessionId}`;
  setStatus(true, 'LIVE');

  loadMetrics();
  loadOverallSummary();
  populateTickerList();
  populateDomainList();
}

/* ── METRICS ────────────────────────────────────────────────── */
async function loadMetrics() {
  try {
    const resp = await fetch(`/api/metrics/${state.sessionId}`);
    if (!resp.ok) throw new Error('Failed to load metrics');
    const data = await resp.json();
    state.metrics = data.metrics;
    renderMetrics(data.metrics);
  } catch (err) {
    showToast('Failed to load metrics', 'error');
  }
}

function renderMetrics(metrics) {
  const overall = metrics.filter(m => m.category === 'overall');
  const grid = $('metrics-grid');

  const metricDefs = [
    { key: 'total_trades',      label: 'Total Trades',   fmt: formatInt,   color: 'amber' },
    { key: 'total_volume',      label: 'Total Volume',   fmt: formatDollar, color: '' },
    { key: 'buy_volume',        label: 'Buy Volume',     fmt: formatDollar, color: 'green' },
    { key: 'sell_volume',       label: 'Sell Volume',    fmt: formatDollar, color: 'red' },
    { key: 'buy_count',         label: 'Buy Orders',     fmt: formatInt,   color: 'green' },
    { key: 'sell_count',        label: 'Sell Orders',    fmt: formatInt,   color: 'red' },
    { key: 'unique_tickers',    label: 'Unique Tickers', fmt: formatInt,   color: 'cyan' },
    { key: 'unique_domains',    label: 'Unique Domains', fmt: formatInt,   color: 'cyan' },
    { key: 'avg_trade_size',    label: 'Avg Trade Size', fmt: formatDollar, color: '' },
    { key: 'top_traded_ticker', label: 'Top Ticker',     fmt: v => v,      color: 'amber' },
    { key: 'top_traded_domain', label: 'Top Domain',     fmt: v => v,      color: 'amber' },
  ];

  grid.innerHTML = '';
  metricDefs.forEach(def => {
    const m = overall.find(o => o.metric_name === def.key);
    if (!m) return;
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.innerHTML = `
      <div class="metric-label">${def.label}</div>
      <div class="metric-value ${def.color}">${def.fmt(m.metric_value)}</div>
    `;
    grid.appendChild(card);
  });

  // Buy/Sell volume bar
  const buyVol  = parseFloat(overall.find(m => m.metric_name === 'buy_volume')?.metric_value  || 0);
  const sellVol = parseFloat(overall.find(m => m.metric_name === 'sell_volume')?.metric_value || 0);
  const total   = buyVol + sellVol;

  if (total > 0) {
    const buyPct  = (buyVol  / total) * 100;
    const sellPct = (sellVol / total) * 100;
    $('vol-bar-wrap').style.display = 'block';
    $('buy-label').textContent  = `BUY ${buyPct.toFixed(1)}%`;
    $('sell-label').textContent = `SELL ${sellPct.toFixed(1)}%`;
    setTimeout(() => {
      $('vol-bar-buy').style.width  = buyPct  + '%';
      $('vol-bar-sell').style.width = sellPct + '%';
    }, 200);
  }
}

/* ── OVERALL SUMMARY ────────────────────────────────────────── */
async function loadOverallSummary() {
  const spinner = $('overall-spinner');
  const body    = $('overall-summary-body');
  spinner.style.display = 'inline-block';
  body.innerHTML = skeletonHTML();

  try {
    const resp = await fetch(`/api/summary/overall/${state.sessionId}`);
    if (!resp.ok) throw new Error('Summary not found');
    const data = await resp.json();
    spinner.style.display = 'none';
    body.innerHTML = parseMarkdown(data.summary) || '<p>No summary available.</p>';
    state.summaryCache['overall'] = data.summary;
  } catch (err) {
    spinner.style.display = 'none';
    body.innerHTML = `<div class="empty-state"><p style="color:var(--red)">${err.message}</p></div>`;
  }
}

/* ── TICKERS ────────────────────────────────────────────────── */
function populateTickerList() {
  const list = $('ticker-list');
  list.innerHTML = '';

  if (!state.tickers.length) {
    list.innerHTML = '<div class="empty-state" style="padding:2rem"><p>No tickers found</p></div>';
    return;
  }

  state.tickers.forEach(ticker => {
    const btn = document.createElement('button');
    btn.className = 'item-btn';
    btn.innerHTML = `<span>${ticker}</span><span class="arrow">›</span>`;
    btn.addEventListener('click', () => selectTicker(ticker, btn));
    list.appendChild(btn);
  });
}

async function selectTicker(ticker, btn) {
  $$('#ticker-list .item-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedTicker = ticker;

  $('ticker-summary-title').textContent = ticker;

  const spinner    = $('ticker-spinner');
  const body       = $('ticker-summary-body');
  const miniMetrics = $('ticker-mini-metrics');

  spinner.style.display = 'inline-block';
  miniMetrics.style.display = 'none';
  body.innerHTML = skeletonHTML();

  try {
    const [summResp] = await Promise.all([
      fetch(`/api/summary/ticker/${state.sessionId}/${encodeURIComponent(ticker)}`),
      renderSubMetrics(ticker, 'ticker', miniMetrics)
    ]);

    if (!summResp.ok) throw new Error('Summary not found');
    const data = await summResp.json();
    spinner.style.display = 'none';
    body.innerHTML = parseMarkdown(data.summary) || '<p>No summary available.</p>';
  } catch (err) {
    spinner.style.display = 'none';
    body.innerHTML = `<div class="empty-state"><p style="color:var(--red)">${err.message}</p></div>`;
  }
}

/* ── DOMAINS ────────────────────────────────────────────────── */
function populateDomainList() {
  const list = $('domain-list');
  list.innerHTML = '';

  if (!state.domains.length) {
    list.innerHTML = '<div class="empty-state" style="padding:2rem"><p>No domains found</p></div>';
    return;
  }

  state.domains.forEach(domain => {
    const btn = document.createElement('button');
    btn.className = 'item-btn';
    btn.innerHTML = `<span>${domain}</span><span class="arrow">›</span>`;
    btn.addEventListener('click', () => selectDomain(domain, btn));
    list.appendChild(btn);
  });
}

async function selectDomain(domain, btn) {
  $$('#domain-list .item-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedDomain = domain;

  $('domain-summary-title').textContent = domain;

  const spinner    = $('domain-spinner');
  const body       = $('domain-summary-body');
  const miniMetrics = $('domain-mini-metrics');

  spinner.style.display = 'inline-block';
  miniMetrics.style.display = 'none';
  body.innerHTML = skeletonHTML();

  try {
    const [summResp] = await Promise.all([
      fetch(`/api/summary/domain/${state.sessionId}/${encodeURIComponent(domain)}`),
      renderSubMetrics(domain, 'domain', miniMetrics)
    ]);

    if (!summResp.ok) throw new Error('Summary not found');
    const data = await summResp.json();
    spinner.style.display = 'none';
    body.innerHTML = parseMarkdown(data.summary) || '<p>No summary available.</p>';
  } catch (err) {
    spinner.style.display = 'none';
    body.innerHTML = `<div class="empty-state"><p style="color:var(--red)">${err.message}</p></div>`;
  }
}

/* ── SUB-METRICS (ticker / domain) ──────────────────────────── */
async function renderSubMetrics(refId, category, container) {
  if (!state.metrics.length) return;

  const metricName = category === 'ticker' ? 'ticker_metrics' : 'domain_metrics';
  const entry = state.metrics.find(m => m.metric_name === metricName && m.reference_id === refId);
  if (!entry) return;

  try {
    const raw = typeof entry.metric_value === 'string'
      ? JSON.parse(entry.metric_value)
      : entry.metric_value;

    const tickerFields = [
      { key: 'total_volume', label: 'Volume',    fmt: formatDollar },
      { key: 'trade_count',  label: 'Trades',    fmt: formatInt },
      { key: 'buy_count',    label: 'Buys',      fmt: formatInt },
      { key: 'sell_count',   label: 'Sells',     fmt: formatInt },
      { key: 'avg_price',    label: 'Avg Price', fmt: formatDollar },
      { key: 'buy_volume',   label: 'Buy Vol',   fmt: formatDollar },
    ];

    const domainFields = [
      { key: 'total_volume',    label: 'Volume',    fmt: formatDollar },
      { key: 'trade_count',     label: 'Trades',    fmt: formatInt },
      { key: 'buy_count',       label: 'Buys',      fmt: formatInt },
      { key: 'sell_count',      label: 'Sells',     fmt: formatInt },
      { key: 'avg_trade_size',  label: 'Avg Size',  fmt: formatDollar },
      { key: 'ticker_count',    label: 'Tickers',   fmt: formatInt },
    ];

    const fields = category === 'ticker' ? tickerFields : domainFields;
    const available = fields.filter(f => raw[f.key] !== undefined);
    if (!available.length) return;

    container.innerHTML = `
      <div class="mini-metrics">
        ${available.slice(0, 6).map(f =>
          `<div class="mini-metric">
            <div class="label">${f.label}</div>
            <div class="val">${f.fmt(raw[f.key])}</div>
          </div>`
        ).join('')}
      </div>`;
    container.style.display = 'block';
  } catch {
    // silent fail — metrics are enhancement only
  }
}

/* ── TABS ────────────────────────────────────────────────────── */
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    $$('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    $(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

/* ── RESET ───────────────────────────────────────────────────── */
$('btn-reset').addEventListener('click', () => {
  state = {
    sessionId: null, tickers: [], domains: [], metrics: [],
    selectedTicker: null, selectedDomain: null, summaryCache: {}
  };

  $('dashboard-section').style.display = 'none';
  $('upload-section').style.display = 'flex';
  $('file-input').value = '';
  $('vol-bar-wrap').style.display = 'none';
  setStatus(false, 'READY');

  // Reset tab state
  $$('.tab-btn').forEach((b, i)    => b.classList.toggle('active', i === 0));
  $$('.tab-content').forEach((c, i) => c.classList.toggle('active', i === 0));
});

/* ── UTC CLOCK ───────────────────────────────────────────────── */
function updateClock() {
  $('footer-time').textContent = new Date().toUTCString().replace('GMT', 'UTC');
}
updateClock();
setInterval(updateClock, 1000);