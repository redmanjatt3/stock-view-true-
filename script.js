// Yahoo-based static stock viewer (no API key).
const chartCtx = document.getElementById('chart').getContext('2d');
let chart = null;
let currentSymbol = '';
let autoRefresh = true;
let refreshTimer = null;

// simple color generator for overlays
function colorFor(i){ const palette = ['#3b82f6','#10b981','#f97316','#ef4444','#8b5cf6','#0ea5a4']; return palette[i % palette.length]; }

function timestampToDate(ts){ const d = new Date(ts*1000); return d.toISOString().slice(0,10); }

async function fetchYahoo(symbol, range='3mo', interval='1d'){
  // attempt to use Yahoo Finance chart endpoint
  const safe = encodeURIComponent(symbol.replace('.','%2E'));
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${safe}?range=${range}&interval=${interval}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Network response not ok');
  const j = await res.json();
  if(j.chart.error) throw new Error(j.chart.error.description || 'Yahoo API error');
  const result = j.chart.result[0];
  const ts = result.timestamp;
  const closes = result.indicators.quote[0].close;
  const labels = ts.map(t => timestampToDate(t));
  return { labels, closes, meta: result.meta };
}

function formatPrice(p){ if(p==null) return '—'; return p.toFixed(2); }

async function drawMain(symbol){
  setStatus(`Loading ${symbol}...`);
  try{
    const d = await fetchYahoo(symbol);
    currentSymbol = symbol;
    document.getElementById('symbolLabel').innerText = symbol;
    const latest = d.closes[d.closes.length-1];
    document.getElementById('latestPrice').innerText = formatPrice(latest);
    setStatus(`Loaded ${d.labels.length} data points. Exchange: ${d.meta.exchangeName || '—'}`);
    renderChart(d.labels, [{label: symbol, data: d.closes, borderColor: colorFor(0)}]);
  }catch(e){
    console.error(e);
    setStatus('Error: ' + (e.message || e));
  }
}

function renderChart(labels, datasets){
  const data = { labels, datasets: datasets.map((ds, idx) => ({
    label: ds.label,
    data: ds.data,
    borderColor: ds.borderColor || colorFor(idx+1),
    tension: 0.15,
    pointRadius: 0
  }))};
  const cfg = { type: 'line', data, options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true}}, scales:{x:{display:true}, y:{display:true}} } };
  if(chart) chart.destroy();
  chart = new Chart(chartCtx, cfg);
}

// overlays: fetch additional symbols and add as normalized series (so different price ranges can be compared)
// normalization: divide by first value to get relative change
async function addOverlay(symbol){
  try{
    const d = await fetchYahoo(symbol);
    // normalize to 100 at start
    const base = d.closes[0] || 1;
    const normalized = d.closes.map(v => (v / base) * 100);
    // align labels: if different length, keep the shorter
    const mainLabels = chart.data.labels;
    let labels = d.labels;
    let dsData = normalized;
    // if labels differ, try to align by taking last N points
    if(labels.length !== mainLabels.length){
      const minLen = Math.min(labels.length, mainLabels.length);
      labels = labels.slice(-minLen);
      dsData = normalized.slice(-minLen);
      // also trim chart labels and datasets
      chart.data.labels = mainLabels.slice(-minLen);
      chart.data.datasets.forEach(ds => ds.data = ds.data.slice(-minLen));
    }
    // add new dataset
    chart.data.datasets.push({ label: symbol + ' (norm)', data: dsData, borderColor: colorFor(chart.data.datasets.length), tension:0.15, pointRadius:0 });
    chart.update();
    // add to UI overlays list
    const chip = document.createElement('div'); chip.className='overlay-chip'; chip.innerText = symbol; chip.onclick = () => { removeOverlay(symbol); chip.remove(); };
    document.getElementById('overlays').appendChild(chip);
  }catch(e){
    console.error(e);
    setStatus('Overlay error: '+ (e.message || e));
  }
}
function removeOverlay(sym){
  const idx = chart.data.datasets.findIndex(ds => ds.label && ds.label.startsWith(sym));
  if(idx>=0){ chart.data.datasets.splice(idx,1); chart.update(); }
}

// UI helpers
function setStatus(msg){ document.getElementById('status').innerText = msg; }

function loadWatchlist(){
  try{
    const arr = JSON.parse(localStorage.getItem('watchlist')||'[]');
    return arr;
  }catch(e){ return []; }
}
function saveWatchlist(arr){ localStorage.setItem('watchlist', JSON.stringify(arr)); renderWatchlist(); }
function renderWatchlist(){
  const ul = document.getElementById('watchlist'); ul.innerHTML='';
  const arr = loadWatchlist();
  arr.forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `<span style="cursor:pointer" onclick="window.viewSymbol('${s}')">${s}</span><div><button class="watch-btn" onclick="window.overlaySymbol('${s}')">Overlay</button> <button class="watch-btn" onclick="window.removeWatch('${s}')">Remove</button></div>`;
    ul.appendChild(li);
  });
}
window.viewSymbol = function(s){ drawMain(s); }
window.overlaySymbol = function(s){ addOverlay(s); }
window.removeWatch = function(s){ const arr=loadWatchlist().filter(x=>x!==s); saveWatchlist(arr); }

// auto refresh tick
async function tick(){
  if(!autoRefresh || !currentSymbol) return;
  try{ const d = await fetchYahoo(currentSymbol, '7d', '1d'); const latest = d.closes[d.closes.length-1]; document.getElementById('latestPrice').innerText = formatPrice(latest); }catch(e){ console.error('refresh',e); }
}

// init
document.getElementById('viewBtn').onclick = () => { const s = document.getElementById('symbolInput').value.trim().toUpperCase(); if(s) drawMain(s); }
document.getElementById('addWatchBtn').onclick = () => {
  const s = document.getElementById('symbolInput').value.trim().toUpperCase();
  if(!s) return alert('Type a symbol first');
  const arr = loadWatchlist(); if(!arr.includes(s)) arr.push(s); saveWatchlist(arr); document.getElementById('symbolInput').value='';
};
document.getElementById('themeBtn').onclick = () => { document.body.classList.toggle('light'); document.body.classList.toggle('dark'); }
document.getElementById('autoRefresh').onchange = (e) => { autoRefresh = e.target.checked; }
document.querySelectorAll('.sample').forEach(b=>b.onclick = (ev)=> drawMain(ev.target.innerText.trim()));

// expose some helpers for inline use
window.addOverlay = addOverlay;

// initial render with sample
renderWatchlist();
drawMain('AAPL');

// start auto-refresh interval
setInterval(tick, 5000);
