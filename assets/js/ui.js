/* UI helpers: i18n, formatting, components, modal, toast */
window.UI = (function () {
  let lang = 'ar';
  try { lang = localStorage.getItem('nabd_lang') || 'ar'; } catch (e) { }
  const setLang = l => { lang = l; try { localStorage.setItem('nabd_lang', l); } catch (e) { } applyLang(); };
  function applyLang() { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; }
  const L = (ar, en) => lang === 'ar' ? ar : en;
  const N = o => o == null ? '' : typeof o === 'string' ? o : (o[lang] || o.ar || o.en || '');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Arabic month/day names with Western digits (0-9) — consistent and easy to read in clinics
  const locale = () => lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB';
  const nf = (n, d) => Number(n || 0).toLocaleString(locale(), { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d || 0 });
  const money = n => `${nf(Math.round(n || 0))} ${L('ج.م', 'EGP')}`;
  const pct = (n, d) => `${nf(n, d == null ? 0 : d)}%`;
  const fdate = (iso, opts) => iso ? new Date(iso).toLocaleDateString(locale(), opts || { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const ftime = iso => iso ? new Date(iso).toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' }) : '—';
  const fdt = iso => iso ? `${fdate(iso, { day: 'numeric', month: 'short' })} · ${ftime(iso)}` : '—';
  function ago(iso) {
    const m = Math.round((Date.now() - new Date(iso)) / 60000);
    if (m < 1) return L('الآن', 'just now');
    if (m < 60) return L(`منذ ${nf(m)} د`, `${m}m ago`);
    const h = Math.round(m / 60); if (h < 24) return L(`منذ ${nf(h)} س`, `${h}h ago`);
    return fdate(iso, { day: 'numeric', month: 'short' });
  }
  const age = dob => { const d = new Date(dob), n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
  const isoDay = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const sameDay = (iso, day) => isoDay(iso) === day;

  const icon = (n, cls) => `<i data-lucide="${n}"${cls ? ` class="${cls}"` : ''}></i>`;
  function icons(root) { if (window.lucide) lucide.createIcons({ attrs: {}, nameAttr: 'data-lucide', root: root || document }); }
  const AV_COLORS = ['#0e8f82', '#5b5bd6', '#d6409f', '#e58a1f', '#0b7fc0', '#169b5b', '#d93f45', '#7c5bd6'];
  function avatar(name, cls) {
    const n = N(name).replace(/^(د\.|Dr\.)\s*/, '');
    const parts = n.split(' ').filter(Boolean); const ini = (parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '');
    let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 997;
    return `<span class="avatar ${cls || ''}" style="background:${AV_COLORS[h % AV_COLORS.length]}">${esc(ini)}</span>`;
  }

  const STATUS = {
    pending: ['tone-warning', 'قيد الانتظار', 'Pending'], confirmed: ['tone-info', 'مؤكد', 'Confirmed'], arrived: ['tone-accent', 'وصل المريض', 'Arrived'],
    in_progress: ['tone-primary', 'داخل الكشف', 'In consultation'], completed: ['tone-success', 'مكتمل', 'Completed'], cancelled: ['tone-danger', 'ملغي', 'Cancelled'], no_show: ['tone-muted', 'لم يحضر', 'No-show']
  };
  const statusBadge = s => { const x = STATUS[s] || ['tone-muted', s, s]; return `<span class="badge ${x[0]}"><span class="dot"></span>${L(x[1], x[2])}</span>`; };
  const statusLabel = s => { const x = STATUS[s]; return x ? L(x[1], x[2]) : s; };
  const PAY = { paid: ['tone-success', 'مدفوعة', 'Paid'], partial: ['tone-warning', 'مدفوعة جزئياً', 'Partial'], unpaid: ['tone-danger', 'غير مدفوعة', 'Unpaid'] };
  const payBadge = s => { const x = PAY[s]; return `<span class="badge ${x[0]}"><span class="dot"></span>${L(x[1], x[2])}</span>`; };
  const METHODS = { cash: ['نقدي', 'Cash'], card: ['بطاقة بنكية', 'Card'], instapay: ['إنستاباي', 'InstaPay'], wallet: ['محفظة إلكترونية', 'Mobile wallet'], insurance: ['تأمين', 'Insurance'] };
  const methodLabel = m => METHODS[m] ? L(...METHODS[m]) : m;
  const SOURCES = {
    vezeeta: ['فيزيتا', 'Vezeeta', '#1f6fd1', 'V'], clinido: ['كلينيدو', 'CliniDo', '#e1306c', 'C'], ekshef: ['إكشف', 'Ekshef', '#f08c00', 'E'],
    website: ['موقع المستشفى', 'Website', '#0e8f82', 'W'], walkin: ['حضور مباشر', 'Walk-in', '#64748b', 'H'], phone: ['هاتف', 'Phone', '#5b5bd6', 'T']
  };
  const srcBadge = s => { const x = SOURCES[s] || [s, s, '#888', '?']; return `<span class="src"><i style="background:${x[2]}">${x[3]}</i>${L(x[0], x[1])}</span>`; };
  const srcLabel = s => SOURCES[s] ? L(SOURCES[s][0], SOURCES[s][1]) : s;
  const srcColor = s => SOURCES[s] ? SOURCES[s][2] : '#888';
  const OUTCOME = { improved: ['tone-success', 'تحسن', 'Improved', 'trending-up'], stable: ['tone-info', 'مستقر', 'Stable', 'minus'], worse: ['tone-danger', 'تراجع', 'Worse', 'trending-down'] };
  const outcomeBadge = o => { const x = OUTCOME[o] || OUTCOME.stable; return `<span class="badge ${x[0]}">${icon(x[3], 'ic-sm')}${L(x[1], x[2])}</span>`; };

  const kpi = (label, value, ic, tone, foot) => `<div class="card kpi"><div class="k-icon tone-${tone || 'primary'}">${icon(ic)}</div><div class="grow"><div class="k-label">${label}</div><div class="k-value num">${value}</div>${foot ? `<div class="k-foot">${foot}</div>` : ''}</div></div>`;
  const empty = (msg, ic) => `<div class="empty">${icon(ic || 'inbox')}<div>${msg || L('لا توجد بيانات', 'No data')}</div></div>`;
  function table(cols, rows, opts) {
    opts = opts || {};
    if (!rows.length) return empty(opts.empty);
    return `<div class="table-wrap"><table class="tbl"><thead><tr>${cols.map(c => `<th${c.w ? ` style="width:${c.w}"` : ''}>${c.label}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr${opts.rowAttr ? ' ' + opts.rowAttr(r, i) : ''}>${cols.map(c => `<td${c.cls ? ` class="${c.cls}"` : ''}>${c.render(r, i)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  const options = (items, sel, allLabel) => (allLabel ? `<option value="">${allLabel}</option>` : '') + items.map(i => `<option value="${esc(i.id)}"${i.id === sel ? ' selected' : ''}>${esc(N(i.name))}</option>`).join('');

  // ---------- modal
  function modal(o) {
    const root = document.createElement('div'); root.className = 'modal-root';
    root.innerHTML = `<div class="modal ${o.size || ''}" role="dialog" aria-modal="true"><div class="modal-head"><h3>${o.title}</h3><button class="btn ghost icon" data-close aria-label="close">${icon('x')}</button></div><div class="modal-body">${o.body}</div>${o.footer ? `<div class="modal-foot">${o.footer}</div>` : ''}</div>`;
    const close = () => { root.remove(); document.body.classList.remove('printing-modal'); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    root.addEventListener('mousedown', e => { if (e.target === root) close(); });
    root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
    document.addEventListener('keydown', onKey);
    document.body.appendChild(root); icons(root);
    if (o.onMount) o.onMount(root, close);
    return close;
  }
  function confirmBox(title, msg, okLabel, tone) {
    return new Promise(res => {
      modal({
        title, body: `<p style="margin:0">${msg}</p>`, footer: `<button class="btn" data-close>${L('إلغاء', 'Cancel')}</button><button class="btn ${tone || 'primary'}" data-ok>${okLabel || L('تأكيد', 'Confirm')}</button>`,
        onMount(r, close) { r.querySelector('[data-ok]').onclick = () => { close(); res(true); }; r.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => res(false))); }
      });
    });
  }
  // ---------- toast
  function toast(title, msg, tone, ic, onClick) {
    let host = document.querySelector('.toasts'); if (!host) { host = document.createElement('div'); host.className = 'toasts'; document.body.appendChild(host); }
    const t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = `<div class="t-icon tone-${tone || 'primary'}">${icon(ic || 'bell')}</div><div class="grow"><div class="t-title">${title}</div>${msg ? `<div class="t-msg">${msg}</div>` : ''}</div><button class="btn ghost sm icon" aria-label="close">${icon('x')}</button>`;
    t.querySelector('button').onclick = e => { e.stopPropagation(); t.remove(); };
    if (onClick) { t.style.cursor = 'pointer'; t.onclick = () => { onClick(); t.remove(); }; }
    host.appendChild(t); icons(t); setTimeout(() => t.remove(), 6500);
  }
  function formData(form) { const o = {}; new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; }); return o; }
  function downloadCSV(name, rows) {
    const csv = '﻿' + rows.map(r => r.map(c => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = name + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- charts
  const charts = [];
  function chart(canvas, config) {
    if (!window.Chart || !canvas) return null;
    const cs = getComputedStyle(document.documentElement);
    Chart.defaults.font.family = cs.getPropertyValue('--font');
    Chart.defaults.color = cs.getPropertyValue('--muted').trim();
    Chart.defaults.borderColor = cs.getPropertyValue('--border').trim();
    config.options = Object.assign({ responsive: true, maintainAspectRatio: false, plugins: {} }, config.options || {});
    config.options.plugins.legend = Object.assign({ position: 'bottom', rtl: lang === 'ar', labels: { usePointStyle: true, boxWidth: 8, padding: 14 } }, config.options.plugins.legend || {});
    config.options.plugins.tooltip = Object.assign({ rtl: lang === 'ar' }, config.options.plugins.tooltip || {});
    const c = new Chart(canvas, config); charts.push(c); return c;
  }
  function destroyCharts() { while (charts.length) { try { charts.pop().destroy(); } catch (e) { } } }
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  applyLang();
  return {
    get lang() { return lang; }, setLang, L, N, esc, nf, money, pct, fdate, ftime, fdt, ago, age, isoDay, sameDay, icon, icons, avatar,
    STATUS, statusBadge, statusLabel, payBadge, methodLabel, METHODS, SOURCES, srcBadge, srcLabel, srcColor, outcomeBadge, OUTCOME,
    kpi, empty, table, options, modal, confirmBox, toast, formData, downloadCSV, chart, destroyCharts, cssVar
  };
})();
